"use client";

import { useEffect, useState } from "react";
import {
  createPost,
  getCategories,
  getAccessibleCommunities,
} from "@/services/community";

interface Community {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Props {
  onClose: () => void;
}

export default function CreatePostModal({
  onClose,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [communities, setCommunities] = useState<Community[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const communitiesData = await getAccessibleCommunities();
        const categoriesData = await getCategories();

        setCommunities(communitiesData);
        setCategories(categoriesData);
      } catch (err) {
        console.log(err);
      }
    }

    loadData();
  }, []);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      await createPost({
        title,
        description,
        communityId,
        categoryId,
      });

      setTitle("");
      setDescription("");
      setCommunityId("");
      setCategoryId("");

      onClose();

      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#043658]/10 bg-white p-8 shadow-2xl">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>

        <h2 className="mb-2 text-3xl font-bold text-[#043658]">
          Create New Post
        </h2>
        <p className="mb-6 text-sm text-slate-500">Share teaching ideas, resources, and discussions with your community.</p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-[#043658] mb-2">Post Title</label>
            <input
              required
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658] outline-none transition placeholder:text-slate-400 focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10"
              placeholder="e.g., Grade 8 Fractions Activity"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#043658] mb-2">Description</label>
            <textarea
              required
              rows={5}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658] outline-none transition placeholder:text-slate-400 focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10"
              placeholder="Share your idea, resource, or question..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#043658] mb-2">Community</label>
            <select
              required
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10"
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
            >
              <option value="">Select Community</option>

              {communities.map((community) => (
                <option
                  key={community.id}
                  value={community.id}
                >
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#043658] mb-2">Category</label>
            <select
              required
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select Category</option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#043658]/20 px-6 py-3 text-sm font-semibold text-[#043658] transition hover:bg-[#043658]/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!title.trim() || !description.trim() || !communityId || !categoryId}
              className="rounded-full bg-[#043658] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#032742] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Publish Post
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}