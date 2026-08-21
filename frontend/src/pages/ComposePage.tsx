import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Paperclip,
  Clock3,
  Undo2,
  Redo2,
  Type,
  Bold,
  Italic,
  Underline,
  AlignCenter,
  ChevronsUpDown,
  ListOrdered,
  List,
  Indent,
  Outdent,
  Quote,
  GalleryVerticalEnd,
  Strikethrough,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import SendLaterPopover from "../components/SendLaterPopover";
import EmailChipsInput from "../components/EmailChipsInput";

export default function ComposePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [to, setTo] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [delay, setDelay] = useState("");
  const [hourlyLimit, setHourlyLimit] = useState("");
  const [body, setBody] = useState("");

  const [sendLaterOpen, setSendLaterOpen] =
    useState(false);

  const [scheduledFor, setScheduledFor] =
    useState("");

  const [scheduledLabel, setScheduledLabel] =
    useState<string | null>(null);

  const [isSending, setIsSending] =
    useState(false);

  const [attachment, setAttachment] =
    useState<File | null>(null);

  const popoverRef =
    useRef<HTMLDivElement>(null);

  const recipientFileRef =
    useRef<HTMLInputElement>(null);

  const attachmentFileRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(
          e.target as Node
        )
      ) {
        setSendLaterOpen(false);
      }
    }

    if (sendLaterOpen) {
      document.addEventListener(
        "mousedown",
        handleClick
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClick
      );
    };
  }, [sendLaterOpen]);

  const handleUploadListClick = () => {
    recipientFileRef.current?.click();
  };

  const handleRecipientFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;

      const uploadedEmails = content
        .split(/[\n,\r;\s]+/)
        .map((email) => email.trim())
        .filter(Boolean);

      const validEmails =
        uploadedEmails.filter((email) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
          )
        );

      if (validEmails.length === 0) {
        alert(
          "No valid email addresses found in the file."
        );
        return;
      }

      setTo((previous) =>
        Array.from(
          new Set([
            ...previous,
            ...validEmails,
          ])
        )
      );

      alert(
        `${validEmails.length} email(s) added.`
      );
    };

    reader.readAsText(file);

    e.target.value = "";
  };

  const handleAttachmentClick = () => {
    attachmentFileRef.current?.click();
  };

  const handleAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setAttachment(file);
  };

  const removeAttachment = () => {
    setAttachment(null);

    if (attachmentFileRef.current) {
      attachmentFileRef.current.value = "";
    }
  };

  const handleScheduleEmail = async (
    scheduleTime: string
  ) => {
    if (to.length === 0) {
      alert(
        "Please enter at least one recipient"
      );
      return;
    }

    if (!subject.trim()) {
      alert("Please enter a subject");
      return;
    }

    if (!body.trim()) {
      alert("Please enter an email body");
      return;
    }

    if (!scheduleTime) {
      alert(
        "Please select a date and time"
      );
      return;
    }

    const delayValue = Number(delay);
    const hourlyLimitValue =
      Number(hourlyLimit);

    if (
      delay &&
      (Number.isNaN(delayValue) ||
        delayValue < 0)
    ) {
      alert(
        "Delay must be a valid positive number"
      );
      return;
    }

    if (
      hourlyLimit &&
      (Number.isNaN(hourlyLimitValue) ||
        hourlyLimitValue < 0)
    ) {
      alert(
        "Hourly limit must be a valid positive number"
      );
      return;
    }

    try {
      setIsSending(true);

      const formData = new FormData();

      formData.append(
        "recipients",
        JSON.stringify(to)
      );

      formData.append(
        "subject",
        subject
      );

      formData.append(
        "body",
        body
      );

      formData.append(
        "scheduledAt",
        scheduleTime
      );

      formData.append(
        "delayBetween",
        String(delayValue || 0)
      );

      formData.append(
        "hourlyLimit",
        String(hourlyLimitValue || 0)
      );

      if (attachment) {
        formData.append(
          "attachment",
          attachment
        );
      }

      const response = await fetch(
        "http://localhost:5000/emails",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to schedule emails"
        );
      }

      console.log(
        "Emails scheduled successfully:",
        data
      );

      alert(
        `${to.length} email(s) scheduled successfully!`
      );

      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Error scheduling emails:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to schedule emails"
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDoneSchedule = async (
    selection: string
  ) => {
    if (!selection) return;

    setScheduledFor(selection);

    const date = new Date(selection);

    setScheduledLabel(
      date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    );

    setSendLaterOpen(false);

    await handleScheduleEmail(selection);
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 text-gray-900"
        >
          <ArrowLeft size={18} />

          <span className="text-lg font-medium">
            Compose New Email
          </span>
        </button>

        <div
          className="flex items-center gap-3 relative"
          ref={popoverRef}
        >
          <input
            ref={attachmentFileRef}
            type="file"
            className="hidden"
            onChange={
              handleAttachmentChange
            }
          />

          <button
            type="button"
            aria-label="Attach file"
            onClick={
              handleAttachmentClick
            }
            className="text-emerald-500 hover:text-emerald-600 transition-colors p-1"
          >
            <Paperclip size={18} />
          </button>

          <button
            type="button"
            aria-label="Schedule"
            onClick={() =>
              setSendLaterOpen(
                (value) => !value
              )
            }
            className={`transition-colors p-1 ${
              sendLaterOpen
                ? "text-emerald-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Clock3 size={18} />
          </button>

          <button
            type="button"
            disabled={isSending}
            onClick={() =>
              setSendLaterOpen(
                (value) => !value
              )
            }
            className="rounded-full border border-emerald-500 text-emerald-500 hover:bg-emerald-50 transition-colors text-sm font-medium px-4 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending
              ? "Scheduling..."
              : "Send"}
          </button>

          {sendLaterOpen && (
            <SendLaterPopover
              value={scheduledFor}
              onChange={setScheduledFor}
              onCancel={() =>
                setSendLaterOpen(false)
              }
              onDone={handleDoneSchedule}
            />
          )}
        </div>
      </div>

      {scheduledLabel && (
        <div className="px-6 -mt-2 mb-2">
          <div className="max-w-4xl rounded-md bg-emerald-50 text-emerald-700 text-sm px-4 py-2">
            This email is scheduled to send on{" "}
            <strong>
              {scheduledLabel}
            </strong>
            .
          </div>
        </div>
      )}

      <div className="px-6 max-w-4xl">
        <div className="flex items-center gap-4 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500 w-16 shrink-0">
            From
          </span>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
          >
            {user?.email ??
              "scheduler@example.com"}

            <ChevronsUpDown
              size={13}
              className="text-gray-400"
            />
          </button>
        </div>

        <div className="flex items-center gap-4 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500 w-16 shrink-0">
            To
          </span>

          <EmailChipsInput
            emails={to}
            onChange={setTo}
          />

          <input
            ref={recipientFileRef}
            type="file"
            accept=".txt,.csv"
            className="hidden"
            onChange={
              handleRecipientFileChange
            }
          />

          <button
            type="button"
            onClick={
              handleUploadListClick
            }
            className="flex items-center gap-1.5 text-sm text-emerald-500 hover:text-emerald-600 transition-colors shrink-0"
          >
            <UploadIcon />
            Upload List
          </button>
        </div>

        <div className="flex items-center gap-4 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-900 font-medium w-16 shrink-0">
            Subject
          </span>

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value)
            }
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900 font-medium">
              Delay between 2 emails
            </span>

            <input
              type="number"
              min="0"
              placeholder="00"
              value={delay}
              onChange={(e) =>
                setDelay(e.target.value)
              }
              className="w-14 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900 font-medium">
              Hourly Limit
            </span>

            <input
              type="number"
              min="0"
              placeholder="00"
              value={hourlyLimit}
              onChange={(e) =>
                setHourlyLimit(e.target.value)
              }
              className="w-14 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100">
          <textarea
            placeholder="Type Your Reply..."
            value={body}
            onChange={(e) =>
              setBody(e.target.value)
            }
            rows={8}
            className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />

          <div className="flex items-center gap-1 mx-4 mb-4 rounded-full bg-white border border-gray-100 px-3 py-2 w-fit shadow-sm">
            <ToolbarIcon
              icon={<Undo2 size={15} />}
            />

            <ToolbarIcon
              icon={<Redo2 size={15} />}
            />

            <ToolbarDivider />

            <ToolbarIcon
              icon={<Type size={15} />}
              withCaret
            />

            <ToolbarDivider />

            <ToolbarIcon
              icon={<Bold size={15} />}
            />

            <ToolbarIcon
              icon={<Italic size={15} />}
            />

            <ToolbarIcon
              icon={<Underline size={15} />}
            />

            <ToolbarDivider />

            <ToolbarIcon
              icon={<AlignCenter size={15} />}
            />

            <ToolbarIcon
              icon={
                <ChevronsUpDown size={15} />
              }
            />

            <ToolbarDivider />

            <ToolbarIcon
              icon={<ListOrdered size={15} />}
            />

            <ToolbarIcon
              icon={<List size={15} />}
            />

            <ToolbarIcon
              icon={<Indent size={15} />}
            />

            <ToolbarIcon
              icon={<Outdent size={15} />}
            />

            <ToolbarDivider />

            <ToolbarIcon
              icon={<Quote size={15} />}
            />

            <ToolbarIcon
              icon={
                <GalleryVerticalEnd
                  size={15}
                />
              }
            />

            <ToolbarDivider />

            <ToolbarIcon
              icon={
                <Strikethrough size={15} />
              }
            />
          </div>
        </div>

        {attachment && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <Paperclip
              size={17}
              className="text-emerald-500"
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">
                {attachment.name}
              </p>

              <p className="text-xs text-gray-400">
                {(attachment.size / 1024).toFixed(
                  1
                )}{" "}
                KB
              </p>
            </div>

            <button
              type="button"
              onClick={removeAttachment}
              className="text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove attachment"
            >
              <X size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarIcon({
  icon,
  withCaret,
}: {
  icon: ReactNode;
  withCaret?: boolean;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-0.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors rounded p-1.5"
    >
      {icon}

      {withCaret && (
        <span className="text-[9px] text-gray-400">
          ▾
        </span>
      )}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <span className="w-px h-4 bg-gray-200 mx-1" />
  );
}

function UploadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />

      <polyline points="17 8 12 3 7 8" />

      <line
        x1="12"
        y1="3"
        x2="12"
        y2="15"
      />
    </svg>
  );
}