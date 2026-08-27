'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Eye, MessageCircle, Heart, Bookmark, AlertTriangle, 
  Shield, Trash2, CheckCircle2, XCircle, Ban, User, Calendar,
  MapPin, FileText, Image as ImageIcon, Download, Loader2, X
} from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { toast } from 'sonner';
import { adminApi } from '@/lib/axios';

interface PostDetail {
  id: string;
  title: string;
  description: string;
  postType: string;
  moderationStatus: string;
  createdAt: string;
  views: number;
  moderatedAt?: string;
  moderationReason?: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    level: string;
    verified: boolean;
    status: string;
    profileImage?: string;
    school?: string;
    department?: string;
    suspensionReason?: string;
    suspensionStart?: string;
    suspensionUntil?: string;
  };
  community: {
    id: string;
    name: string;
    type: string;
    school?: string;
    woreda?: string;
    zone?: string;
    region?: string;
    department?: string;
  };
  category: {
    id: string;
    name: string;
  };
  _count: {
    communityLikes: number;
    comments: number;
    communityBookmarks: number;
    communityReports: number;
  };
  attachments: Array<{
    id: string;
    url: string;
    fileName: string;
    fileSize?: number;
    type: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    teacher: {
      firstName: string;
      lastName: string;
      profileImage?: string;
    };
  }>;
  communityReports: Array<{
    id: string;
    reason: string;
    description?: string;
    status: string;
    createdAt: string;
    teacher: {
      firstName: string;
      lastName: string;
    };
  }>;
  moderationHistory: Array<{
    id: string;
    action: string;
    reason?: string;
    createdAt: string;
  }>;
}

export default function PostReviewPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'reports' | 'history'>('overview');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeReason, setRemoveReason] = useState('');

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['admin-post-detail', params.id],
    queryFn: async () => {
      const response = await adminApi.get(`/admin/posts/${params.id}`);
      return response.data as PostDetail;
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async (data: { action: 'REMOVE' | 'HIDDEN' | 'RESTORE'; reason?: string }) => {
      const response = await adminApi.patch(`/admin/posts/${params.id}/moderate`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Post moderated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-post-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      setShowRemoveModal(false);
      setRemoveReason('');
    },
    onError: () => {
      toast.error('Failed to moderate post');
    },
  });

  const handleModerate = (action: 'REMOVE' | 'HIDDEN' | 'RESTORE', reason?: string) => {
    moderateMutation.mutate({ action, reason });
  };

  const reportMutation = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: string, action: 'RESOLVE' | 'DISMISS' }) => {
      const response = await adminApi.patch(`/admin/posts/${params.id}/reports/${reportId}/resolve`, { action });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Report resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-post-detail'] });
    },
    onError: () => {
      toast.error('Failed to resolve report');
    },
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getModerationStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      REPORTED: 'bg-red-100 text-red-700',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
      REMOVED: 'bg-slate-100 text-slate-700',
      HIDDEN: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getReportReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      SPAM: 'bg-blue-100 text-blue-700',
      ABUSE: 'bg-red-100 text-red-700',
      HARASSMENT: 'bg-orange-100 text-orange-700',
      MISINFORMATION: 'bg-purple-100 text-purple-700',
      FAKE_INFORMATION: 'bg-yellow-100 text-yellow-700',
      OTHER: 'bg-slate-100 text-slate-700',
    };
    return colors[reason] || 'bg-slate-100 text-slate-700';
  };

  const getModerationActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      POST_REMOVED: 'Post Removed',
      POST_RESTORED: 'Post Restored',
      POST_HIDDEN: 'Post Hidden',
      REPORT_RESOLVED: 'Report Resolved',
      REPORT_DISMISSED: 'Report Dismissed',
      TEACHER_WARNED: 'Teacher Warned',
    };
    return labels[action] || action;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#043658] border-r-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !post) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg font-semibold text-red-600">Post not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm font-medium text-[#043658] hover:bg-[#F8FAFC]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#043658]">Post Review</h1>
            <p className="text-sm text-[#6B7C93]">Review and moderate this community post</p>
          </div>
        </div>

        {/* Post Status Banner */}
        <div className={`rounded-lg border p-4 ${getModerationStatusColor(post.moderationStatus)}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Status: {post.moderationStatus}</span>
          </div>
          {post.moderationReason && (
            <p className="mt-2 text-sm">{post.moderationReason}</p>
          )}
          {post.moderatedAt && (
            <p className="mt-1 text-xs">Moderated on {formatDate(post.moderatedAt)}</p>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Post Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Card */}
            <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
              {/* Post Type Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block rounded-full bg-[#043658]/10 px-3 py-1 text-xs font-bold text-[#043658]">
                  {post.postType}
                </span>
                <span className="text-xs text-[#6B7C93]">{formatDate(post.createdAt)}</span>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-[#043658] mb-3">{post.title}</h2>

              {/* Description */}
              <p className="text-[#043658] leading-relaxed whitespace-pre-wrap">{post.description}</p>

              {/* Attachments */}
              {post.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-semibold text-[#043658]">Attachments</h3>
                  {post.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 rounded-lg border border-[#D9E2EC] bg-[#F8FAFC] p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white border border-[#D9E2EC]">
                        {attachment.type === 'IMAGE' ? (
                          <ImageIcon className="h-5 w-5 text-blue-500" />
                        ) : attachment.type === 'PDF' ? (
                          <FileText className="h-5 w-5 text-red-500" />
                        ) : attachment.type === 'VIDEO' ? (
                          <Eye className="h-5 w-5 text-purple-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#043658] truncate">{attachment.fileName}</p>
                        <p className="text-xs text-[#6B7C93]">{formatFileSize(attachment.fileSize)} • {attachment.type}</p>
                      </div>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold text-[#043658] hover:underline whitespace-nowrap"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Engagement Stats */}
              <div className="mt-6 pt-4 border-t border-[#E8EEF3]">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-[#043658]">
                    <Eye className="h-4 w-4 text-[#6B7C93]" />
                    <span className="font-medium">{post.views} views</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#043658]">
                    <Heart className="h-4 w-4 text-[#6B7C93]" />
                    <span className="font-medium">{post._count.communityLikes} likes</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#043658]">
                    <MessageCircle className="h-4 w-4 text-[#6B7C93]" />
                    <span className="font-medium">{post._count.comments} comments</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#043658]">
                    <Bookmark className="h-4 w-4 text-[#6B7C93]" />
                    <span className="font-medium">{post._count.communityBookmarks} bookmarks</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm overflow-hidden">
              <div className="flex border-b border-[#E8EEF3]">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'comments', label: `Comments (${post._count.comments})` },
                  { id: 'reports', label: `Reports (${post._count.communityReports})` },
                  { id: 'history', label: 'History' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#043658] text-white'
                        : 'text-[#6B7C93] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#043658]">Post Overview</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#6B7C93]">Category</p>
                        <p className="font-medium text-[#043658]">{post.category.name}</p>
                      </div>
                      <div>
                        <p className="text-[#6B7C93]">Created</p>
                        <p className="font-medium text-[#043658]">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {post.comments.length === 0 ? (
                      <p className="text-sm text-[#6B7C93]">No comments yet</p>
                    ) : (
                      post.comments.map((comment) => (
                        <div key={comment.id} className="border-b border-[#E8EEF3] pb-4 last:border-0">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#043658]/10 text-xs font-bold text-[#043658]">
                              {comment.teacher.firstName[0]}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[#043658]">
                                {comment.teacher.firstName} {comment.teacher.lastName}
                              </p>
                              <p className="text-sm text-[#043658] mt-1">{comment.content}</p>
                              <p className="text-xs text-[#6B7C93] mt-1">{formatDate(comment.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div className="space-y-4">
                    {post.communityReports.length === 0 ? (
                      <p className="text-sm text-[#6B7C93]">No reports on this post</p>
                    ) : (
                      post.communityReports.map((report) => (
                        <div key={report.id} className="rounded-lg border border-[#D9E2EC] bg-[#F8FAFC] p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${getReportReasonColor(report.reason)}`}>
                                {report.reason}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {report.status}
                              </span>
                            </div>
                            <span className="text-xs text-[#6B7C93]">{formatDate(report.createdAt)}</span>
                          </div>
                          {report.description && (
                            <p className="text-sm text-[#043658] mt-2">{report.description}</p>
                          )}
                          <div className="mt-3 pt-3 border-t border-[#E8EEF3] flex items-center justify-between">
                            <p className="text-xs text-[#6B7C93]">Reported by: {report.teacher.firstName} {report.teacher.lastName}</p>
                            
                            {report.status === 'PENDING' && (
                              <div className="flex items-center gap-2">
                                <button 
                                  disabled={reportMutation.isPending}
                                  onClick={() => reportMutation.mutate({ reportId: report.id, action: 'RESOLVE' })}
                                  className="text-xs font-semibold text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50"
                                >
                                  Resolve
                                </button>
                                <button 
                                  disabled={reportMutation.isPending}
                                  onClick={() => reportMutation.mutate({ reportId: report.id, action: 'DISMISS' })}
                                  className="text-xs font-semibold text-slate-600 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-50"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4">
                    {post.moderationHistory.length === 0 ? (
                      <p className="text-sm text-[#6B7C93]">No moderation history</p>
                    ) : (
                      post.moderationHistory.map((history) => (
                        <div key={history.id} className="flex items-start gap-3 border-b border-[#E8EEF3] pb-3 last:border-0">
                          <Shield className="h-5 w-5 text-[#6B7C93] mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-[#043658]">
                              {getModerationActionLabel(history.action)}
                            </p>
                            {history.reason && (
                              <p className="text-sm text-[#043658] mt-1">{history.reason}</p>
                            )}
                            <p className="text-xs text-[#6B7C93] mt-1">{formatDate(history.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Author & Actions */}
          <div className="space-y-6">
            {/* Author Card */}
            <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-[#043658] mb-4">Author</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#043658]/10 text-lg font-bold text-[#043658]">
                  {post.teacher.firstName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#043658]">
                      {post.teacher.firstName} {post.teacher.lastName}
                    </p>
                    {post.teacher.status === 'SUSPENDED' && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <p className="text-xs text-[#6B7C93]">{post.teacher.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7C93]">Level</span>
                  <span className="font-medium text-[#043658]">{post.teacher.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7C93]">Verified</span>
                  <span className={`font-medium ${post.teacher.verified ? 'text-green-600' : 'text-amber-600'}`}>
                    {post.teacher.verified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7C93]">Status</span>
                  <span className={`font-medium ${post.teacher.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
                    {post.teacher.status}
                  </span>
                </div>
                {post.teacher.school && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7C93]">School</span>
                    <span className="font-medium text-[#043658]">{post.teacher.school}</span>
                  </div>
                )}
                {post.teacher.department && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7C93]">Department</span>
                    <span className="font-medium text-[#043658]">{post.teacher.department}</span>
                  </div>
                )}
              </div>
              {post.teacher.status === 'SUSPENDED' && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs font-semibold text-red-700">Account Suspended</p>
                  {post.teacher.suspensionReason && (
                    <p className="text-xs text-red-600 mt-1">{post.teacher.suspensionReason}</p>
                  )}
                </div>
              )}
              <button
                onClick={() => router.push(`/admin/teachers/${post.teacher.id}`)}
                className="mt-4 w-full rounded-lg border border-[#D9E2EC] bg-white px-4 py-2 text-sm font-medium text-[#043658] hover:bg-[#F8FAFC]"
              >
                View Teacher Profile
              </button>
            </div>

            {/* Community Card */}
            <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-[#043658] mb-4">Community</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[#6B7C93] mb-1">Name</p>
                  <p className="font-medium text-[#043658]">{post.community.name}</p>
                </div>
                <div>
                  <p className="text-[#6B7C93] mb-1">Type</p>
                  <p className="font-medium text-[#043658]">{post.community.type}</p>
                </div>
                {post.community.school && (
                  <div>
                    <p className="text-[#6B7C93] mb-1">School</p>
                    <p className="font-medium text-[#043658]">{post.community.school}</p>
                  </div>
                )}
                {post.community.region && (
                  <div>
                    <p className="text-[#6B7C93] mb-1">Location</p>
                    <p className="font-medium text-[#043658]">
                      {[post.community.woreda, post.community.zone, post.community.region]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Moderation Actions */}
            <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-[#043658] mb-4">Moderation Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleModerate('RESTORE')}
                  disabled={post.moderationStatus === 'ACTIVE' || moderateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Keep Post
                </button>
                <button
                  onClick={() => setShowRemoveModal(true)}
                  disabled={post.moderationStatus === 'REMOVED' || moderateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Post
                </button>
                <button
                  onClick={() => handleModerate('HIDDEN')}
                  disabled={post.moderationStatus === 'HIDDEN' || moderateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-4 py-2.5 text-sm font-semibold text-[#043658] hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-4 w-4" />
                  Hide Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-[#043658] mb-2">Remove Post</h3>
              <p className="text-sm text-[#6B7C93] mb-4">
                Are you sure you want to remove this post? This action will hide the post from the platform and resolve all related reports.
              </p>
              <div className="mb-4">
                <label className="text-sm font-semibold text-[#043658] mb-2 block">
                  Reason for removal
                </label>
                <textarea
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  placeholder="Enter the reason for removing this post..."
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm text-[#043658] outline-none focus:border-[#043658]"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveModal(false);
                    setRemoveReason('');
                  }}
                  className="flex-1 rounded-lg border border-[#D9E2EC] bg-white px-4 py-2 text-sm font-medium text-[#043658] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleModerate('REMOVE', removeReason)}
                  disabled={!removeReason.trim() || moderateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {moderateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
