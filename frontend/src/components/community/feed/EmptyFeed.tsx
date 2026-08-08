"use client";

import { MessageSquarePlus } from "lucide-react";

export default function EmptyFeed() {
  return (
    <div className="rounded-[28px] bg-white p-12 text-center shadow-sm">

      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#043658]/10">

        <MessageSquarePlus
          size={36}
          className="text-[#043658]"
        />

      </div>

      <h2 className="mt-6 text-2xl font-bold text-[#043658]">
        No Posts Yet
      </h2>

      <p className="mt-3 text-gray-500">
        Start the first discussion with your fellow teachers.
      </p>

      <button className="mt-8 rounded-2xl bg-[#043658] px-8 py-3 font-semibold text-white transition hover:bg-[#032B46]">
        Create First Post
      </button>

    </div>
  );
}