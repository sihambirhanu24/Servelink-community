'use client';

import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordSchema, ResetPasswordFormValues } from '@/lib/auth-schemas';
import { useResetPassword } from '@/hooks/useAuth';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(ResetPasswordSchema) });

  const resetPasswordMutation = useResetPassword();

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) return;
    resetPasswordMutation.mutate({ token, newPassword: values.password });
  };

  
  if (!token) {
    return (
      <div className="w-full max-w-sm text-center">
        <h2 className="font-['Lexend'] text-2xl font-semibold text-[#043658]">Invalid reset link</h2>
        <p className="mt-2 text-sm text-slate-500">
          This link is missing or broken. Request a new one from the sign-in page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm">
      <h2 className="font-['Lexend'] text-2xl font-semibold text-[#043658]">Set a new password</h2>
      <p className="mt-1 text-sm text-slate-500">Choose something you haven&apos;t used before.</p>

      {resetPasswordMutation.isError && (
        <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {(resetPasswordMutation.error as any)?.response?.data?.message ?? 'That link may have expired.'}
        </p>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <input
            {...register('password')}
            type="password"
            placeholder="New password"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <input
            {...register('confirmPassword')}
            type="password"
            placeholder="Confirm new password"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={resetPasswordMutation.isPending}
          className="w-full rounded-xl bg-[#043658] py-3 text-sm font-semibold text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-60"
        >
          {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </form>
  );
}
