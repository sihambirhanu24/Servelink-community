
import DashboardCard from "../common/DashboardCard";

interface Props {
  statistics: any;
}

export default function StatsGrid({
  statistics,
}: Props) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

      <DashboardCard
        title="Posts"
        value={statistics?.posts || 0}
      />

      <DashboardCard
        title="Comments"
        value={statistics?.comments || 0}
      />

      <DashboardCard
        title="Likes"
        value={statistics?.likes || 0}
      />

      <DashboardCard
        title="Communities"
        value={statistics?.communities || 0}
      />

    </div>
  );
}