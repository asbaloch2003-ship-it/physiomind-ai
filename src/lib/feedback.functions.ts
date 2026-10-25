import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforceAiRateLimit } from "./ai-rate-limit";

const Feedback = z.object({
  role: z.enum(["DPT student", "Physiotherapist", "Faculty", "Other"]),
  rating: z.number().int().min(1).max(5),
  area: z.enum(["Overall experience", "Study materials", "Special tests", "AI clinical reasoning", "BCQs", "Accessibility", "History taking forms", "Notes", "Curriculum", "Other"]),
  comment: z.string().trim().min(10).max(1500),
  contact: z.string().trim().max(160).optional(),
  website: z.string().max(100).optional(),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => Feedback.parse(value))
  .handler(async ({ data }) => {
    if (data.website) return { success: true };
    enforceAiRateLimit("feedback", 15, 60_000);
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Feedback collection is not configured yet. Please contact the project team.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url.replace(/\/$/, "") + "/rest/v1/project_feedback", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: "Bearer " + key,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          role: data.role, rating: data.rating, area: data.area,
          comment: data.comment, contact: data.contact || null,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        let code = "";
        try {
          const parsed = JSON.parse(errorBody) as { code?: string };
          code = typeof parsed.code === "string" ? parsed.code.slice(0, 30) : "";
        } catch { /* Avoid logging response bodies or credentials. */ }
        console.error("Feedback database write failed", { status: response.status, code });
        throw new Error("Unable to save feedback right now. Please try again later.");
      }
      return { success: true };
    } finally { clearTimeout(timer); }
  });
