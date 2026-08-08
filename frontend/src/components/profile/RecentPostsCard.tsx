interface RecentPost {
  id: string;
  category: string;
  title: string;
}

const MOCK_POSTS: RecentPost[] = [
  { id: '1', category: 'Article', title: 'Rethinking Classroom Layouts' },
  { id: '2', category: 'Tutorial', title: 'Intro to Calculus Concepts' },
];

export function RecentPostsCard() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">Recent Posts</h3>
        <button className="text-xs font-medium text-[#043658] hover:underline">View All</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {MOCK_POSTS.map((post) => (
          <div key={post.id} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="h-24 bg-gradient-to-br from-slate-700 to-[#043658] relative">
              <span className="absolute top-2 left-2 rounded bg-[#043658] text-white text-[9px] font-semibold uppercase px-2 py-0.5">
                {post.category}
              </span>
            </div>
            <div className="p-3 bg-white">
              <p className="text-xs font-medium text-[#043658] leading-tight">{post.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
