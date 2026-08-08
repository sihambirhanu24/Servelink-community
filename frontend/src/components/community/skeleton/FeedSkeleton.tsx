export default function FeedSkeleton() {
  return (
    <div className="space-y-6">

      {[1, 2, 3].map((item) => (

        <div
          key={item}
          className="h-64 animate-pulse rounded-[28px] bg-gray-200"
        />

      ))}

    </div>
  );
}