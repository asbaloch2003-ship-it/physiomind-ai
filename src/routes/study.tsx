import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, BrainCircuit, CheckCircle2, ArrowRight } from "lucide-react";
import { Container, PageHeader, Card, Tag, meta } from "@/components/site";
import { SemesterFilter, SourceReference } from "@/components/curriculum-controls";
import { courses } from "@/lib/curriculum";
import { courseOutlines } from "@/lib/course-outlines";
import { studyMaterials } from "@/lib/study-materials";

export const Route = createFileRoute("/study")({
  head: () => meta("Interactive DPT Study", "Choose a semester and course, study core topics, practice recall, and review with AI."),
  component: Page,
});

function Page() {
  const [semester, setSemester] = useState("all");
  const [selected, setSelected] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [topic, setTopic] = useState(0);
  const [customTopic, setCustomTopic] = useState("");
  const filtered = courses.filter(c => semester === "all" || c.semester === Number(semester));
  const course = courses.find(c => c.id === selected);
  const outline = course ? courseOutlines[course.id] : undefined;
  const material = studyMaterials.find(m => m.courseId === selected);
  const topics = outline?.topics || [];
  const activeTopic = topics[topic];
  const prompt = activeTopic ? `Explain ${activeTopic} in the context of ${course?.name} for a DPT student. Give key concepts, a clinical example, and a self-test question.` : `Teach me ${course?.name || "physiotherapy"} with a clinical example and self-test question.`;
  const tutorSearch = (t: string) => ({topic:t,subject:course?.name || "",semester:String(course?.semester || ""),auto:"1"});
  return <>
    <PageHeader eyebrow="Learn • Recall • Apply" title="Interactive DPT Study" desc="Select your semester and subject, explore curriculum topics, test your recall, and ask Gemini for deeper explanations. No login required." />
    <Container>
      <SourceReference />
      <div className="mb-8 grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2">
        <SemesterFilter value={semester} onChange={v => { setSemester(v); setSelected(""); setTopic(0); setShowAnswer(false); }} />
        <label className="flex flex-col gap-2 text-xs font-semibold">Subject
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm font-normal" value={selected} onChange={e => { setSelected(e.target.value); setTopic(0); setShowAnswer(false); }}>
            <option value="">Choose a subject to begin</option>
            {filtered.map(c => <option key={c.id} value={c.id}>{c.name} — Semester {c.semester}</option>)}
          </select>
        </label>
      </div>
      {!course ? <Card><BookOpen className="mb-3 h-8 w-8 text-primary" /><h2 className="text-xl font-bold">Choose a subject to start studying</h2><p className="mt-2 text-sm text-muted-foreground">Explore the official course outline, review a foundational concept, and practice an interactive recall question.</p></Card> :
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{course.name}</h2><Tag>Semester {course.semester}</Tag></div>
          <p className="mt-3 text-sm text-muted-foreground">{topics.length} curriculum topics available</p>
          {topics.length > 0 ? <div className="mt-5 max-h-[540px] space-y-2 overflow-y-auto">
            {topics.map((t,i) => <Link key={i} to="/ai-assistant" search={tutorSearch(t)} className="block w-full rounded-lg border px-3 py-3 text-left text-sm transition hover:border-primary hover:bg-secondary">{i+1}. {t} →</Link>)}
          </div> : <p className="mt-4 text-sm">Enter your own topic below.</p>}
          <div className="mt-5 border-t pt-4"><label htmlFor="custom-study-topic" className="text-sm font-semibold">Study another topic</label><input id="custom-study-topic" value={customTopic} onChange={e=>setCustomTopic(e.target.value)} maxLength={180} placeholder="Type any topic from this subject" className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"/>{customTopic.trim().length>=3&&<Link to="/ai-assistant" search={tutorSearch(customTopic.trim())} className="mt-3 inline-flex rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Study with AI →</Link>}</div>
        </Card>
        <div className="space-y-5">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Current learning topic</p>
            <h2 className="mt-2 text-xl font-bold">{activeTopic || course.name}</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{material?.note || "Review this topic in your course resources, then use the AI tutor to explore its concepts and clinical relevance."}</p>
            <Link to="/ai-assistant" search={tutorSearch(activeTopic || course.name)} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><BrainCircuit className="h-4 w-4" /> Open AI Study Tutor <ArrowRight className="h-4 w-4" /></Link>
            <p className="mt-3 text-xs text-muted-foreground">Suggested question to copy into AI:</p>
            <div className="mt-2 rounded-lg bg-secondary p-3 text-sm">{prompt}</div>
            <button className="mt-2 text-sm font-semibold text-primary underline" onClick={() => navigator.clipboard?.writeText(prompt)}>Copy suggested question</button>
          </Card>
          {material && <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Active recall</p>
            <h3 className="mt-2 font-semibold">{material.viva}</h3>
            <button className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-secondary" onClick={() => setShowAnswer(v => !v)}>{showAnswer ? "Hide revision hint" : "Reveal revision hint"}</button>
            {showAnswer && <p className="mt-4 rounded-lg bg-success-soft p-4 text-sm leading-7"><CheckCircle2 className="mr-2 inline h-4 w-4 text-success" />{material.note}</p>}
            <div className="mt-5 flex flex-wrap gap-3 text-sm"><Link className="font-semibold text-primary underline" to="/quizzes" search={{semester:String(course.semester),course:course.id}}>Practice BCQ</Link><Link className="font-semibold text-primary underline" to="/notes" search={{semester:String(course.semester),course:course.id}}>Read notes</Link></div>
          </Card>}
        </div>
      </div>}
    </Container>
  </>;
}
