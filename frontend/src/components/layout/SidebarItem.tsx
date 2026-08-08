"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

interface Props {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export default function SidebarItem({
  href,
  icon,
  label,
}: Props) {
  const pathname = usePathname();

  const active = pathname === href;

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-300",
        active
          ? "bg-[#043658] text-white shadow-lg"
          : "text-gray-500 hover:bg-gray-100 hover:text-[#043658]"
      )}
    >
      {icon}

      <span className="font-medium">
        {label}
      </span>
    </Link>
  );
}