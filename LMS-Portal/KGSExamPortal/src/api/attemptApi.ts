import { apiRequest } from './client';
import { Attempt, Question, Answer, ExamFeedbackInput } from '../types';

export interface QuestionsResponse {
  attemptId: string;
  questions: Question[];
  serverTime: string;
}

export interface SaveAnswerPayload {
  selectedOptionId?: string;
  isMarkedForReview?: boolean;
  visited?: boolean;
  timeSpentSeconds?: number;
  version: number;
}

export interface SaveAnswerResponse {
  saved: boolean;
  version: number;
  savedAt: string;
  scoreCalculated?: boolean;
}

export interface SubmitAttemptResponse {
  attemptId: string;
  status: 'SUBMITTED' | 'AUTO_SUBMITTED';
  submittedAt: string;
  message?: string;
}

export const getAttempt = (attemptId: string) =>
  apiRequest<Attempt>(`/attempts/${attemptId}`);

export const getAttemptQuestions = (attemptId: string) =>
  apiRequest<QuestionsResponse>(`/attempts/${attemptId}/questions`);

export const saveAnswer = (
  attemptId: string,
  questionId: string,
  payload: SaveAnswerPayload
) =>
  apiRequest<SaveAnswerResponse>(
    `/attempts/${attemptId}/answers/${questionId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );

export const submitAttempt = (
  attemptId: string,
  answers?: Record<string, string> | Answer[]
) =>
  apiRequest<SubmitAttemptResponse>(`/attempts/${attemptId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });

export const submitExamFeedback = (
  attemptId: string,
  feedback: ExamFeedbackInput
) =>
  apiRequest<{ saved: boolean; feedback: { id: string; rating: number } }>(
    `/attempts/${attemptId}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify(feedback),
    }
  );
