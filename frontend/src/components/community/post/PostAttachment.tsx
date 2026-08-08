import { Post } from "@/types/community";
import { getMediaUrl } from "@/lib/media";

interface Props {
  post: Post;
}

export default function PostAttachment({ post }: Props) {
  if (!post.attachments?.length) return null;

  return (
    <div className="mt-5 space-y-3">
      {post.attachments.map((file) => {
        const url = getMediaUrl(file.url);

        if (file.type === "IMAGE") {
          return (
            <img
              key={file.id}
              src={url}
              alt=""
              className="w-full rounded-xl object-cover max-h-[500px]"
            />
          );
        }

        if (file.type === "VIDEO") {
          return (
            <video
              key={file.id}
              src={url}
              controls
              className="w-full rounded-xl max-h-[500px]"
            />
          );
        }

        return (
          <a
            key={file.id}
            href={url}
            target="_blank"
            className="text-blue-600 underline"
          >
            {file.url}
          </a>
        );
      })}
    </div>
  );
}