import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { discussionApi } from '@/services/discussion';
import {
  CreateDiscussionDto,
  UpdateDiscussionDto,
  DiscussionQueryParams,
  ReportDiscussionDto,
} from '@/types/discussion';

// Query keys
export const discussionKeys = {
  all: ['discussions'] as const,
  lists: () => [...discussionKeys.all, 'list'] as const,
  list: (params?: DiscussionQueryParams) => [...discussionKeys.lists(), params] as const,
  details: () => [...discussionKeys.all, 'detail'] as const,
  detail: (id: string) => [...discussionKeys.details(), id] as const,
};

// List discussions
export function useDiscussions(params?: DiscussionQueryParams) {
  const { token, isInitializing } = useAuth();

  return useQuery({
    queryKey: discussionKeys.list(params),
    queryFn: () => discussionApi.getDiscussions(params),
    enabled: !isInitializing && !!token,
    staleTime: 30000, // 30 seconds
    retry: 1, // Only retry once to fail fast
  });
}

// Get single discussion
export function useDiscussion(id: string) {
  const { token, isInitializing } = useAuth();

  return useQuery({
    queryKey: discussionKeys.detail(id),
    queryFn: () => discussionApi.getDiscussion(id),
    enabled: !isInitializing && !!token && !!id,
    staleTime: 60000, // 1 minute
  });
}

// Create discussion
export function useCreateDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateDiscussionDto) => discussionApi.createDiscussion(dto),
    onSuccess: (newDiscussion) => {
      // Invalidate all discussion queries to refetch
      queryClient.invalidateQueries({ queryKey: discussionKeys.all });
      
      // Invalidate progress queries for discussion points
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["activityHistory"] });
      
      // Optimistically add to cache
      queryClient.setQueryData(
        discussionKeys.detail(newDiscussion.id),
        newDiscussion
      );

      toast.success('Discussion created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create discussion');
    },
  });
}

// Update discussion
export function useUpdateDiscussion(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateDiscussionDto) => discussionApi.updateDiscussion(id, dto),
    onSuccess: (updatedDiscussion) => {
      // Update detail cache
      queryClient.setQueryData(
        discussionKeys.detail(id),
        updatedDiscussion
      );

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: discussionKeys.lists() });

      toast.success('Discussion updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update discussion');
    },
  });
}

// Delete discussion
export function useDeleteDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => discussionApi.deleteDiscussion(id),
    onSuccess: (_, id) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: discussionKeys.detail(id) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: discussionKeys.lists() });

      toast.success('Discussion deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete discussion');
    },
  });
}

// Toggle bookmark
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => discussionApi.toggleBookmark(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: discussionKeys.detail(id) });

      // Snapshot previous value
      const previousDiscussion = queryClient.getQueryData(discussionKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(discussionKeys.detail(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isBookmarked: !old.isBookmarked,
        };
      });

      return { previousDiscussion };
    },
    onError: (err, id, context: any) => {
      // Rollback on error
      queryClient.setQueryData(discussionKeys.detail(id), context.previousDiscussion);
      toast.error('Failed to update bookmark');
    },
    onSuccess: (result, id) => {
      toast.success(result.bookmarked ? 'Discussion bookmarked' : 'Bookmark removed');
      // Invalidate progress queries for bookmark points
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["activityHistory"] });
    },
    onSettled: (_, __, id) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: discussionKeys.detail(id) });
    },
  });
}

// Report discussion
export function useReportDiscussion() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ReportDiscussionDto }) =>
      discussionApi.reportDiscussion(id, dto),
    onSuccess: () => {
      toast.success('Discussion reported. Thank you for helping keep the community safe.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to report discussion');
    },
  });
}

// Mark as read
export function useMarkDiscussionRead() {
  return useMutation({
    mutationFn: (id: string) => discussionApi.markAsRead(id),
  });
}
