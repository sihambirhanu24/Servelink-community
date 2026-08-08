"use client";

import { useEffect, useState } from "react";
import {
  createPost,
  getCategories,
  getCommunities,
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
        const communitiesData = await getCommunities();
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
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-2xl text-gray-500 transition hover:bg-gray-100 hover:text-black"
        >
          ✕
        </button>

        <h2 className="mb-6 text-3xl font-bold text-slate-800">
          Create New Post
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <input
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none text-gray-700"
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            rows={5}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none text-gray-700"
            placeholder="Write your post..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <select
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none text-gray-800"
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

          <select
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none text-gray-900"
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

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
            >
              Publish Post
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}