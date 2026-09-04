"use client";

import { getCurrentUser } from "@/services/auth";
import { setAccessToken, setOnTokenInvalidated } from "@/lib/axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  profileImage?: string;
  status?: string;
  verified?: boolean;
  suspensionReason?: string | null;
  suspensionStart?: string | null;
  suspensionUntil?: string | null;
}

export const SUSPENDED_STATUSES = ["SUSPENDED", "PERMANENTLY_SUSPENDED"];

export function isSuspendedStatus(status?: string | null): boolean {
  return !!status && SUSPENDED_STATUSES.includes(status);
}

/**
 * Suspended teachers are only allowed on the suspension screen and auth pages.
 * The backend enforces this with 403 ACCOUNT_SUSPENDED regardless; this keeps
 * the UI from flashing the normal dashboard first.
 */
function redirectIfSuspended(user: User | null | undefined) {
  if (typeof window === "undefined" || !user || !isSuspendedStatus(user.status)) return;
  const { pathname } = window.location;
  if (pathname === "/suspended" || pathname.startsWith("/auth")) return;
  window.location.replace("/suspended");
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  /**
   * True while AuthContext is reading localStorage / calling /auth/me on startup.
   * Protected queries must wait for this to be false before firing.
   */
  isInitializing: boolean;
  /** Called by login() / register() to push the fresh token+user into context
   *  immediately — no page reload required. */
  updateAuth: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isInitializing: true,
  updateAuth: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Starts true — flips to false once loadUser() finishes (success or failure).
  const [isInitializing, setIsInitializing] = useState(true);

  // ── Clear session on 401 (called by axios interceptor) ───────────────────
  const clearSession = useCallback(() => {
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnTokenInvalidated(clearSession);
    return () => setOnTokenInvalidated(() => {});
  }, [clearSession]);

  // ── Called by login() / register() after a successful auth response ───────
  // Sets token + user in context state so the next render already has them,
  // removing the need for a hard refresh before protected pages can load.
  const updateAuth = useCallback((newToken: string, newUser: User) => {
    setAccessToken(newToken);
    setToken(newToken);
    setUser(newUser);
    redirectIfSuspended(newUser);
  }, []);

  // ── Restore session on mount (hard refresh / new tab) ────────────────────
  useEffect(() => {
    async function loadUser() {
      try {
        const savedToken = localStorage.getItem("token");
        if (!savedToken) return; // no session — isInitializing → false in finally

        // 1. Arm the axios interceptor first so any requests that fire during
        //    the /auth/me call already carry the Bearer header.
        setAccessToken(savedToken);
        setToken(savedToken);

        // 2. Populate user from the localStorage cache immediately so pages
        //    can render optimistically while /auth/me is in-flight.
        const cached = localStorage.getItem("teacher");
        if (cached) {
          try { setUser(JSON.parse(cached)); } catch { /* ignore bad JSON */ }
        }

        // 3. Validate with the server and refresh the cached profile.
        //    /auth/me is one of the few endpoints a suspended account may call;
        //    its `status` is the authoritative signal for the suspension screen.
        const teacher = await getCurrentUser();
        setUser(teacher);
        localStorage.setItem("teacher", JSON.stringify(teacher));
        redirectIfSuspended(teacher);
      } catch {
        // 401 / network error — interceptor already cleared accessToken.
        // Make sure React state is also clean.
        clearSession();
        localStorage.removeItem("token");
        localStorage.removeItem("teacher");
      } finally {
        // Always unblock protected queries, whether we restored a session or not.
        setIsInitializing(false);
      }
    }

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    setAccessToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("teacher");
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    setUser(null);
    setToken(null);
    window.location.href = "/auth/login";
  }

  return (
    <AuthContext.Provider value={{ user, token, isInitializing, updateAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
