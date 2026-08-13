import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g. http://localhost:4000
  withCredentials: true, // sends the httpOnly refresh cookie automatically
});

export default api;

// In-memory access token — NOT localStorage. Lives here so any part of
// the app can set/read it without prop-drilling, but it's wiped on a
// hard refresh (by design — see AuthContext for how it gets rehydrated).
let accessToken: string | null = null;

// Callback to notify AuthContext when token is invalidated
let onTokenInvalidated: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setOnTokenInvalidated(callback: () => void) {
  onTokenInvalidated = callback;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Tracks an in-flight refresh so concurrent 401s from multiple
// simultaneous requests don't each fire their own /auth/refresh call.
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the token is invalid or expired,
    // clear the session and let the login page handle it.
    if (error.response?.status === 401) {
      setAccessToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("teacher");
      
      // Notify AuthContext to update its state
      if (onTokenInvalidated) {
        onTokenInvalidated();
      }
    }

    return Promise.reject(error);
  }
);

// ─── Admin API ───────────────────────────────────────────────────────────────
// Separate axios instance for all /admin/* calls.
// Uses the admin_token stored in localStorage (set after adminLogin()).
// Completely isolated from the teacher session — admin login and teacher
// login are independent flows using different JWT payloads and DB tables.
export const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: false, // admin uses Bearer only, no cookie needed
});

adminApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 on admin routes → token expired or invalid → redirect to admin login
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin');
      document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

