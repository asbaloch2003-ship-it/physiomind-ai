import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  mode: z.enum(["clinical", "study", "quiz", "notes"]),
  question: z.string().trim().min(8).max(8000),
  reportLength: z.enum(["quick","detailed"]).optional(),
});

const guidance = {
  clinical: "Act exclusively as a physiotherapy clinical reasoning educator for DPT students. Produce a physiotherapy assessment and rehabilitation reasoning report, NOT a general medical consultation, physician management plan, surgical plan, medication prescription or definitive diagnosis. Write exactly seven numbered sections with these headings on separate lines: ## 1. Physiotherapy safety screening and referral red flags; ## 2. Physiotherapy subjective and objective assessment; ## 3. Physiotherapy special tests and functional outcome measures; ## 4. Physiotherapy clinical hypotheses and differential considerations; ## 5. Evidence-informed physiotherapy management and rehabilitation; ## 6. Functional goals, outcome measures and reassessment; ## 7. Physiotherapy prognosis, precautions and uncertainties. In section 1 identify urgent warning signs and essential missing information; distinguish emergency referral from routine medical referral, and stop routine testing and rehabilitation until appropriate clearance when indicated. In section 2 suggest targeted physiotherapy history questions relevant to symptoms, irritability, mechanism, function, patient goals and activity, and an objective exam appropriate to the body region and presentation. In section 3 recommend only clinically appropriate special tests, functional assessments and validated outcome measures, explaining their limitations; do not claim a positive single test confirms pathology. In section 4 distinguish physiotherapy working hypotheses from medical diagnoses; explain findings that support or weaken each hypothesis and when referral is needed. In section 5 discuss physiotherapist-delivered education, activity modification, graded therapeutic exercise, functional retraining, relevant manual therapy only when appropriate, self-management, and referral or multidisciplinary collaboration as needed. Do not invent precise exercise dosage when clinical details are insufficient; when suggesting exercise parameters clearly state they are examples requiring individualized assessment. In section 6 set measurable functional goals, meaningful patient-reported outcomes, and a reassessment timeline adapted to the case. In section 7 discuss recovery modifiers and uncertainty without unsupported prognosis percentages. Make every section case-specific, prioritize patient safety, and never add general medical investigations, pharmacological treatments or surgery as a physiotherapy treatment recommendation; mention medical evaluation only when referral is clinically indicated. For neurologic, cardiorespiratory, musculoskeletal, pediatric, sports, women's health or other cases, adapt physiotherapy assessments and interventions to the specialty. Missing data are unknown, not negative findings. No fabricated references, statistics or clinical evidence. End with a brief educational disclaimer. Format using Markdown headings and concise bullets, and write the actual report rather than instructions.",
  study: "Act as a patient, excellent university tutor for ANY DPT curriculum subject, including non-clinical subjects. Give a substantial, accurate, easy-to-understand lesson, not just a definition. Explain key terminology in plain language, organize important subtopics in a logical sequence, explain how and why concepts work, provide meaningful examples, important details, and a short revision summary. For anatomy, explain structures and relevant locations, and for named muscles include origin, insertion, innervation and action. For physics, statistics or biochemistry, show formulas and worked examples when appropriate. Only include clinical examples when relevant to the subject; do not force them into non-clinical topics. Adapt scope to the question; for a broad topic cover the most important sections in depth and offer a sensible next section instead of pretending to exhaust an entire textbook. Use clear Markdown section headings, short paragraphs, numbered steps and bullets. Avoid unnecessary viva questions and invented references.",
  quiz: "Explain the correct answer from a DPT and physiotherapy learning perspective, including physiotherapy assessment, functional implications and rehabilitation reasoning when relevant. Explain why alternatives may be wrong. For non-clinical curriculum questions, explain the actual subject without forcing physiotherapy examples. Never prescribe medication, perform a medical diagnosis or invent evidence.",
  notes: "Create thorough yet easy-to-understand DPT textbook-style topic notes (roughly 500-900 words when appropriate). Cover the requested topic systematically with meaningful subtopics, examples, tables as lists where useful, relevant subject-specific applications and revision summaries. Do not generate viva or oral-exam questions unless explicitly requested by the user; the course list alone does not establish that viva exams are required. Only include clinical relevance when the selected subject or topic is clinical; never force clinical examples into English, statistics, computer studies, Pakistan Studies, sociology, or other non-clinical subjects. For muscle topics, identify the anatomical region and cover major individual muscles, their anatomical location, origin, insertion, nerve supply and actions, grouped logically. Do not claim to list every muscle of the body in one response; offer to cover the next region. Do not invent anatomy. Use plain text headings and numbered points. Do not output Markdown symbols such as asterisks, hash marks or backticks.",
};

type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

export const askPhysioAI = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => Input.parse(value))
  .handler(async ({ data }) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("AI is not configured. Set GEMINI_API_KEY in Vercel.");
    const preferred = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    if (!/^[a-zA-Z0-9._-]+$/.test(preferred)) throw new Error("Invalid AI model configuration.");

    const models = [...new Set([preferred, "gemini-3.5-flash-lite"])];
    const lengthGuide = data.mode === "clinical" ? (data.reportLength === "detailed" ? "Provide a detailed clinical teaching report with fuller explanations, approximately 900-1300 words when warranted. Preserve all seven sections and prioritize urgent safety guidance. " : "Provide a QUICK clinical report of approximately 400-600 words total, with all seven sections retained. Use 1-3 brief, case-specific bullets per section; 3-4 targeted history questions are acceptable. Be especially concise in low-priority sections, but never shorten or omit urgent red-flag advice. ") : "";
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
              generationConfig: { maxOutputTokens: data.mode === "notes" ? 3500 : data.mode === "study" ? 2600 : data.mode === "clinical" ? (data.reportLength === "detailed" ? 3200 : 1750) : 1200 },
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
