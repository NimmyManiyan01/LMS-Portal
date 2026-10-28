export type ExamStatus =
  | "ELIGIBLE"
  | "UPCOMING"
  | "COMPLETED"
  | "RESULTS_PENDING";

export type AdminRole =
  | "SUPER_ADMIN"
  | "EXAM_ADMIN"
  | "REVIEWER"
  | "REPORT_VIEWER";

export type AdminPermission =
  | "users:manage"
  | "permissions:manage"
  | "exams:manage"
  | "questions:manage"
  | "paper_sets:manage"
  | "attempts:monitor"
  | "incidents:review"
  | "marks:correct"
  | "marks:finalize"
  | "reports:read";

export const ADMIN_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    "users:manage",
    "permissions:manage",
    "exams:manage",
    "questions:manage",
    "paper_sets:manage",
    "attempts:monitor",
    "incidents:review",
    "marks:correct",
    "marks:finalize",
    "reports:read",
  ],
  EXAM_ADMIN: [
    "exams:manage",
    "questions:manage",
    "paper_sets:manage",
    "attempts:monitor",
    "reports:read",
  ],
  REVIEWER: ["incidents:review", "marks:correct"],
  REPORT_VIEWER: ["reports:read"],
};

export interface StudentProfile {
  id: string;
  email: string;
  fullName: string;
  registrationId: string;
  profileVerified: boolean;
  avatarUrl?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  sectionId: string;
  sectionName: string;
  questionNumber: number;
  questionText: string;
  codeSnippet?: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  marks: number;
  negativeMarks: number;
}

export interface Exam {
  id: string;
  examCode: string;
  title: string;
  subtitle: string;
  category: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  scheduledDate: string;
  startTimeText: string;
  status: ExamStatus;
  negativeMarking: number;
  markingScheme?: {
    correctMarks?: number;
    incorrectMarks?: number;
    unansweredMarks?: number;
    floorNegativeScoreAtZero?: boolean;
    scoringVersion?: number;
  };
  maxAttempts?: number;
  isProctored: boolean;
  sections: {
    id: string;
    name: string;
    questionCount: number;
  }[];
  instructions: string[];
  readinessRequirements?: {
    camera?: boolean;
    microphone?: boolean;
    fullscreen?: boolean;
  };
  integrityProfile?: string;
  integrityRules?: {
    tabSwitchThreshold?: number;
    copyPasteThreshold?: number;
    gracePeriodSeconds?: number;
  };
}

export interface AnswerState {
  questionId: string;
  selectedOptionId?: string;
  isMarkedForReview: boolean;
  visited: boolean;
  timeSpentSeconds: number;
}

export interface ExamAttempt {
  attemptId: string;
  examId: string;
  studentId: string;
  startTime: Date;
  endTime?: Date;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "TERMINATED";
  answers: Record<string, AnswerState>;
  tabSwitchCount: number;
  submissionToken?: string;
  score?: number;
  accuracyRate?: number;
  percentile?: number;
}
