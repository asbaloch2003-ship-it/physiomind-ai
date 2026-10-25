import outlines from "./course-outlines.json";
import { courses } from "./curriculum";

export interface CurriculumAssessment { id: string; title: string; course: string; semester: number; page: number; }
const topicPattern = /\b(test|tests|assessment|assessments|examination|screening|goniometry|manual muscle testing|reflexes|outcome measures|gait analysis|range of motion|postural alignment|dynamometry|step test|borg|strength duration curve|functional capacity|ergonomic assessments|joint play|glide test)\b/i;
const exclusion = /\b(statistical|hypothesis|randomized|significance|test statistics|research|evidence about diagnostic|glucose tolerance|examination of urine|radiological examination|nutritional assessment|exam questions|professional development|self-assessment tool)\b/i;
const practicalCourse = /^(kinesiology|physiology|biomechanics|health-wellness|exercise-physiology|electrotherapy|clinical-|musculoskeletal|neurological|emergency|cardiopulmonary|prosthetics|clinical-decisions|manual-therapy|integumentary|paediatrics|geriatrics|sports|obstetrics)/;
export const curriculumAssessments: CurriculumAssessment[] = Object.entries(outlines).flatMap(([id, outline]) => {
  if (!practicalCourse.test(id)) return [];
  const course = courses.find(c => c.id === id);
  if (!course) return [];
  const seen = new Set<string>();
  return outline.text.split(/\r?\n/).map(line => line.trim()).filter(line => /^[•]\s+/.test(line))
    .map(line => line.replace(/^[•]\s*/, "").replace(/\s+/g, " ").trim())
    .filter(title => title.length >= 8 && title.length <= 115 && topicPattern.test(title) && !exclusion.test(title) && !/^(examination|assessment|evaluation|tests|outcome measures|principles of assessment and outcome measures|assessment procedures|screening exam|physical examination)$/i.test(title))
    .filter(title => { const key = title.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; })
    .map((title, i) => ({id: id + "-" + i, title, course: course.name, semester: course.semester, page: outline.page}));
});
