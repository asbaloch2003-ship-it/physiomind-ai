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
  { value: "clinical", label: "Physiotherapy clinical reasoning", example: "Fictional physiotherapy case: a 35-year-old recreational runner has gradual anterior knee pain on stairs. Which physiotherapy assessment, functional tests, working hypotheses, goals and rehabilitation plan should be considered?" },
  { value: "study", label: "Study tutor", example: "Explain the gait cycle phases and the role of major lower limb muscles in simple language for a DPT student." },
  { value: "quiz", label: "Quiz explanations", example: "In a BCQ about the Trendelenburg sign, why does pelvic drop suggest hip abductor weakness? Explain common distractors." },
];
function InlineAnswer({ text }: { text: string }) {
  const clean=text.replace(/\\\*/g,"*").replace(/\*{3,}/g,"**");
  return <>{clean.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g).map((part,i)=>
    part.startsWith("**")&&part.endsWith("**") ? <strong key={i} className="font-semibold text-foreground">{part.slice(2,-2)}</strong>
    : part.startsWith("*")&&part.endsWith("*") ? <em key={i}>{part.slice(1,-1)}</em>
    : <span key={i}>{part}</span>
  )}</>;
}
function FormattedAnswer({ text, clinical=false }: { text: string; clinical?: boolean }) {
  const normalized=text.replace(/\r\n?/g,"\n").replace(/\\\*/g,"*")
    .replace(/^[ \t]*\*\*[ \t]*[•*-][ \t]*\*\*[ \t]*$/gm,"")
    .replace(/^[ \t]*[•*-][ \t]*$/gm,"")
    .replace(/^[ \t]*\*\*[ \t]*[•-][ \t]*\*\*[ \t]*(?=\S)/gm,"- ")
    .replace(/[ \t]+(#{1,4})[ \t]+/g,"\n$1 ")
    .replace(/\n{3,}/g,"\n\n");
  const lines=normalized.split("\n").map(line=>line.trim()).filter(Boolean);
  const sections: {title:string;items:{kind:"bullet"|"number"|"subheading"|"paragraph";value:string;num?:string}[]}[]=[];
  let current={title:"",items:[] as {kind:"bullet"|"number"|"subheading"|"paragraph";value:string;num?:string}[]};
  sections.push(current);
  for(const line of lines){
    if(/^(?:\*{1,2})?[•*-](?:\*{1,2})?$/.test(line))continue;
    const heading=line.match(/^#{1,6}\s+(.+)$/);
    if(heading){current={title:heading[1].replace(/\*\*/g,""),items:[]};sections.push(current);continue;}
    const bullet=line.match(/^(?:[-*•]|\*\*[•-]\*\*)\s*(.+)$/);
    if(bullet){current.items.push({kind:"bullet",value:bullet[1]});continue;}
    const numbered=line.match(/^(\d+[.)])\s+(.+)$/);
    if(numbered){current.items.push({kind:"number",num:numbered[1],value:numbered[2]});continue;}
    if(/^\*\*[^*]+\*\*:?$/.test(line)){current.items.push({kind:"subheading",value:line.replace(/^\*\*|\*\*:?\s*$/g,"")});continue;}
    current.items.push({kind:"paragraph",value:line});
  }
  return <article className="space-y-6">{sections.filter(section=>section.title||section.items.length).map((section,i)=>
    <section key={i} className={clinical?"rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:p-6":"space-y-4"}>
      {section.title&&<div className="mb-5 flex items-start gap-3 border-b border-border/70 pb-4"><span className="mt-1 h-6 w-1 shrink-0 rounded-full bg-primary"/><h3 className="text-lg font-bold tracking-tight text-foreground">{section.title}</h3></div>}
      <div className="space-y-3 text-[15px] leading-7 text-foreground/90">{section.items.map((item,j)=>{
        if(item.kind==="subheading")return <h4 key={j} className="pt-2 font-bold text-foreground">{item.value}</h4>;
        if(item.kind==="bullet"||item.kind==="number")return <div key={j} className="flex items-start gap-3"><span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{item.kind==="bullet"?"•":item.num}</span><p className="min-w-0 flex-1"><InlineAnswer text={item.value}/></p></div>;
        return <p key={j} className="break-words"><InlineAnswer text={item.value}/></p>;
      })}</div>
    </section>
  )}</article>;
}
const demoStudy = `## Myotomes and Dermatomes
### Definition
A dermatome is an area of skin supplied predominantly by sensory fibers from one spinal nerve root. A myotome is a group of muscles or movement pattern supplied predominantly by motor fibers from one spinal nerve root. Overlap between adjacent roots is common.

### Common Dermatome Landmarks
- C6: thumb and lateral forearm.
- C7: middle finger.
- C8: little finger.
- T4: approximately nipple level.
- T10: approximately umbilicus.
- L4: medial lower leg and medial ankle.
- L5: dorsum of foot and great toe.
- S1: lateral foot.

### Common Myotome Screening
- C5: shoulder abduction.
- C6: elbow flexion or wrist extension.
- C7: elbow extension.
- C8: finger flexion.
- T1: finger abduction.
- L2: hip flexion.
- L3: knee extension.
- L4: ankle dorsiflexion.
- L5: great-toe extension.
- S1: ankle plantarflexion.

### Clinical Interpretation
Compare both sides, document muscle strength and sensation, and interpret results alongside reflexes, symptom distribution, and other examination findings. A single abnormal result does not confirm a nerve-root diagnosis.

### Quick Revision
Dermatomes assess sensory distribution; myotomes assess motor function. Root maps are approximate and overlap.`;
const demoClinical = `## 1. Subjective Assessment
Fictional example: a 35-year-old runner reports gradual anterior knee pain during stairs and squatting. Duration, training load, trauma history and systemic symptoms require clarification.

## 2. Objective Assessment
Assess gait, squat and step-down movement, knee and hip range of motion, quadriceps and hip strength, pain behavior and functional limitations. Perform additional tests only if indicated.

## 3. Key Findings
Known: anterior knee pain with loading activities. Unknown: swelling, instability, strength deficits, range of motion and red flags.

## 4. Patient Impression
Possible patellofemoral pain-related presentation; requires examination and clinical confirmation. Other sources of anterior knee pain remain possible.

## 5. Physiotherapist Plan
Provide load-management education, graded quadriceps and hip strengthening, symptom-guided activity progression and functional movement retraining.

## 6. Safety and Referrals
Screen for major trauma, inability to bear weight, marked swelling, fever, systemic illness or neurovascular symptoms. Refer urgently if serious warning signs are present.

## 7. Review and Goals
Track pain during stairs, functional activity tolerance and a validated patient-reported outcome measure. Reassess progress and modify loading based on response.`;
const demoQuiz = `## Demonstration: Quiz Explanation
### Question
Which spinal nerve root is commonly assessed by great-toe extension strength?
- A. L2
- B. L3
- C. L5
- D. S1

### Correct Answer
C. L5

### Explanation
Great-toe extension, mainly through extensor hallucis longus, is a common L5 myotome screening movement. Individual muscle innervation overlaps, so the finding should be interpreted with sensation, reflexes and the rest of the examination.`;
function Page() {
  const search=Route.useSearch();
  const incoming=search.topic.trim();
  const initial=incoming ? "Teach me "+incoming+" in "+(search.subject||"my DPT subject")+(search.semester?" (semester "+search.semester+")":"")+". Explain the full topic clearly and in depth, step by step, with important subtopics, definitions of difficult terms, relevant examples and a concise revision summary. Use professional section headings and readable lists. Include clinical applications only if relevant to the subject." : modes[0].example;
  const [mode, setMode] = useState<Mode>(incoming?"study":"clinical");
  const [question, setQuestion] = useState(initial);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportLength,setReportLength] = useState<"quick"|"detailed">("quick");
  const [caseFields,setCaseFields]=useState({age:"",gender:"",details:"",complaint:"",duration:"",history:"",medical:"",medications:"",limitations:"",findings:""});
  const ask = useServerFn(askPhysioAI);
  const [savedNotice,setSavedNotice] = useState("");
  const [demoMode,setDemoMode] = useState(false);
  function showDemo(){
    setAnswer(mode==="clinical"?demoClinical:mode==="quiz"?demoQuiz:demoStudy);
    setDemoMode(true);setError("");setSavedNotice("Competition demo: pre-prepared educational example, not a live AI response.");
  }
  function cacheKey(text:string) { return "physiosmart:study:v1:"+text.trim().toLowerCase(); }
  function readSaved(text:string) {
    try { const value=localStorage.getItem(cacheKey(text)); return value ? JSON.parse(value) as {answer:string; savedAt:number} : null; } catch { return null; }
  }
  useEffect(()=>{if(!incoming)return;setMode("study");setQuestion(initial);setAnswer("");setError("");},[incoming,initial]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const clinicalCase = Object.entries(caseFields).filter(([,v])=>v.trim()).map(([k,v])=>k+": "+v.trim()).join("\n");
    if(mode==="clinical" && (!caseFields.complaint.trim() || !caseFields.history.trim())){setError("Please enter a chief complaint and history of present illness.");return;}
    setSavedNotice("");setDemoMode(false);
    if(mode==="study"){
      const saved=readSaved(question);
      if(saved?.answer){setAnswer(saved.answer);setError("");setSavedNotice("Previously saved explanation from this device. No AI request needed.");return;}
    }
    setBusy(true); setAnswer(""); setError("");
    try { const result = await ask({ data: { mode, reportLength:mode==="clinical"?reportLength:undefined, question: mode==="clinical" ? "Educational fictional/de-identified case. Missing fields are unknown, not normal.\n"+clinicalCase : question } }); setAnswer(result.answer);
      if(mode==="study"){try{localStorage.setItem(cacheKey(question),JSON.stringify({answer:result.answer,savedAt:Date.now()}));}catch{}}
    }
    catch (e) {
      const saved=mode==="study"?readSaved(question):null;
      if(saved?.answer){setAnswer(saved.answer);setSavedNotice("Gemini is temporarily unavailable. Showing your previously saved explanation.");}
      else setError(e instanceof Error ? e.message : "AI request failed. Please try again.");
    }
    finally { setBusy(false); }
  }
  const [copied,setCopied] = useState(false);
  async function copyResponse() {
    try { await navigator.clipboard.writeText(answer); setCopied(true); window.setTimeout(()=>setCopied(false),2000); }
    catch { setError("Copy failed. Please select and copy the response manually."); }
  }
  return <><style>{`@media print { @page { size: A4; margin: 15mm; } body * { visibility: hidden !important; } .ai-print-content, .ai-print-content * { visibility: visible !important; } .ai-print-content { position: absolute !important; top: 0; left: 0; width: 100%; border: 0 !important; box-shadow: none !important; padding: 0 !important; background: white !important; color: #111 !important; } .ai-print-actions { display: none !important; } .ai-print-content section { break-inside: avoid; box-shadow: none !important; } } `}</style><PageHeader eyebrow="AI-powered learning" title="PhysioSmart AI Assistant" desc="Explore physiotherapy-focused clinical assessment and rehabilitation reasoning, DPT study concepts and BCQ explanations. No student account required." /><Container><div className="mx-auto max-w-3xl space-y-6"><Disclaimer /><div className="flex flex-wrap gap-2" role="group" aria-label="AI learning mode">{modes.map(m => <Button key={m.value} variant={mode === m.value ? "default" : "outline"} onClick={() => { setMode(m.value); setQuestion(m.example); setAnswer(""); setError(""); setDemoMode(false); setSavedNotice(""); }}>{m.label}</Button>)}</div><form onSubmit={submit} className="space-y-4">{mode==="clinical"?<div className="space-y-5"><fieldset className="rounded-xl border p-4"><legend className="px-2 text-sm font-bold">Report detail</legend><div className="grid gap-3 sm:grid-cols-2"><label className={`cursor-pointer rounded-lg border p-3 ${reportLength==="quick"?"border-primary bg-primary/5":"bg-card"}`}><input type="radio" name="report-length" value="quick" checked={reportLength==="quick"} onChange={()=>setReportLength("quick")} className="mr-2 accent-current"/><span className="font-semibold">Clinic Snapshot</span><p className="mt-1 pl-5 text-xs text-muted-foreground">170–250 words · 7 brief clinical sections</p></label><label className={`cursor-pointer rounded-lg border p-3 ${reportLength==="detailed"?"border-primary bg-primary/5":"bg-card"}`}><input type="radio" name="report-length" value="detailed" checked={reportLength==="detailed"} onChange={()=>setReportLength("detailed")} className="mr-2 accent-current"/><span className="font-semibold">Detailed Learning Report</span><p className="mt-1 pl-5 text-xs text-muted-foreground">In-depth explanations for advanced learning</p></label></div></fieldset><div className="rounded-xl border bg-secondary/30 p-4"><h2 className="text-lg font-bold">Physiotherapy clinical case</h2><p className="mt-1 text-sm text-muted-foreground">Use a fictional or de-identified case only. Do not enter names, contact information, exact birth dates or identifying details. Fields marked * are required.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-semibold"><span>Gender</span><select aria-label="Gender" value={caseFields.gender} onChange={e=>setCaseFields(s=>({...s,gender:e.target.value}))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"><option value="">Select gender (optional)</option><option value="Male">Male</option><option value="Female">Female</option><option value="Non-binary">Non-binary</option><option value="Prefer to self-describe">Prefer to self-describe</option><option value="Prefer not to say">Prefer not to say</option></select></label>{([{key:"age",label:"Age",placeholder:"e.g. 45 years"},{key:"details",label:"Relevant patient details",placeholder:"e.g. activity level, occupation"},{key:"complaint",label:"Chief complaint *",placeholder:"Main physiotherapy complaint, body region or movement problem"},{key:"duration",label:"Duration",placeholder:"e.g. 3 weeks"}] as const).map(f=><label key={f.key} className="space-y-2 text-sm font-semibold"><span>{f.label}</span><Input value={caseFields[f.key]} maxLength={300} onChange={e=>setCaseFields(s=>({...s,[f.key]:e.target.value}))} placeholder={f.placeholder}/></label>)}</div>{([{key:"history",label:"History of present illness *",placeholder:"Onset, symptoms, progression, aggravating and easing factors"},{key:"medical",label:"Relevant medical history",placeholder:"Conditions, surgeries, prior injuries"},{key:"medications",label:"Medications, if relevant",placeholder:"Relevant medications or none known"},{key:"limitations",label:"Functional limitations",placeholder:"Affected daily activities, walking, transfers, work or sports"},{key:"findings",label:"Examination findings, if available",placeholder:"ROM, strength, movement, gait, balance, sensation, vitals or functional tests"}] as const).map(f=><label key={f.key} className="block space-y-2 text-sm font-semibold"><span>{f.label}</span><Textarea rows={3} maxLength={900} value={caseFields[f.key]} onChange={e=>setCaseFields(s=>({...s,[f.key]:e.target.value}))} placeholder={f.placeholder}/></label>)}</div>:<><label htmlFor="ai-question" className="block font-semibold">Your learning question</label><Textarea id="ai-question" value={question} onChange={e=>setQuestion(e.target.value)} minLength={8} maxLength={4000} rows={7} required placeholder="Ask your DPT learning question"/></>}<p className="text-xs text-muted-foreground">Educational clinical decision support only. This tool cannot confirm a diagnosis or replace assessment, diagnosis or treatment by a qualified healthcare professional.</p><Button disabled={busy||(mode==="clinical"?(!caseFields.complaint.trim()||!caseFields.history.trim()):question.trim().length<8)} type="submit">{busy?"Analyzing…":mode==="clinical"?"Analyze clinical case":"Ask PhysioSmart AI"}</Button><div className="mt-3"><Button type="button" variant="outline" onClick={showDemo}>View offline demonstration example</Button><p className="mt-1 text-xs text-muted-foreground">Pre-prepared sample content; works without Gemini. Not a live answer to your entered question.</p></div></form>{error && <div role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">{error}</div>}{savedNotice&&<p role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">{savedNotice}</p>}{answer && <section aria-live="polite" className="ai-print-content overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><h2 className="mb-5 border-b pb-4 text-xl font-bold tracking-tight">{mode==="clinical"?"Physiotherapy Clinical Reasoning Report":"AI Learning Response"}</h2><div className="ai-print-actions mb-5 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={()=>window.print()}>Save as PDF</Button><Button type="button" variant="outline" onClick={copyResponse}>{copied?"Copied!":"Copy Text"}</Button></div>{demoMode&&<p className="mb-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm font-semibold">Demonstration example — not generated from the current input.</p>}<FormattedAnswer text={answer} clinical={mode==="clinical"} /><p className="mt-5 border-t pt-3 text-xs text-muted-foreground">Educational AI output. Verify clinical claims with authoritative guidelines and qualified supervisors.</p></section>}</div></Container></>;
}
