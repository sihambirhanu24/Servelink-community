"use client";

interface Props {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export default function DeleteModal({
  open,
  onClose,
  onDelete,
  isDeleting = false,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">

        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
            🗑️
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-slate-800">
          Delete Post
        </h2>

        <p className="mt-4 text-center text-gray-600">
          Are you sure you want to delete this post?
        </p>

        <p className="mt-1 text-center text-sm text-red-500">
          This action cannot be undone.
        </p>

        <div className="mt-8 flex justify-end gap-4">

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg border border-gray-300 px-5 py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>

        </div>

      </div>

    </div>
  );
}