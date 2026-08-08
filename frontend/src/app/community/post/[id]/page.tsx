import {
  PostCard,
} from "@/components/community";

import TrendingTopics from "@/components/community/sidebar/TrendingTopics";
import ActiveMembers from "@/components/community/member/ActiveMembers";

const fallbackPost = {
  id: "demo-post",
  title: "Community highlight",
  description: "A sample post to show the detail layout.",
  teacher: {
    id: "demo-teacher",
    firstName: "Demo",
    lastName: "Teacher",
    level: "LEVEL_4",
    profileImage: "",
  },
  community: {
    id: "demo-community",
    name: "General Community",
  },
  category: {
    id: "demo-category",
    name: "Resources",
  },
  attachments: [],
  comments: [],
  likesCount: 12,
  bookmarks: 3,
  createdAt: "Just now",
};

export default function PostPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_360px]">

      <div className="space-y-8">

        <PostCard post={fallbackPost as any} />

      </div>

      <div className="space-y-8">

        <TrendingTopics />

        <ActiveMembers />

      </div>

    </div>
  );
}