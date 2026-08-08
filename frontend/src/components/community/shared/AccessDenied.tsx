"use client";

import { ShieldOff } from "lucide-react";
import Link from "next/link";

interface Props {
  requiredLevel: number;
  currentLevel: number;
  communityName: string;
}

const LEVEL_LABEL: Record<number, string> = {
  1: "Level 1",
  2: "Level 2",
  3: "Level 3",
  4: "Level 4",
  5: "Level 5",
};

export default function AccessDenied({ requiredLevel, currentLevel, communityName }: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <ShieldOff className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="font-['Lexend'] text-2xl font-semibold text-[#043658]">Access Denied</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          The <span className="font-semibold text-[#043658]">{communityName}</span> Community requires{" "}
          <span className="font-semibold text-[#043658]">{LEVEL_LABEL[requiredLevel]}</span> or higher.
          Your current level is{" "}
          <span className="font-semibold text-red-500">{LEVEL_LABEL[currentLevel]}</span>.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Continue contributing in your current communities to advance your level.
        </p>
        <Link
          href="/community"
          id="access-denied-back"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#043658] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#032742]"
        >
          Back to Communities
        </Link>
      </div>
    </div>
  );
}
