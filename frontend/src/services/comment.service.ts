import api from "@/lib/axios";

export const getPostComments = async (postId: string) => {
  const { data } = await api.get(`/community/posts/${postId}`);
  return data.comments ?? [];
};

export const createComment = async (payload: {
  postId: string;
  content: string;
}) => {
  const { data } = await api.post(
    `/community/posts/${payload.postId}/comments`,
    { content: payload.content }
  );

  return data;
};

export const markBestAnswer = async (commentId: string) => {
  const { data } = await api.post(`/community/network/questions/answers/${commentId}/best-answer`);
  return data;
};

export const markHelpful = async (commentId: string) => {
  const { data } = await api.post(`/community/network/answers/${commentId}/helpful`);
  return data;
};
