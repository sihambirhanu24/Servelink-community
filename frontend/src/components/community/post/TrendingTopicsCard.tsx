interface Topic {
  id: string;
  category: string;
  title: string;
  postCount: string;
}

const MOCK_TOPICS: Topic[] = [
  { id: '1', category: 'STEM Education', title: 'AI-Assisted Grading Rubrics', postCount: '856 posts this week' },
  { id: '2', category: 'School Admin', title: 'Q4 Budget Allocation Strategies', postCount: '850 posts this week' },
  { id: '3', category: 'Pedagogy', title: 'Hybrid Learning Best Practices', postCount: '2.4k posts this week' },
];

export function TrendingTopicsCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">Trending Topics</h3>
      </div>
      <div className="space-y-3.5">
        {MOCK_TOPICS.map((topic) => (
          <div key={topic.id}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#FFC107]">
              {topic.category}
            </p>
            <p className="text-sm font-medium text-[#043658] leading-tight mt-0.5">{topic.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{topic.postCount}</p>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-[#043658] hover:bg-slate-50 transition-colors">
        View All Trends
      </button>
    </div>
  );
}
