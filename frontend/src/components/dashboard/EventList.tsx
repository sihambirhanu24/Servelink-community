import EventCard from "./EventCard";

const events = [
  {
    title: "STEM Leadership Summit",
    date: "12 October",
  },
  {
    title: "Grant Writing Workshop",
    date: "17 October",
  },
];

export default function EventList() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold text-[#043658]">
        Upcoming Events
      </h2>

      <div className="space-y-4">

        {events.map((event) => (
          <EventCard
            key={event.title}
            {...event}
          />
        ))}

      </div>

    </div>
  );
}