"use client";

import {
  Users,
  MessageCircle,
  Heart,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    title: "Members",
    value: "12.4K",
    icon: Users,
  },
  {
    title: "Posts",
    value: "3.8K",
    icon: MessageCircle,
  },
  {
    title: "Likes",
    value: "45K",
    icon: Heart,
  },
  {
    title: "Growth",
    value: "+18%",
    icon: TrendingUp,
  },
];

export default function CommunityStats() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

      {stats.map((item) => {

        const Icon = item.icon;

        return (

          <div
            key={item.title}
            className="
            rounded-[28px]
            bg-white
            p-6
            shadow-sm
            transition
            hover:-translate-y-1
            hover:shadow-xl
            "
          >

            <div className="flex items-center justify-between">

              <Icon
                size={30}
                className="text-[#043658]"
              />

              <span className="text-xs text-green-500">
                Live
              </span>

            </div>

            <h2 className="mt-8 text-4xl font-bold">
              {item.value}
            </h2>

            <p className="mt-2 text-gray-500">
              {item.title}
            </p>

          </div>

        );

      })}

    </div>
  );
}