import { apiRequest, ApiResponse } from './client';
import { Exam } from '../types';

export interface InstructionsResponse {
  examId: string;
  examName: string;
  durationMinutes: number;
  totalQuestions: number;
  maximumMarks: number;
  maximumAttempts: number;
  negativeMarking: number;
  instructions: string[];
  readinessRequirements: {
    cameraRequired?: boolean;
    audioRequired?: boolean;
    fullscreenRequired?: boolean;
  };
  monitoring: {
    profile?: 'BASIC' | 'STRICT';
    rules?: any;
  };
}

export interface StartExamResponse {
  attemptId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  startedAt: string;
  expiresAt: string;
  resumed?: boolean;
}

export const getExams = async (): Promise<ApiResponse<Exam[]>> => {
  const res = await apiRequest<any>('/student/exams');
  if (res.data) {
    const list = Array.isArray(res.data) ? res.data : res.data.exams || [];
    return { data: list, status: res.status };
  }
  // Fallback to /exams
  const fallback = await apiRequest<any>('/exams');
  if (fallback.data) {
    const list = Array.isArray(fallback.data) ? fallback.data : fallback.data.exams || [];
    return { data: list, status: fallback.status };
  }
  return { error: res.error || fallback.error || 'Failed to fetch assigned exams', status: res.status || fallback.status };
};

export const getExamInstructions = (examId: string) =>
  apiRequest<InstructionsResponse>(`/exams/${examId}/instructions`);

export const startExam = (examId: string) =>
  apiRequest<StartExamResponse>(`/exams/${examId}/start`, {
    method: 'POST',
  });
