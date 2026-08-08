"use client";

export default function TeacherLevelCard() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm h-[370px] flex flex-col justify-between">

      <div>
        <p className="text-gray-500 text-lg">
          Teacher Level
        </p>
      </div>

      <div className="flex justify-center">
        <div className="relative flex items-center justify-center w-40 h-40 rounded-full border-[14px] border-[#FFC107]">

          <div className="text-center">
            <h1 className="text-5xl font-bold text-[#043658]">
              4
            </h1>

            <p className="text-gray-500">
              Level
            </p>
          </div>

        </div>
      </div>

      <button className="w-full rounded-xl bg-[#043658] py-4 text-white font-semibold hover:bg-[#05466d] transition">
        View Progress
      </button>

    </div>
  );
}