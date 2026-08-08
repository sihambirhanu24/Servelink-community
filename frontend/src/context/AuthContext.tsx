"use client";

import { getCurrentUser } from "@/services/auth";
import { setAccessToken } from "@/lib/axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  logout: () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(null);

 useEffect(() => {
  async function loadUser() {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) return;

      setToken(savedToken);
      setAccessToken(savedToken);

    try {
      const teacher = await getCurrentUser();

      setUser(teacher);

      localStorage.setItem(
        "teacher",
        JSON.stringify(teacher)
      );
    } catch {
      logout();
    }
  }

  loadUser();
}, []);
  useEffect(() => {
    const savedTeacher = localStorage.getItem("teacher");

    if (savedTeacher) {
      setUser(JSON.parse(savedTeacher));
    }
  }, []);

  function logout() {
    setAccessToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("teacher");

    setUser(null);
    setToken(null);

    window.location.href = "/auth/login";
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () =>
  useContext(AuthContext);
