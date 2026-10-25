import { courseOutlines } from "./course-outlines";

export interface CurriculumTopic { title: string; section: string; page: number; }
const ignored = /^(course contents?|learning objectives?|course objectives?|recommended books?|reference books?|references?|practical|note|introduction|description)$/i;
function clean(value: string) { return value.replace(/\s+/g, " ").replace(/[•]+/g, "").trim(); }

/** Derives the topic index from the full HEC 2016 course text, not the previous six-item previews. */
export function getCurriculumTopics(courseId: string): CurriculumTopic[] {
  const outline = courseOutlines[courseId];
  if (!outline?.text) return (outline?.topics || []).map(title => ({title,section:"Course outline",page:outline?.page || 0}));
  const text = outline.text;
  const start = text.search(/COURSE CONTENTS?\b/i);
  const lines = (start >= 0 ? text.slice(start) : text).split(/\r?\n/);
  const topics: CurriculumTopic[] = [];
  let section = "Course contents";
  let current: string | null = null;
  const flush = () => {
    if (!current) return;
    const title = clean(current);
    if (title.length >= 3 && title.length <= 200 && !ignored.test(title) && !topics.some(t => t.title.toLowerCase() === title.toLowerCase())) {
      topics.push({ title, section, page: outline.page });
    }
    current = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^(recommended books?|reference books?|bibliography)\b/i.test(line)) { flush(); break; }
    const bullet = /^[•]\s*(.*)$/.exec(line);
    if (bullet) { flush(); current = bullet[1]; continue; }
    if (current !== null) {
      if (/^[A-Z][A-Z\s&/(),:–-]{3,}$/.test(line) && line.length < 100) { flush(); section = clean(line); continue; }
      if (/^\d+\s*$/.test(line)) continue;
      current += " " + line;
      continue;
    }
    if (/^[A-Z][A-Z\s&/(),:–-]{3,}$/.test(line) && line.length < 100 && !ignored.test(line)) {
      section = clean(line);
      if (!topics.some(t => t.title.toLowerCase() === section.toLowerCase())) topics.push({title:section,section:"Main heading",page:outline.page});
    }
  }
  flush();
  // Some courses use numbered or unbulleted topics: preserve the original extracted headings too.
  for (const title of outline.topics || []) {
    if (!topics.some(t => t.title.toLowerCase() === title.toLowerCase())) topics.push({title,section:"Additional outline heading",page:outline.page});
  }
  return topics;
}
