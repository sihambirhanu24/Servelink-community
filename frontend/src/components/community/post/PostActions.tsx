"use client";

 import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  bookmarkPost,
  removeBookmark,
} from "@/services/community";


import {
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
} from "lucide-react";


import { useLike } from "@/hooks/useLike";
import { useBookmark } from "@/hooks/useBookmark";
import { Post } from "@/types/community";

interface Props {
  post: Post;
}

export default function PostActions({
  post,
}: Props) {
  const queryClient = useQueryClient();

  const like = useLike();
  const bookmark = useBookmark();

  async function handleLike() {
    try {
      await like.mutateAsync({
  id: post.id,
  liked: post.liked,
});

      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleBookmark() {
    try {
     
async function useBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      bookmarked,
    }: {
      id: string;
      bookmarked: boolean;
    }) =>
      bookmarked
        ? removeBookmark(id)
        : bookmarkPost(id),

    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
}
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleShare() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/community/post/${post.id}`
    );

    alert("Link copied!");
  }

  function handleComment() {
    const element = document.getElementById(
      `comment-${post.id}`
    );

    element?.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    <div className="mt-6 flex items-center justify-between border-t pt-5">

      <button
        onClick={handleLike}
        className="flex items-center gap-2 rounded-xl px-4 py-3 transition hover:bg-red-50"
      >
        <Heart
          size={20}
          color={post.liked ? "#ef4444" : "#666"}
          fill={post.liked ? "#ef4444" : "none"}
        />

        <span>{post.likesCount}</span>
      </button>

      <button
        onClick={handleComment}
        className="flex items-center gap-2 rounded-xl px-4 py-3 transition hover:bg-gray-100"
      >
        <MessageCircle size={20} />

        <span>
          {post.comments?.length ?? 0}
        </span>
      </button>

      <button
        onClick={handleBookmark}
        className="flex items-center gap-2 rounded-xl px-4 py-3 transition hover:bg-gray-100"
      >
        <Bookmark size={20} />

        Save
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-2 rounded-xl px-4 py-3 transition hover:bg-gray-100"
      >
        <Share2 size={20} />

        Share
      </button>

    </div>
  );
}