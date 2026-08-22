"use client";

interface TeacherProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "posts", label: "Posts" },
  { id: "resources", label: "Resources" },
  { id: "lessons", label: "Lessons" },
  { id: "about", label: "About" },
];

export function TeacherProfileTabs({ activeTab, onTabChange }: TeacherProfileTabsProps) {
  return (
    <div className="border-b border-slate-200">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative pb-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "text-[#043658]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFC107]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
