"use client";

import PostCard from "@/components/post/PostCard";
import { Post } from "@/types/community";

interface Props {
  posts: Post[];
}

export default function FeedList({
  posts,
}: Props) {
  return (
    <div className="space-y-6">

      {posts.map((post) => (

        <PostCard
          key={post.id}
          post={post}
        />

      ))}

    </div>
  );
}