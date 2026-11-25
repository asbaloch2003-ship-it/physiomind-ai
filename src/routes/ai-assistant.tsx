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
  const sections: {title:string;items:({kind:"bullet"|"number"|"subheading"|"paragraph";value:string;num?:string}|{kind:"table";headers:string[];rows:string[][]})[]}[]=[];
  let current={title:"",items:[] as ({kind:"bullet"|"number"|"subheading"|"paragraph";value:string;num?:string}|{kind:"table";headers:string[];rows:string[][]})[]};
  sections.push(current);
  for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
    const line=lines[lineIndex];
    const splitTableRow=(value:string)=>value.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(cell=>cell.trim());
    const isTableSeparator=(value:string)=>{const cells=splitTableRow(value);return cells.length>=2 && cells.every(cell=>/^:?-{3,}:?$/.test(cell));};
    if(line.includes("|") && lineIndex+1<lines.length && isTableSeparator(lines[lineIndex+1])){
      const headers=splitTableRow(line);
      lineIndex++;
      const rows:string[][]=[];
      while(lineIndex+1<lines.length && lines[lineIndex+1].includes("|")){lineIndex++;const cells=splitTableRow(lines[lineIndex]);if(cells.some(Boolean))rows.push(cells);}
      current.items.push({kind:"table",headers,rows});
      continue;
    }
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
        if(item.kind==="table")return <div key={j} className="my-4 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[520px] border-collapse text-left text-sm"><thead className="bg-primary/10"><tr>{item.headers.map((cell,k)=><th key={k} className="border-b px-4 py-3 font-semibold text-foreground"><InlineAnswer text={cell}/></th>)}</tr></thead><tbody>{item.rows.map((row,k)=><tr key={k} className={k%2===0?"bg-card":"bg-secondary/40"}>{item.headers.map((_,c)=><td key={c} className="border-b border-border/70 px-4 py-3 align-top text-foreground/90">{row[c]?<InlineAnswer text={row[c]}/>:null}</td>)}</tr>)}</tbody></table></div>;
        if(item.kind==="subheading")return <h4 key={j} className="pt-2 font-bold text-foreground">{item.value}</h4>;
        if(item.kind==="bullet"||item.kind==="number")return <div key={j} className="flex items-start gap-3"><span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{item.kind==="bullet"?"•":item.num}</span><p className="min-w-0 flex-1"><InlineAnswer text={item.value}/></p></div>;
        return <p key={j} className="break-words"><InlineAnswer text={item.value}/></p>;
      })}</div>
    </section>
  )}</article>;
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
  const [reportLength,setReportLength] = useState<"quick"|"detailed">("quick");
  const [caseFields,setCaseFields]=useState({age:"",gender:"",details:"",complaint:"",duration:"",history:"",medical:"",medications:"",limitations:"",findings:"",orthopaedicTests:"",neurological:"",balance:"",coordination:"",functionalTests:"",gaitPosture:"",vitals:""});
  const ask = useServerFn(askPhysioAI);
  const [savedNotice,setSavedNotice] = useState("");
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
    setSavedNotice("");
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
  return <><style>{`@media print { @page { size: A4; margin: 15mm; } body * { visibility: hidden !important; } .ai-print-content, .ai-print-content * { visibility: visible !important; } .ai-print-content { position: absolute !important; top: 0; left: 0; width: 100%; border: 0 !important; box-shadow: none !important; padding: 0 !important; background: white !important; color: #111 !important; } .ai-print-actions { display: none !important; } .ai-print-content section { break-inside: avoid; box-shadow: none !important; } } `}</style><PageHeader eyebrow="AI-powered learning" title="PhysioSmart AI Assistant" desc="Explore physiotherapy-focused clinical assessment and rehabilitation reasoning, DPT study concepts and BCQ explanations. No student account required." /><Container><div className="mx-auto max-w-3xl space-y-6"><Disclaimer /><div className="flex flex-wrap gap-2" role="group" aria-label="AI learning mode">{modes.map(m => <Button key={m.value} variant={mode === m.value ? "default" : "outline"} onClick={() => { setMode(m.value); setQuestion(m.example); setAnswer(""); setError(""); setSavedNotice(""); }}>{m.label}</Button>)}</div><form onSubmit={submit} className="space-y-4">{mode==="clinical"?<div className="space-y-5"><fieldset className="rounded-xl border p-4"><legend className="px-2 text-sm font-bold">Report detail</legend><div className="grid gap-3 sm:grid-cols-2"><label className={`cursor-pointer rounded-lg border p-3 ${reportLength==="quick"?"border-primary bg-primary/5":"bg-card"}`}><input type="radio" name="report-length" value="quick" checked={reportLength==="quick"} onChange={()=>setReportLength("quick")} className="mr-2 accent-current"/><span className="font-semibold">Clinic Snapshot</span><p className="mt-1 pl-5 text-xs text-muted-foreground">170–250 words · 7 brief clinical sections</p></label><label className={`cursor-pointer rounded-lg border p-3 ${reportLength==="detailed"?"border-primary bg-primary/5":"bg-card"}`}><input type="radio" name="report-length" value="detailed" checked={reportLength==="detailed"} onChange={()=>setReportLength("detailed")} className="mr-2 accent-current"/><span className="font-semibold">Detailed Learning Report</span><p className="mt-1 pl-5 text-xs text-muted-foreground">In-depth explanations for advanced learning</p></label></div></fieldset><div className="rounded-xl border bg-secondary/30 p-4"><h2 className="text-lg font-bold">Physiotherapy clinical case</h2><p className="mt-1 text-sm text-muted-foreground">Use a fictional or de-identified case only. Do not enter names, contact information, exact birth dates or identifying details. Fields marked * are required.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-semibold"><span>Gender</span><select aria-label="Gender" value={caseFields.gender} onChange={e=>setCaseFields(s=>({...s,gender:e.target.value}))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"><option value="">Select gender (optional)</option><option value="Male">Male</option><option value="Female">Female</option><option value="Non-binary">Non-binary</option><option value="Prefer to self-describe">Prefer to self-describe</option><option value="Prefer not to say">Prefer not to say</option></select></label>{([{key:"age",label:"Age",placeholder:"e.g. 45 years"},{key:"details",label:"Relevant patient details",placeholder:"e.g. activity level, occupation"},{key:"complaint",label:"Chief complaint *",placeholder:"Main physiotherapy complaint, body region or movement problem"},{key:"duration",label:"Duration",placeholder:"e.g. 3 weeks"}] as const).map(f=><label key={f.key} className="space-y-2 text-sm font-semibold"><span>{f.label}</span><Input value={caseFields[f.key]} maxLength={300} onChange={e=>setCaseFields(s=>({...s,[f.key]:e.target.value}))} placeholder={f.placeholder}/></label>)}</div>{([{key:"history",label:"History of present illness *",placeholder:"Onset, symptoms, progression, aggravating and easing factors"},{key:"medical",label:"Relevant medical history",placeholder:"Conditions, surgeries, prior injuries"},{key:"medications",label:"Medications, if relevant",placeholder:"Relevant medications or none known"},{key:"limitations",label:"Functional limitations",placeholder:"Affected daily activities, walking, transfers, work or sports"}] as const).map(f=><label key={f.key} className="block space-y-2 text-sm font-semibold"><span>{f.label}</span><Textarea rows={3} maxLength={900} value={caseFields[f.key]} onChange={e=>setCaseFields(s=>({...s,[f.key]:e.target.value}))} placeholder={f.placeholder}/></label>)}<fieldset className="space-y-4 rounded-xl border p-4"><legend className="px-2 text-sm font-bold">Special Tests & Examination</legend><p className="text-xs text-muted-foreground">Enter only tests performed and their actual findings. Leave blank if not assessed; the AI will suggest relevant tests when needed.</p>{([{key:"findings",label:"General examination",placeholder:"ROM, muscle strength, palpation, posture, movement analysis and other objective findings"},{key:"orthopaedicTests",label:"Orthopaedic / special tests",placeholder:"Test name, side and result; e.g. Lachman, McMurray, SLR, Spurling, FABER, FADIR, as clinically indicated"},{key:"neurological",label:"Neurological assessment",placeholder:"Dermatomes, myotomes, deep tendon reflexes, sensation, tone and neurodynamic tests"},{key:"balance",label:"Balance assessment",placeholder:"Static/dynamic balance, tandem stance, single-leg stance, Romberg, Functional Reach or Berg Balance Scale; record scores/results"},{key:"coordination",label:"Coordination assessment",placeholder:"Finger-to-nose, heel-to-shin, rapid alternating movements and observed accuracy/symmetry"},{key:"functionalTests",label:"Functional performance tests",placeholder:"TUG, 5 Times Sit-to-Stand, 10-Metre Walk Test, 6-Minute Walk Test or other relevant outcome measures; include scores/timing"},{key:"gaitPosture",label:"Gait & posture assessment",placeholder:"Gait pattern, walking speed, assistive device, alignment, deviations and postural findings"},{key:"vitals",label:"Vital signs (when indicated)",placeholder:"Blood pressure, heart rate, respiratory rate, SpO₂ and relevant symptoms"}] as const).map(f=><label key={f.key} className="block space-y-2 text-sm font-semibold"><span>{f.label}</span><Textarea rows={2} maxLength={900} value={caseFields[f.key]} onChange={e=>setCaseFields(s=>({...s,[f.key]:e.target.value}))} placeholder={f.placeholder}/></label>)}</fieldset></div>:<><label htmlFor="ai-question" className="block font-semibold">Your learning question</label><Textarea id="ai-question" value={question} onChange={e=>setQuestion(e.target.value)} minLength={8} maxLength={4000} rows={7} required placeholder="Ask your DPT learning question"/></>}<p className="text-xs text-muted-foreground">Educational clinical decision support only. This tool cannot confirm a diagnosis or replace assessment, diagnosis or treatment by a qualified healthcare professional.</p><Button disabled={busy||(mode==="clinical"?(!caseFields.complaint.trim()||!caseFields.history.trim()):question.trim().length<8)} type="submit">{busy?"Analyzing…":mode==="clinical"?"Analyze clinical case":"Ask PhysioSmart AI"}</Button></form>{error && <div role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">{error}</div>}{savedNotice&&<p role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">{savedNotice}</p>}{answer && <section aria-live="polite" className="ai-print-content overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><h2 className="mb-5 border-b pb-4 text-xl font-bold tracking-tight">{mode==="clinical"?"Physiotherapy Clinical Reasoning Report":"AI Learning Response"}</h2><div className="ai-print-actions mb-5 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={()=>window.print()}>Save as PDF</Button><Button type="button" variant="outline" onClick={copyResponse}>{copied?"Copied!":"Copy Text"}</Button></div><FormattedAnswer text={answer} clinical={mode==="clinical"} /><p className="mt-5 border-t pt-3 text-xs text-muted-foreground">Educational AI output. Verify clinical claims with authoritative guidelines and qualified supervisors.</p></section>}</div></Container></>;
}
