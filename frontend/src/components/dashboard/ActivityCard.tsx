interface Props {
  title: string;
  description: string;
  time: string;
}

export default function ActivityCard({
  title,
  description,
  time,
}: Props) {
  return (
    <div className="flex gap-4 border-b border-gray-100 py-5 last:border-none">

      <div className="mt-1 h-3 w-3 rounded-full bg-[#FFC107]" />

      <div className="flex-1">

        <h3 className="font-semibold text-[#043658]">
          {title}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>

      </div>

      <span className="text-sm text-gray-400">
        {time}
      </span>

    </div>
  );
}