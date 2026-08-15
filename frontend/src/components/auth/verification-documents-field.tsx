'use client';

import { useRef } from 'react';
import {
  ACCEPTED_VERIFICATION_MIME_TYPES,
  MAX_VERIFICATION_DOCUMENTS,
  VERIFICATION_DOCUMENT_TYPES,
  VerificationDocumentType,
  VerificationDocumentValue,
} from '@/lib/auth-schemas';

const DOCUMENT_TYPE_LABELS: Record<VerificationDocumentType, string> = {
  TEACHER_ID: 'Teacher / Staff ID',
  EMPLOYMENT_LETTER: 'Employment Letter',
  CERTIFICATE: 'Teaching Certificate',
  OTHER: 'Other official document',
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  documents: VerificationDocumentValue[];
  onChange: (documents: VerificationDocumentValue[]) => void;
  error?: string;
};

/**
 * File picker for teacher verification evidence. Shared by registration and
 * the profile resubmission flow.
 */
export function VerificationDocumentsField({ documents, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = MAX_VERIFICATION_DOCUMENTS - documents.length;

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const added = Array.from(files)
      .slice(0, remaining)
      .map((file) => ({
        file,
        documentType: 'TEACHER_ID' as VerificationDocumentType,
      }));
    onChange([...documents, ...added]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_VERIFICATION_MIME_TYPES.join(',')}
        className="hidden"
        onChange={(event) => addFiles(event.target.files)}
      />

      <button
        type="button"
        disabled={remaining <= 0}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border border-dashed border-[#043658]/40 bg-white py-3 text-xs font-semibold text-[#043658] hover:bg-[#043658]/5 transition-colors disabled:opacity-50"
      >
        {remaining > 0
          ? `+ Add document (${remaining} remaining)`
          : 'Maximum of 3 documents added'}
      </button>

      <p className="mt-1 text-[11px] text-slate-500">
        PDF, DOCX, JPG or PNG only. Maximum file size is 5 MB.
      </p>

      {documents.length > 0 && (
        <ul className="mt-2 space-y-2">
          {documents.map((document, index) => (
            <li
              key={`${document.file.name}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {document.file.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {document.file.type || 'unknown type'} · {formatSize(document.file.size)}
                </p>
              </div>

              <select
                value={document.documentType}
                onChange={(event) =>
                  onChange(
                    documents.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            documentType: event.target
                              .value as VerificationDocumentType,
                          }
                        : item,
                    ),
                  )
                }
                className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
              >
                {VERIFICATION_DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {DOCUMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() =>
                  onChange(documents.filter((_, itemIndex) => itemIndex !== index))
                }
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
