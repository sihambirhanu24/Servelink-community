import RecommendationCard from "./RecommendationCard";

const communities = [
  {
    title: "AI in Education",
    members: "2,410 teachers",
  },
  {
    title: "STEM Excellence",
    members: "1,870 teachers",
  },
];

export default function RecommendationList() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold text-[#043658]">
        Recommended Communities
      </h2>

      <div className="space-y-4">

        {communities.map((community) => (
          <RecommendationCard
            key={community.title}
            {...community}
          />
        ))}

      </div>

    </div>
  );
}