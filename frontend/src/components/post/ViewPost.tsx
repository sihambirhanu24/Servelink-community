"use client";

import BackButton from "@/components/common/BackButton";
import { Heart, MessageCircle, Calendar, Send } from "lucide-react";
import { createComment } from "@/services/comment.service";
import { useState } from "react";
import { getMediaUrl } from "@/lib/media";

interface Props {
  post: any;
}

export default function ViewPost({ post }: Props) {
  const [comments, setComments] = useState(post.comments ?? []);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  async function handleCommentSubmit() {
    const content = comment.trim();
    if (!content || submittingComment) return;

    try {
      setSubmittingComment(true);
      const createdComment = await createComment({ postId: post.id, content });
      setComments((currentComments: any[]) => [...currentComments, createdComment]);
      setComment("");
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingComment(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-8">

      <BackButton />

      <div className="mx-auto mt-6 max-w-4xl overflow-hidden rounded-3xl border border-[#043658]/15 bg-white shadow-[0_20px_45px_-24px_rgba(4,54,88,0.45)]">

        {/* Header */}

        <div className="bg-[#043658] p-8 text-white">

          <div className="flex items-center gap-5">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFC107] text-2xl font-bold text-[#043658]">

              {post.teacher.firstName.charAt(0)}

            </div>

            <div>

              <h2 className="text-2xl font-bold">

                {post.teacher.firstName} {post.teacher.lastName}

              </h2>

              <p className="text-white/70">

                {post.teacher.level}

              </p>

            </div>

          </div>

        </div>

        {/* Body */}

        <div className="space-y-6 p-8">

          <h1 className="text-4xl font-bold text-[#043658]">

            {post.title}

          </h1>

          <p className="leading-8 text-[#043658]/75">

            {post.description}

          </p>

          <div className="flex gap-3">

            <span className="rounded-full bg-[#043658]/10 px-4 py-2 text-sm font-semibold text-[#043658]">

              {post.community.name}

            </span>

            <span className="rounded-full bg-[#FFC107]/25 px-4 py-2 text-sm font-semibold text-[#043658]">

              {post.category.name}

            </span>

          </div>

          {post.attachments?.length > 0 && <div className="grid gap-4 sm:grid-cols-2">{post.attachments.map((attachment: any) => { const url = getMediaUrl(attachment.url); if (attachment.type === "IMAGE") return <img key={attachment.id} src={url} alt={attachment.fileName || "Post attachment"} className="h-56 w-full rounded-2xl object-cover" />; if (attachment.type === "VIDEO") return <video key={attachment.id} src={url} controls className="h-56 w-full rounded-2xl object-cover" />; return <a key={attachment.id} href={url} target="_blank" rel="noreferrer" className="rounded-2xl border border-[#043658]/15 bg-[#043658]/5 p-5 font-semibold text-[#043658] hover:bg-[#FFC107]/15">Open {attachment.fileName || attachment.type} attachment</a>; })}</div>}

        </div>

        {/* Footer */}

        <div className="flex justify-between border-t border-[#043658]/10 p-6 text-[#043658]">

            <div className="flex gap-8">

            <div className="flex items-center gap-2">

              <Heart size={20} />

              {post.communityLikes.length}

            </div>

            <div className="flex items-center gap-2">

              <MessageCircle size={20} />

              {comments.length}

            </div>

          </div>

          <div className="flex items-center gap-2 text-[#043658]/60">

            <Calendar size={18} />

            {new Date(post.createdAt).toLocaleDateString()}

          </div>

        </div>

        <section id="comments" className="border-t border-[#043658]/10 p-8">
          <h2 className="text-2xl font-bold text-[#043658]">Comments</h2>
          <div className="mt-5 space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-[#043658]/60">No comments yet. Start the conversation.</p>
            ) : comments.map((item: any) => (
              <div key={item.id} className="rounded-2xl bg-[#043658]/5 p-4">
                <p className="text-sm leading-6 text-[#043658]/80">{item.content}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleCommentSubmit();
                }
              }}
              placeholder="Write a comment..."
              className="min-w-0 flex-1 rounded-2xl border border-[#043658]/15 px-4 py-3 text-sm text-[#043658] outline-none focus:border-[#043658] focus:ring-4 focus:ring-[#FFC107]/25"
            />
            <button
              type="button"
              onClick={handleCommentSubmit}
              disabled={submittingComment || !comment.trim()}
              className="rounded-2xl bg-[#043658] px-4 text-white transition hover:bg-[#032742] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Post comment"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </section>

      </div>

    </main>
  );
}