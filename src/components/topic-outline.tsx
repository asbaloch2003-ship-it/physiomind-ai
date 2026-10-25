import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getCurriculumTopics } from "@/lib/curriculum-topics";

interface Props {
  courseId: string;
  onSelect: (topic: string) => void;
  selected?: string;
  disabled?: boolean;
}

/** Show original curriculum headings and their listed topics without inventing subtopics. */
export function TopicOutline({ courseId, onSelect, selected, disabled }: Props) {
  const topics = getCurriculumTopics(courseId);
  const groups = Array.from(topics.reduce((map, item) => {
    const name = item.section || "Course outline";
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(item.title);
    return map;
  }, new Map<string, string[]>()));
  const [closed, setClosed] = useState<string[]>([]);
  if (!topics.length) return <p className="text-sm text-muted-foreground">No indexed topics are available for this subject. Enter a topic manually below.</p>;
  return <div className="space-y-3">
    <p className="text-sm text-muted-foreground">{topics.length} curriculum entries across {groups.length} outline sections. Select any entry to study it.</p>
    {groups.map(([section, entries], i) => {
      const key = section + i;
      const collapsed = closed.includes(key);
      return <section key={key} className="overflow-hidden rounded-xl border bg-card">
        <button type="button" aria-expanded={!collapsed} onClick={() => setClosed(v => collapsed ? v.filter(x => x !== key) : [...v, key])} className="flex w-full items-center justify-between gap-3 bg-secondary/40 px-4 py-3 text-left text-sm font-semibold hover:bg-secondary">
          <span>{section} <span className="ml-1 font-normal text-muted-foreground">({entries.length})</span></span>
          {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
        </button>
        {!collapsed && <div className="grid gap-1 p-2">{entries.map((title, j) => <button key={title + j} type="button" disabled={disabled} onClick={() => onSelect(title)} className={`rounded-lg px-3 py-2.5 text-left text-sm leading-relaxed transition hover:bg-primary-soft hover:text-primary disabled:opacity-50 ${selected === title ? "bg-primary-soft font-semibold text-primary" : ""}`}><span className="mr-2 text-muted-foreground">{j + 1}.</span>{title}</button>)}</div>}
      </section>;
    })}
  </div>;
}
