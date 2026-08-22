"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Heart, MessageCircle, Bookmark, Share2, Eye } from "lucide-react";

interface PostActionsProps {
  likes: number;
  liked: boolean;
  comments: number;
  bookmarked: boolean;
  bookmarkCount: number;
  views: number;
  isVerified: boolean;
  onLike: () => void;
  onComment: () => void;
  onBookmark: () => void;
  onShare?: () => void;
  isLiking?: boolean;
  isBookmarking?: boolean;
}

export function PostActions({
  likes,
  liked,
  comments,
  bookmarked,
  bookmarkCount,
  views,
  isVerified,
  onLike,
  onComment,
  onBookmark,
  onShare,
  isLiking = false,
  isBookmarking = false,
}: PostActionsProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareButtonRef, setShareButtonRef] = useState<HTMLButtonElement | null>(null);

  const handleProtectedAction = (action: () => void) => {
    if (!isVerified) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("show-verification-modal"));
      }
      return;
    }
    action();
  };

  const handleShareClick = () => {
    handleProtectedAction(() => setShareOpen((prev) => !prev));
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between text-sm text-slate-500">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => handleProtectedAction(onLike)}
            disabled={isLiking}
            className={`flex items-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-60 ${
              liked ? "text-red-500" : "hover:text-red-500"
            }`}
          >
            <Heart className="h-5 w-5" fill={liked ? "currentColor" : "none"} />
            <span className="text-sm font-semibold">{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
          </button>
          
          <button
            type="button"
            onClick={onComment}
            className="flex items-center gap-2 transition hover:text-[#043658]"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">{comments} {comments === 1 ? 'Comment' : 'Comments'}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => handleProtectedAction(onBookmark)}
            disabled={isBookmarking}
            className={`flex items-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-60 ${
              bookmarked ? "text-[#043658]" : "hover:text-[#043658]"
            }`}
          >
            <Bookmark className="h-5 w-5" fill={bookmarked ? "currentColor" : "none"} />
            <span className="text-sm font-semibold hidden sm:inline">Bookmark</span>
          </button>
          
          <div className="relative">
            <button
              ref={setShareButtonRef}
              type="button"
              onClick={handleShareClick}
              className="flex items-center gap-2 transition hover:text-[#043658]"
            >
              <Share2 className="h-5 w-5" />
              <span className="text-sm font-semibold hidden sm:inline">Share</span>
            </button>

          {shareOpen && shareButtonRef && typeof window !== "undefined" &&
            createPortal(
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShareOpen(false)} />
                <div
                  className="fixed z-40 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                  style={{
                    top: `${shareButtonRef.getBoundingClientRect().top}px`,
                    left: `${shareButtonRef.getBoundingClientRect().left}px`,
                    transform: "translateY(-100%) translateY(-8px)",
                  }}
                >
                  <p className="mb-1 px-2.5 pt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Share via</p>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition hover:bg-green-50 hover:text-green-700"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-600 text-xs">💬</span>
                    WhatsApp
                  </a>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600 text-xs">✈️</span>
                    Telegram
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-800 font-bold text-xs">𝕏</span>
                    X / Twitter
                  </a>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">in</span>
                    LinkedIn
                  </a>

                  <div className="my-1 h-px bg-slate-100" />

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                      } catch {
                        // Silently fail
                      }
                      setShareOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-[#043658]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                      <Share2 className="h-3.5 w-3.5 text-slate-600" />
                    </span>
                    Copy Link
                  </button>
                </div>
              </>
              ,
              document.body
            )
          }
        </div>
      </div>
        
      <span className="flex items-center gap-1.5 hidden">
        <Eye className="h-4 w-4" />
        <span className="text-xs font-medium">{views}</span>
      </span>
    </div>
  </div>
);
}
