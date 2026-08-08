import api from "@/lib/axios";

export async function getAdminDashboard() {
  const { data } = await api.get("/admin/dashboard");
  return data;
}