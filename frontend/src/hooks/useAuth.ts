import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  login,
  register,
  forgotPassword,
  resetPassword,
} from "@/services/auth";

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      forgotPassword(email),
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) =>
      resetPassword(
        token,
        newPassword,
      ),

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

  return useMutation({
    mutationFn: login,

    onSuccess(data) {
      // If the response contains an 'admin' key, it's an admin login
      if (data?.admin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    },

    onError(error) {
      console.error(error);
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: register,

    onSuccess() {
      
      router.push("/auth/login");
    },

    onError(error) {
      console.error(error);
    },
  });
}