import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useStudentSession } from "@/components/student-session";
import { saveBcqAttempt } from "@/lib/student.functions";
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
  const [saved, setSaved] = useState<Record<string, "saving" | "saved" | "error">>({});
  const pending = useRef<Record<string, { id: string; selectedOption: number }>>({});
  const { user, loading } = useStudentSession();
  const save = useServerFn(saveBcqAttempt);
  const client = useQueryClient();
  useEffect(() => { setAns({}); setSaved({}); pending.current = {}; }, [user?.id]);
  async function record(courseId: string, selectedOption: number) {
    if (!user) return;
    const userId = user.id;
    const attempt = pending.current[courseId] ?? { id: crypto.randomUUID(), selectedOption };
    pending.current[courseId] = attempt;
    setSaved((prev) => ({ ...prev, [courseId]: "saving" }));
    try {
      await save({ data: { id: attempt.id, courseId, selectedOption: attempt.selectedOption } });
      if (pending.current[courseId]?.id !== attempt.id) return;
      setSaved((prev) => ({ ...prev, [courseId]: "saved" }));
      await client.invalidateQueries({ queryKey: ["student-activity"] });
    } catch {
      if (pending.current[courseId]?.id === attempt.id && userId === user.id) setSaved((prev) => ({ ...prev, [courseId]: "error" }));
    }
  }
  function pick(courseId: string, selectedOption: number) {
    setAns((prev) => ({ ...prev, [courseId]: selectedOption }));
    void record(courseId, selectedOption);
  }
  const list = filterMaterials(semester, subject);
  const answered = list.filter((m) => ans[m.courseId] !== undefined).length;
  const score = list.filter((m) => ans[m.courseId] === m.answer).length;
  return (
    <>
      <PageHeader eyebrow="Exam practice" title="BCQs & Quizzes" desc="One best-choice question for every course in the uploaded HEC DPT study scheme. Select an answer for instant feedback." />
      <Container>
        <SourceReference />
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y py-4">
          <p className="text-sm text-muted-foreground">{loading ? "Checking student account…" : user ? "Your BCQ attempts are saved to your student account." : "Guest practice · answers are not saved."}</p>
          {!loading && <Button asChild variant="outline" size="sm">{user ? <Link to="/dashboard">View Dashboard</Link> : <Link to="/auth" search={{ next: "/quizzes" }}>Sign in to save attempts</Link>}</Button>}
        </div>
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
                    return <Button variant="outline" key={o} disabled={picked || loading} onClick={() => pick(m.courseId, j)} className={`h-auto min-h-12 justify-start whitespace-normal px-4 py-3 text-left text-sm disabled:opacity-100 ${cls}`}>{o}</Button>;
                  })}
                </div>
                {picked && <p className="mt-3 text-sm text-muted-foreground">{ans[m.courseId] === m.answer ? "Correct." : `Not quite — the expected answer is “${m.options[m.answer]}”.`}</p>}
                {picked && user && <div className="mt-3 flex items-center gap-3 text-sm" role="status">{saved[m.courseId] === "saved" ? <span className="text-success">Attempt saved</span> : saved[m.courseId] === "error" ? <><span className="text-destructive">Answer not saved.</span><Button variant="outline" size="sm" onClick={() => record(m.courseId, ans[m.courseId] ?? 0)}>Retry saving</Button></> : <span className="text-muted-foreground">Saving attempt…</span>}</div>}
              </Card>
            );
          })}
        </div>
        {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No questions match your filters.</p>}
      </Container>
    </>
  );
}
