import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateTopicBcqs } from "@/lib/ai-bcqs.functions";
import { Button } from "@/components/ui/button";
import { Container, PageHeader, meta } from "@/components/site";
import { SourceReference, StudyFilters } from "@/components/curriculum-controls";
import { getCourse } from "@/lib/curriculum";
import { getCurriculumTopics } from "@/lib/curriculum-topics";
import { learningSearch } from "@/lib/study-materials";

type Question = {question:string;options:string[];answer:number;explanation:string};
export const Route = createFileRoute("/quizzes")({
  head: () => meta("Topic-wise BCQs & Quizzes", "Generate ten fresh best-choice questions per DPT curriculum topic and retry with a new set."),
  validateSearch: learningSearch,
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const generate = useServerFn(generateTopicBcqs);
  const [semester,setSemester] = useState(search.semester ?? "all");
  const [subject,setSubject] = useState(search.course ?? "all");
  const [topic,setTopic] = useState("");
  const [generating,setGenerating] = useState(false);
  const [error,setError] = useState("");
  const [questions,setQuestions] = useState<Question[]>([]);
  const [answers,setAnswers] = useState<Record<number,number>>({});
  const [attempt,setAttempt] = useState(0);
  const [history,setHistory] = useState<Record<string,string[]>>({});
  const [activeTopic,setActiveTopic] = useState("");
  const topics = subject==="all"?[]:getCurriculumTopics(subject);
  const selectedCourse = subject==="all"?undefined:getCourse(subject);
  useEffect(()=>{setTopic("");setQuestions([]);setAnswers({});setError("");},[subject,semester]);
  async function generateQuiz() {
    const current=topic.trim();
    if(current.length<3||generating)return;
    setGenerating(true);setError("");
    const key=subject+"::"+current.toLowerCase();
    const previous=history[key]||[];
    try {
      const result=await generate({data:{topic:(selectedCourse?selectedCourse.name+" — ":"")+current,count:10,previousQuestions:previous.slice(-40),attemptId:globalThis.crypto?.randomUUID?.()||String(Date.now())}});
      const incoming=result.questions;
      if(incoming.length!==10)throw new Error("The quiz was incomplete. Please generate again.");
      setQuestions(incoming);setAnswers({});setActiveTopic(current);setAttempt(n=>n+1);
      setHistory(h=>({...h,[key]:[...(h[key]||[]),...incoming.map(q=>q.question)].slice(-40)}));
    }catch(e){setError(e instanceof Error?e.message:"Unable to generate BCQs. Please try again.");}
    finally{setGenerating(false);}
  }
  const answered=Object.keys(answers).length;
  const correct=questions.filter((q,i)=>answers[i]===q.answer).length;
  return <>
    <PageHeader eyebrow="Exam practice" title="Topic-wise BCQs & Quizzes" desc="Choose a DPT subject and topic to generate 10 new single-best-answer questions per attempt. No fixed question bank." />
    <Container>
      <section className="rounded-2xl border border-primary/20 bg-card p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold">Choose your topic</h2>
        <p className="mt-2 text-sm text-muted-foreground">Select a semester, subject and topic from the curriculum, or enter a custom topic. Each new attempt generates a different set of 10 questions.</p>
        <div className="mt-5"><StudyFilters semester={semester} subject={subject} onSemester={setSemester} onSubject={setSubject}/></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">Curriculum topic
            <select value={topics.some(t=>t.title===topic)?topic:""} onChange={e=>setTopic(e.target.value)} disabled={!selectedCourse} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 font-normal">
              <option value="">Choose a listed topic (optional)</option>
              {topics.map((t,i)=><option key={i} value={t.title}>{t.section}: {t.title}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Topic to practice
            <input value={topic} onChange={e=>setTopic(e.target.value)} maxLength={140} placeholder="e.g. Rotator cuff muscles, gait cycle" className="mt-2 h-11 w-full rounded-lg border bg-background px-3 font-normal"/>
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3"><Button disabled={generating||topic.trim().length<3} onClick={generateQuiz}>{generating?"Generating 10 BCQs…":questions.length?"Generate new 10 BCQs":"Generate 10 BCQs"}</Button><span className="text-sm text-muted-foreground">10 questions per attempt · {attempt?attempt+" attempt(s) this session":"Fresh questions each time"}</span></div>
        {error&&<p role="alert" className="mt-4 rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>}
      </section>
      {questions.length>0&&<section className="mt-7"><div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4"><div><h2 className="text-xl font-bold">{activeTopic}</h2><p className="text-sm text-muted-foreground">Attempt {attempt} · 10 BCQs</p></div><strong aria-live="polite">Score: {correct} / {answered} answered</strong></div>
        <div className="space-y-5">{questions.map((q,i)=><article key={i} className="rounded-xl border bg-card p-5"><h3 className="font-semibold">{i+1}. {q.question}</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{q.options.map((option,j)=><button type="button" key={j} disabled={answers[i]!==undefined} onClick={()=>setAnswers(a=>({...a,[i]:j}))} className={`rounded-lg border p-3 text-left text-sm disabled:cursor-default ${answers[i]===undefined?"hover:bg-secondary":j===q.answer?"border-success bg-success-soft":answers[i]===j?"border-destructive bg-destructive/5":"opacity-65"}`}>{String.fromCharCode(65+j)}. {option}</button>)}</div>{answers[i]!==undefined&&<div className="mt-3 rounded-lg bg-secondary p-3 text-sm"><strong>{answers[i]===q.answer?"Correct!":"Correct answer: "+q.options[q.answer]}</strong><p className="mt-1 text-muted-foreground">{q.explanation}</p></div>}</article>)}</div>
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"><strong>{answered===10?"Completed: ":"Progress: "}{correct} correct out of {answered} answered</strong><Button variant="outline" disabled={generating} onClick={generateQuiz}>New attempt — different 10 BCQs</Button></div>
        <p className="mt-4 text-xs text-muted-foreground">Questions are generated by AI and may contain errors. Recent questions from this session are supplied to discourage repeats; uniqueness cannot be guaranteed indefinitely.</p>
      </section>}
      <div className="mt-9"><SourceReference/></div>
    </Container>
  </>;
}
