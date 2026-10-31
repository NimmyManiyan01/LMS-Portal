import { apiRequest } from './client';
import { Student } from '../types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  college?: string;
  branch?: string;
  passOutYear?: number;
  privacyAccepted: boolean;
  monitoringAccepted: boolean;
}

export interface RegisterResponse {
  studentId: string;
  email: string;
  message: string;
}

export interface RequestOtpResponse {
  ok: boolean;
  message: string;
  resendCooldownSeconds?: number;
}

export interface VerifyOtpResponse {
  token?: string;
  student?: Student;
  user?: {
    id: string;
    email: string;
    fullName: string;
    registrationId: string;
    profileVerified: boolean;
    accountStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
    role: string;
  };
  message?: string;
}

export const registerStudent = (payload: RegisterPayload) =>
  apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const requestOtp = (email: string) =>
  apiRequest<RequestOtpResponse>('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const resendOtp = (email: string) =>
  apiRequest<RequestOtpResponse>('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const verifyOtp = (email: string, code: string) =>
  apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp: code, code }),
  });

export const getMe = () => apiRequest<{ student?: Student; user?: any }>('/auth/me');

export const logout = () =>
  apiRequest<{ ok: boolean }>('/auth/logout', {
    method: 'POST',
  });
