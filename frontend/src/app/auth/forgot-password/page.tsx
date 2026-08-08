import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-[#043658] flex items-center justify-center shadow-lg">
            <span className="text-[#FFC107] text-2xl font-bold">
              S
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white shadow-xl border border-slate-200 p-8">

          <div className="text-center mb-8">
            <div className="inline-flex px-4 py-1 rounded-full bg-[#FFC107]/20 text-[#043658] font-semibold text-sm">
              Account Recovery
            </div>

            <h1 className="mt-5 text-3xl font-bold text-[#043658]">
              Forgot Password?
            </h1>

            <p className="mt-3 text-slate-500 leading-relaxed">
              Enter your email address and we'll send you a secure link to reset your password.
            </p>
          </div>

          <ForgotPasswordForm />

          <div className="mt-8 text-center text-sm text-slate-500">
            Remember your password?
            <a
              href="/auth/login"
              className="ml-2 font-semibold text-[#043658] hover:text-[#FFC107] transition-colors"
            >
              Back to Login
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}