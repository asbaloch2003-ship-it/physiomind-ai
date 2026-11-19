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

type GroqResponse = { choices?: Array<{ message?: { content?: string } }> };
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

// Best-effort server-side cache for non-clinical educational responses only.
// This cache is per server instance and may be cleared by a serverless restart.
const educationalCache = new Map<string, { answer: string; model: string; expires: number }>();
export const askPhysioAI = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => Input.parse(value))
  .handler(async ({ data }) => {
    const cacheable = data.mode === "study" || data.mode === "notes";
    const cacheKey = cacheable ? data.mode + ":" + data.question.trim().toLowerCase() : "";
    const cached = cacheable ? educationalCache.get(cacheKey) : undefined;
    if (cached && cached.expires > Date.now()) return { answer: cached.answer, model: cached.model };
    enforceAiRateLimit("assistant", 24);
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("Groq is not configured. Add GROQ_API_KEY in Vercel Production settings.");

    const lengthGuide = data.mode === "clinical" ? (data.reportLength === "detailed" ? "Use all seven specified headings. Write a focused teaching report of approximately 450-700 words, with concise clinical reasoning and no repetition. Clearly distinguish observed findings from suggested assessments. " : "Write a rapid physiotherapy clinical snapshot, approximately 170-250 words, with exactly the seven specified headings and one or two short bullets under each. Include all essential safety warnings even if this exceeds the target. No references, extra questions, introductions or concluding paragraphs. Clearly distinguish known findings from tests to perform. ") : "";
    const prompt = lengthGuide + "You are PhysioSmart AI, an educational DPT tutor. No personal patient details, diagnosis or fabricated references. Be accurate. " + ((data.mode === "notes" || data.mode === "study" || data.mode === "clinical") ? "" : "Be concise (100-200 words). ") + guidance[data.mode];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), data.mode === "notes" ? 35000 : 30000);
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "system", content: prompt }, { role: "user", content: data.question }],
          max_completion_tokens: data.mode === "notes" ? 2300 : data.mode === "study" ? 1900 : data.mode === "clinical" ? (data.reportLength === "detailed" ? 2400 : 850) : 1200,
          temperature: 0.4,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        console.error("PhysioSmart Groq request failed", { mode: data.mode, httpStatus: response.status, reason: (payload?.error?.message || "").slice(0, 300) });
        if (response.status === 429) throw new Error("Groq free-tier rate limit reached (HTTP 429). Please wait before retrying.");
        if ([401, 403].includes(response.status)) throw new Error("Groq API key rejected. Check GROQ_API_KEY in Vercel.");
        throw new Error("Groq request failed (HTTP " + response.status + "): " + (payload?.error?.message || "Unknown provider error").slice(0, 240));
      }
      const result = await response.json() as GroqResponse;
      const answer = result.choices?.[0]?.message?.content?.trim();
      if (!answer) throw new Error("Groq returned an empty answer. Please retry.");
      if (cacheable) {
        if (educationalCache.size >= 100) {
          const oldest = educationalCache.keys().next().value;
          if (oldest) educationalCache.delete(oldest);
        }
        educationalCache.set(cacheKey, { answer, model: GROQ_MODEL, expires: Date.now() + 86_400_000 });
      }
      return { answer, model: GROQ_MODEL };
    } catch (error) {
      if (controller.signal.aborted) throw new Error("Groq did not respond within the time limit. Your input is preserved.");
      throw error;
    } finally { clearTimeout(timer); }
  });
