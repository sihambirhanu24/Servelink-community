interface EventItem {
  id: string;
  accentColor: string; // tailwind bg class
  dateLabel: string;
  title: string;
  actionLabel: string;
  detail: string;
}

const MOCK_EVENTS: EventItem[] = [
  {
    id: '1',
    accentColor: 'bg-[#FFC107]',
    dateLabel: 'Oct 24',
    title: 'Digital Literacy in Rural Schools',
    actionLabel: 'Join Session',
    detail: '',
  },
  {
    id: '2',
    accentColor: 'bg-blue-500',
    dateLabel: 'Oct 28',
    title: 'Advanced Pedagogy Workshop',
    actionLabel: '',
    detail: 'In-person session at Zone Office.',
  },
];

export function UpcomingEventsCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-3">Upcoming Events</h3>
      <div className="space-y-3">
        {MOCK_EVENTS.map((event) => (
          <div key={event.id} className="rounded-xl bg-[#043658] p-3.5 text-white overflow-hidden relative">
            <span className={`absolute top-0 left-0 right-0 h-1 ${event.accentColor}`} />
            <p className="text-[10px] font-semibold text-slate-300">{event.dateLabel}</p>
            <p className="text-sm font-semibold mt-0.5">{event.title}</p>
            {event.actionLabel && (
              <button className="mt-2 text-xs font-medium text-[#FFC107] hover:underline">
                {event.actionLabel}
              </button>
            )}
            {event.detail && <p className="mt-1 text-xs text-slate-400">{event.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
