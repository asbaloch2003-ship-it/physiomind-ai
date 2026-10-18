import outlines from "./course-outlines.json";
export interface CourseOutline { page: number; endPage: number; topics: string[]; text: string; }
export const courseOutlines: Record<string, CourseOutline> = outlines;
