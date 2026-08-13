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
      onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log("VALIDATION FAILED");
        console.log(errors);
      })}
      className="w-full max-w-2xl"
    >
      <h2 className="font-['Lexend'] text-3xl font-semibold text-[#043658]">Join the Community</h2>
      <p className="mt-2 text-sm text-slate-600">
        Create your account to start managing school initiatives with academic precision.
      </p>

      {registerMutation.isError && (
        <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {getErrorMessage(registerMutation.error)}
        </p>
      )}

      <div className="mt-8 space-y-5">
        {/* First Name & Last Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">First Name</label>
            <input
              {...register('firstName')}
              placeholder="e.g. Abebe"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Last Name</label>
            <input
              {...register('lastName')}
              placeholder="e.g. Kebede"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* School Email & School Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">School Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="name@school.edu.et"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">School/Institution</label>
            <input
              {...register('school')}
              placeholder="Select your school"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.school && <p className="mt-1 text-xs text-red-600">{errors.school.message}</p>}
          </div>
        </div>

        {/* Woreda & Zone Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Woreda</label>
            <input
              {...register('woreda')}
              placeholder="Select Woreda"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.woreda && <p className="mt-1 text-xs text-red-600">{errors.woreda.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Zone</label>
            <input
              {...register('zone')}
              placeholder="Select Zone"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.zone && <p className="mt-1 text-xs text-red-600">{errors.zone.message}</p>}
          </div>
        </div>

        {/* Region & Subject Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Region</label>
            <input
              {...register('region')}
              placeholder="Select Region"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.region && <p className="mt-1 text-xs text-red-600">{errors.region.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">
              Department <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              {...register('department')}
              placeholder="e.g. Mathematics, English, Physics"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department.message}</p>}
            <p className="mt-1 text-[11px] text-slate-400">
              Used to place you in department-specific community chats at Level 2–5.
            </p>
          </div>
        </div>

        {/* Password Row */}
        <div>
          <label className="text-xs font-semibold text-slate-700">Password</label>
          <input
            {...register('password')}
            type="password"
            placeholder="Create a strong password"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        {/* Confirm Password - Full Width */}
        <div>
          <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
          <input
            type="password"
            placeholder="Repeat your password"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
          />
        </div>

        {/* Terms & Conditions */}
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input {...register('agreedToTerms')} type="checkbox" className="mt-0.5 rounded border-slate-300" />
          <span>
            I agree to the <Link href="/terms" className="text-[#043658] underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="text-[#043658] underline">Privacy Policy</Link>.
          </span>
        </label>
        {errors.agreedToTerms && (
          <p className="text-xs text-red-600">{errors.agreedToTerms.message}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded-lg bg-[#043658] py-3 text-sm font-semibold text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-60 mt-6"
        >
          {registerMutation.isPending ? 'Creating account...' : 'Create Account →'}
        </button>
      </div>

      {/* Sign In Link */}
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-[#043658] font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
