import api from "@/lib/axios";

export interface ProgressResponse {
  points: number;
  level: string;
  nextLevel: string | null;
  pointsToNextLevel: number;
  progressPercentage: number;
  privilegeActive: boolean;
  privilegeExpiresAt: string | null;
}

export interface ActivityRecord {
  id: string;
  teacherId: string;
  type: string;
  points: number;
  referenceId: string | null;
  createdAt: string;
}

export const progressService = {
  /**
   * Get the authenticated teacher's progression status
   */
  getProgress: async (): Promise<ProgressResponse> => {
    const response = await api.get("/progress");
    return response.data;
  },

  /**
   * Get the authenticated teacher's activity history
   */
  getActivityHistory: async (): Promise<ActivityRecord[]> => {
    const response = await api.get("/progress/activity");
    return response.data;
  },
};
