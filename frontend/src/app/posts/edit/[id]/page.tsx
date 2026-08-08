"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getPostById } from "@/services/community";

import EditPostForm from "@/components/post/EditPostForm";

export default function EditPostPage() {
  const { id } = useParams();

  const [post, setPost] =
    useState<any>();

  useEffect(() => {
    loadPost();
  }, []);

  async function loadPost() {
    try {
      const data = await getPostById(
        id as string
      );

      setPost(data);
    } catch (error) {
      console.log(error);
    }
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-[900px] animate-pulse space-y-8">
          <div className="h-64 rounded-3xl bg-[#043658]/15" />
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="h-6 w-32 rounded bg-slate-200" />
            <div className="h-14 rounded-2xl bg-slate-100" />
            <div className="h-52 rounded-2xl bg-slate-100" />
            <div className="grid gap-5 sm:grid-cols-2"><div className="h-14 rounded-2xl bg-slate-100" /><div className="h-14 rounded-2xl bg-slate-100" /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EditPostForm post={post} />
  );
}