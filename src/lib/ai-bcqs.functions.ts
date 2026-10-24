import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ topic: z.string().trim().min(3).max(150), count: z.number().int().min(3).max(5) });
const Question = z.object({
  question: z.string().min(12),
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().min(15),
});
type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

export const generateTopicBcqs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("AI is not configured.");
    const preferred = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    if (!/^[a-zA-Z0-9._-]+$/.test(preferred)) throw new Error("Invalid model configuration.");
    const models = [...new Set([preferred, "gemini-3.5-flash-lite"])];
    let lastError = "AI is temporarily unavailable.";
    for (const model of models) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 22000);
      try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
          method: "POST", signal: controller.signal,
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: "You write accurate, single-best-answer educational physiotherapy questions for DPT students. Return ONLY a valid JSON object: {\\"questions\\":[{\\"question\\":\\"...\\",\\"options\\":[\\"...\\",\\"...\\",\\"...\\",\\"...\\"],\\"answer\\":0,\\"explanation\\":\\"...\\"}]}. Exactly " + data.count + " distinct questions. The answer is the ZERO-BASED index of the single correct option. Make distractors plausible. Include a short teaching explanation. Do not include markdown code fences. Avoid unsupported clinical certainty or fabricated references." }] },
            contents: [{ role: "user", parts: [{ text: "Generate " + data.count + " topic-specific BCQs on: " + data.topic }] }],
            generationConfig: { maxOutputTokens: 2200, responseMimeType: "application/json" },
          }),
        });
        if (!response.ok) {
          if ([400, 404, 429, 500, 502, 503, 504].includes(response.status)) { lastError = "AI model unavailable (HTTP " + response.status + ")."; continue; }
          if ([401, 403].includes(response.status)) throw new Error("AI access denied. Check server API configuration.");
          throw new Error("AI request failed (HTTP " + response.status + ").");
        }
        const result = await response.json() as GeminiResponse;
        const raw = result.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
        if (!raw) { lastError = "AI returned no questions."; continue; }
        const cleaned = raw.replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\s*\x60\x60\x60$/, "");
        try {
          const parsed = z.object({ questions: z.array(Question).min(1).max(5) }).parse(JSON.parse(cleaned));
          return { questions: parsed.questions, topic: data.topic };
        } catch { lastError = "AI returned an incomplete question set. Please try again."; }
      } catch (e) {
        if (controller.signal.aborted) { lastError = "AI took too long to generate questions."; continue; }
        throw e;
      } finally { clearTimeout(timer); }
    }
    throw new Error(lastError);
  });
