import React from "react";
import { Filter } from "lucide-react";

type Tab = "overview" | "questions" | "discussions" | "resources" | "members" | "live-streams";

interface CommunityFiltersProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
  search?: string;
  setSearch?: (s: string) => void;
  communityFilter?: string;
  setCommunityFilter?: (s: string) => void;
  categoryFilter?: string;
  setCategoryFilter?: (s: string) => void;
  communities?: any[];
  categories?: any[];
  showSort?: boolean;
  sortOrder?: "newest" | "oldest" | "most-likes";
  setSortOrder?: (o: "newest" | "oldest" | "most-likes") => void;
}

export function CommunityFilters({
  tab,
  setTab,
}: CommunityFiltersProps) {
  return (
    <div className="mb-8 border-b border-slate-200 bg-slate-50/80 backdrop-blur-xl">
      <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Tabs - Scrollable on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 hide-scrollbar lg:pb-0">
          {[
            { key: "overview" as Tab, label: "Overview" },
            { key: "questions" as Tab, label: "Q&A" },
            { key: "discussions" as Tab, label: "Discussions" },
            { key: "resources" as Tab, label: "Resources" },
            { key: "members" as Tab, label: "Members" },
            { key: "live-streams" as Tab, label: "Live Stream" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "bg-[#043658] text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
