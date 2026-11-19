import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforceAiRateLimit } from "./ai-rate-limit";

const Input = z.object({
  mode: z.enum(["clinical", "study", "quiz", "notes"]),
  question: z.string().trim().min(8).max(8000),
  reportLength: z.enum(["quick","detailed"]).optional(),
});

const guidance = {
  clinical: "Act exclusively as a physiotherapy clinical reasoning educator. Produce a case-specific physiotherapy report with exactly seven Markdown headings in this order: ## 1. Subjective Assessment; ## 2. Objective Assessment; ## 3. Key Findings; ## 4. Patient Impression; ## 5. Physiotherapist Plan; ## 6. Safety and Referrals; ## 7. Review and Goals. Subjective Assessment: briefly summarize reported symptoms, onset, aggravating/easing factors, relevant history and functional limitations; do not invent missing history or add a questionnaire. Objective Assessment: recommend relevant PT examination of ROM, strength, neurological function, movement, gait, balance, function and appropriate special tests only when indicated; distinguish proposed tests from actual recorded findings. Key Findings: prioritize the most meaningful known positive findings and relevant unknowns, never invent normal/negative results. Patient Impression: state a provisional physiotherapy working impression and functional problem, not a confirmed medical diagnosis; explain uncertainty briefly. Physiotherapist Plan: give safe, prioritized education, graded exercise, activity modification, functional retraining and other indicated PT interventions, without invented dosage. Safety and Referrals: explicitly screen for relevant red flags, identify urgent versus routine referral and defer testing or treatment when emergency warning signs are suspected. Review and Goals: give measurable patient-centered functional goals, suitable outcome measure and reassessment timeframe when justified. Tailor content to the specialty and case. Missing data are unknown, not normal. No medication, surgery, fabricated references, extra headings or lengthy preambles. The report is educational and does not replace professional evaluation.",
  study: "Act as a patient, excellent university tutor for ANY DPT curriculum subject, including non-clinical subjects. Give a substantial, accurate, easy-to-understand lesson, not just a definition. Explain key terminology in plain language, organize important subtopics in a logical sequence, explain how and why concepts work, provide meaningful examples, important details, and a short revision summary. For anatomy, explain structures and relevant locations, and for named muscles include origin, insertion, innervation and action. For physics, statistics or biochemistry, show formulas and worked examples when appropriate. Only include clinical examples when relevant to the subject; do not force them into non-clinical topics. Adapt scope to the question; for a broad topic cover the most important sections in depth and offer a sensible next section instead of pretending to exhaust an entire textbook. Use clear Markdown section headings, short paragraphs, numbered steps and bullets. Avoid unnecessary viva questions and invented references.",
  quiz: "Explain the correct answer from a DPT and physiotherapy learning perspective, including physiotherapy assessment, functional implications and rehabilitation reasoning when relevant. Explain why alternatives may be wrong. For non-clinical curriculum questions, explain the actual subject without forcing physiotherapy examples. Never prescribe medication, perform a medical diagnosis or invent evidence.",
  notes: "Create thorough yet easy-to-understand DPT textbook-style topic notes (roughly 500-900 words when appropriate). Cover the requested topic systematically with meaningful subtopics, examples, tables as lists where useful, relevant subject-specific applications and revision summaries. Do not generate viva or oral-exam questions unless explicitly requested by the user; the course list alone does not establish that viva exams are required. Only include clinical relevance when the selected subject or topic is clinical; never force clinical examples into English, statistics, computer studies, Pakistan Studies, sociology, or other non-clinical subjects. For muscle topics, identify the anatomical region and cover major individual muscles, their anatomical location, origin, insertion, nerve supply and actions, grouped logically. Do not claim to list every muscle of the body in one response; offer to cover the next region. Do not invent anatomy. Use plain text headings and numbered points. Do not output Markdown symbols such as asterisks, hash marks or backticks.",
};

type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

const isTextModel = (name: string) =>
  /^gemini-[a-zA-Z0-9._-]+$/.test(name) &&
  !/(tts|audio|image|video|live|robotics|computer-use|embedding|native|speech|vision|realtime)/i.test(name);
type ModelListing = { models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> };
let cachedModels: { key: string; names: string[]; expires: number } | undefined;
async function discoverModels(key: string): Promise<string[]> {
  if (cachedModels?.key === key && cachedModels.expires > Date.now()) return cachedModels.names;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
      headers: { "x-goog-api-key": key }, signal: controller.signal,
    });
    if (!response.ok) return [];
    const data = await response.json() as ModelListing;
    const names = (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes("generateContent") && /^models\/gemini-[a-zA-Z0-9._-]+$/.test(m.name || ""))
      .map(m => (m.name || "").replace(/^models\//, ""))
      .filter(isTextModel);
    if (names.length) cachedModels = { key, names, expires: Date.now() + 600_000 };
    return names;
  } catch { return []; }
  finally { clearTimeout(timer); }
}

// Best-effort server-side cache for non-clinical educational responses only.
// This cache is per server instance and may be cleared by a serverless restart.
const educationalCache = new Map<string, { answer: string; model: string; expires: number }>();
// Per-instance circuit breaker: avoid hammering a provider that just returned 503.
let geminiBusyUntil = 0;
export const askPhysioAI = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => Input.parse(value))
  .handler(async ({ data }) => {
    const cacheable = data.mode === "study" || data.mode === "notes";
    const cacheKey = cacheable ? data.mode + ":" + data.question.trim().toLowerCase() : "";
    const cached = cacheable ? educationalCache.get(cacheKey) : undefined;
    if (cached && cached.expires > Date.now()) return { answer: cached.answer, model: cached.model };
    if (Date.now() < geminiBusyUntil) throw new Error("Gemini is temporarily overloaded. Please wait about a minute before trying again. Your input is preserved.");
    enforceAiRateLimit("assistant", 24);
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("AI is not configured. Set GEMINI_API_KEY in Vercel.");
    const preferred = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    if (!/^[a-zA-Z0-9._-]+$/.test(preferred)) throw new Error("Invalid AI model configuration.");

    const available = await discoverModels(key);
    const preferredModels = ["gemini-3.8-flash"];
    const models = available.length ? preferredModels.filter(m => available.includes(m)) : preferredModels;
    if (!models.length) throw new Error("No compatible Gemini text model is available for this API key.");
    const lengthGuide = data.mode === "clinical" ? (data.reportLength === "detailed" ? "Use all seven specified headings. Write a focused teaching report of approximately 450-700 words, with concise clinical reasoning and no repetition. Clearly distinguish observed findings from suggested assessments. " : "Write a rapid physiotherapy clinical snapshot, approximately 170-250 words, with exactly the seven specified headings and one or two short bullets under each. Include all essential safety warnings even if this exceeds the target. No references, extra questions, introductions or concluding paragraphs. Clearly distinguish known findings from tests to perform. ") : "";
    const prompt = lengthGuide + "You are PhysioSmart AI, an educational DPT tutor. No personal patient details, diagnosis or fabricated references. Be accurate. " + ((data.mode === "notes" || data.mode === "study" || data.mode === "clinical") ? "" : "Be concise (100-200 words). ") + guidance[data.mode];
    let lastError = "Gemini is temporarily busy. Please try again shortly.";

    // Long notes should not start a second full generation inside the same serverless invocation.
    const attempts = models.slice(0, 1);
    let overloaded = false;
    let sawUnsupportedModel = false;
    for (let attempt = 0; attempt < attempts.length; attempt++) {
      const model = attempts[attempt];
      if (attempt > 0) await new Promise(resolve => setTimeout(resolve, overloaded ? 1400 : 350));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), data.mode === "notes" ? 27000 : 22000);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: prompt }] },
              contents: [{ role: "user", parts: [{ text: data.question }] }],
              generationConfig: { maxOutputTokens: data.mode === "notes" ? 2300 : data.mode === "study" ? 1900 : data.mode === "clinical" ? (data.reportLength === "detailed" ? 3200 : 800) : 1200 },
            }),
          },
        );

        if (!response.ok) {
          // Preserve the provider's actual error category for diagnosis.
          // Do not log user prompts, patient details, or API credentials.
          const errorPayload = await response.json().catch(() => null) as { error?: { message?: string; status?: string } } | null;
          const providerMessage = errorPayload?.error?.message || "";
          console.error("PhysioSmart Gemini request failed", {
            mode: data.mode, model, httpStatus: response.status,
            providerStatus: errorPayload?.error?.status || "unknown",
            reason: providerMessage.slice(0, 450).replace(/AIza[A-Za-z0-9_-]+/g, "[REDACTED]"),
          });
          if ([429, 500, 502, 503, 504].includes(response.status)) {
            if (response.status === 503) geminiBusyUntil = Date.now() + 60_000;
            overloaded = true;
            lastError = response.status === 429
              ? "Gemini API quota has been reached (HTTP 429). Wait before requesting again."
              : "Gemini is experiencing high demand (HTTP " + response.status + "). Try again shortly.";
            if (response.status === 429 || response.status === 503) break;
            continue;
          }
          if ([400, 404].includes(response.status)) {
            sawUnsupportedModel = true;
            lastError = `Gemini model ${model} rejected the request (HTTP ${response.status}; ${errorPayload?.error?.status || "INVALID_REQUEST"}). Check Vercel function logs for the exact provider reason.`;
            continue;
          }
          if ([401, 403].includes(response.status)) throw new Error("Gemini API access denied. Check the server API key and project permissions.");
          throw new Error(`Gemini request failed (HTTP ${response.status}).`);
        }
        const result = await response.json() as GeminiResponse;
        const answer = result.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
        if (answer) {
          if (cacheable) {
            if (educationalCache.size >= 100) {
              const oldest = educationalCache.keys().next().value;
              if (oldest) educationalCache.delete(oldest);
            }
            educationalCache.set(cacheKey, { answer, model, expires: Date.now() + 86_400_000 });
          }
          return { answer, model };
        }
        lastError = `Gemini model ${model} returned no usable answer.`;
      } catch (error) {
        if (controller.signal.aborted) {
          lastError = `Gemini model ${model} did not respond within the request time limit. Try a narrower topic or retry later.`;
          continue;
        }
        if (error instanceof Error && error.message.startsWith("Gemini API access denied")) throw error;
        lastError = "The AI service could not be reached.";
        continue;
      } finally {
        clearTimeout(timer);
      }
    }
    const summary = overloaded && sawUnsupportedModel
      ? "Gemini is overloaded and some fallback models are unavailable. Please retry later."
      : lastError;
    throw new Error("The AI service could not complete this request. Your input is preserved. " + summary);
  });
