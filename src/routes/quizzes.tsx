import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  const list = filterMaterials(semester, subject);
  const answered = list.filter((m) => ans[m.courseId] !== undefined).length;
  const score = list.filter((m) => ans[m.courseId] === m.answer).length;
  return (
    <>
      <PageHeader eyebrow="Exam practice" title="BCQs & Quizzes" desc="One best-choice question for every course in the uploaded HEC DPT study scheme. Select an answer for instant feedback." />
      <Container>
        <SourceReference />
        <StudyFilters semester={semester} subject={subject} onSemester={setSemester} onSubject={setSubject} />
        <p className="mb-6 text-sm font-semibold">Score: <span className="text-primary">{score}</span> / {answered} answered · {list.length} questions</p>
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
                    return <button key={o} disabled={picked} onClick={() => setAns({ ...ans, [m.courseId]: j })} className={`rounded-md border px-4 py-3 text-left text-sm ${cls}`}>{o}</button>;
                  })}
                </div>
                {picked && <p className="mt-3 text-sm text-muted-foreground">{ans[m.courseId] === m.answer ? "Correct." : `Not quite — the expected answer is “${m.options[m.answer]}”.`}</p>}
              </Card>
            );
          })}
        </div>
        {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No questions match your filters.</p>}
      </Container>
    </>
  );
}
