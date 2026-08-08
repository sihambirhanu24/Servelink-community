import { CreatePostForm } from "@/components/community/create";
import { BookOpen, Users } from "lucide-react";

export default function CreatePostPage() {
  return (
    <div className="mx-auto w-full max-w-[900px] space-y-8 bg-slate-50 py-2">
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#043658_0%,#0A4A74_100%)] p-8 text-white shadow-[0_20px_45px_-24px_rgba(4,54,88,0.75)] sm:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10 bg-white/[0.04]" />
        <div className="absolute -bottom-24 right-28 h-48 w-48 rounded-full border border-[#FFC107]/10" />
        <div className="relative flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#FFC107]">
              <BookOpen className="h-4 w-4" />
              Community contribution
            </div>
            <h1 className="mt-5 font-['Lexend'] text-4xl font-semibold tracking-tight sm:text-5xl">
              Create Community <span className="text-[#FFC107]">Post</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
              Share teaching resources, classroom ideas, lesson plans, and meaningful discussions with educators across the platform.
            </p>
          </div>
          <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-white/[0.09] shadow-lg sm:flex">
            <Users className="h-10 w-10 text-[#FFC107]" />
          </div>
        </div>
      </section>
      <CreatePostForm />
    </div>
  );
}