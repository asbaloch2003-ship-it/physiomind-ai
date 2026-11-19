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
const GROQ_MODEL = "llama-3.1-8b-instant";
const normalized = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

export const generateTopicBcqs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    enforceAiRateLimit("bcqs", 12);
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("Groq is not configured. Add GROQ_API_KEY in Vercel Production settings.");
    const questions: QuizQuestion[] = [];
    const seen = new Set((data.previousQuestions || []).map(normalized));
    let lastError = "The AI service is temporarily unavailable.";

    // Generate 25 questions as five smaller batches to limit response size.
    for (let batch = 0; batch < 5; batch++) {
      let completed = false;
      for (let retry = 0; retry < 2 && !completed; retry++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 25000);
        try {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST", signal: controller.signal,
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
            body: JSON.stringify({
              model: GROQ_MODEL, temperature: 0.65, max_completion_tokens: 2200,
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: "Create exactly FIVE accurate DPT single-best-answer multiple choice questions. Return ONLY a JSON object with a questions array. Each item has question (string), options (four strings), answer (integer 0-3), explanation (at least 15 characters). All questions must be distinct, clinically safe, and appropriate to the topic. Avoid invented references." },
                { role: "user", content: "Topic: " + data.topic + ". Attempt: " + (data.attemptId || "new") + ". Batch " + (batch + 1) + ". Create 5 NEW questions not duplicating these: " + JSON.stringify([...(data.previousQuestions || []).slice(-15), ...questions.map(q => q.question)].slice(-25)) },
              ],
            }),
          });
          if (!response.ok) {
            const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
            console.error("PhysioSmart Groq BCQ failed", { httpStatus: response.status, reason: (payload?.error?.message || "").slice(0, 250) });
            if (response.status === 429) throw new Error("Groq free-tier rate limit reached (HTTP 429). Please wait before retrying.");
            if ([401, 403].includes(response.status)) throw new Error("Groq API key rejected. Check GROQ_API_KEY in Vercel.");
            lastError = "Groq request failed (HTTP " + response.status + ").";
            continue;
          }
          const result = await response.json() as GroqResponse;
          const raw = result.choices?.[0]?.message?.content?.trim();
          if (!raw) { lastError = "Groq returned an empty question set."; continue; }
          const parsed = z.object({ questions: z.array(Question).length(5) }).safeParse(JSON.parse(raw.replace(/^```(?:json)?\\s*/i, "").replace(/\\s*```$/, "")));
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
