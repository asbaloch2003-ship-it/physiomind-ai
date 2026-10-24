import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askPhysioAI } from "@/lib/ai-assistant.functions";
import { Container, PageHeader, Disclaimer, meta } from "@/components/site";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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
  const cleaned=text.replace(/\\\*/g,"*").replace(/^\*\*•\*\*\s*/,"");
  return <>{cleaned.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g).map((part,i)=>
    part.startsWith("**")&&part.endsWith("**")
      ? <strong key={i} className="font-semibold text-foreground">{part.slice(2,-2)}</strong>
      : part.startsWith("*")&&part.endsWith("*")
        ? <em key={i}>{part.slice(1,-1)}</em>
        : <span key={i}>{part}</span>
  )}</>;
}
function FormattedAnswer({ text }: { text: string }) {
  const normalized=text.replace(/\r\n?/g,"\n")
    .replace(/\\\*/g,"*")
    .replace(/^[ \t]*(?:\*\*\s*[•-]\s*\*\*|[•*-])[ \t]*$/gm,"")
    .replace(/^[ \t]*\*\*\s*[•-]\s*\*\*[ \t]*/gm,"- ")
    .replace(/[ \t]+(#{1,4})[ \t]+/g,"\n\n$1 ")
    .replace(/([.!?])\s+(\d+[.)]\s+[A-Z])/g,"$1\n$2");
  const lines=normalized.split("\n").map(s=>s.trim()).filter(Boolean);
  return <article className="space-y-4 text-[15px] leading-7 text-foreground/90">
    {lines.map((line,i)=>{
      if(/^(?:\*\*)?[•*-](?:\*\*)?$/.test(line))return null;
      const heading=line.match(/^#{1,6}\s+(.+)$/);
      if(heading)return <h3 key={i} className="mt-8 border-b border-border pb-3 text-lg font-bold tracking-tight text-foreground"><InlineAnswer text={heading[1]}/></h3>;
      const bullet=line.match(/^(?:[-*•]|\*\*[•-]\*\*)\s+(.+)$/);
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
  const [caseFields,setCaseFields]=useState({age:"",details:"",complaint:"",duration:"",history:"",medical:"",medications:"",limitations:"",findings:""});
  const ask = useServerFn(askPhysioAI);
  useEffect(()=>{if(!incoming)return;setMode("study");setQuestion(initial);setAnswer("");setError("");},[incoming,initial]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const clinicalCase = Object.entries(caseFields).filter(([,v])=>v.trim()).map(([k,v])=>k+": "+v.trim()).join("\n");
    if(mode==="clinical" && (!caseFields.complaint.trim() || !caseFields.history.trim())){setError("Please enter a chief complaint and history of present illness.");return;}
    setBusy(true); setAnswer(""); setError("");
    try { const result = await ask({ data: { mode, question: mode==="clinical" ? "Educational fictional/de-identified case. Missing fields are unknown, not normal.\n"+clinicalCase : question } }); setAnswer(result.answer); }
    catch (e) { setError(e instanceof Error ? e.message : "AI request failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <><PageHeader eyebrow="AI-powered learning" title="PhysioSmart AI Assistant" desc="Ask real AI about clinical reasoning, physiotherapy concepts, and BCQ explanations. No student account required." /><Container><div className="mx-auto max-w-3xl space-y-6"><Disclaimer /><div className="flex flex-wrap gap-2" role="group" aria-label="AI learning mode">{modes.map(m => <Button key={m.value} variant={mode === m.value ? "default" : "outline"} onClick={() => { setMode(m.value); setQuestion(m.example); setAnswer(""); setError(""); }}>{m.label}</Button>)}</div><form onSubmit={submit} className="space-y-4">{mode==="clinical"?<div className="space-y-5"><div className="rounded-xl border bg-secondary/30 p-4"><h2 className="text-lg font-bold">Structured clinical case</h2><p className="mt-1 text-sm text-muted-foreground">Use a fictional or de-identified case only. Do not enter names, contact information, exact birth dates or identifying details. Fields marked * are required.</p></div><div className="grid gap-4 sm:grid-cols-2">{([{key:"age",label:"Age",placeholder:"e.g. 45 years"},{key:"details",label:"Relevant patient details",placeholder:"e.g. activity level, occupation"},{key:"complaint",label:"Chief complaint *",placeholder:"Main symptom or concern"},{key:"duration",label:"Duration",placeholder:"e.g. 3 weeks"}] as const).map(f=><label key={f.key} className="space-y-2 text-sm font-semibold"><span>{f.label}</span><Input value={caseFields[f.key]} maxLength={300} onChange={e=>setCaseFields(s=>({...s,[f.key]:e.target.value}))} placeholder={f.placeholder}/></label>)}</div>{([{key:"history",label:"History of present illness *",placeholder:"Onset, symptoms, progression, aggravating and easing factors"},{key:"medical",label:"Relevant medical history",placeholder:"Conditions, surgeries, prior injuries"},{key:"medications",label:"Medications, if relevant",placeholder:"Relevant medications or none known"},{key:"limitations",label:"Functional limitations",placeholder:"Daily activities, mobility, work or sports"},{key:"findings",label:"Examination findings, if available",placeholder:"Vitals, range of motion, strength, neurological or other findings"}] as const).map(f=><label key={f.key} className="block space-y-2 text-sm font-semibold"><span>{f.label}</span><Textarea rows={3} maxLength={900} value={caseFields[f.key]} onChange={e=>setCaseFields(s=>({...s,[f.key]:e.target.value}))} placeholder={f.placeholder}/></label>)}</div>:<><label htmlFor="ai-question" className="block font-semibold">Your learning question</label><Textarea id="ai-question" value={question} onChange={e=>setQuestion(e.target.value)} minLength={8} maxLength={4000} rows={7} required placeholder="Ask your DPT learning question"/></>}<p className="text-xs text-muted-foreground">Educational clinical decision support only. This tool cannot confirm a diagnosis or replace assessment, diagnosis or treatment by a qualified healthcare professional.</p><Button disabled={busy||(mode==="clinical"?(!caseFields.complaint.trim()||!caseFields.history.trim()):question.trim().length<8)} type="submit">{busy?"Analyzing…":mode==="clinical"?"Analyze clinical case":"Ask PhysioSmart AI"}</Button></form>{error && <div role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">{error}</div>}{answer && <section aria-live="polite" className="overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><h2 className="mb-5 border-b pb-4 text-xl font-bold tracking-tight">AI learning response</h2><FormattedAnswer text={answer} /><p className="mt-5 border-t pt-3 text-xs text-muted-foreground">Educational AI output. Verify clinical claims with authoritative guidelines and qualified supervisors.</p></section>}</div></Container></>;
}
