import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, Container, PageHeader, Tag, meta } from "@/components/site";
import { SourceReference, StudyFilters } from "@/components/curriculum-controls";
import { getCourse } from "@/lib/curriculum";
import { filterMaterials, learningSearch } from "@/lib/study-materials";

export const Route = createFileRoute("/notes")({
  head: () => meta("Study Notes", "Curriculum-aligned revision notes and viva prompts for every DPT course in Pakistan."),
  validateSearch: learningSearch,
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const [semester, setSemester] = useState(search.semester ?? "all");
  const [subject, setSubject] = useState(search.course ?? "all");
  const list = filterMaterials(semester, subject);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const saved = localStorage.getItem("physiosmart-reviewed-notes"); if (saved) setReviewed(JSON.parse(saved)); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem("physiosmart-reviewed-notes", JSON.stringify(reviewed)); } catch {} }, [reviewed, loaded]);
  return (
    <>
      <PageHeader eyebrow="Study material" title="Notes & Viva Prep" desc="One revision note and one viva prompt for every course in the uploaded HEC DPT study scheme." />
      <Container>
        <SourceReference />
        <StudyFilters semester={semester} subject={subject} onSemester={setSemester} onSubject={setSubject} />
        <p className="mb-5 text-sm text-muted-foreground">{list.length} notes · {Object.values(reviewed).filter(Boolean).length} marked reviewed · independently written revision material, not HEC-endorsed</p>
        <div className="grid gap-5 lg:grid-cols-2">
          {list.map((m) => {
            const course = getCourse(m.courseId);
            return (
              <Card key={m.courseId} className="!rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{m.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{course?.name}</p>
                  </div>
                  <Tag>{course ? `Semester ${course.semester}` : "General"}</Tag>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{m.note}</p>
                <button type="button" className="mt-4 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-secondary" onClick={() => setExpanded(prev => ({...prev, [m.courseId]: !prev[m.courseId]}))}>{expanded[m.courseId] ? "Hide viva question" : "Practice viva question"}</button>
                {expanded[m.courseId] && <div className="mt-4 flex gap-3 rounded-md bg-secondary p-3">
                  <GraduationCap className="mt-0.5 size-4 shrink-0 text-accent" />
                  <p className="text-sm"><span className="font-semibold">Viva prompt:</span> {m.viva}</p>
                </div>}
                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={!!reviewed[m.courseId]} onChange={e => setReviewed(prev => ({...prev, [m.courseId]: e.target.checked}))} /> Mark as reviewed</label>
                <a className="mt-3 inline-block text-sm font-semibold text-primary underline" href="/ai-assistant">Ask AI to explain this topic →</a>
              </Card>
            );
          })}
        </div>
        {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No notes match your filters.</p>}
      </Container>
    </>
  );
}
