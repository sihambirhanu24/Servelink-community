"use client";

export default function FeedLoading() {
  return (
    <div className="space-y-6">

      {Array.from({ length: 3 }).map((_, i) => (

        <div
          key={i}
          className="h-60 animate-pulse rounded-3xl bg-gray-100"
        />

      ))}

    </div>
  );
}