"use client";

import { useQuery } from "@tanstack/react-query";
import { progressService, ActivityRecord } from "@/services/progress";
import { Trophy, MessageSquare, HelpCircle, FileText, Heart, Bookmark, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ACTIVITY_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  QUESTION_CREATED: {
    icon: HelpCircle,
    label: "Question Created",
    color: "text-blue-600 bg-blue-50",
  },
  DISCUSSION_CREATED: {
    icon: MessageSquare,
    label: "Discussion Created",
    color: "text-green-600 bg-green-50",
  },
  RESOURCE_CREATED: {
    icon: FileText,
    label: "Resource Created",
    color: "text-purple-600 bg-purple-50",
  },
  BEST_ANSWER_SELECTED: {
    icon: Trophy,
    label: "Best Answer Selected",
    color: "text-yellow-600 bg-yellow-50",
  },
  LIKE_RECEIVED: {
    icon: Heart,
    label: "Received a Like",
    color: "text-red-600 bg-red-50",
  },
  BOOKMARK_RECEIVED: {
    icon: Bookmark,
    label: "Received a Bookmark",
    color: "text-indigo-600 bg-indigo-50",
  },
  DISCUSSION_BOOKMARK_RECEIVED: {
    icon: Bookmark,
    label: "Discussion Bookmarked",
    color: "text-indigo-600 bg-indigo-50",
  },
  VIOLATION_CONFIRMED: {
    icon: TrendingUp,
    label: "Violation Penalty",
    color: "text-red-600 bg-red-50",
  },
  ANSWER_SUBMITTED: {
    icon: MessageSquare,
    label: "Answer Submitted",
    color: "text-gray-600 bg-gray-50",
  },
  ANSWER_HELPFUL: {
    icon: TrendingUp,
    label: "Answer Marked Helpful",
    color: "text-green-600 bg-green-50",
  },
  QUESTION_RESOLVED: {
    icon: Trophy,
    label: "Question Resolved",
    color: "text-yellow-600 bg-yellow-50",
  },
};

interface PointsHistoryProps {
  limit?: number;
}

export function PointsHistory({ limit = 20 }: PointsHistoryProps) {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ["activityHistory", limit],
    queryFn: () => progressService.getActivityHistory(limit),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-[#043658] mb-4">Points History</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-[#043658] mb-4">Points History</h3>
        <p className="text-sm text-gray-500">No activity history yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-[#043658] mb-4">Points History</h3>
      <div className="space-y-3">
        {activities.map((activity) => {
          const config = ACTIVITY_CONFIG[activity.type] || {
            icon: TrendingUp,
            label: activity.type,
            color: "text-gray-600 bg-gray-50",
          };
          const Icon = config.icon;
          const points = activity.points;
          const isPositive = points > 0;
          const isNegative = points < 0;

          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${config.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{config.label}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div
                className={`text-sm font-bold ${
                  isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-600"
                }`}
              >
                {isPositive ? "+" : ""}{points}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
