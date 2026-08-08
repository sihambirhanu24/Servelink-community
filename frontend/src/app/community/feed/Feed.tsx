"use client";

import { useQuery } from "@tanstack/react-query";
import { getPosts } from "@/services/community.service";
import PostCard from "@/components/post/PostCard";
import FeedSkeleton from "@/components/community/skeleton/FeedSkeleton";
import EmptyFeed from "@/components/community/feed/EmptyFeed";

export default function Feed() {
  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  if (isLoading) return <FeedSkeleton />;

  if (!data?.length) {
    return <EmptyFeed />;
  }

  return (
    <div className="space-y-5">
      {data.map((post: any) => (
        <PostCard
          key={post.id}
          post={post}
        />
      ))}
    </div>
  );
}