"use client";

import { MoreHorizontal } from "lucide-react";
import { Post } from "@/types/community";

interface Props {
  post: Post;
}

export default function PostHeader({
  post,
}: Props) {
  const teacher = post?.teacher;
  const community = post?.community;

const teacherName =
  teacher
    ? `${teacher.firstName} ${teacher.lastName}`
    : "Unknown Teacher";
const teacherInitial =
  teacher?.firstName?.charAt(0).toUpperCase() || "T";  const teacherLevel = typeof teacher?.level === "number" ? teacher.level : "N/A";
  const communityName =
    typeof community?.name === "string" && community.name.trim()
      ? community.name.trim()
      : "Community";

  return (
    <div className="flex justify-between">

      <div className="flex gap-4">

        {teacher?.profileImage ? (
  <img
    src={`http://localhost:3000/${teacher.profileImage}`}
    alt={teacherName}
    className="h-14 w-14 rounded-full object-cover"
  />
) : (
  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#043658] text-xl font-bold text-white">
    {teacherInitial}
  </div>
)}
        <div>

          <h3 className="font-bold">
            {teacherName}
          </h3>

          <div className="mt-1 flex gap-2">

            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">

              Level {teacher?.level?.replace("_", " ")}

            </span>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">

              {communityName}

            </span>

          </div>

          <p className="mt-2 text-sm text-gray-500">

            {post.createdAt}

          </p>

        </div>

      </div>

      <button>

        <MoreHorizontal />

      </button>

    </div>
  );
}