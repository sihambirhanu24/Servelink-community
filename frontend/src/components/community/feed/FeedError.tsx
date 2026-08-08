"use client";

export default function FeedError() {
  return (
    <div className="rounded-3xl bg-red-50 p-10">

      <h2 className="text-2xl font-bold text-red-500">
        Something went wrong
      </h2>

      <p className="mt-2 text-gray-500">
        Unable to load community posts.
      </p>

    </div>
  );
}