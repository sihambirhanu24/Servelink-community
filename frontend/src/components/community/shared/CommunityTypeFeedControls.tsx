"use client";

import { Search } from "lucide-react";

interface FilterTab {
  key: string;
  label: string;
}

interface Props {
  search: string;
  onSearch: (v: string) => void;
  activeFilter: string;
  onFilter: (key: string) => void;
  filters: FilterTab[];
  placeholder?: string;
}

export default function CommunityTypeFeedControls({
  search,
  onSearch,
  activeFilter,
  onFilter,
  filters,
  placeholder = "Search posts…",
}: Props) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="community-feed-search"
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-[#043658] placeholder:text-slate-400 outline-none transition focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/10"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            id={`filter-${f.key}`}
            type="button"
            onClick={() => onFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeFilter === f.key
                ? "bg-[#043658] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-[#043658]/30 hover:text-[#043658]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
