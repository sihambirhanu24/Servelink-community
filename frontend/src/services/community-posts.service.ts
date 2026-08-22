import api from "@/lib/axios";

export const getSavedPosts = async () => {
  const { data } = await api.get("/posts/saved");
  return data;
};

export const getMyCommunitiesPosts = async () => {
  const { data } = await api.get("/posts/my-communities");
  return data;
};
