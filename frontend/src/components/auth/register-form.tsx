'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MAX_VERIFICATION_DOCUMENTS,
  RegisterSchema,
  RegisterFormValues,
  VerificationDocumentValue,
} from '@/lib/auth-schemas';
import { getErrorMessage } from '@/lib/error-message';
import { useRegister } from '@/hooks/useAuth';
import { VerificationDocumentsField } from './verification-documents-field';

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { documents: [] },
  });

  const [documents, setDocumentState] = useState<VerificationDocumentValue[]>([]);

  const setDocuments = (next: VerificationDocumentValue[]) => {
    setDocumentState(next);
    setValue('documents', next, { shouldValidate: true });
  };

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
      <h2 className="font-['Lexend'] text-2xl font-semibold text-[#043658]">Join the Community</h2>
      <p className="mt-1 text-xs text-slate-600">
        Create your account to start managing school initiatives with academic precision.
      </p>

      {registerMutation.isError && (
        <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {getErrorMessage(registerMutation.error)}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {/* First Name & Last Name Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">First Name</label>
            <input
              {...register('firstName')}
              placeholder="e.g. Abebe"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.firstName && <p className="mt-0.5 text-xs text-red-600">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Last Name</label>
            <input
              {...register('lastName')}
              placeholder="e.g. Kebede"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.lastName && <p className="mt-0.5 text-xs text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* School Email & School Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">School Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="name@school.edu.et"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.email && <p className="mt-0.5 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">School/Institution</label>
            <input
              {...register('school')}
              placeholder="Select your school"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.school && <p className="mt-0.5 text-xs text-red-600">{errors.school.message}</p>}
          </div>
        </div>

        {/* Woreda & Zone Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Woreda</label>
            <input
              {...register('woreda')}
              placeholder="Select Woreda"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.woreda && <p className="mt-0.5 text-xs text-red-600">{errors.woreda.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Zone</label>
            <input
              {...register('zone')}
              placeholder="Select Zone"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.zone && <p className="mt-0.5 text-xs text-red-600">{errors.zone.message}</p>}
          </div>
        </div>

        {/* Region & Subject Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Region</label>
            <input
              {...register('region')}
              placeholder="Select Region"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.region && <p className="mt-0.5 text-xs text-red-600">{errors.region.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Department</label>
            <input
              {...register('department')}
              placeholder="e.g. Mathematics, English, Physics"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.department && <p className="mt-0.5 text-xs text-red-600">{errors.department.message}</p>}
            <p className="mt-0.5 text-[10px] text-slate-400">
              Used to place you in department-specific community chats at Level 2–5.
            </p>
          </div>
        </div>

        {/* Password Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Create a strong password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
            {errors.password && <p className="mt-0.5 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat your password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
          </div>
        </div>

        {/* Verification Documents */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <h3 className="font-['Lexend'] text-sm font-semibold text-[#043658]">
            Verification Documents
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-600">
            Upload up to {MAX_VERIFICATION_DOCUMENTS} documents proving you are a teacher
            (Teacher ID, employment letter or teaching certificate). An administrator
            reviews them before your community access is enabled.
          </p>

          <div className="mt-2">
            <label className="text-xs font-semibold text-slate-700">
              Teacher / Staff ID number <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              {...register('teacherIdNumber')}
              placeholder="e.g. TCH-2024-00913"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
            />
          </div>

          <VerificationDocumentsField
            documents={documents}
            onChange={setDocuments}
            error={
              Array.isArray(errors.documents)
                ? errors.documents.find(Boolean)?.file?.message
                : errors.documents?.message
            }
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
          className="w-full rounded-lg bg-[#043658] py-2.5 text-sm font-semibold text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-60"
        >
          {registerMutation.isPending ? 'Creating account...' : 'Create Account →'}
        </button>
      </div>

      {/* Sign In Link */}
      <p className="mt-3 text-center text-xs text-slate-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-[#043658] font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
