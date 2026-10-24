/** Best-effort per-process protection. Use a shared durable store for multi-instance production limits. */
const attempts = new Map<string, { count: number; expires: number }>();
export function enforceAiRateLimit(identity: string, limit = 12, windowMs = 60_000) {
  const now = Date.now();
  if (attempts.size > 5000) for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  const current = attempts.get(identity);
  if (!current || current.expires <= now) { attempts.set(identity, { count: 1, expires: now + windowMs }); return; }
  if (current.count >= limit) throw new Error("AI request limit reached. Please wait a minute and try again.");
  current.count++;
}
