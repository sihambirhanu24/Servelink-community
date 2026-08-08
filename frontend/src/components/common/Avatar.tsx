"use client";

import { getMediaUrl } from "@/lib/media";

interface AvatarProps {
  name: string;
  profileImage?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  showRing?: boolean;
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function Avatar({
  name,
  profileImage,
  size = "md",
  className = "",
  onClick,
  showRing = false,
}: AvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = SIZE_CLASSES[size];
  const ringClass = showRing
    ? "ring-2 ring-[#FFC107] ring-offset-1"
    : "";
  const cursorClass = onClick ? "cursor-pointer" : "";

  const imageUrl = profileImage ? getMediaUrl(profileImage) : null;

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        onClick={onClick}
        className={`${sizeClass} ${ringClass} ${cursorClass} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${sizeClass} ${ringClass} ${cursorClass} shrink-0 rounded-full bg-[#043658] flex items-center justify-center font-semibold text-white ${className}`}
    >
      {initials}
    </div>
  );
}
