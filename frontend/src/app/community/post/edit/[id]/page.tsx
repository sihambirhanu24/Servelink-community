"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Loader2,
  FileText,
  X,
  Upload,
  Eye,
  MessageSquare,
  Trash2,
  AlertCircle,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getPost,
  updatePost,
  uploadAttachment,
  deleteAttachment,
  getCategories,
  getCommunities,
} from "@/services/community.service";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getMediaUrl } from "@/lib/media";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Attachment {
  id: string;
  url: string;
  type: "IMAGE" | "PDF" | "DOCX" | "VIDEO";
  fileName?: string;
  fileSize?: number;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface Community {
  id: string;
  name: string;
  type: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  views: number;
  community: Community;
  category: Category;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    level: string;
  };
  attachments: Attachment[];
  likesCount: number;
  commentsCount: number;
  allowComments: boolean;
}

export default function EditPostPage() {
  const params = useParams();
  const postId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch post data
  const { data: post, isLoading: postLoading } = useQuery<Post>({
    queryKey: ["post", postId],
    queryFn: () => getPost(postId),
    enabled: !!postId,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Fetch communities
  const { data: communitiesData } = useQuery({
    queryKey: ["communities"],
    queryFn: getCommunities,
  });

  const communities: Community[] = communitiesData || [];

  // Initialize form with post data
  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setDescription(post.description || "");
      setCommunityId(post.community.id);
      setCategoryId(post.category.id);
      setAllowComments(post.allowComments ?? true);
      setExistingAttachments(post.attachments || []);

      // Check if current user is the post owner
      if (user?.id !== post.teacher.id) {
        router.push(`/community/post/${postId}`);
      }
    }
  }, [post, user, postId, router]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      // Strip HTML tags and trim description
      const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
      
      // Update post
      await updatePost(postId, {
        title: title.trim(),
        description: cleanDescription || undefined, // Send undefined if empty
        categoryId,
        communityId, // Include communityId
      });

      // Upload new attachments
      for (const file of newFiles) {
        await uploadAttachment(postId, file);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      toast.success("Post updated successfully!");
      setTimeout(() => router.push(`/community/post/${postId}`), 500);
    },
    onError: () => {
      toast.error("Failed to update post. Please try again.");
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const api = await import("@/lib/axios").then((m) => m.default);
      await api.delete(`/community/posts/${postId}`);
    },
    onSuccess: () => {
      toast.success("Post deleted successfully!");
      setTimeout(() => router.push("/profile/posts"), 500);
    },
    onError: () => {
      toast.error("Failed to delete post. Please try again.");
    },
  });

  // Text formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...files]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      setNewFiles((prev) => [...prev, ...files]);
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = async (id: string) => {
    try {
      await deleteAttachment(id);
      setExistingAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Failed to delete attachment:", error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("doc")) return "📝";
    if (type.includes("image")) return "🖼️";
    return "📎";
  };

  if (postLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex h-[calc(100vh-64px)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex h-[calc(100vh-64px)] items-center justify-center">
            <p className="text-slate-600">Post not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <ConfirmDialog
          isOpen={confirm.isOpen}
          title={confirm.options.title}
          message={confirm.options.message}
          confirmText={confirm.options.confirmText}
          cancelText={confirm.options.cancelText}
          type={confirm.options.type}
          onConfirm={confirm.handleConfirm}
          onCancel={confirm.handleCancel}
        />
        <div className="h-[calc(100vh-64px)] overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-4xl">
            {/* Compact Header */}
            <div className="mb-4 flex items-center justify-between">
              <Link
                href="/profile/posts"
                className="flex items-center gap-2 text-sm font-medium text-[#043658] hover:text-[#FFC107] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#043658] to-[#065a8f] flex items-center justify-center text-white text-sm font-semibold">
                  {user?.firstName?.charAt(0) || "U"}
                </div>
                <span className="text-xs font-medium text-[#043658] hidden sm:inline">
                  {user?.firstName}
                </span>
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#043658] to-[#065a8f] px-6 py-4">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Post
                </h1>
                <p className="text-sm text-blue-100 mt-1">
                  Update your contribution
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Post Title */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#043658]">
                    Title <span className="text-[#FFC107]">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter post title..."
                    className="w-full rounded-lg border-2 border-slate-200 px-4 py-2.5 text-[#043658] font-medium placeholder:text-slate-400 focus:border-[#FFC107] focus:outline-none focus:ring-2 focus:ring-[#FFC107]/20 transition-all"
                  />
                </div>

                {/* Rich Text Editor */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#043658]">
                    Description
                  </label>
                  
                  {/* Compact Toolbar */}
                  <div className="mb-2 flex items-center gap-1 rounded-lg border-2 border-slate-200 bg-slate-50 p-1.5">
                    <button
                      type="button"
                      onClick={() => formatText("bold")}
                      className="rounded-md p-1.5 hover:bg-[#FFC107]/20 hover:text-[#043658] transition-all"
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText("italic")}
                      className="rounded-md p-1.5 hover:bg-[#FFC107]/20 hover:text-[#043658] transition-all"
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText("underline")}
                      className="rounded-md p-1.5 hover:bg-[#FFC107]/20 hover:text-[#043658] transition-all"
                      title="Underline"
                    >
                      <Underline className="h-4 w-4" />
                    </button>
                    <div className="mx-1 h-4 w-px bg-slate-300" />
                    <button
                      type="button"
                      onClick={() => formatText("insertUnorderedList")}
                      className="rounded-md p-1.5 hover:bg-[#FFC107]/20 hover:text-[#043658] transition-all"
                      title="Bullet List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText("insertOrderedList")}
                      className="rounded-md p-1.5 hover:bg-[#FFC107]/20 hover:text-[#043658] transition-all"
                      title="Numbered List"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </button>
                    <div className="mx-1 h-4 w-px bg-slate-300" />
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt("Enter URL:");
                        if (url) formatText("createLink", url);
                      }}
                      className="rounded-md p-1.5 hover:bg-[#FFC107]/20 hover:text-[#043658] transition-all"
                      title="Insert Link"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Editor */}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setDescription(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: description }}
                    className="min-h-[150px] rounded-lg border-2 border-slate-200 p-3 text-sm text-[#043658] focus:border-[#FFC107] focus:outline-none focus:ring-2 focus:ring-[#FFC107]/20 transition-all"
                    data-placeholder="Describe your post..."
                  />
                </div>

                {/* Community & Category in Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#043658]">
                      Community
                    </label>
                    <select
                      value={communityId}
                      onChange={(e) => setCommunityId(e.target.value)}
                      disabled
                      className="w-full rounded-lg border-2 border-slate-200 px-3 py-2.5 text-sm text-slate-500 bg-slate-100 cursor-not-allowed focus:outline-none"
                    >
                      <option value={post.community.id}>{post.community.name}</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#043658]">
                      Category <span className="text-[#FFC107]">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-200 px-3 py-2.5 text-sm text-[#043658] font-medium focus:border-[#FFC107] focus:outline-none focus:ring-2 focus:ring-[#FFC107]/20 transition-all"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Compact Settings */}
                <div className="flex items-center justify-between rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-[#043658]" />
                    <div>
                      <p className="text-xs font-semibold text-[#043658]">Public Post</p>
                      <p className="text-xs text-slate-500">Visible to community</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowComments}
                      onChange={(e) => setAllowComments(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#FFC107] focus:ring-[#FFC107]"
                    />
                    <span className="text-xs font-medium text-[#043658]">Allow comments</span>
                  </label>
                </div>

                {/* Attachments - Compact */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-semibold text-[#043658]">
                      Attachments ({existingAttachments.length + newFiles.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FFC107] to-[#FFD54F] px-3 py-1.5 text-xs font-semibold text-[#043658] hover:shadow-lg transition-all"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Add File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Existing Attachments */}
                  {existingAttachments.length > 0 && (
                    <div className="mb-2 space-y-2">
                      {existingAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 rounded-lg border border-[#043658]/20 bg-[#043658]/5 p-2"
                        >
                          {attachment.type === "IMAGE" ? (
                            <img
                              src={getMediaUrl(attachment.url)}
                              alt={attachment.fileName || "Attachment"}
                              className="h-10 w-10 rounded object-cover border border-[#043658]/20"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-[#043658] text-lg">
                              {getFileIcon(attachment.type)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#043658] truncate">
                              {attachment.fileName || "Attachment"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(attachment.fileSize)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeExistingAttachment(attachment.id)}
                            className="rounded p-1 text-red-600 hover:bg-red-50 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Files */}
                  {newFiles.length > 0 && (
                    <div className="mb-2 space-y-2">
                      {newFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-lg border-2 border-[#FFC107] bg-[#FFC107]/10 p-2"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#FFC107] text-lg">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#043658] truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(file.size)} • New
                            </p>
                          </div>
                          <button
                            onClick={() => removeNewFile(index)}
                            className="rounded p-1 text-red-600 hover:bg-red-100 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Compact Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`rounded-lg border-2 border-dashed p-4 text-center transition-all ${
                      isDragging
                        ? "border-[#FFC107] bg-[#FFC107]/10"
                        : "border-slate-300 bg-slate-50"
                    }`}
                  >
                    <Upload className="mx-auto h-6 w-6 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-600">
                      Drag & drop or click Add File
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Images, PDF, DOCX (max 10MB)
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => router.push("/profile/posts")}
                    className="flex-1 rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending || !title || !categoryId}
                    className="flex-1 rounded-lg bg-gradient-to-r from-[#043658] to-[#065a8f] px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>

                {updateMutation.isError && (
                  <div className="rounded-lg bg-red-50 border-2 border-red-200 p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-900">Failed to save</p>
                      <p className="text-xs text-red-700 mt-0.5">
                        {(updateMutation.error as Error)?.message || "Please try again"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Delete Post */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={async () => {
                      const confirmed = await confirm.confirm({
                        title: "Delete Post",
                        message: "Are you sure you want to delete this post? This action cannot be undone and all associated data will be permanently removed.",
                        confirmText: "Delete Permanently",
                        cancelText: "Cancel",
                        type: "danger",
                      });
                      
                      if (confirmed) {
                        deleteMutation.mutate();
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete Post Permanently
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
