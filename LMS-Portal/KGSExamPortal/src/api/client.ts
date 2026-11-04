import { Platform } from 'react-native';

// Production Azure Backend API URL for KGS Exam Portal Student Mobile App:
const AZURE_PRODUCTION_BASE_URL =
  'https://kgs-lms-backend-cafdhmc2gtdtfde4.centralindia-01.azurewebsites.net/api';

// Local development fallback URL:
const LOCAL_DEV_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:4000/api'
    : 'http://localhost:4000/api';

// Set active base URL to Azure Production
let currentBaseUrl = AZURE_PRODUCTION_BASE_URL;
let sessionCookie: string | null = null;

export const setBaseUrl = (url: string) => {
  currentBaseUrl = url;
};

export const setSessionCookie = (cookie: string | null) => {
  sessionCookie = cookie;
};

export const getSessionCookie = () => sessionCookie;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${currentBaseUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Capture kgs_session cookie from Set-Cookie header if present
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader && setCookieHeader.includes('kgs_session=')) {
      const match = setCookieHeader.match(/kgs_session=[^;]+/);
      if (match) {
        sessionCookie = match[0];
      }
    }

    const text = await response.text();
    let data: any = {};
    if (text) {
      if (text.trim().startsWith('<')) {
        // Express HTML error page response (e.g. 404/500)
        data = { error: `Endpoint not found or server error (HTTP ${response.status})` };
      } else {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }
    }

    if (!response.ok) {
      return {
        error: data.error || data.message || `HTTP Error ${response.status}`,
        status: response.status,
      };
    }

    return {
      data: data as T,
      status: response.status,
    };
  } catch (err: any) {
    return {
      error: err.message || 'Network connection failed. Please check internet connection or Azure backend server status.',
      status: 0,
    };
  }
}
