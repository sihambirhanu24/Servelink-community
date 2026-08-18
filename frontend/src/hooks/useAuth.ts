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
        return;
      }
      
      // Check teacher verification status
      const teacher = data?.teacher;
      if (!teacher) {
        router.push('/dashboard');
        return;
      }

      // Route based on verification status
      switch (teacher.verificationStatus) {
        case 'APPROVED':
          router.push('/dashboard');
          break;
        case 'PENDING':
          router.push('/verification-pending');
          break;
        case 'REJECTED':
          router.push('/verification-rejected');
          break;
        default:
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
      // After registration, redirect to verification-pending page
      // New registrations always have PENDING status
      router.push("/verification-pending");
    },

    onError(error) {
      console.error(error);
    },
  });
}