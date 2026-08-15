import { api, setAccessToken } from '@/lib/axios';
import {
  LoginFormValues,
  RegisterFormValues,
  ForgotPasswordFormValues,
} from '@/lib/auth-schemas';
import { useMutation } from "@tanstack/react-query";

export async function login(values: LoginFormValues) {
  const { data } = await api.post('/auth/login', values);
  setAccessToken(data.accessToken);

  if (data.admin) {
    // Admin login — store under separate keys
    localStorage.setItem('admin_token', data.accessToken);
    localStorage.setItem('admin', JSON.stringify(data.admin));
    document.cookie = `admin_token=${data.accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
  } else {
    // Teacher login
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('teacher', JSON.stringify(data.teacher));
  }
  return data;
}

export async function register(values: RegisterFormValues) {
  const { agreedToTerms, documents, ...fields } = values;
  void agreedToTerms;

  // Verification documents make registration multipart; the backend reads the
  // files from the `documents` field and their labels from `documentTypes`.
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== '') formData.append(key, String(value));
  });
  documents.forEach(({ file, documentType }) => {
    formData.append('documents', file);
    formData.append('documentTypes', documentType);
  });

  const { data } = await api.post('/auth/register', formData);
  setAccessToken(data.accessToken);
  localStorage.setItem('token', data.accessToken);
  localStorage.setItem('teacher', JSON.stringify(data.teacher));
  return data;
}

export async function logout() {
  setAccessToken(null);
  localStorage.removeItem('token');
  localStorage.removeItem('teacher');
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data;
}

export const getMe = getCurrentUser;

export const forgotPassword = async (
  email: string
) => {
  const { data } = await api.post(
    "/auth/forgot-password",
    {
      email,
    }
  );

  return data;
};

export const resetPassword = async (
  token: string,
  password: string
) => {
  const { data } = await api.post(
    "/auth/reset-password",
    {
      token,
      password,
    }
  );

  return data;
};

export async function adminLogin(email: string, password: string) {
  const { data } = await api.post('/auth/admin/login', { email, password });
  setAccessToken(data.accessToken);
  
  // Store under 'admin_token' and 'admin' keys — completely separate
  // from the 'token'/'teacher' keys used by teacher auth.
  localStorage.setItem('admin_token', data.accessToken);
  localStorage.setItem('admin', JSON.stringify(data.admin));
  
  // Set cookie for middleware to recognize admin session
  if (typeof document !== 'undefined') {
    document.cookie = `admin_token=${data.accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
  }
  
  return data;
}

export function getStoredAdmin() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('admin');
  return raw ? JSON.parse(raw) : null;
}

export function adminLogout() {
  setAccessToken(null);
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin');
  // Expire the cookie so the middleware redirects to login
  if (typeof document !== 'undefined') {
    document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
  }
}
