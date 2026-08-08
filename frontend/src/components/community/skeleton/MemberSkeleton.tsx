export default function MemberSkeleton() {
  return (
    <div className="space-y-5">

      {[1, 2, 3, 4].map((item) => (

        <div
          key={item}
          className="h-16 animate-pulse rounded-xl bg-gray-200"
        />

      ))}

    </div>
  );
}