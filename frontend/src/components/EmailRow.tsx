import { Star, Clock3 } from "lucide-react";
import type { EmailItem } from "../types";

interface EmailRowProps {
  email: EmailItem;
  onToggleStar: (id: string) => void;
  onOpen: (email: EmailItem) => void;
}

function getTimeLabel(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const emailDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const differenceInDays = Math.round(
    (emailDay.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (differenceInDays === 0) {
    return `Today ${time}`;
  }

  if (differenceInDays === 1) {
    return `Tomorrow ${time}`;
  }

  if (differenceInDays > 1 && differenceInDays < 7) {
    const day = date.toLocaleDateString("en-US", {
      weekday: "short",
    });

    return `${day} ${time}`;
  }

  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${formattedDate} ${time}`;
}

export default function EmailRow({
  email,
  onToggleStar,
  onOpen,
}: EmailRowProps) {
  const timeLabel = getTimeLabel(email.scheduledAt);

  return (
    <div
      onClick={() => onOpen(email)}
      className="flex items-center gap-3 px-6 py-3.5 border-b border-gray-100 hover:bg-gray-50/70 transition-colors cursor-pointer"
    >
      <span className="text-sm font-medium text-gray-800 w-32 shrink-0 truncate">
        To: {email.recipient}
      </span>

      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-500 text-[11px] font-medium px-2 py-0.5">
        <Clock3 size={11} />
        {timeLabel}
      </span>

      <span className="min-w-0 flex-1 text-sm text-gray-700 truncate">
        <span className="font-medium text-gray-900">
          {email.subject}
        </span>

        <span className="text-gray-400">
          {" "}
          - {email.preview}
        </span>
      </span>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleStar(email.id);
        }}
        aria-label={email.starred ? "Unstar" : "Star"}
        className="shrink-0 text-gray-300 hover:text-amber-400 transition-colors"
      >
        <Star
          size={16}
          fill={email.starred ? "currentColor" : "none"}
          className={email.starred ? "text-amber-400" : ""}
        />
      </button>
    </div>
  );
}