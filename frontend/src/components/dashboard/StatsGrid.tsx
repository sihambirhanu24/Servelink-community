import {
  Users,
  FileText,
  MessageCircle,
  Heart,
} from "lucide-react";

import { StatCard } from './StatCard';

export default function StatsGrid() {
  return (
    <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">

      <StatCard
        label="Communities"
        value="14"
        iconColor="text-blue-600"
        icon={Users}
      />

      <StatCard
        label="Posts"
        value="128"
        iconColor="text-[#926E00]"
        icon={FileText}
      />

      <StatCard
        label="Comments"
        value="325"
        iconColor="text-emerald-600"
        icon={MessageCircle}
      />

      <StatCard
        label="Likes"
        value="1,080"
        iconColor="text-red-600"
        icon={Heart}
      />

    </section>
  );
}