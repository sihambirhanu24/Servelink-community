"use client";

import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="relative">

      <Search
        size={20}
        className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type="text"
        placeholder="Search discussions..."
        className="
          w-full
          rounded-2xl
          border
          border-gray-200
          bg-white
          py-4
          pl-14
          pr-5
          outline-none
          transition
          focus:border-[#043658]
          focus:ring-2
          focus:ring-[#043658]/20
        "
      />

    </div>
  );
}