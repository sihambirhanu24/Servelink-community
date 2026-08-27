import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  login,
  register,
  forgotPassword,
  resetPassword,
} from "@/services/auth";
import { useAuth } from "@/context/AuthContext";

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => forgotPassword(email),
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      resetPassword(token, newPassword),
    onSuccess() {
      router.push("/auth/login");
    },
    onError(error) {
      console.error(error);
    },
  });
}

export function useLogin() {
  const router = useRouter();
  const { updateAuth } = useAuth();

  return useMutation({
    mutationFn: login,
    onSuccess(data) {
      // Admin login — token is stored in localStorage by login(), middleware
      // handles cookie-based route protection.  No AuthContext update needed
      // for admin because admin pages use adminApi (separate axios instance).
      if (data?.admin) {
        router.push("/admin");
        return;
      }

      // Teacher login — push token + user into AuthContext state NOW, before
      // navigating.  This means the dashboard's enabled: !!token queries will
      // fire immediately on the first render of the dashboard, not after a
      // second reload.
      if (data?.accessToken && data?.teacher) {
        updateAuth(data.accessToken, data.teacher);
      }

      router.push("/dashboard");
    },
    onError(error) {
      console.error(error);
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const { updateAuth } = useAuth();

  return useMutation({
    mutationFn: register,
    onSuccess(data) {
      // Same pattern as login — populate context before navigating.
      if (data?.accessToken && data?.teacher) {
        updateAuth(data.accessToken, data.teacher);
      }

      router.push("/dashboard");
    },
    onError(error) {
      console.error(error);
    },
  });
}
