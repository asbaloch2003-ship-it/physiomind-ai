import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
      <PageHeader eyebrow="Exam practice" title="BCQs & Quizzes" desc="One best-choice question for every course in the uploaded HEC DPT study scheme. Select an answer for instant feedback." />
      <Container>
        <SourceReference />
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y py-4"><p className="text-sm text-muted-foreground">Free guest practice — no account needed. Your answers are saved in this browser.</p><Button variant="outline" size="sm" onClick={reset}>Restart quiz</Button></div>
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
