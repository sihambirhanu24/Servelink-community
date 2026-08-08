import { ThumbsUp, MessageCircle, FileText } from 'lucide-react';

interface MessageAttachment {
  name: string;
  size: string;
}

export interface ChatMessageData {
  id: string;
  isOwnMessage: boolean;
  authorName: string;
  levelBadge: string; // "LEVEL 10 EDUCATOR", "DEAN OF SCIENCES", "LEVEL 9 MEMBER"
  timestamp: string;
  text?: string;
  attachment?: MessageAttachment;
  reactions?: { likeCount: number; commentCount: number };
}

export function ChatMessageBubble({ message }: { message: ChatMessageData }) {
  const { isOwnMessage, authorName, levelBadge, timestamp, text, attachment, reactions } = message;

  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-2 mb-1">
        {!isOwnMessage && (
          <span className="text-sm font-semibold text-[#043658]">{authorName}</span>
        )}
        <span className="text-[9px] font-semibold uppercase tracking-wide bg-[#FFC107]/20 text-[#926E00] rounded-full px-2 py-0.5">
          {levelBadge}
        </span>
        <span className="text-xs text-slate-400">{timestamp}</span>
        {isOwnMessage && <span className="text-sm font-semibold text-[#043658]">{authorName}</span>}
      </div>

      {text && (
        <div
          className={`max-w-md rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwnMessage
              ? 'bg-[#043658] text-white rounded-tr-sm'
              : 'bg-slate-100 text-slate-700 rounded-tl-sm'
          }`}
        >
          {text}
        </div>
      )}

      {attachment && (
        <a
          href="#"
          className="mt-1 flex items-center gap-3 rounded-xl bg-[#043658] px-4 py-3 hover:bg-[#043658]/90 transition-colors max-w-md"
        >
          <div className="h-9 w-9 rounded-lg bg-[#FFC107]/20 flex items-center justify-center shrink-0">
            <FileText className="h-4.5 w-4.5 text-[#FFC107]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{attachment.name}</p>
            <p className="text-xs text-slate-300">{attachment.size}</p>
          </div>
        </a>
      )}

      {reactions && (
        <div className="mt-1.5 flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <ThumbsUp className="h-3.5 w-3.5" /> {reactions.likeCount}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <MessageCircle className="h-3.5 w-3.5" /> {reactions.commentCount}
          </span>
        </div>
      )}
    </div>
  );
}
