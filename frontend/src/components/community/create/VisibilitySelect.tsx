"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function VisibilitySelect({
  value,
  onChange,
}: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10"
    >
      <option value="PUBLIC">
        🌍 Public
      </option>

      <option value="COMMUNITY">
        🏫 Community Only
      </option>

      <option value="PRIVATE">
        👥 Private
      </option>
    </select>
  );
}