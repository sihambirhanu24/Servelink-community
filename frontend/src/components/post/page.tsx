"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import BackButton from "@/components/common/BackButton";
import { getMyPosts } from "@/services/profile";
import { deletePost } from "@/services/community";

interface Post {
  id: string;
  title: string;
  description: string;
  createdAt: string;

  community: {
    name: string;
  };

  category: {
    name: string;
  };
}

export default function MyPostsPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);

      const data = await getMyPosts();

      setPosts(data);
    } catch (error) {
      console.log(error);
      alert("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Are you sure you want to delete this post?");

    if (!confirmed) return;

    try {
      await deletePost(id);

      alert("Post deleted successfully.");

      loadPosts();
    } catch (error) {
      console.log(error);
      alert("Failed to delete post.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <BackButton />

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-slate-800">
          My Posts
        </h1>

        <button
          onClick={() => router.push("/post")}
          className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
        >
          Create Post
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center shadow">
          Loading posts...
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow">
          <h2 className="text-xl font-semibold">
            No posts yet
          </h2>

          <p className="mt-2 text-gray-500">
            You haven't created any posts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl bg-white p-6 shadow transition hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {post.title}
                  </h2>

                  <p className="mt-3 text-gray-600">
                    {post.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-6 text-sm text-gray-500">
                    <span>
                      <strong>Community:</strong>{" "}
                      {post.community.name}
                    </span>

                    <span>
                      <strong>Category:</strong>{" "}
                      {post.category.name}
                    </span>

                    <span>
                      <strong>Created:</strong>{" "}
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => router.push(`/post/${post.id}`)}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
                >
                  View
                </button>

                <button
                  onClick={() =>
                    router.push(`/post/edit/${post.id}`)
                  }
                  className="rounded-lg bg-yellow-500 px-5 py-2 text-white hover:bg-yellow-600"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(post.id)}
                  className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}