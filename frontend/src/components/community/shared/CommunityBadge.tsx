interface Props {
  level: string;
}

export default function CommunityBadge({
  level,
}: Props) {
  return (
    <span
      className="
      rounded-full
      bg-[#FFC107]/20
      px-4
      py-1
      text-xs
      font-semibold
      text-[#A96E00]
      "
    >
      {level}
    </span>
  );
}