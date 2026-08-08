import api from "@/lib/axios";

export const joinCommunity = async (communityId: string) => {
  const { data } = await api.post("/membership/join", {
    communityId,
  });

  return data;
};

export const leaveCommunity = async (communityId: string) => {
  const { data } = await api.delete(
    `/membership/${communityId}/leave`
  );

  return data;
};

export const getMembers = async (communityId: string) => {
  const { data } = await api.get(
    `/membership/${communityId}/members`
  );

  return data;
};