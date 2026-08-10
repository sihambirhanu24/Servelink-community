"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

async function fetchAccessibleCommunities() {
  const { data } = await api.get("/community/accessible");
  return (data?.communities ?? []) as Array<{ id: string; name: string; type: string }>;
}

export default function CommunitySelect({ value, onChange }: Props) {
  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["accessible-communities-select"],
    queryFn: fetchAccessibleCommunities,
    staleTime: 60_000,
    retry: 1,
  });

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isLoading}
      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10 disabled:opacity-60"
    >
      <option value="">{isLoading ? "Loading communities…" : "Select Community"}</option>
      {communities.map((community) => (
        <option key={community.id} value={community.id}>
          {community.name}
        </option>
      ))}
    </select>
  );
}
