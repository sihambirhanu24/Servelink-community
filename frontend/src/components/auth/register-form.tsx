'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterFormValues } from '@/lib/auth-schemas';
import { getErrorMessage } from '@/lib/error-message';
import { useRegister } from '@/hooks/useAuth';

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(RegisterSchema) });

  const registerMutation = useRegister();

 const onSubmit = (values: RegisterFormValues) => {
  

  registerMutation.mutate(values);
};

  return (
    <form
  onSubmit={handleSubmit(
    onSubmit,
    (errors) => {
      console.log("VALIDATION FAILED");
      console.log(errors);
    }
  )}
  className="w-full max-w-sm"
>
      <h2 className="font-['Lexend'] text-2xl font-semibold text-[#043658]">Join the Community</h2>
      <p className="mt-1 text-sm text-slate-500">
        Create your account to start managing school initiatives with academic precision.
      </p>

      {registerMutation.isError && (
        <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {getErrorMessage(registerMutation.error)}
        </p>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600">First Name</label>
          <input
            {...register('firstName')}
            placeholder="Sarah"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
          />
          {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Last Name</label>
          <input
            {...register('lastName')}
            placeholder="Jenkins"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
          />
          {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">School Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="s.jenkins@academy.edu"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

       

        {(['school', 'woreda', 'zone', 'region'] as const).map((field) => (
          <div key={field}>
            <label className="text-xs font-medium text-slate-600">
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              {...register(field)}
              placeholder={`Enter your ${field}`}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]?.message}</p>}
          </div>
        ))}

        <div>
          <label className="text-xs font-medium text-slate-600">Password</label>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••••••"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
          />
          <p className="mt-1 text-xs text-slate-400">
            Must be at least 12 characters with special symbols.
          </p>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <label className="flex items-start gap-2 text-xs text-slate-500">
          <input {...register('agreedToTerms')} type="checkbox" className="mt-0.5 rounded border-slate-300" />
          <span>
            I agree to the <Link href="/terms" className="text-[#043658] underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="text-[#043658] underline">Privacy Policy</Link>.
          </span>
        </label>
        {errors.agreedToTerms && (
          <p className="text-xs text-red-600">{errors.agreedToTerms.message}</p>
        )}

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded-xl bg-[#043658] py-3 text-sm font-semibold text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-60"
        >
          {registerMutation.isPending ? 'Creating account...' : 'Create Professional Account'}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-[#043658] font-semibold hover:underline">
          Sign in here
        </Link>
      </p>
    </form>
  );
}
