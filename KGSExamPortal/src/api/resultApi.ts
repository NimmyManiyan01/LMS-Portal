import { apiRequest } from './client';
import { FinalResult } from '../types';

export const getResults = () => apiRequest<FinalResult[]>('/student/results');

export const getResultDetail = (attemptId: string) =>
  apiRequest<FinalResult>(`/student/results/${attemptId}`);
