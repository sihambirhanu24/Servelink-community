import { Post } from "@/types/community";

interface Props {
  post: Post;
}

export default function PostContent({
  post,
}: Props) {
  return (
    <div className="mt-6">

      <h2 className="text-2xl font-bold">

        {post.title}

      </h2>

      <p className="mt-4 leading-8 text-gray-600">

        {post.description}

      </p>

    </div>
  );
}