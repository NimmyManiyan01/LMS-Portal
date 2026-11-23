export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL

  if (!envUrl || envUrl === "." || envUrl === "./") {
    if (envUrl === "." || envUrl === "./") return "."

    return window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
      ? "http://localhost:4000"
      : "https://kgs-lms-backend-cafdhmc2gtdtfde4.centralindia-01.azurewebsites.net"
  }

  return envUrl.replace(/\/$/, "")
}

export const API_BASE_URL = getApiBaseUrl()

function authTokenKey(isAdmin: boolean): string {
  return isAdmin ? "kgs_admin_token" : "kgs_student_token"
}

export function getAuthToken(isAdmin = false): string | null {
  return localStorage.getItem(authTokenKey(isAdmin))
}

export function setAuthToken(token: string, isAdmin = false): void {
  localStorage.setItem(authTokenKey(isAdmin), token)
  localStorage.removeItem("kgs_token")
}

export function clearAuthToken(isAdmin = false): void {
  localStorage.removeItem(authTokenKey(isAdmin))
  localStorage.removeItem("kgs_token")
}

export function getAuthHeaders(isAdmin = false): Record<string, string> {
  const token = getAuthToken(isAdmin)

  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function getCsrfHeaders(): Record<string, string> {
  const csrf = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("kgs_csrf="))
    ?.slice("kgs_csrf=".length)
  return csrf ? { "X-CSRF-Token": decodeURIComponent(csrf) } : {}
}

export async function authFetch(
  url: string,

  options: RequestInit = {},

  isAdmin = false,
): Promise<Response> {
  const authHeaders = getAuthHeaders(isAdmin)

  const headers = {
    ...authHeaders,

    ...getCsrfHeaders(),

    ...(options.headers || {}),
  }

  return fetch(url, {
    ...options,

    headers,

    credentials: "include",
  })
}
