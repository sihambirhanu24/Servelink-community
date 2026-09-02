import { Post } from "@/types/community";
import { sanitizeHtml } from "@/lib/sanitize";

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

      <div 
        className="mt-4 leading-8 text-gray-700 prose prose-sm max-w-none prose-p:my-2 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-4 prose-ol:pl-4 prose-a:text-[#043658] prose-a:underline hover:prose-a:text-[#FFC107]"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.description) }}
      />

    </div>
  );
}