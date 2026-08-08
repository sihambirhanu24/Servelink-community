export default function ProgressCard() {
  return (
    <div className="rounded-3xl bg-[#043658] p-8 text-white shadow-lg">

      <p className="text-sm text-white/70">
        Level Progress
      </p>

      <h2 className="mt-3 text-3xl font-bold">
        Level 4
      </h2>

      <div className="mt-8 h-3 rounded-full bg-white/20">

        <div className="h-3 w-4/5 rounded-full bg-[#FFC107]" />

      </div>

      <div className="mt-3 flex justify-between text-sm">

        <span>2400 XP</span>

        <span>3000 XP</span>

      </div>

      <button className="mt-8 w-full rounded-xl bg-[#FFC107] py-3 font-semibold text-[#043658] transition hover:opacity-90">
        View Achievements
      </button>

    </div>
  );
}