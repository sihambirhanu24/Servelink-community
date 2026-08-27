'use client';

import { Discussion } from '@/types/discussion';
import { Avatar } from '@/components/common/Avatar';
import { MessageCircle, ThumbsUp, Bookmark, Clock, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface DiscussionCardProps {
  discussion: Discussion;
}

export function DiscussionCard({ discussion }: DiscussionCardProps) {
  const authorName = `${discussion.author.firstName} ${discussion.author.lastName}`;
  const timeAgo = formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true });
  const lastActive = formatDistanceToNow(new Date(discussion.lastActiveAt), { addSuffix: true });

  return (
    <Link href={`/community/network/discussions/${discussion.id}`}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer">
        {/* Author Info */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar
            profileImage={discussion.author.profileImage}
            name={authorName}
            size="md"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${discussion.author.id}`}
                className="font-semibold text-gray-900 hover:text-[#043658]"
                onClick={(e) => e.stopPropagation()}
              >
                {authorName}
              </Link>
              {discussion.author.verified && (
                <BadgeCheck className="w-4 h-4 text-[#FFC107]" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{discussion.author.subject || 'Teacher'}</span>
              <span>·</span>
              <span>{discussion.author.level}</span>
              {discussion.isPinned && (
                <>
                  <span>·</span>
                  <span className="text-[#FFC107] font-medium">📌 Pinned</span>
                </>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <Clock className="w-3 h-3 inline mr-1" />
            {timeAgo}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {discussion.title}
        </h3>
        <p className="text-gray-700 mb-4 line-clamp-3">
          {discussion.description}
        </p>

        {/* Tags */}
        {discussion.tags && discussion.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {discussion.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {discussion.tags.length > 3 && (
              <span className="px-3 py-1 text-gray-500 text-xs">
                +{discussion.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Category */}
        {discussion.category && (
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 bg-[#043658]/5 text-[#043658] text-xs font-medium rounded-full">
              {discussion.category.name}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{discussion.replyCount} {discussion.replyCount === 1 ? 'reply' : 'replies'}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            <span>{discussion.views} {discussion.views === 1 ? 'view' : 'views'}</span>
          </div>
          {discussion.isBookmarked && (
            <div className="flex items-center gap-1 text-[#FFC107]">
              <Bookmark className="w-4 h-4 fill-current" />
              <span>Bookmarked</span>
            </div>
          )}
          <div className="ml-auto text-xs text-gray-500">
            Last active {lastActive}
          </div>
        </div>
      </div>
    </Link>
  );
}
