export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '.' || envUrl === './') {
    return envUrl === '.' || envUrl === './' ? '.' : 'https://assesspro-backend-ny01.onrender.com';
  }
  return envUrl.replace(/\/$/, '');
}

export const API_BASE_URL = getApiBaseUrl();

export function getAuthToken(isAdmin = false): string | null {
  if (isAdmin) {
    return localStorage.getItem('kgs_admin_token') || localStorage.getItem('kgs_token');
  }
  return localStorage.getItem('kgs_student_token') || localStorage.getItem('kgs_token');
}

export function setAuthToken(token: string, isAdmin = false): void {
  if (isAdmin) {
    localStorage.setItem('kgs_admin_token', token);
  } else {
    localStorage.setItem('kgs_student_token', token);
  }
  localStorage.setItem('kgs_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('kgs_admin_token');
  localStorage.removeItem('kgs_student_token');
  localStorage.removeItem('kgs_token');
}

export function getAuthHeaders(isAdmin = false): Record<string, string> {
  const token = getAuthToken(isAdmin);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function authFetch(
  url: string,
  options: RequestInit = {},
  isAdmin = false
): Promise<Response> {
  const authHeaders = getAuthHeaders(isAdmin);
  const headers = {
    ...authHeaders,
    ...(options.headers || {}),
  };
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}
