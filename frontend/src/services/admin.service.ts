import { api } from "@/lib/axios";

export const getTeachers = async () => {
  const { data } = await api.get("/admin/teachers");
  return data;
};

export const getTeacher = async (id: string) => {
  const { data } = await api.get(`/admin/teachers/${id}`);
  return data;
};

export const upgradeTeacher = async (
  id: string,
) => {
  const { data } =
    await api.patch(
      `/admin/teachers/${id}/upgrade`,
    );

  return data;
};
export const getMembershipRequests =
async () => {

    const { data } =
    await api.get(
        "/admin/memberships"
    );

    return data;

};
export const approveMembership =
async (id:string)=>{

    const { data } =
    await api.patch(
        `/admin/memberships/${id}/approve`
    );

    return data;

};
export const rejectMembership =
async(id:string)=>{

    const { data } =
    await api.patch(
        `/admin/memberships/${id}/reject`
    );

    return data;

};
export const getCommunities = async () => {
  const { data } =
    await api.get("/admin/communities");

  return data;
};
export const getCommunity =
async (id: string) => {

  const { data } =
    await api.get(
      `/admin/communities/${id}`
    );

  return data;

};
export const createCommunity =
async (body: any) => {

  const { data } =
    await api.post(
      "/admin/communities",
      body,
    );

  return data;

};
export const updateCommunity =
async (
  id: string,
  body: any,
) => {

  const { data } =
    await api.patch(
      `/admin/communities/${id}`,
      body,
    );

  return data;

};
export const deleteCommunity =
async (id: string) => {

  const { data } =
    await api.delete(
      `/admin/communities/${id}`,
    );

  return data;

};
