"use client";

export default function MemberGrowth() {
  return (
    <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#043658] to-[#0B5B8A] p-6 text-white shadow-lg">

      <p className="text-white/70">
        Community Growth
      </p>

      <h2 className="mt-2 text-4xl font-bold">
        +18%
      </h2>

      <p className="mt-1 text-white/70">
        compared to last month
      </p>

      <div className="mt-8">

        <div className="mb-2 flex justify-between text-sm">

          <span>Progress</span>

          <span>82%</span>

        </div>

        <div className="h-3 overflow-hidden rounded-full bg-white/20">

          <div className="h-full w-[82%] rounded-full bg-[#FFC107]" />

        </div>

      </div>

      <button className="mt-8 w-full rounded-2xl bg-white py-3 font-semibold text-[#043658] transition hover:scale-105">
        Invite Teachers
      </button>

    </div>
  );
}