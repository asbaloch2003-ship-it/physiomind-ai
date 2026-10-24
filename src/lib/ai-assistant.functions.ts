import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  mode: z.enum(["clinical", "study", "quiz"]),
  question: z.string().trim().min(8).max(4000),
});

const guidance = {
  clinical: "For a fictional physiotherapy teaching case: organize response under Red flags & urgent referral, Missing history, Assessment, Differential considerations, Special tests (indications and limitations), Rehabilitation options, Outcome measures, Prognosis, and Learning references. Do not assert a diagnosis or prescribe treatment for a real patient. If emergency symptoms appear, clearly recommend urgent in-person medical evaluation. Never fabricate citations; identify sources to verify rather than inventing papers.",
  study: "Explain DPT physiotherapy concepts clearly using a short summary, foundational explanation, practical example, key takeaways and self-check question. Clearly identify uncertainty.",
  quiz: "Teach the reasoning behind a physiotherapy multiple-choice answer. Explain why distractors may be wrong, and do not assume an answer key without evidence.",
};
export const askPhysioAI = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => Input.parse(value))
  .handler(async ({ data }) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("AI is not configured on this server yet. Add GEMINI_API_KEY as a server-only secret.");
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error("Invalid AI model configuration.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "You are PhysioSmart AI, an educational tutor for Doctor of Physical Therapy students in Pakistan. Never request or retain personally identifying patient information. Your answers are educational, not medical advice. Do not fabricate evidence, references, or certainty. " + guidance[data.mode] }] },
          contents: [{ role: "user", parts: [{ text: data.question }] }],
          generationConfig: { maxOutputTokens: 1300, temperature: 0.35 },
        }),
      });
      if (!response.ok) {
        // Google's structured error message explains which model, API version, or
        // project permission failed. Never expose raw responses or credentials.
        let detail = "";
        try {
          const payload: unknown = await response.json();
          if (payload && typeof payload === "object" && "error" in payload) {
            const error = payload.error;
            if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
              detail = error.message;
            }
          }
        } catch {
          // A non-JSON response is possible; retain the HTTP status below.
        }
        const safeDetail = detail
          .replaceAll(key, "[REDACTED]")
          .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED]")
          .replace(/https?:\\/\\/\\S+/g, "[URL]")
          .replace(/[\\r\\n\\t]+/g, " ")
          .slice(0, 450);
        const label = response.status === 429 ? "Gemini free-tier quota"
          : response.status === 401 || response.status === 403 ? "Gemini API access"
          : response.status === 404 ? "Gemini model or endpoint"
          : "Gemini API";
        throw new Error(label + " error (HTTP " + response.status + ")" + (safeDetail ? ": " + safeDetail : ". Check your model and project settings."));
      }
      const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const answer = result.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
      if (!answer) throw new Error("The AI did not return a usable answer. Please rephrase your question.");
      return { answer, model };
    } finally {
      clearTimeout(timeout);
    }
  });
