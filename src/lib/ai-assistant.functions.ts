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

export const askPhysioAI = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => Input.parse(value))
  .handler(async ({ data }) => {
    enforceAiRateLimit("assistant", 24);
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("AI is not configured. Set GEMINI_API_KEY in Vercel.");
    const preferred = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    if (!/^[a-zA-Z0-9._-]+$/.test(preferred)) throw new Error("Invalid AI model configuration.");

    const models = [...new Set([preferred, "gemini-3.5-flash-lite"])];
    const lengthGuide = data.mode === "clinical" ? (data.reportLength === "detailed" ? "Use all seven specified headings. Write a focused teaching report of approximately 450-700 words, with concise clinical reasoning and no repetition. Clearly distinguish observed findings from suggested assessments. " : "Write a rapid physiotherapy clinical snapshot, approximately 170-250 words, with exactly the seven specified headings and one or two short bullets under each. Include all essential safety warnings even if this exceeds the target. No references, extra questions, introductions or concluding paragraphs. Clearly distinguish known findings from tests to perform. ") : "";
    const prompt = lengthGuide + "You are PhysioSmart AI, an educational DPT tutor. No personal patient details, diagnosis or fabricated references. Be accurate. " + ((data.mode === "notes" || data.mode === "study" || data.mode === "clinical") ? "" : "Be concise (100-200 words). ") + guidance[data.mode];
    let lastError = "Gemini is temporarily busy. Please try again shortly.";

    const attempts = [models[0], models[1], models[0]];
    for (let attempt = 0; attempt < attempts.length; attempt++) {
      const model = attempts[attempt];
      if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 900 * attempt));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 16000);
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
              generationConfig: { maxOutputTokens: data.mode === "notes" ? 3500 : data.mode === "study" ? 2600 : data.mode === "clinical" ? (data.reportLength === "detailed" ? 3200 : 800) : 1200 },
            }),
          },
        );

        if (!response.ok) {
          if ([429, 500, 502, 503, 504].includes(response.status)) {
            lastError = `Gemini model ${model} is busy (HTTP ${response.status}).`;
            continue;
          }
          if ([400, 404].includes(response.status)) {
            lastError = `Gemini model ${model} is not supported for this request (HTTP ${response.status}).`;
            continue;
          }
          if ([401, 403].includes(response.status)) throw new Error("Gemini API access denied. Check the server API key and project permissions.");
          throw new Error(`Gemini request failed (HTTP ${response.status}).`);
        }
        const result = await response.json() as GeminiResponse;
        const answer = result.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
        if (answer) return { answer, model };
        lastError = `Gemini model ${model} returned no usable answer.`;
      } catch (error) {
        if (controller.signal.aborted) {
          lastError = `Gemini model ${model} timed out.`;
          continue;
        }
        if (error instanceof Error && error.message.startsWith("Gemini API access denied")) throw error;
        lastError = "The AI service could not be reached.";
        continue;
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error("The AI service is temporarily unavailable. Your case details are still in the form. Please try again in a moment. (" + lastError + ")");
  });
