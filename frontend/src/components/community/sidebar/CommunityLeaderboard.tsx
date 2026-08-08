"use client";

const teachers = [
  {
    name: "Sarah",
    xp: 9200,
  },
  {
    name: "Helen",
    xp: 8500,
  },
  {
    name: "John",
    xp: 7900,
  },
];

export default function CommunityLeaderboard() {
  return (
    <div className="rounded-[30px] bg-white p-6 shadow-sm">

      <h2 className="text-xl font-bold">
        Top Contributors
      </h2>

      <div className="mt-6 space-y-5">

        {teachers.map((teacher, index) => (

          <div
            key={teacher.name}
            className="flex items-center justify-between"
          >

            <div className="flex gap-4">

              <span className="font-bold">
                #{index + 1}
              </span>

              <p>{teacher.name}</p>

            </div>

            <span className="font-semibold text-[#043658]">
              {teacher.xp} XP
            </span>

          </div>

        ))}

      </div>

    </div>
);
}