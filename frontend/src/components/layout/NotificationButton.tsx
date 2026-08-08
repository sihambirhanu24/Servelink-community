"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationButton() {
  return (
    <Link href="/notifications" aria-label="Open notifications" className="relative rounded-xl bg-white p-3 shadow-sm">

      <Bell />

      <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />

    </Link>
  );
}