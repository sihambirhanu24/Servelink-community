"use client";

import React, { useEffect, useState } from "react";
import { useProgress } from "@/hooks/useProgress";
import { Trophy, TrendingUp, Clock, Lock } from "lucide-react";

interface TimeRemaining {
  hours: number;
  minutes: number;
}

export function ProgressCard() {
  const { data: progress, isLoading, error } = useProgress();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  // Calculate time remaining for privilege
  useEffect(() => {
    if (!progress?.privilegeActive || !progress?.privilegeExpiresAt) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date();
      const expiresAt = new Date(progress.privilegeExpiresAt!);
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining({ hours, minutes });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [progress?.privilegeActive, progress?.privilegeExpiresAt]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !progress) {
    return null;
  }

  const levelColors = {
    LEVEL_1: "bg-gray-500",
    LEVEL_2: "bg-blue-500",
    LEVEL_3: "bg-green-500",
    LEVEL_4: "bg-purple-500",
    LEVEL_5: "bg-yellow-500",
  };

  const levelColor = levelColors[progress.level as keyof typeof levelColors] || "bg-gray-500";

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-t-4" style={{ borderTopColor: "#043658" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-[#043658]" />
          <h3 className="text-lg font-bold text-[#043658]">Your Progress</h3>
        </div>
        <div className={`${levelColor} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
          {progress.level.replace("_", " ")}
        </div>
      </div>

      {/* Points Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            {progress.points} / {progress.nextLevel ? progress.points + progress.pointsToNextLevel : progress.points} points
          </span>
          {progress.nextLevel && (
            <span className="text-sm font-medium text-[#043658]">
              Next: {progress.nextLevel.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-[#FFC107] h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.progressPercentage}%` }}
          ></div>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          {progress.progressPercentage}% complete
        </div>
      </div>

      {/* Points to Next Level */}
      {progress.nextLevel && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <div className="text-sm">
            <span className="font-semibold text-blue-900">{progress.pointsToNextLevel} points</span>
            <span className="text-blue-700"> to reach {progress.nextLevel.replace("_", " ")}</span>
          </div>
        </div>
      )}

      {/* 24-Hour Privilege Status */}
      {progress.privilegeActive && timeRemaining ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <Clock className="w-5 h-5 text-green-600" />
          <div className="text-sm">
            <div className="font-semibold text-green-900">24-Hour Trial Access Active!</div>
            <div className="text-green-700">
              Expires in: {timeRemaining.hours}h {timeRemaining.minutes}m
            </div>
          </div>
        </div>
      ) : progress.level === "LEVEL_5" ? (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <div className="text-sm">
            <div className="font-semibold text-yellow-900">Maximum Level Achieved!</div>
            <div className="text-yellow-700">You have access to all communities</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Lock className="w-5 h-5 text-gray-600" />
          <div className="text-sm text-gray-600">
            Keep earning points to unlock higher-level communities
          </div>
        </div>
      )}

      {/* How to Earn Points */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">Earn Points By:</div>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Creating posts: +5 points (max 3/day)</li>
          <li>• Receiving likes: +1 point each</li>
          <li>• Receiving bookmarks: +1 point each</li>
        </ul>
      </div>
    </div>
  );
}
