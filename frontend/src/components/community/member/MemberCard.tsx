"use client";

import { UserPlus } from "lucide-react";

interface Props {
  member: {
    id: string;
    name: string;
    level: number;
    avatar?: string;
  };
}

export default function MemberCard({
  member,
}: Props) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">

      <div className="flex items-center gap-4">

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#043658] text-lg font-bold text-white">
          {member.name.charAt(0)}
        </div>

        <div>

          <h3 className="font-semibold">
            {member.name}
          </h3>

          <p className="text-sm text-gray-500">
            Level {member.level}
          </p>

        </div>

      </div>

      <button className="rounded-xl bg-[#043658] p-3 text-white hover:bg-[#032B46]">
        <UserPlus size={18} />
      </button>

    </div>
  );
}