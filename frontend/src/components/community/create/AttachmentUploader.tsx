"use client";

import { File, FileImage, FileText, Upload, Video, X } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
}

export default function AttachmentUploader({
  files,
  onChange,
}: Props) {
  return (
    <div className="space-y-4 border-t border-slate-100 pt-8">
      <div>
        <h2 className="text-sm font-semibold text-[#043658]">Attachments</h2>
        <p className="mt-1 text-xs text-slate-400">Add supporting resources to make your post more useful.</p>
      </div>
      <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-9 text-center transition hover:border-[#043658]/40 hover:bg-[#043658]/[0.03]">
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4,video/webm,video/quicktime"
          className="sr-only"
          onChange={(e) => {
            if (!e.target.files) return;
            const selectedFiles = Array.from(e.target.files);
            const validFiles = selectedFiles.filter((file) =>
              ACCEPTED_FILE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE,
            );

            if (validFiles.length !== selectedFiles.length) {
              alert('Please select images, PDF, DOCX, MP4, WebM or MOV files up to 5 MB each.');
            }

            onChange(validFiles);
          }}
        />
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#043658]/10 text-[#043658] transition group-hover:-translate-y-1 group-hover:bg-[#FFC107]/20">
          <Upload className="h-6 w-6" />
        </span>
        <span className="mt-4 text-sm font-semibold text-[#043658]">Drag &amp; Drop files here</span>
        <span className="mt-1 text-sm text-slate-500">or <span className="font-semibold text-[#043658]">Browse Files</span></span>
        <span className="mt-3 text-xs text-slate-400">Images · PDF · DOCX · Video · Maximum size: 5 MB</span>
        <span className="mt-4 flex items-center gap-3 text-slate-400">
          <FileImage className="h-4 w-4" /><FileText className="h-4 w-4" /><Video className="h-4 w-4" />
        </span>
      </label>

      {files.length > 0 && <div className="grid gap-3 sm:grid-cols-2">
        {files.map((file) => (
          <div key={file.name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#043658]/10 text-[#043658]"><File className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#043658]">{file.name}</span><span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span></span>
            <span aria-hidden="true" className="text-slate-300"><X className="h-4 w-4" /></span>
          </div>
        ))}
      </div>}
    </div>
  );
}