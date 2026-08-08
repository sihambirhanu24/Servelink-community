"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getPostById } from "@/services/community";

import ViewPost from "@/components/post/ViewPost";

export default function Page() {

  const { id } = useParams();

  const [post, setPost] = useState<any>();

  useEffect(() => {

    loadPost();

  }, []);

  async function loadPost() {

    try {

      const data = await getPostById(id as string);

      setPost(data);

    } catch (error) {

      console.log(error);

    }

  }

  if (!post) {

    return (

      <div className="flex h-screen items-center justify-center">

        Loading...

      </div>

    );

  }

  return <ViewPost post={post} />;

}