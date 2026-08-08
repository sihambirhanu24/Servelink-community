interface Props {
  title: string;
  date: string;
}

export default function EventCard({
  title,
  date,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 p-5">

      <h3 className="font-semibold text-[#043658]">
        {title}
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        {date}
      </p>

    </div>
  );
}