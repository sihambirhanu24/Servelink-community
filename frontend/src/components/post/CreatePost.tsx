// "use client";

// import { useState } from "react";
// import { createPost } from "@/services/community";
// import { useRouter } from "next/navigation";

// export default function CreatePost() {
//   const router = useRouter();

//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [communityId, setCommunityId] = useState("");
//   const [categoryId, setCategoryId] = useState("");

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();

//     await createPost({
//       title,
//       description,
//       communityId,
//       categoryId,
//     });

//     router.push("/posts");
//   }

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow"
//     >
//       <h1 className="text-3xl font-bold mb-8">
//         Create Post
//       </h1>

//       <input
//         className="w-full border p-3 rounded mb-4"
//         placeholder="Title"
//         value={title}
//         onChange={(e)=>setTitle(e.target.value)}
//       />

//       <textarea
//         className="w-full border p-3 rounded mb-4"
//         rows={6}
//         placeholder="Description"
//         value={description}
//         onChange={(e)=>setDescription(e.target.value)}
//       />

//       <input
//         className="w-full border p-3 rounded mb-4"
//         placeholder="Community ID"
//         value={communityId}
//         onChange={(e)=>setCommunityId(e.target.value)}
//       />

//       <input
//         className="w-full border p-3 rounded mb-6"
//         placeholder="Category ID"
//         value={categoryId}
//         onChange={(e)=>setCategoryId(e.target.value)}
//       />

//       <button
//         className="bg-blue-600 text-white px-8 py-3 rounded-lg"
//       >
//         Create
//       </button>
//     </form>
//   );
// }