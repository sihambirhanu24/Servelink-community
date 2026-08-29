import api from '@/lib/axios';
import {
  Discussion,
  DiscussionDetail,
  PaginatedDiscussions,
  CreateDiscussionDto,
  UpdateDiscussionDto,
  DiscussionQueryParams,
  ReportDiscussionDto,
  CreateDiscussionResult,
} from '@/types/discussion';

export const discussionApi = {
  // List discussions
  async getDiscussions(params?: DiscussionQueryParams): Promise<PaginatedDiscussions> {
    const { data } = await api.get('/discussions', { params });
    return data;
  },

  // Get single discussion
  async getDiscussion(id: string): Promise<DiscussionDetail> {
    const { data } = await api.get(`/discussions/${id}`);
    return data;
  },

  // Create discussion
  async createDiscussion(dto: CreateDiscussionDto): Promise<CreateDiscussionResult> {
    const { data } = await api.post('/discussions', dto);
    return data;
  },

  // Update discussion
  async updateDiscussion(id: string, dto: UpdateDiscussionDto): Promise<DiscussionDetail> {
    const { data } = await api.put(`/discussions/${id}`, dto);
    return data;
  },

  // Delete discussion
  async deleteDiscussion(id: string): Promise<void> {
    await api.delete(`/discussions/${id}`);
  },

  // Toggle bookmark
  async toggleBookmark(id: string): Promise<{ bookmarked: boolean }> {
    const { data } = await api.post(`/discussions/${id}/bookmark`);
    return data;
  },

  // Report discussion
  async reportDiscussion(id: string, dto: ReportDiscussionDto): Promise<{ success: boolean }> {
    const { data } = await api.post(`/discussions/${id}/report`, dto);
    return data;
  },

  // Mark as read
  async markAsRead(id: string): Promise<void> {
    await api.post(`/discussions/${id}/mark-read`);
  },
};
