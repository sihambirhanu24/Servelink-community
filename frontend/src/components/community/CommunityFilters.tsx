"use client";

import { Filter } from "lucide-react";

type Tab = "all" | "following" | "my-communities" | "saved";

interface CommunityFiltersProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
  search: string;
  setSearch: (value: string) => void;
  communityFilter: string;
  setCommunityFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  sortOrder?: "newest" | "oldest" | "most-likes";
  setSortOrder?: (value: "newest" | "oldest" | "most-likes") => void;
  communities: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  showSort?: boolean;
}

export function CommunityFilters({
  tab,
  setTab,
  search,
  setSearch,
  communityFilter,
  setCommunityFilter,
  categoryFilter,
  setCategoryFilter,
  sortOrder = "newest",
  setSortOrder,
  communities,
  categories,
  showSort = false,
}: CommunityFiltersProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {[
            { key: "all" as Tab, label: "All Posts" },
            { key: "following" as Tab, label: "Following" },
            { key: "my-communities" as Tab, label: "My Communities" },
            { key: "saved" as Tab, label: "Saved" },
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

        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-[#043658] outline-none focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20"
            />
          </div>

          {/* Community Filter */}
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={communityFilter}
              onChange={(e) => setCommunityFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2 text-sm text-[#043658] outline-none focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20"
            >
              <option value="all">All Communities</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2 text-sm text-[#043658] outline-none focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {showSort && setSortOrder && (
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#043658] outline-none focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20"
            >
              <option value="newest">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="most-likes">Most Liked</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
