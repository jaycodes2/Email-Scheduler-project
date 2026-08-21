import { useMemo } from "react";
import { Calendar } from "lucide-react";

interface SendLaterPopoverProps {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onDone: (selection: string) => void;
}

function formatOptionLabel(date: Date, label: string): string {
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${label}, ${time}`;
}

function buildQuickOptions(): { label: string; date: Date }[] {
  const now = new Date();
  const options: { label: string; date: Date }[] = [];

  // Later today, on the hour, every hour from the next full hour to 9pm
  const todayCursor = new Date(now);
  todayCursor.setMinutes(0, 0, 0);
  todayCursor.setHours(todayCursor.getHours() + 1);
  while (todayCursor.getHours() <= 21 && todayCursor.getHours() >= now.getHours()) {
    const d = new Date(todayCursor);
    options.push({ label: formatOptionLabel(d, "Today"), date: d });
    todayCursor.setHours(todayCursor.getHours() + 1);
  }

  // Tomorrow at a spread of useful times
  const tomorrowHours = [9, 10, 11, 15, 18];
  tomorrowHours.forEach((hour) => {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    options.push({ label: formatOptionLabel(d, "Tomorrow"), date: d });
  });

  // This weekend (next Saturday 9am) if not already past
  const weekend = new Date(now);
  const daysUntilSaturday = (6 - weekend.getDay() + 7) % 7 || 7;
  weekend.setDate(weekend.getDate() + daysUntilSaturday);
  weekend.setHours(9, 0, 0, 0);
  options.push({ label: formatOptionLabel(weekend, "Saturday"), date: weekend });

  // Next Monday 9am
  const monday = new Date(now);
  const daysUntilMonday = (8 - monday.getDay()) % 7 || 7;
  monday.setDate(monday.getDate() + daysUntilMonday);
  monday.setHours(9, 0, 0, 0);
  options.push({ label: formatOptionLabel(monday, "Monday"), date: monday });

  return options;
}

export default function SendLaterPopover({
  value,
  onChange,
  onCancel,
  onDone,
}: SendLaterPopoverProps) {
  const options = useMemo(buildQuickOptions, []);

  return (
    <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-white border border-gray-100 shadow-xl z-20 flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Send Later
        </h3>

        <label className="relative block">
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-gray-200 pl-3 pr-9 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 [color-scheme:light]"
          />
          <Calendar
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </label>
      </div>

      <div className="max-h-56 overflow-y-auto px-1 py-1">
        {options.map((opt) => {
          const isoLocal = toLocalInputValue(opt.date);
          const active = value === isoLocal;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(isoLocal)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-emerald-50 text-emerald-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onDone(value)}
          disabled={!value}
          className="rounded-full border border-emerald-500 text-emerald-500 hover:bg-emerald-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-sm font-medium px-4 py-1.5"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
