"use client";

import CommentForm from "./CommentForm";
import CommentPreview from "./CommentPreview";

export default function CommentSection() {
  return (
    <section className="rounded-[28px] bg-white p-7 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold">
        Comments
      </h2>

      <div className="space-y-5">

        <CommentPreview />

        <CommentPreview />

        <CommentPreview />

      </div>

      <CommentForm />

    </section>
  );
}