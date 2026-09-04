'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Bookmark,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Flag,
  Heart,
  Loader2,
  MessageCircle,
  Paperclip,
  RotateCcw,
  RotateCw,
  Search,
  ShieldAlert,
  Trash2,
  User,
  X,
} from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { PostActionMenu, type PostMenuItem } from '@/components/admin/posts/PostActionMenu';
import { ModerationDialog, type ModerationDialogTarget } from '@/components/admin/posts/ModerationDialog';
import { PostReportsModal } from '@/components/admin/posts/PostReportsModal';
import {
  ACTION_LABELS,
  allowedActions,
  apiErrorMessage,
  formatAdminDate,
  fullName,
  initials,
  REPORT_FILTER_LABELS,
  SORT_LABELS,
  STATUS_BADGE,
  STATUS_LABELS,
  teacherLevelLabel,
  TYPE_BADGE,
  TYPE_LABELS,
} from '@/components/admin/posts/moderation-ui';
import {
  MODERATION_STATUSES,
  POST_SORTS,
  POST_TYPES,
  REPORT_FILTERS,
  useAdminPostStats,
  useAdminPostsList,
  useBulkModeratePosts,
  useCommunityOptions,
  useModeratePost,
  type AdminPostRow,
  type AdminPostsQuery,
  type ModerationAction,
  type ModerationStatus,
  type PostSort,
  type PostType,
  type ReportFilter,
} from '@/services/admin-posts';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

interface Filters {
  search: string;
  postType: PostType | '';
  communityId: string;
  moderationStatus: ModerationStatus | '';
  reportStatus: ReportFilter | '';
  dateFrom: string;
  dateTo: string;
  sortBy: PostSort;
}

const EMPTY_FILTERS: Filters = {
  search: '',
  postType: '',
  communityId: '',
  moderationStatus: '',
  reportStatus: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'newest',
};

const isOneOf = <T extends string>(values: readonly T[], value: string | null): value is T =>
  value !== null && (values as readonly string[]).includes(value);

export default function AdminPostsPage() {
  return (
    <AdminLayout>
      <Suspense fallback={<PageSkeleton />}>
        <PostsModerationCenter />
      </Suspense>
    </AdminLayout>
  );
}

function PostsModerationCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => ({
    ...EMPTY_FILTERS,
    // Deep links: /admin/posts?reportStatus=UNRESOLVED, ?communityId=…, ?moderationStatus=…
    reportStatus: isOneOf(REPORT_FILTERS, searchParams.get('reportStatus')) ? searchParams.get('reportStatus') as ReportFilter : '',
    moderationStatus: isOneOf(MODERATION_STATUSES, searchParams.get('moderationStatus')) ? searchParams.get('moderationStatus') as ModerationStatus : '',
    communityId: searchParams.get('communityId') ?? '',
  }));
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogTarget, setDialogTarget] = useState<ModerationDialogTarget | null>(null);
  const [reportsFor, setReportsFor] = useState<AdminPostRow | null>(null);

  // Debounce the search box into the server query.
  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((current) => (current.search === searchInput ? current : { ...current, search: searchInput }));
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const query = useMemo<AdminPostsQuery>(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: filters.sortBy,
      search: filters.search || undefined,
      postType: filters.postType || undefined,
      communityId: filters.communityId || undefined,
      moderationStatus: filters.moderationStatus || undefined,
      reportStatus: filters.reportStatus || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }),
    [filters, page],
  );

  const stats = useAdminPostStats();
  const posts = useAdminPostsList(query);
  const communities = useCommunityOptions();
  const moderate = useModeratePost();
  const bulkModerate = useBulkModeratePosts();

  const rows = posts.data?.data ?? [];
  const meta = posts.data?.meta;
  const filtersActive = Object.entries(filters).some(
    ([key, value]) => key !== 'sortBy' && value !== '',
  );

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
    setSelected(new Set());
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchInput('');
    setPage(1);
    setSelected(new Set());
    router.replace('/admin/posts');
  };

  const goToPage = (next: number) => {
    setPage(next);
    setSelected(new Set());
  };

  const reviewReports = () => {
    setFilters({ ...EMPTY_FILTERS, reportStatus: 'UNRESOLVED', sortBy: 'most_reported' });
    setSearchInput('');
    setPage(1);
    setSelected(new Set());
  };

  // ── Selection ────────────────────────────────────────────────────────────
  const pageIds = rows.map((r) => r.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPageSelected = pageIds.some((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedRows = rows.filter((r) => selected.has(r.id));
  const bulkEligible = (action: ModerationAction) =>
    selectedRows.filter((r) => allowedActions(r.moderationStatus).includes(action)).map((r) => r.id);

  // ── Mutations ────────────────────────────────────────────────────────────
  const openDialog = (action: ModerationAction, post: AdminPostRow) =>
    setDialogTarget({ action, postIds: [post.id], postTitle: post.title });

  const openBulkDialog = (action: ModerationAction) => {
    const ids = bulkEligible(action);
    if (ids.length === 0) {
      toast.info(`None of the selected posts can be ${ACTION_LABELS[action].toLowerCase()}d in their current state.`);
      return;
    }
    setDialogTarget({ action, postIds: ids });
  };

  const closeDialog = useCallback(() => setDialogTarget(null), []);

  const confirmDialog = (reason?: string) => {
    if (!dialogTarget) return;
    const { action, postIds } = dialogTarget;
    const past = { HIDDEN: 'hidden', REMOVE: 'deleted', RESTORE: 'restored' }[action];

    if (postIds.length === 1) {
      moderate.mutate(
        { postId: postIds[0], action, reason },
        {
          onSuccess: () => {
            toast.success(`Post ${past}`);
            setDialogTarget(null);
            setSelected((current) => {
              const next = new Set(current);
              next.delete(postIds[0]);
              return next;
            });
            if (reportsFor?.id === postIds[0] && action !== 'RESTORE') setReportsFor(null);
          },
          onError: (error) => toast.error(apiErrorMessage(error, `Failed to ${ACTION_LABELS[action].toLowerCase()} post`)),
        },
      );
      return;
    }

    bulkModerate.mutate(
      { ids: postIds, action, reason },
      {
        onSuccess: (result) => {
          const skipped = result.skipped.length;
          toast.success(
            `${result.updated.length} post${result.updated.length === 1 ? '' : 's'} ${past}` +
              (skipped ? ` · ${skipped} skipped` : ''),
          );
          setDialogTarget(null);
          setSelected(new Set());
        },
        onError: (error) => toast.error(apiErrorMessage(error, 'Bulk action failed')),
      },
    );
  };

  const isMutating = moderate.isPending || bulkModerate.isPending;

  const menuItemsFor = (post: AdminPostRow): PostMenuItem[] => {
    const actions = allowedActions(post.moderationStatus);
    const items: PostMenuItem[] = [
      { key: 'view', label: 'View Post', icon: Eye, onSelect: () => router.push(`/admin/posts/${post.id}`) },
      {
        key: 'author',
        label: 'View Author',
        icon: User,
        onSelect: () => router.push(`/admin/teachers?search=${encodeURIComponent(post.teacher.email)}`),
      },
      {
        key: 'community',
        label: 'View Community',
        icon: Building2,
        onSelect: () => router.push(`/admin/communities/${post.community.id}`),
      },
    ];
    if (post._count.communityReports > 0) {
      items.push({ key: 'reports', label: 'View Reports', icon: Flag, onSelect: () => setReportsFor(post) });
    }
    if (actions.includes('HIDDEN')) {
      items.push({ key: 'hide', label: 'Hide Post', icon: EyeOff, onSelect: () => openDialog('HIDDEN', post) });
    }
    if (actions.includes('RESTORE')) {
      items.push({ key: 'restore', label: 'Restore Post', icon: RotateCcw, onSelect: () => openDialog('RESTORE', post) });
    }
    if (actions.includes('REMOVE')) {
      items.push({ key: 'delete', label: 'Delete Post', icon: Trash2, destructive: true, onSelect: () => openDialog('REMOVE', post) });
    }
    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#043658]">Posts Management</h1>
        <p className="mt-1 text-sm text-[#6B7C93]">
          Review, moderate, and manage community content across ServeLink.
        </p>
      </div>

      {/* Statistics */}
      <StatsSection
        stats={stats.data}
        isLoading={stats.isLoading}
        isError={stats.isError}
        onRetry={() => stats.refetch()}
        onSelectStatus={(status) => updateFilter('moderationStatus', status)}
        onSelectType={(type) => updateFilter('postType', type)}
        onSelectReported={reviewReports}
      />

      {/* Reported content alert */}
      {stats.data && stats.data.postsWithPendingReports > 0 && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">
              {stats.data.postsWithPendingReports} post{stats.data.postsWithPendingReports === 1 ? '' : 's'} require
              {stats.data.postsWithPendingReports === 1 ? 's' : ''} moderation.
            </p>
            <p className="text-xs text-red-700">
              {stats.data.pendingReports} unresolved report{stats.data.pendingReports === 1 ? '' : 's'} submitted by
              teachers are waiting for review.
            </p>
          </div>
          <button
            type="button"
            onClick={reviewReports}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Flag className="h-4 w-4" />
            Review Reports
          </button>
        </div>
      )}

      {/* Search & filters */}
      <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 focus-within:border-[#043658] focus-within:ring-2 focus-within:ring-[#043658]/15">
            <Search className="h-4 w-4 shrink-0 text-[#6B7C93]" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search title, content, author name or email, community…"
              aria-label="Search posts"
              className="flex-1 bg-transparent text-sm text-[#043658] outline-none placeholder:text-[#6B7C93]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
                className="text-[#6B7C93] hover:text-[#043658]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <label className="flex items-center gap-2 text-sm text-[#6B7C93]">
            <span className="whitespace-nowrap font-semibold">Sort</span>
            <select
              value={filters.sortBy}
              onChange={(event) => updateFilter('sortBy', event.target.value as PostSort)}
              className="rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40 focus:border-[#043658]"
            >
              {POST_SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {SORT_LABELS[sort]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <FilterSelect
            label="Post Type"
            value={filters.postType}
            onChange={(value) => updateFilter('postType', value as PostType | '')}
            placeholder="All types"
            options={POST_TYPES.map((type) => ({ value: type, label: TYPE_LABELS[type] }))}
          />
          <FilterSelect
            label="Community"
            value={filters.communityId}
            onChange={(value) => updateFilter('communityId', value)}
            placeholder={communities.isLoading ? 'Loading…' : 'All communities'}
            disabled={communities.isLoading}
            options={(communities.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <FilterSelect
            label="Status"
            value={filters.moderationStatus}
            onChange={(value) => updateFilter('moderationStatus', value as ModerationStatus | '')}
            placeholder="All statuses"
            options={MODERATION_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }))}
          />
          <FilterSelect
            label="Report Status"
            value={filters.reportStatus}
            onChange={(value) => updateFilter('reportStatus', value as ReportFilter | '')}
            placeholder="Any"
            options={REPORT_FILTERS.map((filter) => ({ value: filter, label: REPORT_FILTER_LABELS[filter] }))}
          />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">From</span>
            <input
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(event) => updateFilter('dateFrom', event.target.value)}
              className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40 focus:border-[#043658]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">To</span>
            <input
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(event) => updateFilter('dateTo', event.target.value)}
              className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40 focus:border-[#043658]"
            />
          </label>
        </div>

        {filtersActive && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E8EEF3] pt-3">
            <p className="text-xs text-[#6B7C93]">
              {meta ? `${meta.total} post${meta.total === 1 ? '' : 's'} match the current filters.` : 'Filters applied.'}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9E2EC] px-3 py-1.5 text-xs font-semibold text-[#043658] transition-colors hover:bg-[#F8FAFC]"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#E8EEF3] bg-[#F8FAFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {selected.size > 0 ? (
            <>
              <p className="text-sm font-semibold text-[#043658]">
                {selected.size} post{selected.size === 1 ? '' : 's'} selected
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openBulkDialog('HIDDEN')}
                  disabled={isMutating}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  Hide Selected
                </button>
                <button
                  type="button"
                  onClick={() => openBulkDialog('RESTORE')}
                  disabled={isMutating}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9E2EC] bg-white px-3 py-1.5 text-xs font-semibold text-[#043658] transition-colors hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore Selected
                </button>
                <button
                  type="button"
                  onClick={() => openBulkDialog('REMOVE')}
                  disabled={isMutating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Selected
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="rounded-lg px-2 py-1.5 text-xs font-semibold text-[#6B7C93] hover:text-[#043658]"
                >
                  Clear
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-[#043658]">
                Posts
                {meta && <span className="ml-2 font-normal text-[#6B7C93]">{meta.total.toLocaleString()} total</span>}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#6B7C93]">
                {posts.isFetching && !posts.isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {meta && meta.total > 0 && (
                  <span>
                    Showing {(meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.total)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-[#E8EEF3] bg-[#F8FAFC]">
                <th scope="col" className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all posts on this page"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                    }}
                    onChange={toggleAll}
                    disabled={rows.length === 0}
                    className="h-4 w-4 rounded border-[#D9E2EC] text-[#043658] accent-[#043658]"
                  />
                </th>
                {['Post', 'Author', 'Community', 'Type', 'Engagement', 'Reports', 'Status', 'Created'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]"
                  >
                    {heading}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.isLoading ? (
                <TableSkeleton />
              ) : posts.isError ? (
                <TableMessage
                  icon={<AlertTriangle className="h-8 w-8 text-red-500" />}
                  title="Unable to load posts."
                  description={apiErrorMessage(posts.error, 'The server did not return the post list.')}
                  action={
                    <button
                      type="button"
                      onClick={() => posts.refetch()}
                      className="rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white hover:bg-[#05456F]"
                    >
                      Retry
                    </button>
                  }
                />
              ) : rows.length === 0 ? (
                <TableMessage
                  icon={<Search className="h-8 w-8 text-[#6B7C93]" />}
                  title={filtersActive ? 'No posts match your filters.' : 'No posts found.'}
                  description={
                    filtersActive
                      ? 'Try widening the date range or clearing a filter.'
                      : 'Posts created by teachers will appear here.'
                  }
                  action={
                    filtersActive ? (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="rounded-lg border border-[#D9E2EC] px-4 py-2 text-sm font-semibold text-[#043658] hover:bg-[#F8FAFC]"
                      >
                        Reset Filters
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                rows.map((post) => (
                  <PostRow
                    key={post.id}
                    post={post}
                    selected={selected.has(post.id)}
                    onToggle={() => toggleOne(post.id)}
                    onOpenReports={() => setReportsFor(post)}
                    menuItems={menuItemsFor(post)}
                    disabled={isMutating}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={goToPage} />
        )}
      </div>

      <ModerationDialog
        target={dialogTarget}
        isPending={isMutating}
        onCancel={closeDialog}
        onConfirm={confirmDialog}
      />

      <PostReportsModal
        post={reportsFor}
        onClose={() => setReportsFor(null)}
        onHidePost={(post) => openDialog('HIDDEN', post)}
      />
    </div>
  );
}

// ─── Statistics ──────────────────────────────────────────────────────────────

interface StatsSectionProps {
  stats: ReturnType<typeof useAdminPostStats>['data'];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectStatus: (status: ModerationStatus) => void;
  onSelectType: (type: PostType) => void;
  onSelectReported: () => void;
}

function StatsSection({ stats, isLoading, isError, onRetry, onSelectStatus, onSelectType, onSelectReported }: StatsSectionProps) {
  if (isError) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[#D9E2EC] bg-white px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-[#043658]">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Unable to load statistics.
        </span>
        <button type="button" onClick={onRetry} className="font-semibold text-[#043658] underline-offset-2 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  const primary: { label: string; value?: number; hint: string; onClick?: () => void; accent?: string }[] = [
    { label: 'Total Posts', value: stats?.total, hint: 'All posts in the database' },
    { label: 'Published', value: stats?.published, hint: 'Visible to teachers', onClick: () => onSelectStatus('ACTIVE'), accent: 'text-green-700' },
    { label: 'Pending Review', value: stats?.pendingReview, hint: 'Reported or under review', onClick: () => onSelectStatus('REPORTED'), accent: 'text-yellow-700' },
    { label: 'Reported', value: stats?.postsWithPendingReports, hint: 'With unresolved reports', onClick: onSelectReported, accent: 'text-red-700' },
    { label: 'Hidden', value: stats?.hidden, hint: 'Hidden by an admin', onClick: () => onSelectStatus('HIDDEN'), accent: 'text-purple-700' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {primary.map((card) => (
          <StatCard key={card.label} {...card} isLoading={isLoading} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {POST_TYPES.map((type) => (
          <StatCard
            key={type}
            label={`${TYPE_LABELS[type]}s`}
            value={stats?.byType[type]}
            hint={`Posts of type ${TYPE_LABELS[type].toLowerCase()}`}
            onClick={() => onSelectType(type)}
            isLoading={isLoading}
            compact
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  onClick,
  accent,
  isLoading,
  compact,
}: {
  label: string;
  value?: number;
  hint: string;
  onClick?: () => void;
  accent?: string;
  isLoading: boolean;
  compact?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={onClick ? `Filter by ${label.toLowerCase()}` : undefined}
      className={`rounded-lg border border-[#D9E2EC] bg-white text-left ${compact ? 'px-4 py-3' : 'p-4'} ${
        onClick ? 'transition-colors hover:border-[#043658]/40 hover:bg-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043658]/30' : ''
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">{label}</div>
      {isLoading ? (
        <div className={`mt-2 animate-pulse rounded bg-[#E8EEF3] ${compact ? 'h-6 w-12' : 'h-8 w-16'}`} />
      ) : (
        <p className={`${compact ? 'text-xl' : 'text-2xl'} font-bold ${accent ?? 'text-[#043658]'}`}>
          {value?.toLocaleString() ?? '—'}
        </p>
      )}
      {!compact && <p className="mt-0.5 text-xs text-[#6B7C93]">{hint}</p>}
    </Tag>
  );
}

// ─── Table pieces ────────────────────────────────────────────────────────────

function PostRow({
  post,
  selected,
  onToggle,
  onOpenReports,
  menuItems,
  disabled,
}: {
  post: AdminPostRow;
  selected: boolean;
  onToggle: () => void;
  onOpenReports: () => void;
  menuItems: PostMenuItem[];
  disabled: boolean;
}) {
  const level = teacherLevelLabel(post.teacher.level);
  return (
    <tr className={`border-b border-[#E8EEF3] transition-colors hover:bg-[#F8FAFC] ${selected ? 'bg-[#FFF8E1]/60' : ''}`}>
      <td className="px-4 py-3 align-top">
        <input
          type="checkbox"
          aria-label={`Select post ${post.title}`}
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 rounded border-[#D9E2EC] accent-[#043658]"
        />
      </td>
      <td className="max-w-[320px] px-4 py-3 align-top">
        <Link
          href={`/admin/posts/${post.id}`}
          className="line-clamp-1 font-semibold text-[#043658] hover:underline"
          title={post.title}
        >
          {post.title || 'Untitled post'}
        </Link>
        <p className="mt-0.5 line-clamp-2 text-xs text-[#6B7C93]" title={post.preview}>
          {post.preview || 'No content'}
        </p>
        {post._count.attachments > 0 && (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#6B7C93]">
            <Paperclip className="h-3 w-3" />
            {post._count.attachments} attachment{post._count.attachments === 1 ? '' : 's'}
          </span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <Link
          href={`/admin/teachers?search=${encodeURIComponent(post.teacher.email)}`}
          className="group flex items-center gap-2.5"
        >
          {post.teacher.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.teacher.profileImage} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#043658] text-[11px] font-bold text-white">
              {initials(post.teacher)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-[#043658] group-hover:underline">
              {fullName(post.teacher)}
            </span>
            <span className="block truncate text-xs text-[#6B7C93]">
              {level ?? post.teacher.email}
              {post.teacher.status !== 'ACTIVE' && (
                <span className="ml-1 rounded bg-red-100 px-1 py-0.5 text-[10px] font-bold text-red-700">
                  {post.teacher.status.replace('_', ' ')}
                </span>
              )}
            </span>
          </span>
        </Link>
      </td>
      <td className="px-4 py-3 align-top">
        <Link href={`/admin/communities/${post.community.id}`} className="text-sm font-medium text-[#043658] hover:underline">
          {post.community.name}
        </Link>
        <p className="text-xs text-[#6B7C93]">{post.community.type.charAt(0) + post.community.type.slice(1).toLowerCase()}</p>
      </td>
      <td className="px-4 py-3 align-top">
        <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${TYPE_BADGE[post.postType]}`}>
          {TYPE_LABELS[post.postType]}
        </span>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-3 text-xs text-[#6B7C93]">
          <span className="inline-flex items-center gap-1" title="Reactions">
            <Heart className="h-3.5 w-3.5" />
            {post._count.communityLikes}
          </span>
          <span className="inline-flex items-center gap-1" title="Comments">
            <MessageCircle className="h-3.5 w-3.5" />
            {post._count.comments}
          </span>
          <span className="inline-flex items-center gap-1" title="Bookmarks">
            <Bookmark className="h-3.5 w-3.5" />
            {post._count.communityBookmarks}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        {post._count.communityReports === 0 ? (
          <span className="text-xs text-[#6B7C93]">—</span>
        ) : (
          <button
            type="button"
            onClick={onOpenReports}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors ${
              post.pendingReports > 0
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={`${post.pendingReports} unresolved of ${post._count.communityReports} total`}
          >
            <Flag className="h-3 w-3" />
            {post.pendingReports}
            <span className="font-normal opacity-70">/ {post._count.communityReports}</span>
          </button>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_BADGE[post.moderationStatus]}`}>
          {STATUS_LABELS[post.moderationStatus]}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-[#6B7C93]">{formatAdminDate(post.createdAt)}</td>
      <td className="px-4 py-3 text-right align-top">
        <PostActionMenu items={menuItems} disabled={disabled} label={`Actions for ${post.title}`} />
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-[#E8EEF3]" aria-hidden="true">
          <td className="px-4 py-4">
            <div className="h-4 w-4 animate-pulse rounded bg-[#E8EEF3]" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-56 animate-pulse rounded bg-[#E8EEF3]" />
            <div className="mt-2 h-3 w-72 animate-pulse rounded bg-[#F1F5F9]" />
          </td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-[#E8EEF3]" />
              <div className="h-4 w-24 animate-pulse rounded bg-[#E8EEF3]" />
            </div>
          </td>
          {Array.from({ length: 6 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-4 w-16 animate-pulse rounded bg-[#E8EEF3]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function TableMessage({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={10} className="px-6 py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          {icon}
          <p className="text-sm font-semibold text-[#043658]">{title}</p>
          {description && <p className="max-w-md text-xs text-[#6B7C93]">{description}</p>}
          {action}
        </div>
      </td>
    </tr>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  const pages = useMemo(() => {
    const set = new Set<number>([1, totalPages, page - 1, page, page + 1]);
    return [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  }, [page, totalPages]);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-[#E8EEF3] bg-[#F8FAFC] px-4 py-3 sm:px-6">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg border border-[#D9E2EC] bg-white px-3 py-1.5 text-sm font-medium text-[#043658] transition-colors hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <ul className="flex items-center gap-1">
        {pages.map((p, index) => {
          const gap = index > 0 && p - pages[index - 1] > 1;
          return (
            <li key={p} className="flex items-center gap-1">
              {gap && <span className="px-1 text-xs text-[#6B7C93]">…</span>}
              <button
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`min-w-[2.25rem] rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  p === page ? 'bg-[#043658] text-white' : 'text-[#043658] hover:bg-[#F1F5F9]'
                }`}
              >
                {p}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg border border-[#D9E2EC] bg-white px-3 py-1.5 text-sm font-medium text-[#043658] transition-colors hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40 focus:border-[#043658] disabled:bg-slate-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div>
        <div className="h-9 w-64 animate-pulse rounded bg-[#E8EEF3]" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-[#F1F5F9]" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border border-[#D9E2EC] bg-white" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-xl border border-[#D9E2EC] bg-white" />
      <div className="h-96 animate-pulse rounded-xl border border-[#D9E2EC] bg-white" />
    </div>
  );
}