import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student } from '../types';
import * as authApi from '../api/authApi';

interface AuthContextType {
  student: Student | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginEmail: string;
  setLoginEmail: (email: string) => void;
  checkAuth: () => Promise<void>;
  register: (payload: authApi.RegisterPayload) => Promise<{ success: boolean; error?: string; studentId?: string }>;
  requestOtp: (email: string) => Promise<{ success: boolean; error?: string; cooldownSeconds?: number }>;
  verifyOtp: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logoutStudent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  student: null,
  isLoading: true,
  isAuthenticated: false,
  loginEmail: '',
  setLoginEmail: () => {},
  checkAuth: async () => {},
  register: async () => ({ success: false }),
  requestOtp: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  logoutStudent: async () => {},
});

const extractStudent = (data: any): Student | null => {
  if (data?.student) return data.student;
  if (data?.user) {
    return {
      id: data.user.id,
      studentId: data.user.registrationId || data.user.id,
      fullName: data.user.fullName || 'Student',
      email: data.user.email,
      accountStatus: data.user.accountStatus || 'ACTIVE',
    };
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState<string>('');

  const checkAuth = async () => {
    setIsLoading(true);
    // Keep splash screen visible for 10 full seconds on app launch
    const splashTimer = new Promise((resolve) => setTimeout(resolve, 10000));
    try {
      const [res] = await Promise.all([authApi.getMe(), splashTimer]);
      const st = extractStudent(res?.data);
      setStudent(st);
    } catch {
      await splashTimer;
      setStudent(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const register = async (payload: authApi.RegisterPayload) => {
    const res = await authApi.registerStudent(payload);
    if (res.error) {
      return { success: false, error: res.error };
    }
    return { success: true, studentId: res.data?.studentId };
  };

  const requestOtp = async (email: string) => {
    setLoginEmail(email);
    const res = await authApi.requestOtp(email);
    if (res.error) {
      return { success: false, error: res.error };
    }
    return {
      success: true,
      cooldownSeconds: res.data?.resendCooldownSeconds || 30,
    };
  };

  const verifyOtp = async (email: string, code: string) => {
    const res = await authApi.verifyOtp(email, code);
    if (res.error) {
      return { success: false, error: res.error };
    }
    const st = extractStudent(res.data);
    if (st) {
      setStudent(st);
      return { success: true };
    }
    return { success: false, error: 'Verification failed' };
  };

  const logoutStudent = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore
    } finally {
      setStudent(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        isLoading,
        isAuthenticated: !!student,
        loginEmail,
        setLoginEmail,
        checkAuth,
        register,
        requestOtp,
        verifyOtp,
        logoutStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
