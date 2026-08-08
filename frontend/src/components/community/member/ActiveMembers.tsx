"use client";

const members = [
  {
    name: "Sarah Johnson",
    level: "Level 5",
  },
  {
    name: "Michael Brown",
    level: "Level 4",
  },
  {
    name: "Helen Bekele",
    level: "Level 3",
  },
];

export default function ActiveMembers() {
  return (
    <div className="rounded-[28px] bg-white p-6 shadow-sm">

      <h2 className="mb-6 text-xl font-bold text-[#043658]">
        Active Members
      </h2>

      <div className="space-y-5">

        {members.map((member) => (

          <div
            key={member.name}
            className="flex items-center justify-between"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#043658] font-bold text-white">
                {member.name.charAt(0)}
              </div>

              <div>

                <h3 className="font-semibold">
                  {member.name}
                </h3>

                <p className="text-sm text-gray-500">
                  {member.level}
                </p>

              </div>

            </div>

            <button className="rounded-full bg-[#043658] px-4 py-2 text-sm text-white transition hover:bg-[#032B46]">
              Follow
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}