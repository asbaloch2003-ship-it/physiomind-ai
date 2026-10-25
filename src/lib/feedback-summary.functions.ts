import { createServerFn } from "@tanstack/react-start";

export const getFeedbackSummary = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { available: false as const };
  try {
    const base = new URL(url.trim());
    if (base.protocol !== "https:" || !base.hostname.endsWith(".supabase.co") || (base.pathname !== "/" && base.pathname !== "")) return { available: false as const };
    const endpoint = new URL("/rest/v1/project_feedback?select=rating", base.origin);
    let count = 0;
    let sum = 0;
    // Only rating is fetched. No comments, email addresses or identifiers are returned to visitors.
    for (let offset = 0; offset < 100000; offset += 1000) {
      const response = await fetch(endpoint.toString(), {
        headers: { apikey: key, Authorization: "Bearer " + key, Range: `${offset}-${offset + 999}` },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Feedback summary query failed (${response.status})`);
      const rows: unknown = await response.json();
      if (!Array.isArray(rows)) throw new Error("Invalid feedback summary response");
      for (const row of rows) {
        const rating = (row as { rating?: unknown }).rating;
        if (typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5) {
          count += 1;
          sum += rating;
        }
      }
      if (rows.length < 1000) return { available: true as const, count, average: count ? Math.round(sum / count * 10) / 10 : 0 };
    }
    // Do not display misleading partial totals.
    return { available: false as const };
  } catch (error) {
    console.error("Feedback summary unavailable", error instanceof Error ? error.message : "unknown error");
    return { available: false as const };
  }
});
