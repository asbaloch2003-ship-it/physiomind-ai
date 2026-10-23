import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askPhysioAI } from "@/lib/ai-assistant.functions";
import { Container, PageHeader, Disclaimer, meta } from "@/components/site";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/ai-assistant")({
  head: () => meta("AI Clinical & Study Assistant", "Ask Gemini-powered educational physiotherapy questions."),
  component: Page,
});
type Mode = "clinical" | "study" | "quiz";
const modes: { value: Mode; label: string; example: string }[] = [
  { value: "clinical", label: "Clinical reasoning", example: "Fictional case: a 35-year-old recreational runner has gradual anterior knee pain during stairs. What history, red flags, assessments, and rehabilitation principles should a DPT student consider?" },
  { value: "study", label: "Study tutor", example: "Explain the gait cycle phases and the role of major lower limb muscles in simple language for a DPT student." },
  { value: "quiz", label: "Quiz explanations", example: "In a BCQ about the Trendelenburg sign, why does pelvic drop suggest hip abductor weakness? Explain common distractors." },
];
function Page() {
  const [mode, setMode] = useState<Mode>("clinical");
  const [question, setQuestion] = useState(modes[0].example);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ask = useServerFn(askPhysioAI);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setAnswer(""); setError("");
    try { const result = await ask({ data: { mode, question } }); setAnswer(result.answer); }
    catch (e) { setError(e instanceof Error ? e.message : "AI request failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <><PageHeader eyebrow="Gemini-powered learning" title="PhysioSmart AI Assistant" desc="Ask real AI about clinical reasoning, physiotherapy concepts, and BCQ explanations. No student account required." /><Container><div className="mx-auto max-w-3xl space-y-6"><Disclaimer /><div className="flex flex-wrap gap-2" role="group" aria-label="AI learning mode">{modes.map(m => <Button key={m.value} variant={mode === m.value ? "default" : "outline"} onClick={() => { setMode(m.value); setQuestion(m.example); setAnswer(""); setError(""); }}>{m.label}</Button>)}</div><form onSubmit={submit} className="space-y-4"><label htmlFor="ai-question" className="block font-semibold">Your learning question or fictional case</label><Textarea id="ai-question" value={question} onChange={e => setQuestion(e.target.value)} minLength={8} maxLength={4000} rows={7} required placeholder="Enter a fictional clinical case or DPT question" /><p className="text-xs text-muted-foreground">Do not enter real patient names, phone numbers, dates of birth, or other identifying details. Responses are AI-generated and may contain errors.</p><Button disabled={busy || question.trim().length < 8} type="submit">{busy ? "AI is thinking…" : "Ask PhysioSmart AI"}</Button></form>{error && <div role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">{error}</div>}{answer && <section aria-live="polite" className="rounded-xl border bg-card p-6"><h2 className="mb-4 text-xl font-bold">AI learning response</h2><div className="whitespace-pre-wrap text-sm leading-7">{answer}</div><p className="mt-5 border-t pt-3 text-xs text-muted-foreground">Educational AI output. Verify clinical claims with authoritative guidelines and qualified supervisors.</p></section>}</div></Container></>;
}
