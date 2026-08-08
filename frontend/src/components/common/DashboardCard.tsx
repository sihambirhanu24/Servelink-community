interface Props {
  title: string;
  value: number;
}

export default function DashboardCard({
  title,
  value,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h3 className="text-gray-500">{title}</h3>

      <h1 className="mt-3 text-4xl font-bold text-[#043658]">
        {value}
      </h1>
    </div>
  );
}