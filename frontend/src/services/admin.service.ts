import { api } from "@/lib/axios";

// ============ TEACHERS ============
export const getTeachers = async (query?: any) => {
  const { data } = await api.get("/admin/teachers", { params: query });
  return data;
};

export const getTeacher = async (id: string) => {
  const { data } = await api.get(`/admin/teachers/${id}`);
  return data;
};

export const upgradeTeacher = async (id: string, dto: any) => {
  const { data } = await api.patch("/admin/teachers/upgrade-level", {
    teacherId: id,
    ...dto,
  });
  return data;
};

export const suspendTeacher = async (id: string) => {
  const { data } = await api.patch(`/admin/teachers/${id}/suspend`);
  return data;
};

export const activateTeacher = async (id: string) => {
  const { data } = await api.patch(`/admin/teachers/${id}/activate`);
  return data;
};
// ============ DASHBOARD ============
export const getDashboard = async () => {
  const { data } = await api.get("/admin/dashboard");
  return data;
};

// ============ COMMUNITIES ============
export const getCommunities = async (query?: any) => {
  const { data } = await api.get("/community", { params: query });
  return data;
};

export const getCommunity = async (id: string) => {
  const { data } = await api.get(`/community/${id}`);
  return data;
};

// ============ CATEGORIES ============
export const getCategories = async (query?: any) => {
  const { data } = await api.get("/community/categories", { params: query });
  return data;
};

export const getCategory = async (id: string) => {
  const { data } = await api.get(`/community/categories/${id}`);
  return data;
};

// ============ POSTS ============
export const getPosts = async (query?: any) => {
  const { data } = await api.get("/posts", { params: query });
  return data;
};

export const getPost = async (id: string) => {
  const { data } = await api.get(`/posts/${id}`);
  return data;
};

export const updatePost = async (id: string, body: any) => {
  const { data } = await api.patch(`/community/posts/${id}`, body);
  return data;
};

export const deletePost = async (id: string) => {
  const { data } = await api.delete(`/community/posts/${id}`);
  return data;
};

// ============ REPORTS ============
export const reportPost = async (postId: string, reason: string) => {
  const { data } = await api.post(`/engagement/posts/${postId}/report`, { reason });
  return data;
};

// ============ MEMBERSHIP REQUESTS ============
export const getMembershipRequests = async () => {
  const { data } = await api.get("/admin/memberships");
  return data;
};

export const approveMembership = async (id: string) => {
  const { data } = await api.patch(`/admin/memberships/${id}/approve`);
  return data;
};

export const rejectMembership = async (id: string) => {
  const { data } = await api.patch(`/admin/memberships/${id}/reject`);
  return data;
};
