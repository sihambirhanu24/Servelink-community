import api from "@/lib/axios";

export const getProfile = async () => {
  const { data } = await api.get("/teacher/profile");
  return data;
};

export const getStatistics = async () => {
  const { data } = await api.get("/teacher/statistics");
  return data;
};

export const updateProfile = async (body: any) => {
  const { data } = await api.patch("/teacher/profile", body);
  return data;
};