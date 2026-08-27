'use client';

import { useState } from 'react';
import { DiscussionMessage as MessageType } from '@/types/discussion';
import { Avatar } from '@/components/common/Avatar';
import { ThumbsUp, Reply, MoreVertical, Edit2, Trash2, Flag, BadgeCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { ReportDiscussionModal } from './ReportDiscussionModal';

interface DiscussionMessageProps {
  message: MessageType;
  discussionId?: string;
  discussionTitle?: string;
  onReply: (messageId: string, senderName: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onHelpful: (messageId: string) => void;
  onReport?: (messageId: string) => void;
}

export function DiscussionMessage({
  message,
  discussionId,
  discussionTitle,
  onReply,
  onEdit,
  onDelete,
  onHelpful,
  onReport,
}: DiscussionMessageProps) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showReportModal, setShowReportModal] = useState(false);

  const isOwnMessage = user?.id === message.senderId;
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
  
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  const helpfulCount = reactions.filter(r => r.reaction === '👍').length;
  const hasHelpful = reactions.some(r => r.reaction === '👍' && r.teacherId === user?.id);

  const handleEditSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div className="group relative">
      {/* Reply-to indicator */}
      {message.replyTo && (
        <div className="ml-12 mb-2 p-2 bg-slate-100 border-l-2 border-[#043658] rounded-r text-xs">
          <p className="text-slate-600">
            <span className="font-medium text-slate-900">{message.replyTo.senderName}</span>: {message.replyTo.content}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar
          profileImage={message.senderImage}
          name={message.senderName}
          size="sm"
          className="flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-900">{message.senderName}</span>
            {message.senderVerified && (
              <BadgeCheck className="w-3.5 h-3.5 text-[#FFC107]" />
            )}
            <span className="text-xs text-slate-500">{message.senderLevel}</span>
            {message.senderSubject && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">{message.senderSubject}</span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">{timeAgo}</span>
            {message.editedAt && (
              <span className="text-[10px] text-slate-400">(edited)</span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEditSave}
                  className="px-3 py-1.5 bg-[#043658] text-white rounded-lg text-xs hover:bg-[#043658]/90"
                  disabled={!editContent.trim()}
                >
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-2">
              {/* Helpful */}
              <button
                onClick={() => onHelpful(message.id)}
                disabled={isOwnMessage}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  hasHelpful
                    ? 'text-[#FFC107] font-medium'
                    : 'text-slate-500 hover:text-[#FFC107]'
                } ${isOwnMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${hasHelpful ? 'fill-current' : ''}`} />
                <span>{helpfulCount > 0 && helpfulCount}</span>
              </button>

              {/* Reply */}
              <button
                onClick={() => onReply(message.id, message.senderName)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#043658] transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>

              {/* More actions */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {showActions && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                    {isOwnMessage ? (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowActions(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            onDelete(message.id);
                            setShowActions(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setShowReportModal(true);
                          setShowActions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Report
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}

      {/* Report Modal */}
      {discussionId && discussionTitle && (
        <ReportDiscussionModal
          discussionId={discussionId}
          discussionTitle={discussionTitle}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
