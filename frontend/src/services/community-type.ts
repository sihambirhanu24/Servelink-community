import { api } from '@/lib/axios';

export async function fetchMyCommunityByType(type: string) {
  const { data } = await api.get(`/community/type/${type}`);
  return data; // { teacherLevel, community: { ...counts, communityMembers } }
}

export async function fetchPostsByType(
  type: string,
  filters: { search?: string; categoryId?: string; filter?: string; page?: number; limit?: number },
) {
  const { data } = await api.get(`/community/type/${type}/posts`, { params: filters });
  return data;
}

export async function fetchMembersByType(type: string) {
  const { data } = await api.get(`/community/type/${type}/members`);
  return data;
}

export async function fetchCategories() {
  const { data } = await api.get('/community/categories');
  return data;
}
