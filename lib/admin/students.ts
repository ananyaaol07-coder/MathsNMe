export interface AdminStudent {
  id: string;
  studentName: string;
  guardianEmail: string;
  grade: number | null;
  board: string;
  country: string;
  state: string;
  city: string;
  phone: string;
  currentLevel: number;
  pretestCompleted: boolean;
  createdAt: number | null;
  policyAccepted: boolean;
}

export function timestampMillis(value: unknown): number | null {
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    const result: unknown = value.toMillis();
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  }
  return null;
}

export function parseStudent(id: string, data: Record<string, unknown>): AdminStudent {
  const text = (key: string) => typeof data[key] === "string" ? data[key] as string : "";
  return {
    id, studentName: text("studentName") || "Unnamed student", guardianEmail: text("guardianEmail"),
    grade: typeof data.grade === "number" && Number.isInteger(data.grade) ? data.grade : null,
    board: text("board"), country: text("country"), state: text("state"), city: text("city"), phone: text("phone"),
    currentLevel: typeof data.currentLevel === "number" && Number.isInteger(data.currentLevel) && data.currentLevel > 0 ? data.currentLevel : 0,
    pretestCompleted: data.pretestCompleted === true, createdAt: timestampMillis(data.createdAt), policyAccepted: data.policyAccepted === true,
  };
}

export interface StudentFilters { search: string; grade: string; board: string; level: string; pretest: string; sort: string }
export const defaultFilters: StudentFilters = { search: "", grade: "", board: "", level: "", pretest: "", sort: "newest" };
export function filterStudents(students: AdminStudent[], filters: StudentFilters): AdminStudent[] {
  const search = filters.search.trim().toLowerCase();
  return students.filter(student =>
    (!search || `${student.studentName} ${student.guardianEmail}`.toLowerCase().includes(search)) &&
    (!filters.grade || String(student.grade) === filters.grade) &&
    (!filters.board || student.board === filters.board) &&
    (!filters.level || String(student.currentLevel) === filters.level) &&
    (!filters.pretest || (filters.pretest === "completed" ? student.pretestCompleted : !student.pretestCompleted))
  ).sort((a, b) => {
    if (filters.sort === "name") return a.studentName.localeCompare(b.studentName) || a.id.localeCompare(b.id);
    if (filters.sort === "level") return b.currentLevel - a.currentLevel || a.studentName.localeCompare(b.studentName);
    return (b.createdAt ?? 0) - (a.createdAt ?? 0) || a.id.localeCompare(b.id);
  });
}
export function levelLabel(level: number) { return level > 0 ? `Level ${level}` : "Not assigned"; }
export function dateLabel(value: number | null) {
  return value === null ? "Not recorded" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(value);
}
