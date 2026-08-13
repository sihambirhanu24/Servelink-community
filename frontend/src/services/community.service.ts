import api from "@/lib/axios";

export const CommunityService = {


  getPosts: () =>
    api.get("/community/posts"),

  getPost: (id: string) =>
    api.get(`/community/posts/${id}`),

  createPost: (body: {
    title: string;
    description: string;
    communityId: string;
    categoryId: string;
  }) =>
    api.post("/community/posts", body),

  updatePost: (
    id: string,
    body: {
      title?: string;
      description?: string;
      categoryId?: string;
      communityId?: string;
    }
  ) =>
    api.patch(`/community/posts/${id}`, body),

  deletePost: (id: string) =>
    api.delete(`/community/posts/${id}`),



  likePost: (id: string) =>
    api.post(`/community/posts/${id}/like`),

  unlikePost: (id: string) =>
    api.delete(`/community/posts/${id}/like`),



  createComment: (
    postId: string,
    content: string,
  ) =>
    api.post(
      `/community/posts/${postId}/comments`,
      {
        content,
      }
    ),

  deleteComment: (
    commentId: string,
  ) =>
    api.delete(
      `/community/comments/${commentId}`
    ),



  bookmarkPost: (id: string) =>
    api.post(
      `/community/posts/${id}/bookmark`
    ),

  removeBookmark: (id: string) =>
    api.delete(
      `/community/posts/${id}/bookmark`
    ),

  getBookmarks: () =>
    api.get("/community/bookmarks"),



  reportPost: (
    postId: string,
    reason: string,
  ) =>
    api.post(
      `/community/posts/${postId}/report`,
      {
        reason,
      }
    ),


  uploadAttachment: (
    postId: string,
    file: File,
  ) => {
    const formData = new FormData();

    formData.append("file", file);

    return api.post(
      `/community/posts/${postId}/attachment`,
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );
  },

  deleteAttachment: (attachmentId: string) =>
    api.delete(`/community/attachments/${attachmentId}`),


  getMyPosts: () =>
    api.get("/community/my-posts"),



  getCommunities: () =>
    api.get("/community"),

  getCommunity: (id: string) =>
    api.get(`/community/${id}`),



  joinCommunity: (
    communityId: string,
  ) =>
    api.post("/membership/join", {
      communityId,
    }),

  leaveCommunity: (
    communityId: string,
  ) =>
    api.delete(
      `/membership/${communityId}/leave`
    ),

  getMembers: (
    communityId: string,
  ) =>
    api.get(
      `/membership/${communityId}/members`
    ),



  getCategories: () =>
    api.get("/community/categories"),
};

export const getPosts = async () => {
  const { data } = await CommunityService.getPosts();
  return data;
};

export const getPost = async (id: string) => {
  const { data } = await CommunityService.getPost(id);
  return data;
};

export const createPost = async (body: {
  title: string;
  description: string;
  communityId: string;
  categoryId: string;
}) => {
  const { data } = await CommunityService.createPost(body);
  return data;
};

export const updatePost = async (
  id: string,
  body: {
    title?: string;
    description?: string;
    categoryId?: string;
    communityId?: string;
  }
) => {
  const { data } = await CommunityService.updatePost(id, body);
  return data;
};

export const deletePost = async (id: string) => {
  const { data } = await CommunityService.deletePost(id);
  return data;
};

export const likePost = async (id: string) => {
  const { data } = await CommunityService.likePost(id);
  return data;
};

export const unlikePost = async (id: string) => {
  const { data } = await CommunityService.unlikePost(id);
  return data;
};

export const createComment = async (postId: string, content: string) => {
  const { data } = await CommunityService.createComment(postId, content);
  return data;
};

export const deleteComment = async (commentId: string) => {
  const { data } = await CommunityService.deleteComment(commentId);
  return data;
};

export const bookmarkPost = async (id: string) => {
  const { data } = await CommunityService.bookmarkPost(id);
  return data;
};

export const removeBookmark = async (id: string) => {
  const { data } = await CommunityService.removeBookmark(id);
  return data;
};

export const getBookmarks = async () => {
  const { data } = await CommunityService.getBookmarks();
  return data;
};

export const reportPost = async (postId: string, reason: string) => {
  const { data } = await CommunityService.reportPost(postId, reason);
  return data;
};

export const getMyPosts = async () => {
  const { data } = await CommunityService.getMyPosts();
  return data;
};

export const getCommunities = async () => {
  const { data } = await api.get("/community");

  return Array.isArray(data)
    ? data
    : data.communities ?? [];
};

export const getCommunity = async (id: string) => {
  const { data } = await CommunityService.getCommunity(id);
  return data;
};

export const joinCommunity = async (communityId: string) => {
  const { data } = await CommunityService.joinCommunity(communityId);
  return data;
};

export const leaveCommunity = async (communityId: string) => {
  const { data } = await CommunityService.leaveCommunity(communityId);
  return data;
};

export const getMembers = async (communityId: string) => {
  const { data } = await CommunityService.getMembers(communityId);
  return data;
};

export const getCategories = async () => {
  const { data } = await CommunityService.getCategories();
  return data;
};
export const uploadAttachment = async (
  postId: string,
  file: File,
) => {
  const { data } =
    await CommunityService.uploadAttachment(
      postId,
      file,
    );

  return data;
};

export const deleteAttachment = async (attachmentId: string) => {
  const { data } = await CommunityService.deleteAttachment(attachmentId);
  return data;
};
