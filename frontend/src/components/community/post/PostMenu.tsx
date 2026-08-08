"use client";

import {
  Pencil,
  Trash2,
  Flag,
} from "lucide-react";

export default function PostMenu() {
  return (
    <div className="absolute right-0 top-10 w-56 rounded-2xl bg-white p-3 shadow-xl">

      <button className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-gray-100">

        <Pencil size={18} />

        Edit Post

      </button>

      <button className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-gray-100">

        <Trash2 size={18} />

        Delete

      </button>

      <button className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-gray-100">

        <Flag size={18} />

        Report

      </button>

    </div>
  );
}