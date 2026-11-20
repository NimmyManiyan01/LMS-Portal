export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  phone?: string;
  college?: string;
  branch?: string;
  passOutYear?: number;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

export interface Exam {
  _id: string;
  code: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  maxAttempts: number;
  negativeMarking?: number;
  instructions?: string[];
  readinessRequirements?: {
    cameraRequired?: boolean;
    audioRequired?: boolean;
    fullscreenRequired?: boolean;
  };
  integrityProfile?: 'BASIC' | 'STRICT';
  integrityRules?: {
    tabSwitchThreshold?: number;
    fullscreenExitThreshold?: number;
    copyPasteThreshold?: number;
    multiplePersonThreshold?: number;
  };
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: Option[];
  sectionId?: string;
  sectionName?: string;
  questionNumber: number;
  marks: number;
  negativeMarks: number;
  codeSnippet?: string;
}

export interface Answer {
  questionId: string;
  selectedOptionId?: string;
  isMarkedForReview?: boolean;
  visited?: boolean;
  timeSpentSeconds?: number;
  version?: number;
  savedAt?: string;
}

export interface Attempt {
  attemptId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'EXPIRED';
  startedAt: string;
  deadline: string;
  serverTime: string;
  questionIds: string[];
  answers: Answer[];
}

export interface IntegrityEventPayload {
  eventId: string;
  eventType: 'TAB_HIDDEN' | 'FULLSCREEN_EXIT' | 'COPY' | 'PASTE' | 'SCREENSHOT' | 'CAMERA_INTERRUPTED' | 'MULTIPLE_PERSON';
  clientTimestamp: string;
}

export interface IntegrityEventResponse {
  recorded: boolean;
  duplicate?: boolean;
  eventId: string;
  confirmedCount: number;
  threshold?: number;
  action: 'RECORDED' | 'WARNING' | 'AUTO_SUBMIT';
}

export interface FinalResult {
  attemptId: string;
  examName: string;
  examCode?: string;
  marksScored: number | null;
  maximumMarks: number | null;
  submittedAt: string;
  finalizedAt?: string;
  releaseStatus: 'RELEASED' | 'PENDING' | 'WITHHELD';
  released: boolean;
  message?: string;
}

export interface ExamFeedbackInput {
  rating: number; // 1 to 5
  comment?: string;
}
