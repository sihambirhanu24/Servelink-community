"use client";

import { usePosts } from "@/hooks/usePosts";

import FeedHeader from "./FeedHeader";
import FeedList from "./FeedList";
import FeedLoading from "./FeedLoading";
import FeedError from "./FeedError";
import FeedEmpty from "./FeedEmpty";
import type { Post } from "@/types/community";

interface FeedProps {
  posts?: Post[];
}

export default function Feed({ posts }: FeedProps) {
  const {
    data,
    isLoading,
    isError,
  } = usePosts();

  const feedData = posts ?? (data as Post[] | undefined);

  if (!posts && isLoading) return <FeedLoading />;

  if (!posts && isError) return <FeedError />;

  if (!feedData?.length) return <FeedEmpty />;

  return (
    <section className="space-y-6">

      <FeedHeader />

      <FeedList posts={feedData} />

    </section>
  );
}