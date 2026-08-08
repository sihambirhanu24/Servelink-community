import Feed from "@/components/community/feed/Feed";

export default function BookmarkPage() {
  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-4xl font-bold text-[#043658]">
          Saved Posts
        </h1>

        <p className="text-gray-500">
          Posts you've bookmarked.
        </p>

      </div>

      <Feed />

    </div>
  );
}