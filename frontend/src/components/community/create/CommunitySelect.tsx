"use client";

import { useEffect, useState } from "react";
import { getCommunities } from "@/services/community.service";
interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function CommunitySelect({
  value,
  onChange,
}: Props) {
  const [communities, setCommunities] = useState<any[]>([]);

useEffect(() => {
  getCommunities().then((data) => {
    setCommunities(data);
  });
}, []);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10"
    >
      <option value="">Select Community</option>

      {communities.map((community) => (
        <option
          key={community.id}
          value={community.id}
        >
          {community.name}
        </option>
      ))}
    </select>
  );
}