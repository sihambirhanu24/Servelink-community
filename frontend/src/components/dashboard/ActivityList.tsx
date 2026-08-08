import ActivityCard from "./ActivityCard";

const activities = [
  {
    title: "Modern Physics",
    description: "Shared new teaching resources.",
    time: "2h ago",
  },
  {
    title: "Community Catalyst",
    description: "Earned 500 membership points.",
    time: "Yesterday",
  },
  {
    title: "Interactive Algebra",
    description: "Downloaded lesson materials.",
    time: "2 days",
  },
];

export default function ActivityList() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold text-[#043658]">
        Recent Activity
      </h2>

      {activities.map((activity) => (
        <ActivityCard
          key={activity.title}
          {...activity}
        />
      ))}

    </div>
  );
}