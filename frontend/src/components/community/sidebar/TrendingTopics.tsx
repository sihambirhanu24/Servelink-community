"use client";

import { TrendingUp } from "lucide-react";

const topics = [
  {
    title: "AI in Education",
    posts: 234,
  },
  {
    title: "STEM Learning",
    posts: 198,
  },
  {
    title: "Digital Classroom",
    posts: 154,
  },
  {
    title: "Curriculum Design",
    posts: 120,
  },
];

export default function TrendingTopics() {
  return (
    <div className="rounded-[28px] bg-white p-6 shadow-sm">

      <div className="mb-6 flex items-center justify-between">

        <h2 className="text-xl font-bold text-[#043658]">
          Trending Topics
        </h2>

        <TrendingUp
          className="text-[#FFC107]"
          size={22}
        />

      </div>

      <div className="space-y-4">

        {topics.map((topic) => (

          <div
            key={topic.title}
            className="cursor-pointer rounded-2xl bg-[#F7F9FC] p-4 transition hover:-translate-y-1 hover:bg-[#EDF3F8]"
          >

            <h3 className="font-semibold text-[#043658]">
              #{topic.title}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {topic.posts} discussions
            </p>

          </div>

        ))}

      </div>

    </div>
  );
}