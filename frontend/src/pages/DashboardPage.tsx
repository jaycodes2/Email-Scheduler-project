import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Clock3 } from "lucide-react";

import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import type { DateFilter } from "../components/TopBar";
import EmailRow from "../components/EmailRow";

import { useAuth } from "../context/AuthContext";
import type {
  EmailFolder,
  EmailItem,
} from "../types";

function getFullDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeFolder, setActiveFolder] =
    useState<EmailFolder>("scheduled");

  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [scheduledCount, setScheduledCount] =
    useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("all");

  const [selectedEmail, setSelectedEmail] =
    useState<EmailItem | null>(null);

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);

      const [
        activeResponse,
        scheduledResponse,
        sentResponse,
      ] = await Promise.all([
        fetch(
          `http://localhost:5000/emails?status=${activeFolder}`
        ),
        fetch(
          "http://localhost:5000/emails?status=scheduled"
        ),
        fetch(
          "http://localhost:5000/emails?status=sent"
        ),
      ]);

      if (
        !activeResponse.ok ||
        !scheduledResponse.ok ||
        !sentResponse.ok
      ) {
        throw new Error(
          "Failed to fetch emails"
        );
      }

      const [
        activeData,
        scheduledData,
        sentData,
      ] = await Promise.all([
        activeResponse.json(),
        scheduledResponse.json(),
        sentResponse.json(),
      ]);

      const formattedEmails: EmailItem[] =
        activeData.map((email: any) => ({
          id: String(email.id),
          recipient: email.recipient,
          subject: email.subject,
          preview: email.body,
          folder: email.status,
          scheduledAt: email.scheduled_at,
          starred: email.starred,
        }));

      setEmails(formattedEmails);
      setScheduledCount(scheduledData.length);
      setSentCount(sentData.length);
    } catch (error) {
      console.error(
        "Failed to fetch emails:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [activeFolder]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const toggleStar = async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/emails/${id}/star`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update star");
      }

      const updatedEmail = await response.json();

      setEmails((prev) =>
        prev.map((email) =>
          email.id === id
            ? {
                ...email,
                starred: updatedEmail.starred,
              }
            : email
        )
      );

      setSelectedEmail((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              starred: updatedEmail.starred,
            }
          : prev
      );
    } catch (error) {
      console.error(
        "Failed to toggle star:",
        error
      );
    }
  };

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  const filteredEmails = emails.filter(
    (email) => {
      const query =
        searchQuery.toLowerCase();

      const matchesSearch =
        email.recipient
          .toLowerCase()
          .includes(query) ||
        email.subject
          .toLowerCase()
          .includes(query) ||
        email.preview
          .toLowerCase()
          .includes(query);

      if (!matchesSearch) {
        return false;
      }

      if (dateFilter === "all") {
        return true;
      }

      const emailDate = new Date(
        email.scheduledAt
      );

      const today = new Date();

      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const startOfTomorrow = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      const startOfDayAfterTomorrow =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 2
        );

      if (dateFilter === "today") {
        return (
          emailDate >= startOfToday &&
          emailDate < startOfTomorrow
        );
      }

      if (dateFilter === "tomorrow") {
        return (
          emailDate >= startOfTomorrow &&
          emailDate < startOfDayAfterTomorrow
        );
      }

      if (dateFilter === "week") {
        const endOfWeek = new Date(
          startOfToday
        );

        endOfWeek.setDate(
          startOfToday.getDate() + 7
        );

        return (
          emailDate >= startOfToday &&
          emailDate < endOfWeek
        );
      }

      return true;
    }
  );

  if (!user) return null;

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden">
      <Sidebar
        user={user}
        activeFolder={activeFolder}
        onFolderChange={(folder) => {
          setActiveFolder(folder);
          setSelectedEmail(null);
        }}
        scheduledCount={scheduledCount}
        sentCount={sentCount}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {selectedEmail ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={18} />
                Back to emails
              </button>

              <button
                type="button"
                onClick={() =>
                  toggleStar(selectedEmail.id)
                }
                className="text-gray-300 hover:text-amber-400 transition-colors"
              >
                <Star
                  size={20}
                  fill={
                    selectedEmail.starred
                      ? "currentColor"
                      : "none"
                  }
                  className={
                    selectedEmail.starred
                      ? "text-amber-400"
                      : ""
                  }
                />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-10 py-8">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <Clock3
                    size={15}
                    className="text-orange-500"
                  />

                  <span className="text-sm text-orange-500">
                    {selectedEmail.folder ===
                    "scheduled"
                      ? "Scheduled for"
                      : "Sent on"}{" "}
                    {getFullDate(
                      selectedEmail.scheduledAt
                    )}
                  </span>
                </div>

                <h1 className="text-2xl font-semibold text-gray-900 mb-8">
                  {selectedEmail.subject}
                </h1>

                <div className="border-y border-gray-100 py-5 mb-8">
                  <div className="text-sm text-gray-500 mb-1">
                    To
                  </div>

                  <div className="text-sm font-medium text-gray-900">
                    {selectedEmail.recipient}
                  </div>
                </div>

                <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                  {selectedEmail.preview}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <TopBar
              onRefresh={fetchEmails}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
            />

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  Loading emails...
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  No emails found.
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    onToggleStar={toggleStar}
                    onOpen={setSelectedEmail}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}