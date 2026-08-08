import { MessageCircle, Heart, Bookmark } from "lucide-react";
import { Post } from "@/types/community";

interface Props {
  post: Post;
}

export default function PostStats({
  post,
}: Props) {
  return (
    <div className="mt-8 flex gap-8 text-sm text-gray-500">

      <div className="flex items-center gap-2">

        <Heart size={18} />

        {post.liked ? 1 : 0} Likes

      </div>

      <div className="flex items-center gap-2">

        <MessageCircle size={18} />

        {post.comments.length} Comments

      </div>

      <div className="flex items-center gap-2">

        <Bookmark size={18} />

        {post.bookmarks} Saves

      </div>

    </div>
  );
}