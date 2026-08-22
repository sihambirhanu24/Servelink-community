"use client";

import React from "react";
import { useProgress } from "@/hooks/useProgress";
import { Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";

/**
 * Compact progress widget for dashboard
 */
export function ProgressWidget() {
  const { data: progress, isLoading } = useProgress();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (!progress) {
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
    <Link href="/profile">
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#043658]" />
            <span className="font-semibold text-gray-800">Level Progress</span>
          </div>
          <div className={`${levelColor} text-white px-2 py-0.5 rounded-full text-xs font-semibold`}>
            {progress.level.replace("_", " ")}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#FFC107] h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Points Info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">{progress.points} points</span>
          {progress.nextLevel && (
            <div className="flex items-center gap-1 text-[#043658]">
              <TrendingUp className="w-3 h-3" />
              <span className="font-medium">{progress.pointsToNextLevel} to {progress.nextLevel.replace("_", " ")}</span>
            </div>
          )}
        </div>

      </div>
    </Link>
  );
}
