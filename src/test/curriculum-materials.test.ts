import { describe, expect, it } from "vitest";

import { courses, semesters } from "@/lib/curriculum";
import { filterMaterials, studyMaterials } from "@/lib/study-materials";

// The uploaded HEC DPT study scheme is the source of truth for which courses exist,
// so every course must have exactly one revision note and one BCQ of its own.
describe("Curriculum study materials", () => {
  it("covers the ten official semesters", () => {
    expect(semesters).toHaveLength(10);
    expect(semesters.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("gives every course exactly one study material", () => {
    expect(courses).toHaveLength(62);
    expect(studyMaterials).toHaveLength(courses.length);

    const ids = studyMaterials.map((m) => m.courseId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const course of courses) {
      expect(ids, `missing material for ${course.id}`).toContain(course.id);
    }
  });

  it("has no material pointing at a course outside the study scheme", () => {
    const known = new Set(courses.map((c) => c.id));
    expect(studyMaterials.filter((m) => !known.has(m.courseId))).toEqual([]);
  });

  it("filters to semester one's six courses", () => {
    expect(courses.filter((c) => c.semester === 1)).toHaveLength(6);
    expect(filterMaterials("1", "all")).toHaveLength(6);
    expect(filterMaterials("1", "anatomy-1").map((m) => m.courseId)).toEqual(["anatomy-1"]);
    expect(filterMaterials("all", "all")).toHaveLength(62);
  });
});
