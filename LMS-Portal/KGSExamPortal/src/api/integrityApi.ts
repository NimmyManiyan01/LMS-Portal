import { apiRequest } from './client';
import { IntegrityEventPayload, IntegrityEventResponse } from '../types';

export const reportIntegrityEvent = (
  attemptId: string,
  payload: IntegrityEventPayload
) =>
  apiRequest<IntegrityEventResponse>(
    `/attempts/${attemptId}/integrity-events`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

export const getIntegrityStatus = (attemptId: string) =>
  apiRequest<{
    status: string;
    profile?: string;
    counts?: any;
    rules?: any;
  }>(`/attempts/${attemptId}/integrity-status`);
