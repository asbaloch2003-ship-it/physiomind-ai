import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState }
import { useServerFn } from "@tanstack/react-start";
import { generateTopicBcqs } from "@/lib/ai-bcqs.functions"; from "react";
import { Button } from "@/components/ui/button";
import { Card, Container, PageHeader, meta } from "@/components/site";
import { SourceReference, StudyFilters } from "@/components/curriculum-controls";
import { getCourse } from "@/lib/curriculum";
import { filterMaterials, learningSearch } from "@/lib/study-materials";

export const Route = createFileRoute("/quizzes")({
  head: () => meta("BCQs & Quizzes", "Best-choice questions aligned to every DPT course, with instant feedback."),
  validateSearch: learningSearch,
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const generate = useServerFn(generateTopicBcqs);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiQuestions, setAiQuestions] = useState<Array<{question:string;options:string[];answer:number;explanation:string}>>([]);
  const [aiAnswers, setAiAnswers] = useState<Record<number,number>>({});
  async function generateQuiz() {
    if (topic.trim().length < 3 || generating) return;
    setGenerating(true); setAiError(""); setAiQuestions([]); setAiAnswers({});
    try { const result = await generate({data:{topic:topic.trim(),count}}); setAiQuestions(result.questions); }
    catch(e) { setAiError(e instanceof Error ? e.message : "Unable to generate BCQs."); }
    finally { setGenerating(false); }
  }
  const [semester, setSemester] = useState(search.semester ?? "all");
  const [subject, setSubject] = useState(search.course ?? "all");
  const [ans, setAns] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const saved = localStorage.getItem("physiosmart-bcq-answers"); if (saved) setAns(JSON.parse(saved)); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem("physiosmart-bcq-answers", JSON.stringify(ans)); } catch {} }, [ans, loaded]);
  function pick(courseId: string, selectedOption: number) {
    setAns(prev => ({ ...prev, [courseId]: selectedOption }));
  }
  function reset() { setAns({}); }
  const list = filterMaterials(semester, subject);
  const answered = list.filter((m) => ans[m.courseId] !== undefined).length;
  const score = list.filter((m) => ans[m.courseId] === m.answer).length;
  return (
    <>
      <PageHeader eyebrow="Exam practice" title="BCQs & Quizzes" desc="Generate fresh topic-wise AI BCQs, or practice the existing curriculum-aligned questions with instant explanations." />
      <Container>
        <section className="mb-8 rounded-2xl border border-primary/20 bg-card p-5 shadow-sm sm:p-7">
          <div className="mb-4"><p className="text-xs font-bold uppercase tracking-wide text-primary">AI question generator</p><h2 className="mt-1 text-2xl font-bold">Create topic-wise BCQs</h2><p className="mt-2 text-sm text-muted-foreground">Enter any DPT topic and generate fresh practice questions with instant scoring and explanations. No login required.</p></div>
          <div className="flex flex-wrap items-end gap-3"><label className="min-w-52 flex-1 text-sm font-semibold">Topic<input className="mt-2 h-11 w-full rounded-lg border bg-background px-3 font-normal" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Brachial plexus, gait cycle, ACL tests" maxLength={150}/></label><label className="text-sm font-semibold">Questions<select className="mt-2 block h-11 rounded-lg border bg-background px-3 font-normal" value={count} onChange={e=>setCount(Number(e.target.value))}><option value={3}>3 BCQs</option><option value={5}>5 BCQs</option></select></label><Button className="h-11" disabled={generating||topic.trim().length<3} onClick={generateQuiz}>{generating?"Generating…":"Generate AI BCQs"}</Button></div>
          {aiError && <p role="alert" className="mt-4 rounded-lg border border-destructive p-3 text-sm text-destructive">{aiError}</p>}
          {aiQuestions.length>0 && <div className="mt-6 space-y-5"><div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3"><strong>AI practice: {topic}</strong><span className="text-sm text-muted-foreground">Score: {aiQuestions.filter((q,i)=>aiAnswers[i]===q.answer).length} / {Object.keys(aiAnswers).length} answered</span></div>
            {aiQuestions.map((q,i)=><div key={i} className="rounded-xl border p-4"><h3 className="font-semibold">{i+1}. {q.question}</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{q.options.map((option,j)=><button type="button" key={j} disabled={aiAnswers[i]!==undefined} onClick={()=>setAiAnswers(prev=>({...prev,[i]:j}))} className={`rounded-lg border p-3 text-left text-sm disabled:cursor-default ${aiAnswers[i]===undefined?"hover:bg-secondary":j===q.answer?"border-success bg-success-soft":aiAnswers[i]===j?"border-destructive bg-destructive/5":"opacity-65"}`}>{String.fromCharCode(65+j)}. {option}</button>)}</div>{aiAnswers[i]!==undefined&&<div className="mt-3 rounded-lg bg-secondary p-3 text-sm"><strong>{aiAnswers[i]===q.answer?"Correct!":"Review the correct answer:"} {q.options[q.answer]}</strong><p className="mt-1 text-muted-foreground">{q.explanation}</p></div>}</div>)}
            <Button variant="outline" onClick={()=>setAiAnswers({})}>Retry these questions</Button><p className="text-xs text-muted-foreground">AI-generated educational questions may contain errors; verify clinical details.</p></div>}
        </section>
        <SourceReference />
        <h2 className="mb-4 text-xl font-bold">Curriculum practice bank</h2><div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y py-4"><p className="text-sm text-muted-foreground">Free guest practice — no account needed. Your answers are saved in this browser.</p><Button variant="outline" size="sm" onClick={reset}>Restart quiz</Button></div>
        <StudyFilters semester={semester} subject={subject} onSemester={setSemester} onSubject={setSubject} />
        <p className="mb-6 text-sm font-semibold" aria-live="polite">Score: <span className="text-primary">{score}</span> / {answered} answered · {list.length} questions</p>
        <div className="space-y-5">
          {list.map((m, i) => {
            const course = getCourse(m.courseId);
            const picked = ans[m.courseId] !== undefined;
            return (
              <Card key={m.courseId} className="!rounded-lg">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{course?.name} · Semester {course?.semester}</p>
                <h2 className="mt-2 font-semibold">{i + 1}. {m.question}</h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {m.options.map((o, j) => {
                    const cls = !picked ? "hover:bg-secondary" : j === m.answer ? "border-success bg-success-soft" : ans[m.courseId] === j ? "border-destructive text-destructive" : "opacity-60";
                    return <Button variant="outline" key={o} disabled={picked} onClick={() => pick(m.courseId, j)} className={`h-auto min-h-12 justify-start whitespace-normal px-4 py-3 text-left text-sm disabled:opacity-100 ${cls}`}>{o}</Button>;
                  })}
                </div>
                {picked && <p className="mt-3 text-sm text-muted-foreground">{ans[m.courseId] === m.answer ? "Correct." : `Not quite — the expected answer is “${m.options[m.answer]}”.`}</p>}
                {picked && <div className="mt-3 rounded-lg bg-secondary p-4 text-sm leading-6"><strong>Why this answer?</strong><p className="mt-1 text-muted-foreground">{m.note}</p></div>}
              </Card>
            );
          })}
        </div>
        {answered > 0 && <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"><strong>Progress: {answered} / {list.length}</strong><Button variant="outline" onClick={reset}>Try again</Button></div>}
        {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No questions match your filters.</p>}
      </Container>
    </>
  );
}
