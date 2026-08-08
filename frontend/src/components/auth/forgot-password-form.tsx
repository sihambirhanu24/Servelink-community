'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, ForgotPasswordFormValues } from '@/lib/auth-schemas';
import { useForgotPassword } from '@/hooks/useAuth';

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(ForgotPasswordSchema) });

  const forgotPasswordMutation = useForgotPassword();

  const onSubmit = (values: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate(values.email);
  };

  // Success state: intentionally the SAME message regardless of whether
  // the email exists — matches the backend's enumeration protection.
  if (forgotPasswordMutation.isSuccess) {
    return (
      <div className="w-full max-w-sm text-center">
        <h2 className="font-['Lexend'] text-2xl font-semibold text-[#043658]">Check your email</h2>
        <p className="mt-2 text-sm text-slate-500">
          If an account exists for that email, a reset link is on its way.
        </p>
       
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm">
      <h2 className="font-['Lexend'] text-2xl font-semibold text-[#043658]">Reset your password</h2>
      <p className="mt-1 text-sm text-slate-500">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <input
            {...register('email')}
            type="email"
            placeholder="Email Address"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={forgotPasswordMutation.isPending}
          className="w-full rounded-xl bg-[#043658] py-3 text-sm font-semibold text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-60"
        >
          {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
        </button>
      </div>

     
      
    </form>
  );
}
