import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askPhysioAI } from "@/lib/ai-assistant.functions";
import { Container, PageHeader, Disclaimer, meta } from "@/components/site";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/ai-assistant")({
  head: () => meta("AI Clinical & Study Assistant", "Ask AI-powered educational physiotherapy questions."),
  validateSearch: (search: Record<string,unknown>) => ({topic:typeof search.topic==="string"?search.topic.slice(0,180):"",subject:typeof search.subject==="string"?search.subject.slice(0,180):"",semester:typeof search.semester==="string"?search.semester.slice(0,10):"",auto:search.auto==="1"?"1":""}),
  component: Page,
});
type Mode = "clinical" | "study" | "quiz";
const modes: { value: Mode; label: string; example: string }[] = [
  { value: "clinical", label: "Clinical reasoning", example: "Fictional case: a 35-year-old recreational runner has gradual anterior knee pain during stairs. What history, red flags, assessments, and rehabilitation principles should a DPT student consider?" },
  { value: "study", label: "Study tutor", example: "Explain the gait cycle phases and the role of major lower limb muscles in simple language for a DPT student." },
  { value: "quiz", label: "Quiz explanations", example: "In a BCQ about the Trendelenburg sign, why does pelvic drop suggest hip abductor weakness? Explain common distractors." },
];
function InlineAnswer({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      : part.startsWith("*") && part.endsWith("*")
        ? <em key={i}>{part.slice(1,-1)}</em>
        : <span key={i}>{part}</span>
  )}</>;
}
function FormattedAnswer({ text }: { text: string }) {
  const normalized = text.replace(/\r\n?/g,"\n")
    .replace(/[ \t]+(#{1,4})[ \t]+/g,"\n\n$1 ")
    .replace(/([.!?])\s+(\d+[.)]\s+[A-Z])/g,"$1\n$2")
    .replace(/\n{3,}/g,"\n\n");
  const lines=normalized.split("\n");
  return <article className="space-y-4 text-[15px] leading-7 text-foreground/90">
    {lines.map((raw,i)=>{
      const line=raw.trim();
      if(!line)return null;
      const heading=line.match(/^#{1,6}\s+(.+)$/);
      if(heading)return <h3 key={i} className="mt-8 border-b border-border pb-3 text-lg font-bold tracking-tight text-foreground"><InlineAnswer text={heading[1]}/></h3>;
      const bullet=line.match(/^[-*•]\s+(.+)$/);
      if(bullet)return <div key={i} className="flex items-start gap-3 pl-1"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 font-bold text-primary">•</span><p className="min-w-0 flex-1"><InlineAnswer text={bullet[1]}/></p></div>;
      const numbered=line.match(/^(\d+[.)])\s+(.+)$/);
      if(numbered)return <div key={i} className="flex items-start gap-3 rounded-lg bg-secondary/35 px-3 py-2"><span className="shrink-0 font-bold text-primary">{numbered[1]}</span><p className="min-w-0 flex-1"><InlineAnswer text={numbered[2]}/></p></div>;
      if(/^\*\*[^*]+\*\*:?$/.test(line))return <h4 key={i} className="mt-6 text-base font-bold text-foreground"><InlineAnswer text={line.replace(/:$/,"")}/></h4>;
      return <p key={i} className="break-words"><InlineAnswer text={line}/></p>;
    })}
  </article>;
}
function Page() {
  const search=Route.useSearch();
  const incoming=search.topic.trim();
  const initial=incoming ? "Teach me "+incoming+" in "+(search.subject||"my DPT subject")+(search.semester?" (semester "+search.semester+")":"")+". Explain the full topic clearly and in depth, step by step, with important subtopics, definitions of difficult terms, relevant examples and a concise revision summary. Use professional section headings and readable lists. Include clinical applications only if relevant to the subject." : modes[0].example;
  const [mode, setMode] = useState<Mode>(incoming?"study":"clinical");
  const [question, setQuestion] = useState(initial);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ask = useServerFn(askPhysioAI);
  useEffect(()=>{if(!incoming)return;setMode("study");setQuestion(initial);setAnswer("");setError("");},[incoming,initial]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setAnswer(""); setError("");
    try { const result = await ask({ data: { mode, question } }); setAnswer(result.answer); }
    catch (e) { setError(e instanceof Error ? e.message : "AI request failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <><PageHeader eyebrow="AI-powered learning" title="PhysioSmart AI Assistant" desc="Ask real AI about clinical reasoning, physiotherapy concepts, and BCQ explanations. No student account required." /><Container><div className="mx-auto max-w-3xl space-y-6"><Disclaimer /><div className="flex flex-wrap gap-2" role="group" aria-label="AI learning mode">{modes.map(m => <Button key={m.value} variant={mode === m.value ? "default" : "outline"} onClick={() => { setMode(m.value); setQuestion(m.example); setAnswer(""); setError(""); }}>{m.label}</Button>)}</div><form onSubmit={submit} className="space-y-4"><label htmlFor="ai-question" className="block font-semibold">Your learning question or fictional case</label><Textarea id="ai-question" value={question} onChange={e => setQuestion(e.target.value)} minLength={8} maxLength={4000} rows={7} required placeholder="Enter a fictional clinical case or DPT question" /><p className="text-xs text-muted-foreground">Do not enter real patient names, phone numbers, dates of birth, or other identifying details. Responses are AI-generated and may contain errors.</p><Button disabled={busy || question.trim().length < 8} type="submit">{busy ? "AI is thinking…" : "Ask PhysioSmart AI"}</Button></form>{error && <div role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">{error}</div>}{answer && <section aria-live="polite" className="overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><h2 className="mb-5 border-b pb-4 text-xl font-bold tracking-tight">AI learning response</h2><FormattedAnswer text={answer} /><p className="mt-5 border-t pt-3 text-xs text-muted-foreground">Educational AI output. Verify clinical claims with authoritative guidelines and qualified supervisors.</p></section>}</div></Container></>;
}
