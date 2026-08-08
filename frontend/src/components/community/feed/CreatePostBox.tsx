"use client";

import { useEffect, useRef, useState } from "react";

import {
  Image as ImageIcon,
  Paperclip,
  Video,
  SendHorizonal,
  X,
} from "lucide-react";

import {
  createPost,
  uploadAttachment,
  getCommunities,
  getCategories,
} from "@/services/community";

interface Community {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

export default function CreatePostBox() {

 

  const imageInputRef =
    useRef<HTMLInputElement>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const videoInputRef =
    useRef<HTMLInputElement>(null);

  

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [communityId, setCommunityId] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [files, setFiles] =
    useState<File[]>([]);

  const [communities, setCommunities] =
    useState<Community[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(false);



  useEffect(() => {
    async function load() {
      try {
        const communityData =
          await getCommunities();

        const categoryData =
          await getCategories();

        setCommunities(communityData);

        setCategories(categoryData);
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, []);

  

  function addFiles(
    selected: FileList | null,
  ) {
    if (!selected) return;

    setFiles((prev) => [
      ...prev,
      ...Array.from(selected),
    ]);
  }

  function removeFile(index: number) {
    setFiles(
      files.filter((_, i) => i !== index),
    );
  }

 

  async function publish() {
    try {
      setLoading(true);

      if (
        !title ||
        !description ||
        !communityId ||
        !categoryId
      ) {
        alert("Please fill all fields.");
        return;
      }

      const post =
        await createPost({
          title,
          description,
          communityId,
          categoryId,
        });

      for (const file of files) {
        await uploadAttachment(
          post.id,
          file,
        );
      }

      alert("Post published!");

      setTitle("");
      setDescription("");
      setCommunityId("");
      setCategoryId("");
      setFiles([]);

      window.location.reload();

    } catch (error) {
      console.error('Unable to publish post', error);
      alert('Unable to publish post. Please try again.');
    } finally {
      setLoading(false);
    }
  }

 return (
  <div className="rounded-[30px] bg-white p-6 shadow-sm space-y-6">

    {/* Title */}
    <input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="Post title..."
      className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-[#043658]"
    />

    {/* Description */}
    <textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="Share a discussion, ask a question, or upload a teaching resource..."
      rows={6}
      className="w-full resize-none rounded-2xl bg-[#F5F7FB] p-5 outline-none"
    />

    {/* Community + Category */}
    <div className="grid grid-cols-2 gap-4">

      <select
        value={communityId}
        onChange={(e) => setCommunityId(e.target.value)}
        className="rounded-xl border p-3"
      >
        <option value="">
          Select Community
        </option>

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
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="rounded-xl border p-3"
      >
        <option value="">
          Select Category
        </option>

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

    {/* Hidden Inputs */}

    <input
      ref={imageInputRef}
      type="file"
      hidden
      accept="image/*"
      multiple
      onChange={(e) =>
        addFiles(e.target.files)
      }
    />

    <input
      ref={videoInputRef}
      type="file"
      hidden
      accept="video/*"
      multiple
      onChange={(e) =>
        addFiles(e.target.files)
      }
    />

    <input
      ref={fileInputRef}
      type="file"
      hidden
      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
      multiple
      onChange={(e) =>
        addFiles(e.target.files)
      }
    />

    {/* Upload Buttons */}

    <div className="flex gap-6">

      <button
        type="button"
        onClick={() =>
          imageInputRef.current?.click()
        }
        className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-100"
      >
        <ImageIcon size={18} />
        Image
      </button>

      <button
        type="button"
        onClick={() =>
          fileInputRef.current?.click()
        }
        className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-100"
      >
        <Paperclip size={18} />
        File
      </button>

      <button
        type="button"
        onClick={() =>
          videoInputRef.current?.click()
        }
        className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-100"
      >
        <Video size={18} />
        Video
      </button>

    </div>

    {/* Selected Files */}

    {files.length > 0 && (

      <div className="space-y-2">

        {files.map((file, index) => (

          <div
            key={index}
            className="flex items-center justify-between rounded-lg border p-3"
          >

            <span className="truncate">
              {file.name}
            </span>

            <button
              type="button"
              onClick={() =>
                removeFile(index)
              }
              className="rounded-full p-1 hover:bg-red-100"
            >
              <X
                size={18}
                className="text-red-600"
              />
            </button>

          </div>

        ))}

      </div>

    )}

    {/* Publish */}

    <div className="flex justify-end">

      <button
        type="button"
        disabled={loading}
        onClick={publish}
        className="flex items-center gap-2 rounded-2xl bg-[#043658] px-8 py-3 font-semibold text-white hover:bg-[#032B46] disabled:opacity-50"
      >
        <SendHorizonal size={18} />

        {loading
          ? "Publishing..."
          : "Publish"}
      </button>

    </div>

  </div>
);
}