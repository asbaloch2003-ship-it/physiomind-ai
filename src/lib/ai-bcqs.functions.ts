import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforceAiRateLimit } from "./ai-rate-limit";

const Input = z.object({ topic: z.string().trim().min(3).max(150), count: z.literal(25), previousQuestions: z.array(z.string().max(500)).max(40).optional(), attemptId: z.string().max(100).optional() });
const Question = z.object({
  question: z.string().min(12),
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().min(15),
});
type QuizQuestion = z.infer<typeof Question>;
type GroqResponse = { choices?: Array<{ message?: { content?: string } }> };
const preferredGroqModels = ["llama-3.3-70b-versatile", "openai/gpt-oss-20b", "llama-3.1-8b-instant"];
let groqModelCache: { models: string[]; expires: number } | undefined;
async function selectGroqModel(key: string): Promise<string> {
  const configured = process.env.GROQ_MODEL?.trim();
  if (configured && !/^[a-zA-Z0-9._/-]+$/.test(configured)) throw new Error("Invalid GROQ_MODEL setting.");
  if (!groqModelCache || groqModelCache.expires < Date.now()) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: "Bearer " + key }, signal: controller.signal,
      });
      if (!response.ok) throw new Error("Unable to list Groq models (HTTP " + response.status + ").");
      const listing = await response.json() as { data?: Array<{ id?: string; active?: boolean }> };
      const models = (listing.data || []).filter(m => m.active !== false && typeof m.id === "string").map(m => m.id!);
      if (!models.length) throw new Error("No active Groq models are available to this API key.");
      groqModelCache = { models, expires: Date.now() + 600000 };
    } finally { clearTimeout(timer); }
  }
  const models = groqModelCache.models;
  if (configured) {
    if (!models.includes(configured)) throw new Error("Configured GROQ_MODEL is not available to your Groq API key.");
    return configured;
  }
  const preferred = preferredGroqModels.find(m => models.includes(m));
  if (preferred) return preferred;
  const alternative = models.find(m => /llama|gpt-oss|qwen/i.test(m) && !/guard|safety|whisper|audio|tts|vision|image|transcri|compound/i.test(m));
  if (!alternative) throw new Error("No suitable Groq text-generation model is available. Check the Groq Models page.");
  return alternative;
}
const normalized = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
function parseQuestions(raw: string): unknown {
  const clean = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try { return JSON.parse(clean); } catch {
    const first = clean.indexOf("{");
    const last = clean.lastIndexOf("}");
    if (first < 0 || last <= first) throw new Error("AI returned invalid JSON.");
    return JSON.parse(clean.slice(first, last + 1));
  }
}

export const generateTopicBcqs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    enforceAiRateLimit("bcqs", 12);
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("Groq is not configured. Add GROQ_API_KEY in Vercel Production settings.");
    const model = await selectGroqModel(key);
    const questions: QuizQuestion[] = [];
    const seen = new Set((data.previousQuestions || []).map(normalized));
    let lastError = "The AI service is temporarily unavailable.";

    // Generate 25 questions as five smaller batches to limit response size.
    for (let batch = 0; batch < 5; batch++) {
      let completed = false;
      for (let retry = 0; retry < 3 && !completed; retry++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 25000);
        try {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST", signal: controller.signal,
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
            body: JSON.stringify({
              model, temperature: 0.25, max_completion_tokens: 2500,
              messages: [
                { role: "system", content: "Create exactly FIVE accurate DPT single-best-answer multiple choice questions. Return ONLY valid JSON (no Markdown fences or commentary) with a questions array. Each item has question (string), options (four strings), answer (integer 0-3), explanation (at least 15 characters). All questions must be distinct, clinically safe, and appropriate to the topic. Avoid invented references." },
                { role: "user", content: "Topic: " + data.topic + ". Attempt: " + (data.attemptId || "new") + ". Batch " + (batch + 1) + ". Create 5 NEW questions not duplicating these: " + JSON.stringify([...(data.previousQuestions || []).slice(-15), ...questions.map(q => q.question)].slice(-25)) },
              ],
            }),
          });
          if (!response.ok) {
            const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
            console.error("PhysioSmart Groq BCQ failed", { httpStatus: response.status, reason: (payload?.error?.message || "").slice(0, 250) });
            if (response.status === 429) throw new Error("Groq free-tier rate limit reached (HTTP 429). Please wait before retrying.");
            if ([401, 403].includes(response.status)) throw new Error("Groq API key rejected. Check GROQ_API_KEY in Vercel.");
            lastError = "Groq request failed (HTTP " + response.status + "): " + (payload?.error?.message || "Unknown provider error").slice(0, 240);
            continue;
          }
          const result = await response.json() as GroqResponse;
          const raw = result.choices?.[0]?.message?.content?.trim();
          if (!raw) { lastError = "Groq returned an empty question set."; continue; }
          const parsed = z.object({ questions: z.array(Question).length(5) }).safeParse(parseQuestions(raw));
          if (!parsed.success) { lastError = "AI returned an incomplete question set."; continue; }
          const fresh = parsed.data.questions.filter(item => !seen.has(normalized(item.question)));
          if (fresh.length !== 5 || new Set(fresh.map(item => normalized(item.question))).size !== 5) { lastError = "AI repeated questions; retrying."; continue; }
          for (const item of fresh) { questions.push(item); seen.add(normalized(item.question)); }
          completed = true;
        } catch (error) {
          if (error instanceof Error && (/rate limit|API key rejected/.test(error.message))) throw error;
          lastError = controller.signal.aborted ? "Groq timed out while generating questions." : error instanceof Error ? error.message : "Groq request failed.";
        } finally { clearTimeout(timer); }
      }
      if (!completed) throw new Error("Generated " + questions.length + " of 25 questions. " + lastError + " No incomplete quiz was shown. Please retry later.");
    }
    return { questions, topic: data.topic };
  });
