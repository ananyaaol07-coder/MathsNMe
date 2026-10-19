export interface Submission {
  id: string;

  studentId: string;

  worksheetId: string;

  levelId: number;

  timeTaken: number;

  totalQuestions: number;

  completedQuestions: number;

  imageUrls: string[];

  score?: number;

  accuracy?: number;

  status:
    | "in_progress"
    | "submitted"
    | "evaluated";

  submittedAt: Date;

  evaluatedAt?: Date;
}