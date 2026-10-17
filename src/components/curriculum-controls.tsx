import { BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { curriculumSource, semesters, courses } from "@/lib/curriculum";

export function SourceReference({ page = 17 }: { page?: number }) {
  return <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-5">
    <div className="flex items-start gap-3"><BookOpen className="mt-1 size-5 shrink-0 text-primary" /><div>
      <p className="text-sm font-semibold">HEC Pakistan · DPT curriculum · Revised 2016</p>
      <p className="mt-1 text-xs text-muted-foreground">Uploaded source edition. Study materials are independently written, not HEC-endorsed.</p>
    </div></div>
    <Button variant="outline" asChild><a href={`${curriculumSource.url}#page=${page}`} target="_blank" rel="noreferrer">Read official curriculum <ExternalLink /></a></Button>
  </div>;
}

export function SemesterFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <label className="flex flex-col gap-2 text-xs font-semibold">Semester
    <select aria-label="Semester" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 min-w-44 rounded-md border bg-card px-3 text-sm font-normal">
      <option value="all">All semesters</option>
      {semesters.map((s) => <option key={s.number} value={s.number}>Semester {s.number} · Year {s.year}</option>)}
    </select>
  </label>;
}

export function StudyFilters({ semester, subject, onSemester, onSubject }: { semester: string; subject: string; onSemester: (v: string) => void; onSubject: (v: string) => void }) {
  return <div className="mb-7 flex flex-wrap items-end gap-4">
    <SemesterFilter value={semester} onChange={(v) => { onSemester(v); onSubject("all"); }} />
    <label className="flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold">Subject
      <select aria-label="Subject" value={subject} onChange={(e) => onSubject(e.target.value)} className="h-10 w-full min-w-0 rounded-md border bg-card px-3 text-sm font-normal">
        <option value="all">All subjects</option>
        {courses.filter((c) => semester === "all" || c.semester === Number(semester)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </label>
  </div>;
}

export function SubjectSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <label className="flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold">Find a subject
    <Input className="h-10" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search anatomy, research, clinical practice…" aria-label="Find a subject" />
  </label>;
}