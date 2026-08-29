import api from "@/lib/axios";

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  subject?: string;
  school?: string;
  woreda?: string;
  zone?: string;
  region?: string;
  department?: string;
  // Personal
  gender?: string;
  bio?: string;
  phone?: string;
  // Professional
  profession?: string;
  specialization?: string;
  skills?: string;
  gradeLevel?: string;
  yearsOfExperience?: number;
  // School
  schoolType?: string;
  city?: string;
  schoolLocation?: string;
}

export interface NotificationPreferencePayload {
  soundEnabled?: boolean;
  soundType?: string;
  browserNotifications?: boolean;
  messages?: boolean;
  communityActivity?: boolean;
  questions?: boolean;
  discussions?: boolean;
  resources?: boolean;
  levelProgress?: boolean;
  announcements?: boolean;
}


export const getProfile = async () => {
  const { data } = await api.get("/profile/me");
  return data;
};

export const updateProfile = async (body: UpdateProfilePayload) => {
  const { data } = await api.patch("/profile", body);
  return data;
};

export const uploadProfilePhoto = async (file: File) => {
  const formData = new FormData();
  formData.append("photo", file);
  const { data } = await api.patch("/profile/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as { success: boolean; profileImage: string };
};

export const uploadBannerPhoto = async (file: File) => {
  const formData = new FormData();
  formData.append("banner", file);
  const { data } = await api.patch("/profile/banner", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as { success: boolean; bannerUrl: string };
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
) => {
  const { data } = await api.patch("/profile/password", {
    oldPassword,
    newPassword,
  });
  return data;
};

export const getMyPosts = async () => {
  const { data } = await api.get("/profile/posts");
  return data;
};

export const getMyCommunities = async () => {
  const { data } = await api.get("/profile/communities");
  return data;
};

export const getMyBookmarks = async () => {
  const { data } = await api.get("/profile/bookmarks");
  return data;
};

export const getNotificationPreferences = async () => {
  const { data } = await api.get("/profile/settings/notifications");
  return data;
};

export const updateNotificationPreferences = async (body: NotificationPreferencePayload) => {
  const { data } = await api.patch("/profile/settings/notifications", body);
  return data;
};