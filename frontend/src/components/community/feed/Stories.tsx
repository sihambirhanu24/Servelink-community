"use client";

const stories = [
  {
    name: "Sarah",
    color: "bg-pink-500",
  },
  {
    name: "John",
    color: "bg-blue-500",
  },
  {
    name: "Helen",
    color: "bg-green-500",
  },
  {
    name: "Daniel",
    color: "bg-yellow-500",
  },
  {
    name: "Abel",
    color: "bg-purple-500",
  },
];

export default function Stories() {
  return (
    <div className="flex gap-5 overflow-x-auto">

      {stories.map((story) => (

        <div
          key={story.name}
          className="min-w-[90px]"
        >

          <div
            className={`h-20 w-20 rounded-full border-4 border-[#FFC107] ${story.color}`}
          />

          <p className="mt-2 text-center text-sm">
            {story.name}
          </p>

        </div>

      ))}

    </div>
  );
}