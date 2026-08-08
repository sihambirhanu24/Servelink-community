"use client";

interface Props {
  joined?: boolean;
  onClick?: () => void;
}

export default function JoinButton({
  joined = false,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-2 font-semibold transition ${
        joined
          ? "bg-gray-200 text-gray-700"
          : "bg-[#043658] text-white hover:bg-[#032B46]"
      }`}
    >
      {joined ? "Joined" : "Join"}
    </button>
  );
}