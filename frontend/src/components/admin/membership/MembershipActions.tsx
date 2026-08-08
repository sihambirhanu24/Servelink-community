"use client";

import { useApproveMembership } from "@/hooks/useApproveMembership";
import { useRejectMembership } from "@/hooks/useRejectMembership";

export default function MembershipActions({
  request,
}: {
  request: any;
}) {

  const approve =
    useApproveMembership();

  const reject =
    useRejectMembership();

  return (
    <div className="flex gap-2">

      <button
        disabled={!request.eligible}
        onClick={() =>
          approve.mutate(request.id)
        }
        className={`rounded-xl px-4 py-2 text-white ${
          request.eligible
            ? "bg-green-600 hover:bg-green-700"
            : "cursor-not-allowed bg-gray-400"
        }`}
      >
        Approve
      </button>

      <button
        onClick={() =>
          reject.mutate(request.id)
        }
        className="rounded-xl bg-red-500 px-4 py-2 text-white hover:bg-red-600"
      >
        Reject
      </button>

    </div>
  );
}