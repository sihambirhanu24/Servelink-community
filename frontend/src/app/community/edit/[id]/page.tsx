import { CreatePostForm } from "@/components/community/create";

export default function EditPostPage() {
  return (
    <div className="mx-auto max-w-5xl">

      <h1 className="mb-8 text-4xl font-bold">
        Edit Post
      </h1>

      <CreatePostForm />

    </div>
  );
}