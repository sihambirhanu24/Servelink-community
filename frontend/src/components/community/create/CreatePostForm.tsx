"use client";

console.log("CreatePostForm rendered");

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Globe2, Layers3, Type, Users } from "lucide-react";

import { CommunityService } from "@/services/community.service";

import CommunitySelect from "./CommunitySelect";
import CategorySelect from "./CategorySelect";
import VisibilitySelect from "./VisibilitySelect";
import AttachmentUploader from "./AttachmentUploader";
import FormActions from "./FormActions";

export default function CreatePostForm() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");

  const [communityId, setCommunityId] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [visibility, setVisibility] =
    useState("PUBLIC");

  const [files, setFiles] =
    useState<File[]>([]);

  const [loading, setLoading] =
    useState(false);

 async function publishPost() {
  try {
    setLoading(true);

    console.log("Publishing...");

    console.log({
      title,
      description,
      communityId,
      categoryId,
    });

    const response =
      await CommunityService.createPost({
        title,
        description,
        communityId,
        categoryId,
      });

    console.log("Response:", response);

    const post = response.data;

    console.log("Created post:", post);

    for (const file of files) {
      console.log("Uploading", file.name);

      await CommunityService.uploadAttachment(
        post.id,
        file,
      );
    }

    
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    router.push("/posts");

  } catch (err) {
    console.error(err);

    if (typeof err === "object" && err !== null && "response" in err) {
      console.log((err as any).response?.data);
    }

   
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="space-y-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <section className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#043658]" htmlFor="post-title">
          <Type className="h-4 w-4 text-[#043658]" />
          Post Title
        </label>
        <input
          id="post-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a descriptive title..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10"
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#043658]" htmlFor="post-description">
            <FileText className="h-4 w-4 text-[#043658]" />
            Description
          </label>
          <span className="text-xs font-medium text-slate-400">{description.length} / 2000 characters</span>
        </div>
        <textarea
          id="post-description"
          rows={8}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What would you like to share with the community today?"
          className="min-h-[220px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base leading-7 text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10"
        />
      </section>

      <section className="grid gap-5 border-t border-slate-100 pt-8 sm:grid-cols-2">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#043658]"><Users className="h-4 w-4" />Community</label>
          <CommunitySelect value={communityId} onChange={setCommunityId} />
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#043658]"><Layers3 className="h-4 w-4" />Category</label>
          <CategorySelect value={categoryId} onChange={setCategoryId} />
        </div>
      </section>

      <section className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#043658]"><Globe2 className="h-4 w-4" />Visibility</label>
        <VisibilitySelect value={visibility} onChange={setVisibility} />
      </section>

      <AttachmentUploader files={files} onChange={setFiles} />

      <FormActions loading={loading} onPublish={publishPost} />
    </div>
  );
}