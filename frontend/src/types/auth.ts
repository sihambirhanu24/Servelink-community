import api from "@/lib/axios";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  school: string;
  woreda: string;
  zone: string;
  region: string;
  subject: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  subject?: string;
  verified: boolean;
  level: string;
  school: string;
  woreda: string;
  zone: string;
  region: string;
}

export interface LoginResponse {
  accessToken: string;
  teacher: Teacher;
}

export const login = async (
  body: LoginDto
): Promise<LoginResponse> => {
  const { data } = await api.post("/auth/login", body);
  return data;
};

export const register = async (
  body: RegisterDto
) => {
  const { data } = await api.post("/auth/register", body);
  return data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("teacher");
};

export const getCurrentTeacher = (): Teacher | null => {
  const teacher = localStorage.getItem("teacher");

  if (!teacher) return null;

  return JSON.parse(teacher);
};

export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem("token");
};
export const getMe = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};