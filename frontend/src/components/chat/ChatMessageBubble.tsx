'use client';

import { useState } from 'react';
import { MessageCircleMore, Trash2, Edit2, Pin, PinOff, Copy } from 'lucide-react';
import { ChatMessage } from '@/hooks/useChatSocket';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  onReact?: (reaction: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  showActions?: boolean;
}

const REACTIONS = ['👍', '❤️', '😂', '👏', '😮', '🙏'];

export function ChatMessageBubble({
  message,
  isOwnMessage,
  onReact,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  onContextMenu,
  showActions = true,
}: ChatMessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (message.deletedAt) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className="text-xs text-slate-400 italic px-4 py-2">This message was deleted</div>
      </div>
    );
  }

  const reactionArray = message.reactions ? Object.entries(message.reactions) : [];

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div className={`max-w-xs ${isOwnMessage ? 'order-2' : ''}`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-[#043658] text-white rounded-br-none'
              : 'bg-slate-100 text-slate-900 rounded-bl-none'
          } relative`}
          onContextMenu={onContextMenu}
        >
          {/* Reply preview */}
          {message.replyToId && (
            <div
              className={`text-xs mb-1 py-1 px-2 rounded ${
                isOwnMessage ? 'bg-white/20' : 'bg-slate-200'
              } border-l-2 ${isOwnMessage ? 'border-white' : 'border-slate-400'}`}
            >
              <p className={`font-semibold ${isOwnMessage ? 'text-white/80' : 'text-slate-600'}`}>
                Replying to message
              </p>
              <p className={`truncate ${isOwnMessage ? 'text-white/70' : 'text-slate-500'}`}>
                View context in thread
              </p>
            </div>
          )}

          {/* Message content */}
          <p className="break-words whitespace-pre-wrap">{message.content}</p>

          {/* Attachments grid */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((att, idx) => (
                <AttachmentPreview key={idx} attachment={att} isOwnMessage={isOwnMessage} />
              ))}
            </div>
          )}

          {/* Timestamp and edit indicator */}
          <div
            className={`text-xs mt-1 flex items-center gap-1 ${
              isOwnMessage ? 'text-white/60 justify-end' : 'text-slate-500'
            }`}
          >
            {message.editedAt && <span className="italic">(edited)</span>}
            <span>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Reactions */}
        {reactionArray.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {reactionArray.map(([reaction, count]) => (
              <button
                key={reaction}
                className="text-xs bg-slate-100 hover:bg-slate-200 rounded-full px-2 py-1 transition-colors"
                onClick={() => onReact?.(reaction)}
              >
                {reaction} {count}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons (hover) */}
        {showActions && (
          <div className={`flex gap-1 mt-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
            {/* Reaction picker */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-all p-1 text-sm"
                title="Add reaction"
              >
                😊
              </button>
              {showReactions && (
                <div
                  className={`absolute bottom-full mb-2 bg-white border border-slate-200 rounded-lg p-2 flex gap-1 shadow-lg z-10 ${
                    isOwnMessage ? 'right-0' : 'left-0'
                  }`}
                >
                  {REACTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onReact?.(r);
                        setShowReactions(false);
                      }}
                      className="hover:scale-125 transition-transform cursor-pointer"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-all p-1"
                title="More options"
              >
                <MessageCircleMore className="w-4 h-4" />
              </button>
              {showMenu && (
                <div
                  className={`absolute bottom-full mb-2 bg-white border border-slate-200 rounded-lg py-1 shadow-lg z-10 whitespace-nowrap ${
                    isOwnMessage ? 'right-0' : 'left-0'
                  }`}
                >
                  {isOwnMessage && (
                    <>
                      <button
                        onClick={() => {
                          onEdit?.();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete?.();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                  {message.isPinned ? (
                    <button
                      onClick={() => {
                        onUnpin?.();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <PinOff className="w-4 h-4" /> Unpin
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onPin?.();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <Pin className="w-4 h-4" /> Pin
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AttachmentPreview({ attachment, isOwnMessage }: any) {
  const isImage = attachment.type === 'IMAGE';
  const bgColor = isOwnMessage ? 'bg-white/20' : 'bg-slate-200';

  if (isImage) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block rounded overflow-hidden ${bgColor}`}
      >
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className="max-w-xs h-auto hover:opacity-80 transition-opacity"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      download={attachment.fileName}
      className={`flex items-center gap-2 p-2 rounded ${bgColor} hover:opacity-80 transition-opacity`}
    >
      <div className="text-xl">
        {attachment.type === 'PDF' && '📄'}
        {attachment.type === 'DOCX' && '📘'}
        {attachment.type === 'VIDEO' && '🎥'}
      </div>
      <div className="text-xs truncate">
        <p className="font-semibold truncate">{attachment.fileName}</p>
        <p className={isOwnMessage ? 'text-white/60' : 'text-slate-500'}>
          {(attachment.fileSize / 1024 / 1024).toFixed(1)} MB
        </p>
      </div>
    </a>
  );
}
