'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, Search, Filter, TrendingUp, Users, MessageCircle, Eye, Clock, Pin, Plus } from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useDiscussions } from '@/hooks/useDiscussions';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/common/Avatar';
import { stripHtml } from '@/lib/sanitize';

type SortOption = 'latest' | 'popular' | 'mostReplied' | 'trending';
type FilterTab = 'all' | 'my' | 'following';

export default function DiscussionsPage() {
  const router = useRouter();
  const { isInitializing, user } = useAuth();

  const [page] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useDiscussions({
    sortBy: sortBy === 'popular' ? 'mostActive' : sortBy === 'mostReplied' ? 'mostDiscussed' : 'latest',
    page,
    limit: 50,
  });

  const handleDiscussionClick = (discussionId: string) => {
    router.push(`/community/network/discussions/${discussionId}`);
  };

  const filteredDiscussions = data?.data.filter(d => {
    if (searchQuery) {
      return d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             d.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  }) || [];

  if (isInitializing || isLoading) {
    return (
      <div className="flex h-screen bg-[#F5F8FB] overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 min-w-0 overflow-y-auto">
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#043658]" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F8FB] overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="w-full max-w-[1280px] mx-auto px-6 py-6" style={{ width: 'calc(100% - 48px)' }}>
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] gap-4 lg:gap-6" style={{ width: '100%', minWidth: 0 }}>
              {/* Main Content Column */}
              <div className="min-w-0 space-y-4 lg:order-1" style={{ minWidth: 0 }}>
              {/* Tabs & Controls */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ minWidth: 0, height: '56px' }}>
                  <div className="flex items-center gap-2 overflow-x-auto" style={{ minWidth: 0 }}>
                    {(['all', 'my', 'following'] as FilterTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setFilterTab(tab)}
                        className={`px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                          filterTab === tab
                            ? 'bg-[#043658] text-white shadow-sm'
                            : 'text-[#043658] hover:bg-slate-100'
                        }`}
                      >
                        {tab === 'all' ? 'All Discussions' : tab === 'my' ? 'My Discussions' : 'Following'}
                      </button>
                    ))}
                    <div className="w-px h-6 bg-slate-200 flex-shrink-0 mx-1" />
                    <button className="px-4 py-2 text-xs font-medium text-[#043658] hover:bg-slate-100 rounded-lg whitespace-nowrap flex-shrink-0">
                      Popular
                    </button>
                    <button className="px-4 py-2 text-xs font-medium text-[#043658] hover:bg-slate-100 rounded-lg whitespace-nowrap flex-shrink-0">
                      Recent
                    </button>
                  </div>

                  {/* Search */}
                  <div className="flex items-center flex-shrink-0 ml-auto">
                    <div className="relative" style={{ minWidth: '180px', maxWidth: '220px', width: '200px' }}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search discussions..."
                        className="pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent w-full bg-slate-50"
                        style={{ boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Discussion List */}
                <div className="divide-y divide-slate-100" style={{ minWidth: 0 }}>
                  {error && (
                    <div className="p-4 flex items-start gap-3 bg-red-50">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Failed to load discussions</p>
                        <p className="text-xs text-red-700 mt-1">
                          {(error as any)?.response?.data?.message || 'Please try again later.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {filteredDiscussions.length > 0 ? (
                    filteredDiscussions.map((discussion) => {
                      const authorName = `${discussion.author.firstName} ${discussion.author.lastName}`;
                      const timeAgo = formatDistanceToNow(new Date(discussion.lastActiveAt), { addSuffix: true });
                      
                      return (
                        <div
                          key={discussion.id}
                          onClick={() => handleDiscussionClick(discussion.id)}
                          className="p-4 hover:bg-slate-50 cursor-pointer transition-all group"
                          style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}
                        >
                          <div className="flex gap-3" style={{ minWidth: 0 }}>
                            {/* Avatar */}
                            <Avatar
                              profileImage={discussion.author.profileImage}
                              name={authorName}
                              size="sm"
                              className="flex-shrink-0"
                            />
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0" style={{ minWidth: 0 }}>
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2 mb-1.5" style={{ minWidth: 0 }}>
                                <div className="flex-1 min-w-0" style={{ minWidth: 0 }}>
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <span className="text-xs font-bold text-[#043658] break-words" style={{ overflowWrap: 'anywhere' }}>{authorName}</span>
                                    <span className="text-xs text-slate-400">•</span>
                                    <span className="text-xs text-slate-500">{timeAgo}</span>
                                    {discussion.isPinned && (
                                      <Pin className="w-3 h-3 text-[#FFC107] flex-shrink-0" />
                                    )}
                                  </div>
                                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#043658] transition-colors line-clamp-1 break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                    {discussion.title}
                                  </h3>
                                </div>
                              </div>
                              
                              <p className="text-xs text-slate-600 line-clamp-2 mb-2 break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                {stripHtml(discussion.description)}
                              </p>
                              
                              {/* Footer Metadata */}
                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap" style={{ minWidth: 0 }}>
                                {discussion.category && (
                                  <span className="px-2 py-0.5 bg-slate-100 text-[#043658] font-medium rounded text-[10px] whitespace-nowrap">
                                    {discussion.category.name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <MessageCircle className="w-3 h-3 flex-shrink-0" />
                                  {discussion.replyCount}
                                </span>
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <Eye className="w-3 h-3 flex-shrink-0" />
                                  {discussion.views}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : !isLoading && !error ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#043658]/10 to-[#FFC107]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageCircle className="w-6 h-6 text-[#043658]" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">
                        No discussions yet
                      </h3>
                      <p className="text-xs text-slate-600 max-w-sm mx-auto">
                        Be the first to start a discussion
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="hidden md:block lg:order-2 min-w-0 space-y-5" style={{ minWidth: 0, width: '100%', maxWidth: '100%' }}>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-5" style={{ width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
            {/* Active Users */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-[#043658] flex-shrink-0" />
                <h3 className="text-sm font-bold text-slate-900">Active Now</h3>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-[#043658] to-[#0a5c91] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 text-[10px] font-bold flex-shrink-0">
                  +12
                </div>
              </div>
            </div>

            {/* Trending */}
            <div style={{ minWidth: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#FFC107] flex-shrink-0" />
                <h3 className="text-sm font-bold text-slate-900">Trending</h3>
              </div>
              <div className="space-y-2.5" style={{ minWidth: 0 }}>
                {[
                  { title: 'New curriculum roll-out challenges in rural districts', replies: 34 },
                  { title: 'Best AI tools for grading essays?', replies: 89 },
                  { title: 'Parent-Teacher conference scheduling templates', replies: 24 },
                ].map((item, i) => (
                  <div key={i} className="text-xs min-w-0" style={{ minWidth: 0 }}>
                    <p className="text-[#043658] font-medium hover:underline cursor-pointer line-clamp-2 leading-tight break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.replies} replies</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Topics */}
            <div style={{ minWidth: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm flex-shrink-0">#</span>
                <h3 className="text-sm font-bold text-slate-900">Popular Topics</h3>
              </div>
              <div className="flex flex-wrap gap-1.5" style={{ minWidth: 0 }}>
                {['Mathematics', 'Science', 'Administration', 'Special Ed', 'Technology', 'Lesson Plans'].map((topic) => (
                  <button
                    key={topic}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-full hover:bg-[#043658] hover:text-white transition-all whitespace-nowrap flex-shrink-0"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* My Activity */}
            <div style={{ minWidth: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-[#043658] flex-shrink-0" />
                <h3 className="text-sm font-bold text-slate-900">My Activity</h3>
              </div>
              <div className="space-y-1.5 text-xs" style={{ minWidth: 0 }}>
                <p className="text-slate-600 hover:text-[#043658] cursor-pointer break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>Started Discussions</p>
                <p className="text-slate-600 hover:text-[#043658] cursor-pointer break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>Joined Discussions</p>
                <p className="text-slate-600 hover:text-[#043658] cursor-pointer break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>Saved Drafts</p>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
