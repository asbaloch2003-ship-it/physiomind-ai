import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Container, PageHeader, meta } from "@/components/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { courses, getCourse } from "@/lib/curriculum";
import { gradeAttempt, summarizeActivity } from "@/lib/bcq-activity";
import { getStudentActivity, updateStudentProfile } from "@/lib/student.functions";

const activityQuery = queryOptions({ queryKey: ["student-activity"], queryFn: () => getStudentActivity() });
export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => meta("Student Dashboard", "Your saved BCQ attempts, subject activity and student profile on PhysioSmart AI."),
  loader: ({ context }) => context.queryClient.ensureQueryData(activityQuery),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(activityQuery);
  const stats = summarizeActivity(data.attempts);
  const [name, setName] = useState(data.profile.display_name);
  const [semester, setSemester] = useState(data.profile.semester?.toString() ?? "");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const update = useServerFn(updateStudentProfile);
  const client = useQueryClient();
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    try { await update({ data: { displayName: name, semester: semester ? Number(semester) : null } }); await client.invalidateQueries({ queryKey: ["student-activity"] }); setNotice("Profile saved."); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Profile not saved."); }
    finally { setBusy(false); }
  }
  const activeCourses = courses.filter((c) => data.attempts.some((a) => a.course_id === c.id));
  return <><PageHeader eyebrow="Your recorded activity" title="Student Dashboard" desc={data.profile.display_name ? `Welcome back, ${data.profile.display_name}.` : "Welcome to your student account."} /><Container>
    <div className="grid gap-5 sm:grid-cols-3">{[["BCQ attempts", stats.total], ["Answer accuracy", `${stats.accuracy}%`], ["Subjects practised", stats.courses]].map(([label, value]) => <div key={label} className="rounded-lg border bg-card p-6"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold text-primary">{value}</p></div>)}</div>
    <div className="mt-10 flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-semibold">Subject activity</h2><Button asChild><Link to="/quizzes">Practice BCQs</Link></Button></div>
    {activeCourses.length === 0 ? <p className="mt-6 border-y py-8 text-muted-foreground">No saved attempts yet. Your first BCQ answer will appear here.</p> : <div className="mt-4 divide-y border-y">{activeCourses.map((course) => { const summary = summarizeActivity(data.attempts.filter((a) => a.course_id === course.id)); return <div key={course.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><Link to="/quizzes" search={{ course: course.id, semester: String(course.semester) }} className="font-semibold text-primary">{course.name}</Link><p className="text-xs text-muted-foreground">Semester {course.semester}</p></div><p className="text-sm">{summary.correct}/{summary.total} correct · {summary.accuracy}% accuracy</p></div>; })}</div>}
    <h2 className="mt-10 text-xl font-semibold">Recent BCQ attempts</h2>
    {data.attempts.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No activity recorded.</p> : <ul className="mt-4 divide-y">{data.attempts.slice(0, 20).map((attempt) => <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{getCourse(attempt.course_id)?.name}</p><time className="text-xs text-muted-foreground" dateTime={attempt.created_at}>{new Date(attempt.created_at).toLocaleString()}</time></div><span className={gradeAttempt(attempt) ? "text-success text-sm font-medium" : "text-destructive text-sm font-medium"}>{gradeAttempt(attempt) ? "Correct" : "Incorrect"}</span></li>)}</ul>}
    <section className="mt-10 border-t pt-8"><h2 className="text-xl font-semibold">Student profile</h2><form onSubmit={submit} className="mt-5 grid max-w-xl gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Display name<Input className="mt-2" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></label><label className="text-sm font-medium" htmlFor="student-semester">Current semester<select id="student-semester" className="mt-2 h-9 w-full rounded-md border bg-background px-3" value={semester} onChange={(e) => setSemester(e.target.value)}><option value="">Not selected</option>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>Semester {i + 1}</option>)}</select></label><Button disabled={busy} className="sm:col-span-2 sm:justify-self-start">{busy ? "Saving…" : "Save profile"}</Button></form>{notice && <p role="status" className="mt-3 text-sm">{notice}</p>}</section>
  </Container></>;
}