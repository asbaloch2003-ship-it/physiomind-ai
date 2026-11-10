import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforceAiRateLimit } from "./ai-rate-limit";

const Input = z.object({ topic: z.string().trim().min(3).max(150), count: z.literal(10), previousQuestions: z.array(z.string().max(500)).max(40).optional(), attemptId: z.string().max(100).optional() });
const Question = z.object({
  question: z.string().min(12),
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().min(15),
});
type QuizQuestion = z.infer<typeof Question>;
type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const normalized = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

export const generateTopicBcqs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    enforceAiRateLimit("bcqs", 12);
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("AI is not configured. Set GEMINI_API_KEY in Vercel.");
    const configured = process.env.GEMINI_MODEL;
    if (configured && !/^[a-zA-Z0-9._-]+$/.test(configured)) throw new Error("Invalid AI model configuration.");
    // Use documented stable model IDs as fallback if the configured model is busy or unsupported.
    const models = [...new Set([configured || "gemini-2.5-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-flash"])];
    const questions: QuizQuestion[] = [];
    const seen = new Set((data.previousQuestions || []).map(normalized));
    let lastError = "The AI service is temporarily unavailable.";

    // Two smaller calls are less demanding than one large 10-question response.
    for (let batch = 0; batch < 2; batch++) {
      let completed = false;
      for (const model of models) {
        if (completed) break;
        for (let retry = 0; retry < 2; retry++) {
          if (retry) await pause(1200);
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 24000);
          try {
            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
              method: "POST", signal: controller.signal,
              headers: { "Content-Type": "application/json", "x-goog-api-key": key },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: "Create exactly FIVE accurate DPT single-best-answer multiple choice questions. Return ONLY a JSON object with questions array. Each item must have question (string), options (four strings), answer (integer 0-3), explanation (at least 15 characters). Questions should be distinct, clinically safe, and appropriate to the topic. Each explanation must be concise. Avoid invented references." }] },
                contents: [{ role: "user", parts: [{ text: "Topic: " + data.topic + ". Attempt: " + (data.attemptId || "new") + ". Batch " + (batch + 1) + ". Create 5 NEW questions not duplicating these: " + JSON.stringify([...(data.previousQuestions || []).slice(-15), ...questions.map(q => q.question)].slice(-25)) }] }],
                generationConfig: { maxOutputTokens: 2300, temperature: 0.8, responseMimeType: "application/json" },
              }),
            });
            if (!response.ok) {
              if ([401, 403].includes(response.status)) throw new Error("Gemini API access denied. Check the server API key and permissions.");
              if (response.status === 429) {
                lastError = "Gemini request quota reached (HTTP 429). Please wait and try again.";
                // Switching models does not reliably bypass project-level quota.
                break;
              }
              if ([400, 404].includes(response.status)) { lastError = "Configured AI model unsupported (HTTP " + response.status + ")."; break; }
              if ([500, 502, 503, 504].includes(response.status)) { lastError = "Gemini is temporarily overloaded (HTTP " + response.status + ")."; continue; }
              throw new Error("AI request failed (HTTP " + response.status + ").");
            }
            const result = await response.json() as GeminiResponse;
            const raw = result.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
            if (!raw) { lastError = "AI returned an empty question set."; continue; }
            const parsed = z.object({ questions: z.array(Question).length(5) }).safeParse(JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")));
            if (!parsed.success) { lastError = "AI returned an incomplete question set."; continue; }
            const fresh = parsed.data.questions.filter(q => !seen.has(normalized(q.question)));
            if (fresh.length !== 5 || new Set(fresh.map(q => normalized(q.question))).size !== 5) { lastError = "AI repeated questions; retrying."; continue; }
            for (const q of fresh) { questions.push(q); seen.add(normalized(q.question)); }
            completed = true;
            break;
          } catch (error) {
            if (error instanceof Error && error.message.startsWith("Gemini API access denied")) throw error;
            lastError = controller.signal.aborted ? "Gemini timed out while generating questions." : error instanceof SyntaxError ? "AI returned invalid JSON." : error instanceof Error ? error.message : "AI request failed.";
          } finally { clearTimeout(timer); }
        }
      }
      if (!completed) throw new Error(lastError + " Please retry shortly; no incomplete quiz was shown.");
    }
    return { questions, topic: data.topic };
  });
