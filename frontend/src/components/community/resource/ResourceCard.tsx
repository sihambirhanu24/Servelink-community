"use client";

import Link from "next/link";
import { FileText, Image, Video, FileCode, Download, MessageCircle, Star, Eye } from "lucide-react";

interface Attachment {
  id: string;
  url: string;
  type: "IMAGE" | "PDF" | "DOCX" | "VIDEO";
  fileName: string;
  fileSize: number;
}

interface Teacher {
  id?: string;
  firstName: string;
  lastName: string;
  level: string;
  profileImage?: string | null;
}

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string;
    postType: string;
    views?: number;
    createdAt: string;
    teacher?: Teacher | null;
    attachments?: Attachment[];
    _count?: { comments: number; communityLikes: number };
    likesCount?: number;
    communityLikes?: any[];
    comments?: any[];
  };
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  IMAGE: <Image className="h-5 w-5 text-blue-500" />,
  PDF: <FileText className="h-5 w-5 text-red-500" />,
  DOCX: <FileCode className="h-5 w-5 text-blue-600" />,
  VIDEO: <Video className="h-5 w-5 text-purple-500" />,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function levelLabel(raw?: string) {
  return String(raw ?? "LEVEL_1").replace(/^LEVEL_/, "L");
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const att = resource.attachments?.[0];
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:5000";
  const fileUrl = att ? `${apiBase}/${att.url}` : null;

  const likesCount =
    resource._count?.communityLikes ??
    resource.likesCount ??
    resource.communityLikes?.length ??
    0;
  const commentsCount = resource._count?.comments ?? resource.comments?.length ?? 0;
  const teacherName = resource.teacher
    ? `${resource.teacher.firstName} ${resource.teacher.lastName}`
    : "Teacher";

  return (
    <div className="group flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm hover:border-[#043658]/30 hover:shadow-md transition-all">
      {/* Attachment preview / file icon */}
      <Link href={`/community/post/${resource.id}`} className="block">
        <div className="flex items-center justify-center rounded-t-xl border-b border-slate-100 bg-slate-50 h-32">
          {att?.type === "IMAGE" && fileUrl ? (
            <img
              src={fileUrl}
              alt={resource.title}
              className="h-full w-full object-cover rounded-t-xl"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-300">
              {att ? (TYPE_ICON[att.type] ?? <FileText className="h-8 w-8" />) : <FileText className="h-8 w-8" />}
              {att && (
                <span className="text-xs font-medium text-slate-400">
                  {att.type} · {formatSize(att.fileSize)}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/community/post/${resource.id}`} className="group-hover:underline">
          <h3 className="text-sm font-semibold text-[#043658] line-clamp-2 leading-snug mb-1">
            {resource.title}
          </h3>
        </Link>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
          {resource.description}
        </p>

        {/* Meta row */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#043658]/10 text-[8px] font-bold text-[#043658]">
              {resource.teacher?.firstName?.[0] ?? "T"}
            </div>
            <span className="font-medium text-slate-600">{teacherName}</span>
            {resource.teacher?.level && (
              <span className="rounded-full bg-[#043658]/8 px-1.5 py-0.5 font-semibold text-[#043658]">
                {levelLabel(resource.teacher.level)}
              </span>
            )}
          </div>
          <span>{timeAgo(resource.createdAt)}</span>
        </div>

        {/* Stats + download */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {resource.views ?? 0}</span>
            <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {likesCount}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {commentsCount}</span>
          </div>
          {att && fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={att.fileName}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-lg border border-[#043658]/20 bg-[#043658]/5 px-2.5 py-1 text-[11px] font-semibold text-[#043658] hover:bg-[#043658]/10 transition-colors"
            >
              <Download className="h-3 w-3" />
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResourceCard;
