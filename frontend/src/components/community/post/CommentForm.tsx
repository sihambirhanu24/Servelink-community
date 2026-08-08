"use client";

import { useState } from "react";

export default function CommentForm() {

  const [comment, setComment] =
    useState("");

  const submit = () => {
    console.log(comment);

    setComment("");
  };

  return (
    <div className="mt-8">

      <textarea
        rows={4}
        value={comment}
        onChange={(e) =>
          setComment(e.target.value)
        }
        className="w-full rounded-2xl border p-4"
        placeholder="Write a comment..."
      />

      <button
        onClick={submit}
        className="mt-4 rounded-xl bg-[#043658] px-6 py-3 text-white"
      >
        Post Comment
      </button>

    </div>
  );
}