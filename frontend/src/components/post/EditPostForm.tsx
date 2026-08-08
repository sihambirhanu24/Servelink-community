"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, FileText, Globe2, Layers3, Loader2, Save, Trash2, Type, Users } from "lucide-react";

import {
  getCommunities,
  getCategories,
  updatePost,
  deletePost,
} from "@/services/community";
import { getMediaUrl } from "@/lib/media";

interface Props {
  post: any;
}

export default function EditPostForm({
  post,
}: Props) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [communityId, setCommunityId] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [communities, setCommunities] =
    useState<any[]>([]);

  const [categories, setCategories] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const initialValues = useRef({ title: "", description: "", communityId: "", categoryId: "" });

  useEffect(() => {
    setTitle(post.title);
    setDescription(post.description);
    setCommunityId(post.communityId);
    setCategoryId(post.categoryId);
    initialValues.current = {
      title: post.title,
      description: post.description,
      communityId: post.communityId,
      categoryId: post.categoryId,
    };

    loadDropdowns();
  }, []);

  const hasUnsavedChanges =
    title !== initialValues.current.title ||
    description !== initialValues.current.description ||
    communityId !== initialValues.current.communityId ||
    categoryId !== initialValues.current.categoryId;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  async function loadDropdowns() {
    try {
      const communityData =
        await getCommunities();

      const categoryData =
        await getCategories();

      setCommunities(communityData);
      setCategories(categoryData);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      await updatePost(post.id, {
        title,
        description,
        communityId,
        categoryId,
      });

      alert("Post updated successfully!");

      router.push("/community/my-posts");
    } catch (error) {
      console.log(error);
      alert("Failed to update post.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      setLoading(true);
      await deletePost(post.id);
      setDeleteOpen(false);
      router.push("/community/my-posts");
    } catch (error) {
      console.log(error);
      const message = error instanceof Error ? error.message : "The post could not be deleted. Please try again.";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  function leaveEditPage() {
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Leave Page?")) return;
    router.push("/community/my-posts");
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[900px] space-y-8">
        <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#043658_0%,#0A4A74_100%)] p-8 text-white shadow-[0_20px_45px_-24px_rgba(4,54,88,0.75)] sm:p-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10 bg-white/[0.04]" />
          <div className="relative flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FFC107]"><BookOpen className="h-4 w-4" />Content workspace</div>
              <h1 className="mt-5 font-['Lexend'] text-4xl font-semibold tracking-tight sm:text-5xl">Edit Community <span className="text-[#FFC107]">Post</span></h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">Update your teaching resource, discussion, or classroom knowledge before publishing the latest version.</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#FFC107]/20 px-4 py-2 text-sm font-semibold text-[#FFC107]">Editing</span>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <section className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#043658]" htmlFor="edit-title"><Type className="h-4 w-4" />Post Title</label>
            <input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10" />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm font-semibold text-[#043658]" htmlFor="edit-description"><FileText className="h-4 w-4" />Description</label><span className="text-xs text-slate-400">{description.length} / 2000 characters</span></div>
            <textarea id="edit-description" rows={8} value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[220px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 leading-7 text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10" />
          </section>

          <section className="grid gap-5 border-t border-slate-100 pt-8 sm:grid-cols-2">
            <div className="space-y-3"><label className="flex items-center gap-2 text-sm font-semibold text-[#043658]"><Users className="h-4 w-4" />Community</label><select value={communityId} onChange={(e) => setCommunityId(e.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10">{communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}</select></div>
            <div className="space-y-3"><label className="flex items-center gap-2 text-sm font-semibold text-[#043658]"><Layers3 className="h-4 w-4" />Category</label><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
          </section>

          <section className="space-y-3"><label className="flex items-center gap-2 text-sm font-semibold text-[#043658]"><Globe2 className="h-4 w-4" />Visibility</label><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658]"><Globe2 className="h-4 w-4 text-slate-400" />Visible to the selected community</div></section>

          {post.attachments?.length > 0 && <section className="space-y-3 border-t border-slate-100 pt-8"><div><h2 className="text-sm font-semibold text-[#043658]">Current Attachments</h2><p className="mt-1 text-xs text-slate-400">Existing files attached to this post.</p></div><div className="grid gap-3 sm:grid-cols-2">{post.attachments.map((attachment: any) => <div key={attachment.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#043658]/10 text-[#043658]"><FileText className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#043658]">{attachment.fileName || attachment.url.split(/[\\/]/).pop()}</span><span className="text-xs text-slate-400">{attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : attachment.type}</span></span><a href={getMediaUrl(attachment.url)} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#043658] hover:bg-white">Preview</a></div>)}</div></section>}

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#043658]/10 pt-6 sm:flex-row sm:items-center"><button type="button" onClick={leaveEditPage} className="rounded-full border border-[#043658]/20 px-5 py-3 text-center text-sm font-semibold text-[#043658] transition hover:bg-[#043658]/5">Cancel</button><button type="button" onClick={() => setDeleteOpen(true)} className="rounded-full border border-[#FFC107]/60 px-5 py-3 text-sm font-semibold text-[#043658] transition hover:bg-[#FFC107]/15"><Trash2 className="mr-2 inline-block h-4 w-4" />Delete Post</button><button type="submit" disabled={loading} className="rounded-full bg-[#043658] px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#032742] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />Saving Changes...</> : <><Save className="mr-2 inline-block h-4 w-4" />Save Changes</>}</button></div>
        </form>

        {deleteOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#043658]/70 p-4"><div className="w-full max-w-md rounded-3xl border border-[#043658]/15 bg-white p-7 shadow-2xl"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFC107]/20 text-[#043658]"><Trash2 className="h-6 w-6" /></div><h2 className="mt-5 text-2xl font-semibold text-[#043658]">Delete this post?</h2><p className="mt-2 text-sm text-[#043658]/65">This action cannot be undone.</p><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={() => setDeleteOpen(false)} disabled={loading} className="rounded-full border border-[#043658]/20 px-5 py-3 text-sm font-semibold text-[#043658] hover:bg-[#043658]/5">Cancel</button><button type="button" onClick={handleDelete} disabled={loading} className="rounded-full bg-[#043658] px-5 py-3 text-sm font-semibold text-white hover:bg-[#032742] disabled:opacity-60">{loading ? "Deleting..." : "Delete"}</button></div></div></div>}
      </div>
    </main>
  );
}