"use client";

import { MONTH_NAMES, daysInMonth } from "@/lib/birthday";

type Props = {
  month:     number | null;
  day:       number | null;
  onChange:  (month: number | null, day: number | null) => void;
  error?:    boolean;
};

export function BirthdayFields({ month, day, onChange, error }: Props) {
  const maxDay = month ? daysInMonth(month) : 31;
  const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);

  const selectClass = `w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white ${
    error ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-primary"
  }`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <select
        aria-label="Birthday day"
        value={day ?? ""}
        onChange={(e) => onChange(month, e.target.value ? Number(e.target.value) : null)}
        className={selectClass}
      >
        <option value="">Day</option>
        {dayOptions.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select
        aria-label="Birthday month"
        value={month ?? ""}
        onChange={(e) => {
          const m = e.target.value ? Number(e.target.value) : null;
          const clampedDay = m && day && day > daysInMonth(m) ? daysInMonth(m) : day;
          onChange(m, clampedDay);
        }}
        className={selectClass}
      >
        <option value="">Month</option>
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>
    </div>
  );
}
