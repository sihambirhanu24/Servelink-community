"use client";

import { useEffect, useState } from "react";
import { CommunityService } from "@/services/community.service";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function CategorySelect({
  value,
  onChange,
}: Props) {
  const [categories, setCategories] =
    useState<any[]>([]);

  useEffect(() => {
    CommunityService.getCategories().then((res) =>
      setCategories(res.data)
    );
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10"
    >
      <option value="">Select Category</option>

      {categories.map((category) => (
        <option
          key={category.id}
          value={category.id}
        >
          {category.name}
        </option>
      ))}
    </select>
  );
}