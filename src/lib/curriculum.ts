import curriculumAsset from "@/assets/curriculum.pdf.asset.json";

export const curriculumSource = {
  title: "HEC Doctor of Physical Therapy Curriculum (Revised 2016)",
  url: curriculumAsset.url,
  schemePages: "17–19",
  publishedCredits: 174,
};

export interface Course {
  id: string;
  name: string;
  semester: number;
  credits: number;
  theory: number | null;
  practical: number | null;
  optional: boolean;
}

type CourseRow = [id: string, name: string, credits: number, theory: number | null, practical: number | null, optional?: boolean];
const rows: CourseRow[][] = [
  [
    ["anatomy-1", "Anatomy I", 4, 3, 1],
    ["physiology-1", "Physiology I", 3, 2, 1],
    ["kinesiology-1", "Kinesiology I", 3, 2, 1],
    ["english-1", "English I (Functional English)", 3, 3, 0],
    ["pakistan-studies", "Pakistan Studies", 2, 2, 0],
    ["computer", "Introduction to Computer", 3, 2, 1],
  ],
  [
    ["anatomy-2", "Anatomy II", 4, 3, 1],
    ["physiology-2", "Physiology II", 3, 2, 1],
    ["kinesiology-2", "Kinesiology II", 3, 2, 1],
    ["english-2", "English II (Communication Skills)", 3, 3, 0],
    ["islamic-studies", "Islamic Studies / Ethics", 2, 2, 0],
    ["sociology", "Sociology", 2, 2, 0],
  ],
  [
    ["english-3", "English III (Technical Writing & Presentation Skills)", 3, 3, 0],
    ["medical-physics", "Medical Physics", 3, 2, 1],
    ["anatomy-3", "Anatomy III", 3, 2, 1],
    ["physiology-3", "Physiology III", 3, 2, 1],
    ["biomechanics-1", "Biomechanics & Ergonomics I", 3, 3, 0],
    ["biochemistry-1", "Biochemistry I", 2, 2, 0],
  ],
  [
    ["anatomy-4", "Anatomy IV (Neuro Anatomy)", 3, 2, 1],
    ["biomechanics-2", "Biomechanics & Ergonomics II", 3, 2, 1],
    ["health-wellness", "Health & Wellness", 2, 2, 0],
    ["biochemistry-2", "Biochemistry II", 3, 2, 1],
    ["exercise-physiology", "Exercise Physiology", 3, 2, 1],
    ["molecular-biology", "Molecular Biology & Genetics", 2, 2, 0],
  ],
  [
    ["pathology-1", "Pathology & Microbiology I", 2, 2, 0],
    ["pharmacology-1", "Pharmacology & Therapeutics I", 2, 2, 0],
    ["electrotherapy-1", "Physical Agents & Electrotherapy I", 3, 2, 1],
    ["therapeutic-exercises", "Therapeutic Exercises & Techniques", 3, 2, 1],
    ["biostatistics-1", "Biostatistics I", 3, 3, 0],
    ["behavioral-sciences", "Behavioral Sciences (Psychology & Ethics)", 2, 2, 0],
    ["clinical-1", "Supervised Clinical Practice I", 3, 0, 3],
  ],
  [
    ["pathology-2", "Pathology & Microbiology II", 3, 2, 1],
    ["pharmacology-2", "Pharmacology & Therapeutics II", 2, 2, 0],
    ["electrotherapy-2", "Physical Agents & Electrotherapy II", 3, 2, 1],
    ["biostatistics-2", "Biostatistics II", 3, 3, 0, true],
    ["community-medicine", "Community Medicine & Rehabilitation", 3, 3, 0],
    ["clinical-2", "Supervised Clinical Practice II", 3, 0, 3],
  ],
  [
    ["medicine-1", "Medicine I", 3, 3, 0],
    ["surgery-1", "Surgery I", 3, 3, 0],
    ["radiology", "Radiology & Diagnostic Imaging", 3, 2, 1],
    ["musculoskeletal", "Musculoskeletal Physical Therapy", 3, 2, 1],
    ["evidence-based", "Evidence Based Practice", 3, 2, 1],
    ["clinical-3", "Supervised Clinical Practice III", 3, 0, 3],
  ],
  [
    ["medicine-2", "Medicine II", 3, 3, 0],
    ["surgery-2", "Surgery II", 3, 3, 0],
    ["neurological", "Neurological Physical Therapy", 3, 2, 1],
    ["research-methodology", "Scientific Inquiry & Research Methodology", 3, 2, 1],
    ["emergency", "Emergency Procedures & Primary Care in Physical Therapy", 3, 2, 1],
    ["clinical-4", "Supervised Clinical Practice IV", 3, 0, 3],
  ],
  [
    ["cardiopulmonary", "Cardiopulmonary Physical Therapy", 3, 2, 1],
    ["prosthetics", "Prosthetics & Orthotics", 2, 2, 0],
    ["clinical-decisions", "Clinical Decision Making & Differential Diagnosis", 3, 3, 0],
    ["manual-therapy", "Manual Therapy", 3, 2, 1],
    ["professional-practice", "Professional Practice (Laws, Ethics & Administration)", 2, 2, 0],
    ["integumentary", "Integumentary Physical Therapy", 2, 2, 0],
    ["clinical-5", "Supervised Clinical Practice V", 3, 0, 3],
  ],
  [
    ["obstetrics", "Obstetrics & Gynaecological Physical Therapy", 2, 2, 0],
    ["paediatrics", "Paediatric Physical Therapy", 2, 2, 0],
    ["geriatrics", "Gerontology & Geriatric Physical Therapy", 2, 2, 0],
    ["sports", "Sports Physical Therapy", 2, 2, 0],
    ["clinical-6", "Supervised Clinical Practice VI", 4, 0, 4],
    ["research-project", "Research Project", 6, null, null],
  ],
];

const publishedTotals = [18, 17, 17, 16, 18, 17, 18, 18, 18, 18];
export const semesters = rows.map((row, i) => ({
  number: i + 1,
  year: Math.ceil((i + 1) / 2),
  publishedCredits: publishedTotals[i] ?? 0,
  courses: row.map(([id, name, credits, theory, practical, optional]) => ({
    id, name, credits, theory, practical, optional: optional ?? false, semester: i + 1,
  })),
}));
export const courses: Course[] = semesters.flatMap((s) => s.courses);
export function getCourse(id: string) { return courses.find((c) => c.id === id); }
export function creditLabel(course: Course) {
  return course.theory === null ? `${course.credits}` : `${course.credits} (${course.theory}–${course.practical})`;
}
export function filterCourses(semester: string, query: string) {
  return courses.filter((c) => (semester === "all" || c.semester === Number(semester)) && c.name.toLowerCase().includes(query.toLowerCase()));
}