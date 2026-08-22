"use client";

import { useState } from "react";
import { FileText, Video } from "lucide-react";
import { getMediaUrl } from "@/lib/media";

interface Attachment {
  id: string;
  url: string;
  type: "IMAGE" | "PDF" | "DOCX" | "VIDEO";
  fileName?: string;
  fileSize?: number;
}

interface PostAttachmentProps {
  attachments: Attachment[];
  onImageClick?: (url: string) => void;
}

export function PostAttachment({ attachments, onImageClick }: PostAttachmentProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const imageAttachments = attachments.filter((a) => a.type === "IMAGE");
  const documentAttachments = attachments.filter((a) => a.type !== "IMAGE");

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
    onImageClick?.(url);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <>
      {attachments.length > 0 && (
        <div className="mt-4 space-y-3">
          {imageAttachments.length > 0 && (
            <div
              className={
                imageAttachments.length === 1
                  ? "grid grid-cols-1"
                  : imageAttachments.length === 2
                  ? "grid grid-cols-2 gap-2"
                  : "grid grid-cols-2 gap-2"
              }
            >
              {imageAttachments.slice(0, 4).map((attachment, index) => {
                const url = getMediaUrl(attachment.url);
                const isLastVisible = index === 3;
                const remainingCount = imageAttachments.length - 4;

                return (
                  <button
                    key={attachment.id}
                    type="button"
                    onClick={() => handleImageClick(url)}
                    className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 text-left bg-slate-50"
                  >
                    <img
                      src={url}
                      alt={attachment.fileName ?? "Attachment"}
                      className={`w-full object-cover transition duration-300 group-hover:scale-[1.02] ${
                        imageAttachments.length === 1 ? "max-h-[350px]" : "h-52"
                      }`}
                    />
                    {isLastVisible && remainingCount > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-semibold text-white transition group-hover:bg-black/40">
                        +{remainingCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {documentAttachments.length > 0 && (
            <div className="space-y-2">
              {documentAttachments.map((attachment) => {
                const url = getMediaUrl(attachment.url);
                const isPdf = attachment.type === "PDF";
                const isDocx = attachment.type === "DOCX";
                const isVideo = attachment.type === "VIDEO";

                return (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          isPdf
                            ? "bg-red-100 text-red-600"
                            : isDocx
                            ? "bg-blue-100 text-blue-600"
                            : isVideo
                            ? "bg-purple-100 text-purple-600"
                            : "bg-[#043658]/10 text-[#043658]"
                        }`}
                      >
                        {isPdf ? (
                          <FileText className="h-5 w-5" />
                        ) : isDocx ? (
                          <FileText className="h-5 w-5" />
                        ) : isVideo ? (
                          <Video className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#043658]">{attachment.fileName ?? attachment.type}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(attachment.fileSize)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#043658] transition hover:bg-slate-50"
                      >
                        Open
                      </a>
                      <a
                        href={url}
                        download
                        className="rounded-lg border border-[#043658]/15 bg-[#043658]/5 px-3 py-1.5 text-xs font-semibold text-[#043658] transition hover:bg-[#043658]/10"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white p-2"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-[#043658] shadow-lg hover:bg-white transition-colors"
            >
              Close
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-h-[85vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
