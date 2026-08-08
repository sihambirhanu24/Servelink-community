'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginFormValues } from '@/lib/auth-schemas';
import { getErrorMessage } from '@/lib/error-message';
import { useLogin } from '@/hooks/useAuth';

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(LoginSchema) });

  const loginMutation = useLogin();

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm">
      <h2 className="font-['Lexend'] text-2xl font-semibold text-[#043658]">Sign In</h2>
      <p className="mt-1 text-sm text-slate-500">Welcome back! Please enter your credentials.</p>

      
      {loginMutation.isError && (
        <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {getErrorMessage(loginMutation.error)}
        </p>
      )}

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

        <div>
          <input
            {...register('password')}
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-500">
            <input type="checkbox" className="rounded border-slate-300" />
            Remember me
          </label>
          <Link href="/auth/forgot-password" className="text-[#043658] font-medium hover:underline">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-xl bg-[#043658] py-3 text-sm font-semibold text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-60"
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign In →'}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-[#043658] font-semibold hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
