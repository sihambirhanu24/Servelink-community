import React from "react";

export default function UpcomingEvents() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Upcoming Events</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          3 events
        </span>
      </div>

      <div className="space-y-3">
        {[
          { title: "Community Meetup", date: "Jul 30 • 6:00 PM" },
          { title: "Live Q&A Session", date: "Aug 2 • 7:30 PM" },
          { title: "Workshop: Build Together", date: "Aug 5 • 4:00 PM" },
        ].map((event) => (
          <div key={event.title} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">{event.title}</p>
            <p className="text-xs text-slate-500">{event.date}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
