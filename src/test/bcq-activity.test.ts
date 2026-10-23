import { describe, expect, it } from "vitest";
import { gradeAttempt, summarizeActivity } from "@/lib/bcq-activity";

describe("Saved BCQ activity", () => {
  it("grades the selected answer against the course question", () => {
    expect(gradeAttempt({ course_id: "anatomy-1", selected_option: 1 })).toBe(true);
    expect(gradeAttempt({ course_id: "anatomy-1", selected_option: 0 })).toBe(false);
  });
  it("counts actual attempts including repeat practice", () => {
    const attempts = [1, 0, 1].map((selected_option, i) => ({ id: String(i), course_id: "anatomy-1", selected_option, created_at: "2026-10-22T18:00:00Z" }));
    expect(summarizeActivity(attempts)).toEqual({ total: 3, correct: 2, accuracy: 67, courses: 1 });
  });
  it("shows zero activity rather than demo statistics for a new student", () => {
    expect(summarizeActivity([])).toEqual({ total: 0, correct: 0, accuracy: 0, courses: 0 });
  });
  it("rejects missing courses and invalid answer indices", () => {
    expect(() => gradeAttempt({ course_id: "missing", selected_option: 0 })).toThrow();
    expect(() => gradeAttempt({ course_id: "anatomy-1", selected_option: -1 })).toThrow();
  });
});