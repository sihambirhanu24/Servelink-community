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
  // user starts null on both server and client — prevents hydration mismatch.
  // The Avatar in Topbar renders initials on first paint, then flips to the
  // profile image after the useEffect below reads localStorage and fires /auth/me.
  const [user, setUser] = useState<User | null>(null);

  // token is also null initially. We set it (and the axios interceptor) inside
  // useEffect so the server and client first-render output match exactly.
  // Pages that depend on token use it as a dep so they re-run once it's set.
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem("token");
      if (!savedToken) return;

      // 1. Set token + axios interceptor first so any queued API calls work
      setToken(savedToken);
      setAccessToken(savedToken);

      // 2. Immediately populate user from cache so pages don't wait for /auth/me
      const cached = localStorage.getItem("teacher");
      if (cached) {
        try { setUser(JSON.parse(cached)); } catch { /* ignore bad cache */ }
      }

      // 3. Refresh from server in the background
      try {
        const teacher = await getCurrentUser();
        setUser(teacher);
        localStorage.setItem("teacher", JSON.stringify(teacher));
      } catch {
        logout();
      }
    }
    loadUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
