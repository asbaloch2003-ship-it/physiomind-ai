import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforceAiRateLimit } from "./ai-rate-limit";

const Question = z.object({
  question: z.string().min(12),
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().min(15),
});
type QuizQuestion = z.infer<typeof Question>;
const Input = z.object({ topic: z.string().trim().min(3).max(150), count: z.literal(25), previousQuestions: z.array(z.string().max(500)).max(40).optional(), attemptId: z.string().max(100).optional(), partialQuestions: z.array(Question).max(24).optional() });
type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const normalized = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
const isTextModel = (name: string) =>
  /^gemini-[a-zA-Z0-9._-]+$/.test(name) &&
  !/(tts|audio|image|video|live|robotics|computer-use|embedding|native|speech|vision|realtime)/i.test(name);
type ModelListing = { models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> };
let modelCache: { key: string; models: string[]; expires: number } | undefined;
async function availableModels(key: string): Promise<string[]> {
  if (modelCache?.key === key && modelCache.expires > Date.now()) return modelCache.models;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
      headers: { "x-goog-api-key": key }, signal: controller.signal,
    });
    if (!response.ok) return [];
    const listing = await response.json() as ModelListing;
    const models = (listing.models || [])
      .filter(m => m.supportedGenerationMethods?.includes("generateContent") && /^models\/gemini-[a-zA-Z0-9._-]+$/.test(m.name || ""))
      .map(m => (m.name || "").replace(/^models\//, ""))
      .filter(isTextModel);
    if (models.length) modelCache = { key, models, expires: Date.now() + 10 * 60_000 };
    return models;
  } catch { return []; }
  finally { clearTimeout(timer); }
}

export const generateTopicBcqs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    enforceAiRateLimit("bcqs", 12);
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("AI is not configured. Set GEMINI_API_KEY in Vercel.");
    // Keep BCQ generation on the two models from the earlier working setup.
    // Do not fall back to Gemini 2.5: access is restricted for some newer projects.
    const discovered = await availableModels(key);
    const preferred = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
    const models = discovered.length ? preferred.filter(m => discovered.includes(m)) : [];
    if (!models.length && !process.env.GROQ_API_KEY) throw new Error("Could not verify an available Gemini text model and GROQ_API_KEY is not configured.");
    const questions: QuizQuestion[] = [...(data.partialQuestions || [])];
    const seen = new Set([...(data.previousQuestions || []), ...questions.map(q => q.question)].map(normalized));
    let lastError = "The AI service is temporarily unavailable.";

    // Three batches (9 + 8 + 8) reduce provider requests from five to three.
    const batchSizes = [9, 8, 8];
    for (let batch = 0; batch < batchSizes.length; batch++) {
      const batchStart = batchSizes.slice(0, batch).reduce((a, b) => a + b, 0);
      if (questions.length >= batchStart + batchSizes[batch]) continue;
      const needed = batchSizes[batch];
      let completed = false;
      for (const model of models.slice(0, 3)) {
        if (completed) break;
        for (let retry = 0; retry < 2; retry++) {
          if (retry) await pause(2500);
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 30000);
          try {
            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
              method: "POST", signal: controller.signal,
              headers: { "Content-Type": "application/json", "x-goog-api-key": key },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: "Create exactly " + needed + " accurate DPT single-best-answer multiple choice questions. Return ONLY a JSON object with questions array. Each item must have question (string), options (four strings), answer (integer 0-3), explanation (at least 15 characters). Questions should be distinct, clinically safe, and appropriate to the topic. Each explanation must be concise. Avoid invented references." }] },
                contents: [{ role: "user", parts: [{ text: "Topic: " + data.topic + ". Attempt: " + (data.attemptId || "new") + ". Batch " + (batch + 1) + ". Create " + needed + " NEW questions not duplicating these: " + JSON.stringify([...(data.previousQuestions || []).slice(-15), ...questions.map(q => q.question)].slice(-25)) }] }],
                generationConfig: { maxOutputTokens: 4600, temperature: 0.3, responseMimeType: "application/json" },
              }),
            });
            if (!response.ok) {
              const errorPayload = await response.json().catch(() => null) as { error?: { message?: string; status?: string } } | null;
              const providerMessage = errorPayload?.error?.message || "";
              console.error("PhysioSmart Gemini BCQ request failed", {
                model, httpStatus: response.status,
                providerStatus: errorPayload?.error?.status || "unknown",
                reason: providerMessage.slice(0, 450).replace(/AIza[A-Za-z0-9_-]+/g, "[REDACTED]"),
              });
              if ([401, 403].includes(response.status)) throw new Error("Gemini API access denied. Check the server API key and permissions.");
              if (response.status === 429) {
                lastError = "Gemini request quota reached (HTTP 429). Please wait and try again.";
                break;
              }
              if ([400, 404].includes(response.status)) {
                lastError = "Gemini model " + model + " rejected the request (HTTP " + response.status + "; " + (errorPayload?.error?.status || "unknown") + ").";
                break;
              }
              if ([500, 502, 503, 504].includes(response.status)) { lastError = "Gemini is temporarily overloaded (HTTP " + response.status + ")."; if (retry === 0) await pause(1800); continue; }
              throw new Error("AI request failed (HTTP " + response.status + ").");
            }
            const result = await response.json() as GeminiResponse;
            const raw = result.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
            if (!raw) { lastError = "AI returned an empty question set."; continue; }
            const parsed = z.object({ questions: z.array(Question).length(needed) }).safeParse(JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")));
            if (!parsed.success) { lastError = "AI returned an incomplete question set."; continue; }
            const fresh = parsed.data.questions.filter(q => !seen.has(normalized(q.question)));
            if (fresh.length !== needed || new Set(fresh.map(q => normalized(q.question))).size !== needed) { lastError = "AI repeated questions; retrying."; continue; }
            for (const q of fresh) { questions.push(q); seen.add(normalized(q.question)); }
            completed = true;
            break;
          } catch (error) {
            if (error instanceof Error && error.message.startsWith("Gemini API access denied")) throw error;
            lastError = controller.signal.aborted ? "Gemini timed out while generating questions." : error instanceof SyntaxError ? "AI returned invalid JSON." : error instanceof Error ? error.message : "AI request failed.";
          } finally { clearTimeout(timer); }
        }
      }
      // Secondary provider: use Groq if Gemini cannot complete this batch.
      if (!completed && process.env.GROQ_API_KEY) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        try {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST", signal: controller.signal,
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.GROQ_API_KEY },
            body: JSON.stringify({
              model: "openai/gpt-oss-20b",
              messages: [
                { role: "system", content: "Create exactly " + needed + " accurate DPT single-best-answer multiple choice questions. Return ONLY a JSON object with questions array. Each item must have question (string), options (four strings), answer (integer 0-3), explanation (at least 15 characters). Questions should be distinct, clinically safe, and appropriate to the topic. Each explanation must be concise. Avoid invented references." },
                { role: "user", content: "Topic: " + data.topic + ". Attempt: " + (data.attemptId || "new") + ". Batch " + (batch + 1) + ". Create " + needed + " NEW questions not duplicating these: " + JSON.stringify([...(data.previousQuestions || []).slice(-15), ...questions.map(q => q.question)].slice(-25)) },
              ],
              max_completion_tokens: 5000,
              response_format: { type: "json_object" },
            }),
          });
          if (!response.ok) {
            const payload = await response.json().catch(() => null) as { error?: { message?: string; code?: string } } | null;
            console.error("PhysioSmart Groq BCQ fallback failed", { batch: batch + 1, httpStatus: response.status, providerCode: payload?.error?.code || "unknown", reason: (payload?.error?.message || "").slice(0, 350) });
            lastError = "Gemini and Groq are currently unavailable (Groq HTTP " + response.status + ").";
          } else {
            const result = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
            const raw = result.choices?.[0]?.message?.content?.trim();
            if (raw) {
              const parsed = z.object({ questions: z.array(Question).length(needed) }).safeParse(JSON.parse(raw.replace(/^\x60\x60\x60(?:json)?\\s*/i, "").replace(/\\s*\x60\x60\x60$/, "")));
              if (parsed.success) {
                const fresh = parsed.data.questions.filter(q => !seen.has(normalized(q.question)));
                if (fresh.length === needed && new Set(fresh.map(q => normalized(q.question))).size === needed) {
                  for (const q of fresh) { questions.push(q); seen.add(normalized(q.question)); }
                  completed = true;
                } else lastError = "Groq returned duplicate questions; please continue generation.";
              } else lastError = "Groq returned an incomplete question set.";
            } else lastError = "Groq returned an empty question set.";
          }
        } catch (error) {
          lastError = controller.signal.aborted ? "Groq timed out while generating questions." : "Groq fallback could not complete this batch.";
          console.error("PhysioSmart Groq BCQ fallback error", { batch: batch + 1, reason: error instanceof Error ? error.message.slice(0, 250) : "unknown" });
        } finally { clearTimeout(timer); }
      }
      if (!completed) return { questions, topic: data.topic, complete: false, warning: lastError };
    }
    return { questions, topic: data.topic, complete: true, warning: "" };
  });
