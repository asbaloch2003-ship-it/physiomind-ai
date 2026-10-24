import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  mode: z.enum(["clinical", "study", "quiz", "notes"]),
  question: z.string().trim().min(8).max(4000),
});

const guidance = {
  clinical: "You are an educational clinical decision-support tutor for DPT students, NOT a diagnostic tool. Analyze the provided fictional or de-identified history and findings without inventing missing facts. Respond in exactly these nine numbered Markdown sections, each with specific, actionable teaching points: ## 1. Safety screening and potential red flags; ## 2. Important additional history questions; ## 3. Recommended physiotherapy assessment; ## 4. Relevant special tests and validated outcome measures; ## 5. Possible clinical considerations and differential diagnoses; ## 6. Evidence-informed intervention options; ## 7. Outcome measures and reassessment plan; ## 8. Prognostic factors and uncertainties; ## 9. References and evidence limitations. Explain the purpose and interpretation of relevant tests and tools, and make intervention suggestions conditional on safety screening and clinical confirmation. Explicitly identify unknowns and uncertainties. Do NOT assert a confirmed diagnosis from history alone; use possible clinical consideration, differential diagnosis and requires clinical confirmation. Highlight urgent red flags first, and advise prompt emergency assessment for potentially serious presentations rather than proposing exercise treatment. Never invent citations, guidelines, evidence statistics, prognostic percentages, or references. Only give specific references if highly confident they exist and are relevant; otherwise state reliable references could not be verified and suggest trusted guideline sources without pretending to have looked them up. End with a clear educational-only disclaimer that qualified healthcare professionals must assess, diagnose and treat real patients. Use concise, professional paragraphs and bullet lists.",
  study: "Act as a patient, excellent university tutor for ANY DPT curriculum subject, including non-clinical subjects. Give a substantial, accurate, easy-to-understand lesson, not just a definition. Explain key terminology in plain language, organize important subtopics in a logical sequence, explain how and why concepts work, provide meaningful examples, important details, and a short revision summary. For anatomy, explain structures and relevant locations, and for named muscles include origin, insertion, innervation and action. For physics, statistics or biochemistry, show formulas and worked examples when appropriate. Only include clinical examples when relevant to the subject; do not force them into non-clinical topics. Adapt scope to the question; for a broad topic cover the most important sections in depth and offer a sensible next section instead of pretending to exhaust an entire textbook. Use clear Markdown section headings, short paragraphs, numbered steps and bullets. Avoid unnecessary viva questions and invented references.",
  quiz: "Explain the correct physiotherapy reasoning, and why alternatives might be wrong when options are provided.",
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
    const prompt = "You are PhysioSmart AI, an educational DPT tutor. No personal patient details, diagnosis or fabricated references. Be accurate. " + ((data.mode === "notes" || data.mode === "study" || data.mode === "clinical") ? "" : "Be concise (100-200 words). ") + guidance[data.mode];
    let lastError = "Gemini is temporarily busy. Please try again shortly.";

    for (const model of models) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 22000);
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
              generationConfig: { maxOutputTokens: data.mode === "notes" ? 3500 : data.mode === "study" ? 2600 : data.mode === "clinical" ? 3200 : 1200 },
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
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error(lastError + " Both available model attempts failed. Please try later.");
  });
