'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterFormValues } from '@/lib/auth-schemas';
import { getErrorMessage } from '@/lib/error-message';
import { useRegister } from '@/hooks/useAuth';
import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(RegisterSchema) });

  const registerMutation = useRegister();
  const [teacherCertificate, setTeacherCertificate] = useState<File | null>(null);
  const [certificateError, setCertificateError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      setCertificateError('Invalid file type. Only PDF, DOCX, JPG, and PNG are allowed.');
      setTeacherCertificate(null);
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setCertificateError('File size must be less than 5MB.');
      setTeacherCertificate(null);
      return;
    }

    setCertificateError('');
    setTeacherCertificate(file);
  };

  const removeFile = () => {
    setTeacherCertificate(null);
    setCertificateError('');
  };

  const onSubmit = async (values: RegisterFormValues) => {
    if (!teacherCertificate) {
      setCertificateError('Teacher certificate is required for verification.');
      return;
    }

    // Create FormData to send file with registration data
    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      formData.append(key, values[key as keyof RegisterFormValues] as string);
    });
    formData.append('teacherCertificate', teacherCertificate);

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

        {/* Teacher Certificate Upload */}
        <div className="mt-4 border-t border-slate-200 pt-4">
          <label className="text-xs font-semibold text-slate-700 flex items-center">
            <FileText className="w-4 h-4 mr-1.5" />
            Teacher Certificate / ID (Required)
          </label>
          <p className="mt-1 text-[10px] text-slate-500 mb-2">
            Upload your teacher certificate, institutional ID, or employment letter for verification. 
            Accepted: PDF, DOCX, JPG, PNG (max 5MB)
          </p>
          
          {!teacherCertificate ? (
            <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-[#043658] hover:bg-slate-50 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xs text-slate-600 font-medium">
                  Click to upload teacher certificate
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  PDF, DOCX, JPG, PNG (max 5MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="mt-2 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-900">{teacherCertificate.name}</p>
                  <p className="text-[10px] text-green-700">
                    {(teacherCertificate.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}
          
          {certificateError && (
            <p className="mt-2 text-xs text-red-600 flex items-center">
              <X className="w-3 h-3 mr-1" />
              {certificateError}
            </p>
          )}
        </div>

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
