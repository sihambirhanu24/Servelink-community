import Link from "next/link";

interface Props {
  id: string;
  name: string;
  description: string;
  members: number;
  posts: number;
}

export default function CommunityCard({
  id,
  name,
  description,
  members,
  posts,
}: Props) {
  return (
    <Link href={`/community/${id}`}>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:border-[#FFC107] hover:shadow-xl">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#043658]">
            {name}
          </h2>

          <span className="rounded-full bg-[#FFC107] px-3 py-1 text-sm font-semibold text-[#043658]">
            Active
          </span>
        </div>

        <p className="mb-6 text-gray-600">
          {description}
        </p>

        <div className="flex justify-between text-sm">
          <div>
            <p className="font-bold text-[#043658]">
              {members}
            </p>

            <p className="text-gray-500">
              Members
            </p>
          </div>

          <div>
            <p className="font-bold text-[#043658]">
              {posts}
            </p>

            <p className="text-gray-500">
              Posts
            </p>
          </div>
        </div>

      </div>
    </Link>
  );
}