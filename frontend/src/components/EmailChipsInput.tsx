import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface EmailChipsInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  maxVisible?: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailChipsInput({
  emails,
  onChange,
  placeholder = "recipient@example.com",
  maxVisible = 3,
}: EmailChipsInputProps) {
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);

  const commitDraft = () => {
    const candidate = draft.trim().replace(/,$/, "");
    if (!candidate) return;
    if (!emails.includes(candidate)) {
      onChange([...emails, candidate]);
    }
    setDraft("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        commitDraft();
      }
    } else if (e.key === "Backspace" && draft === "" && emails.length > 0) {
      onChange(emails.slice(0, -1));
    }
  };

  const removeEmail = (email: string) => {
    onChange(emails.filter((e) => e !== email));
  };

  const visible = expanded ? emails : emails.slice(0, maxVisible);
  const hiddenCount = emails.length - visible.length;

  return (
    <div className="flex-1 flex flex-wrap items-center gap-2 py-0.5">
      {visible.map((email) => {
        const invalid = !EMAIL_RE.test(email);
        return (
          <span
            key={email}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
              invalid
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {email}
            <button
              type="button"
              onClick={() => removeEmail(email)}
              aria-label={`Remove ${email}`}
              className="text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </span>
        );
      })}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm px-3 py-1 hover:bg-emerald-100 transition-colors"
        >
          +{hiddenCount}
        </button>
      )}

      {expanded && emails.length > maxVisible && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1"
        >
          Show less
        </button>
      )}

      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={emails.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[140px] text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none py-1"
      />
    </div>
  );
}
