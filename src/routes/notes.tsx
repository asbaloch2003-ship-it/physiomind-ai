import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card, Container, PageHeader, meta } from "@/components/site";
import { SourceReference, StudyFilters } from "@/components/curriculum-controls";
import { courses, getCourse } from "@/lib/curriculum";
import { learningSearch } from "@/lib/study-materials";
import { askPhysioAI } from "@/lib/ai-assistant.functions";

export const Route = createFileRoute("/notes")({
  head: () => meta("DPT Notes", "Semester-wise and subject-wise DPT topic notes with simple explanations."),
  validateSearch: learningSearch,
  component: Page,
});

const outlines:Record<string,string[]> = {
  anatomy:["Regional anatomy","Bones and joints","Muscles","Peripheral nerves","Blood supply","Applied anatomy"],
  physiology:["Homeostasis","Nerve and muscle physiology","Cardiovascular system","Respiratory system","Renal and endocrine systems"],
  kinesiology:["Planes and axes","Joint movements","Muscle actions","Posture","Gait cycle"],
  biomechanics:["Forces and torque","Levers","Joint mechanics","Posture and ergonomics","Gait biomechanics"],
  clinical:["Patient history","Red flags","Examination","Documentation","Rehabilitation planning"],
  neurological:["Neurological assessment","Stroke","Spinal cord injury","Peripheral nerves","Balance and coordination"],
  musculoskeletal:["Orthopaedic assessment","Special tests","Spinal conditions","Joint conditions","Exercise rehabilitation"],
  cardiopulmonary:["Cardiopulmonary assessment","Breathing exercises","Airway clearance","Exercise tolerance","Rehabilitation"],
  electrotherapy:["TENS","NMES","Ultrasound","Thermotherapy","Contraindications"],
  pharmacology:["Drug actions","Drug absorption","Pain medicines","Adverse effects","Physiotherapy precautions"],
  pathology:["Cell injury","Inflammation","Healing","Infection","Systemic pathology"],
  biochemistry:["Biomolecules","Enzymes","Metabolism","ATP production","Clinical biochemistry"],
  research:["Research questions","Study designs","Literature review","Ethics","Data analysis"],
  sports:["Injury assessment","Load management","ACL rehabilitation","Return to sport","Prevention"],
  paediatrics:["Developmental milestones","Paediatric assessment","Cerebral palsy","Developmental delay","Rehabilitation"],
  geriatrics:["Ageing","Falls prevention","Frailty","Osteoporosis","Functional rehabilitation"],
  obstetrics:["Pregnancy","Pelvic floor","Antenatal exercise","Postnatal rehabilitation"],
  prosthetics:["Amputation","Prosthetic components","Orthotics","Gait training"],
  manual:["Joint mobilisation","Soft tissue techniques","Indications","Precautions"],
  integumentary:["Skin anatomy","Wound healing","Pressure injuries","Burn rehabilitation"],
  english:["Grammar","Communication","Reading","Writing","Presentations"],
  medicine:["Cardiovascular conditions","Respiratory conditions","Neurological conditions","Endocrine conditions"],
  surgery:["Preoperative assessment","Postoperative care","Wound healing","Early mobilisation"],
  biostatistics:["Descriptive statistics","Probability","Hypothesis testing","Confidence intervals"],
};
const extras:Record<string,string[]> = {
  "pakistan-studies":["Pakistan movement","Constitutional history","Geography","Civic responsibilities"],
  "computer":["Computer basics","Operating systems","Office software","Internet safety"],
  "islamic-studies":["Ethics","Honesty","Professional responsibility","Cultural sensitivity"],
  "sociology":["Society and culture","Social determinants of health","Disability and inclusion"],
  "medical-physics":["Mechanics","Waves","Electricity","Medical applications"],
  "health-wellness":["Health promotion","Prevention","Physical activity","Nutrition"],
  "exercise-physiology":["Exercise responses","Energy systems","Training adaptations","Exercise prescription"],
  "molecular-biology":["DNA and RNA","Gene expression","Inheritance","Genetic conditions"],
  "therapeutic-exercises":["Range of motion","Strengthening","Stretching","Balance","Exercise progression"],
  "behavioral-sciences":["Patient psychology","Motivation","Communication","Professional ethics"],
  "community-medicine":["Public health","Community rehabilitation","Health education","Prevention"],
  "radiology":["X-ray","CT","MRI","Ultrasound"],
  "evidence-based":["Research evidence","Clinical expertise","Patient preferences","Critical appraisal"],
  "emergency":["Basic life support","First aid","Emergency recognition","Referral"],
  "clinical-decisions":["Differential diagnosis","Red flags","Clinical reasoning","Referral"],
  "professional-practice":["Consent","Confidentiality","Documentation","Professional ethics"],
  "research-project":["Research proposal","Literature review","Methods","Analysis","Research report"],
};
function topicsFor(id:string) {
  if(extras[id])return extras[id];
  const key=Object.keys(outlines).find(k=>id.includes(k));
  return key?outlines[key]:["Introduction","Core concepts","Important principles","Practical applications","Revision"];
}
function NotesText({value}:{value:string}) {
  // Normalize AI formatting safely, without rendering raw HTML.
  const cleaned=value.replace(/\r/g,"").replace(/\\\*/g,"*")
    .replace(/(^|\n)\s*#{1,6}\s*/g,"$1")
    .replace(/\s+#{2,6}\s+/g,"\n")
    .replace(/\*\*/g,"").replace(/\*/g,"")
    .replace(/\s+[•]\s+(?=[A-Z])/g,"\n• ");
  const lines=cleaned.split("\n").map(s=>s.trim()).filter(Boolean);
  const headingNames=/^(Introduction|Definition|Overview|Classification|Types|Key Concepts|Easy Explanation|Detailed Explanation|Mechanism|Functions|Actions|Origin|Insertion|Nerve Supply|Anatomical Location|Position|Examples?|Clinical Relevance|Clinical Applications|Practical Applications|Summary|Quick Revision(?: Points)?|Important Points|Viva Questions(?: with Answers)?|Questions and Answers|Causes|Symptoms|Management|Procedure|Precautions|Contraindications|Indications|Principles|Applications|Conclusion|Anatomy|Structure|Physiology|Pathophysiology|Assessment|Treatment|Key Takeaways)\s*:?$/i;
  type NoteBlock={kind:"heading"|"subheading"|"text"|"bullet"|"number";text:string;number?:string};
  const blocks:NoteBlock[]=lines.map((line)=>{
    const explicit=line.match(/^SECTION:\s*(.+)$/i);
    if(explicit)return {kind:"heading",text:explicit[1]};
    const sub=line.match(/^SUBSECTION:\s*(.+)$/i);
    if(sub)return {kind:"subheading",text:sub[1]};
    if(headingNames.test(line))return {kind:"heading",text:line.replace(/:$/,"")};
    const numbered=line.match(/^(\d+)[.)]\s+(.+)$/);
    if(numbered)return {kind:"number",text:numbered[2],number:numbered[1]};
    const bullet=line.match(/^(?:[-•]\s+|ITEM:\s*)(.+)$/i);
    if(bullet)return {kind:"bullet",text:bullet[1]};
    if(line.endsWith(":")&&line.length<85)return {kind:"subheading",text:line.slice(0,-1)};
    return {kind:"text",text:line};
  });
  function emphasis(text:string) {
    const match=text.match(/^([^:]{2,65}):\s+(.+)$/);
    if(!match)return text;
    return <><strong className="font-semibold text-slate-900">{match[1]}:</strong> {match[2]}</>;
  }
  return <article className="space-y-4 text-[15px] leading-7 text-slate-700">
    {blocks.map((block,i)=>{
      if(block.kind==="heading")return <div key={i} className="mt-9 flex items-center gap-3 border-b border-slate-200 pb-3 first:mt-0"><span className="h-6 w-1 shrink-0 rounded-full bg-blue-600"/><h3 className="text-lg font-bold tracking-tight text-slate-950">{block.text}</h3></div>;
      if(block.kind==="subheading")return <h4 key={i} className="mt-6 text-base font-bold text-slate-900">{block.text}</h4>;
      if(block.kind==="bullet"||block.kind==="number")return <div key={i} className="flex items-start gap-3 pl-1"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-700">{block.kind==="number"?block.number:"•"}</span><p className="min-w-0 flex-1">{emphasis(block.text)}</p></div>;
      return <p key={i} className="max-w-none">{emphasis(block.text)}</p>;
    })}
  </article>;
}
function Page(){
  const search=Route.useSearch();
  const [semester,setSemester]=useState(search.semester??"1");
  const [subject,setSubject]=useState(search.course??"all");
  const [custom,setCustom]=useState("");
  const [topic,setTopic]=useState("");
  const [answer,setAnswer]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const ask=useServerFn(askPhysioAI);
  const course=getCourse(subject);
  async function generate(t:string){
    if(!course||t.trim().length<3||busy)return;
    setBusy(true);setError("");setAnswer("");setTopic(t);
    try{
      const nonClinical = /^(english-|pakistan-studies|computer$|islamic-studies$|sociology$|biostatistics-|research-methodology$|research-project$|professional-practice$)/.test(course.id);
      const application = nonClinical ? "Explain subject-specific applications and worked examples; do not include clinical relevance, patient cases or physiotherapy applications unless directly requested or genuinely part of the topic." : "Include clinical relevance and physiotherapy applications only when they naturally apply to the topic.";
      const question="Create detailed, simple, comprehensive DPT study notes for semester "+course.semester+", subject "+course.name+", topic "+t+". Explain all important subtopics, concepts, classifications, processes, examples and exam points in depth, not just a definition. "+application+" For anatomical muscle topics, cover anatomical location, origin, insertion, nerve supply and actions for individual major muscles, grouping by region. For non-muscle topics, adapt headings and details to that subject. Include revision points and three viva questions with answers. IMPORTANT OUTPUT FORMAT: Use SECTION: Heading on a separate line for each major section, SUBSECTION: Name for subtopics, ITEM: Detail for bullet items, and ordinary paragraphs for explanations. Each SECTION, SUBSECTION and ITEM must start on a NEW LINE. Do not use Markdown symbols (asterisks, hashes or backticks). Write professional textbook-style sections, not a wall of text. Do not invent sources.";
      const result=await ask({data:{mode:"notes",question}});
      setAnswer(result.answer);
    }catch(e){setError(e instanceof Error?e.message:"Could not generate notes.");}
    finally{setBusy(false);}
  }
  return <>
    <PageHeader eyebrow="DPT learning library" title="Semester-wise Study Notes" desc="Choose a semester, subject and topic to generate simple, easy-to-understand notes. No fixed list of 62 short notes."/>
    <Container>
      <SourceReference/>
      <StudyFilters semester={semester} subject={subject} onSemester={v=>{setSemester(v);setSubject("all");setAnswer("");}} onSubject={v=>{setSubject(v);setAnswer("");}}/>
      {!course?<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{courses.filter(c=>semester==="all"||c.semester===Number(semester)).map(c=><button key={c.id} onClick={()=>setSubject(c.id)} className="rounded-xl border bg-card p-5 text-left hover:border-primary"><span className="text-xs text-primary">Semester {c.semester}</span><h2 className="mt-2 font-semibold">{c.name}</h2><span className="mt-3 block text-sm text-muted-foreground">Explore topics →</span></button>)}</div>:
      <div className="space-y-5">
        <Card><h2 className="text-xl font-bold">{course.name}</h2><p className="mt-2 text-sm text-muted-foreground">Select a suggested topic or type any topic from your curriculum. Suggested topics are independent study outlines, not a complete official syllabus.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">{topicsFor(course.id).map(t=><button key={t} disabled={busy} onClick={()=>generate(t)} className="rounded-lg border p-3 text-left text-sm hover:bg-secondary">{t} →</button>)}</div>
          <div className="mt-5 flex flex-wrap gap-2"><input aria-label="Topic name" className="h-11 min-w-48 flex-1 rounded-lg border bg-background px-3 text-sm" placeholder="Or type another topic…" value={custom} onChange={e=>setCustom(e.target.value)} maxLength={150}/><Button disabled={busy||custom.trim().length<3} onClick={()=>generate(custom)}>{busy?"Generating…":"Generate AI notes"}</Button></div>
        </Card>
        {busy&&<p role="status">Preparing your notes…</p>}
        {error&&<p role="alert" className="rounded-lg border border-destructive p-4 text-destructive">{error}</p>}
        {answer&&<Card><header className="mb-7 rounded-xl border border-slate-200 bg-slate-50 px-5 py-6"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">PhysioSmart AI · Study Notes</p><h2 className="text-2xl font-bold tracking-tight text-slate-950">{topic}</h2><p className="mt-2 text-sm text-slate-600">{course.name} · Semester {course.semester}</p></header><NotesText value={answer}/><div className="mt-5 flex gap-2 border-t pt-4"><Button variant="outline" onClick={()=>navigator.clipboard?.writeText(answer)}>Copy notes</Button><Button variant="outline" onClick={()=>window.print()}>Print</Button></div><p className="mt-3 text-xs text-muted-foreground">AI-generated study notes; verify important facts with textbooks and instructors.</p></Card>}
      </div>}
    </Container>
  </>;
}
