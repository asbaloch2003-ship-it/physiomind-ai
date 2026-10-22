import { studyMaterials } from "@/lib/study-materials";

export interface Attempt {
  id: string;
  course_id: string;
  selected_option: number;
  created_at: string;
}

export function gradeAttempt(attempt: Pick<Attempt, "course_id" | "selected_option">) {
  const material = studyMaterials.find((m) => m.courseId === attempt.course_id);
  if (!material || !Number.isInteger(attempt.selected_option) || !material.options[attempt.selected_option]) throw new Error("Invalid BCQ answer");
  return attempt.selected_option === material.answer;
}

export function summarizeActivity(attempts: Attempt[]) {
  const correct = attempts.filter(gradeAttempt).length;
  return {
    total: attempts.length,
    correct,
    accuracy: attempts.length ? Math.round(correct / attempts.length * 100) : 0,
    courses: new Set(attempts.map((a) => a.course_id)).size,
  };
}