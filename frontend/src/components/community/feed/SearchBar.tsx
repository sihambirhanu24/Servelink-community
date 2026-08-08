"use client";

import { Search } from "lucide-react";

interface Props {
  placeholder?: string;
}

export default function SearchBar({
  placeholder = "Search posts, teachers, communities...",
}: Props) {
  return (
    <div className="relative w-full">
      <Search
        size={20}
        className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type="text"
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-14 pr-5 outline-none transition focus:border-[#043658]"
      />
    </div>
  );
}