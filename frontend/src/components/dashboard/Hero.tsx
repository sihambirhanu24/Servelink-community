"use client";

import ProgressBar from "../ui/ProgressBar";
import { useTeacher } from "@/hooks/useTeacher";

export default function Hero() {
  const { data: teacher } = useTeacher();
  return (
    <section className="grid gap-5 lg:grid-cols-[2fr_350px] ">

      <div className="relative overflow-hidden rounded-[32px] bg-[#043658] p-10 text-white">

        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#FFC107]/10 blur-3xl" />

        <p className="text-white/60">
          Dashboard
        </p>

        <h1 className="text-3xl font-bold">
  Welcome back, {teacher?.firstName}
</h1>

<p>
  {teacher?.level}
</p>

        <ProgressBar value={82} />

        <div className="mt-3 flex justify-between text-sm">

          <span>2400 XP</span>

          <span>3000 XP</span>

        </div>

      </div>

      <div className="rounded-[32px] bg-white p-8 shadow-sm">

        <p className="text-gray-500">
          Teacher Level
        </p>

        <div className="mt-5 flex justify-center">

          <div className="flex h-40 w-40 items-center justify-center rounded-full border-[14px] border-[#FFC107]">

            <div>

              <h2 className="text-center text-5xl font-bold text-[#043658]">
                4
              </h2>

              <p className="text-center text-sm text-gray-500">
                Level
              </p>

            </div>

          </div>

        </div>

        <button className="mt-8 w-full rounded-2xl bg-[#043658] py-4 font-semibold text-white hover:bg-[#032B46]">
          View Progress
        </button>

      </div>

    </section>
  );
}