"use client";

import { SlidersHorizontal } from "lucide-react";

export default function FilterButton() {
  return (
    <button className="flex items-center gap-3 rounded-2xl border bg-white px-6 py-3 shadow-sm transition hover:bg-gray-50">

      <SlidersHorizontal size={18} />

      Filter

    </button>
  );
}