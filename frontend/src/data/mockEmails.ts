import type { EmailItem } from "../types";

export const mockEmails: EmailItem[] = [
  {
    id: "1",
    to: "John Smith",
    subject: "Meeting follow-up - Scheduled",
    preview: "Hi John, just wanted to follow up on our meeting...",
    timeLabel: "Tue 9:15:12 AM",
    starred: false,
    folder: "scheduled",
  },
  {
    id: "2",
    to: "Olive",
    subject: "Ramit, great to meet you - you'll love it",
    preview: "Hi Olive, just wanted to follow up on our meeting...",
    timeLabel: "Thu 8:15:12 PM",
    starred: false,
    folder: "scheduled",
  },
  {
    id: "3",
    to: "Priya Patel",
    subject: "Proposal sent - awaiting review",
    preview: "Hi Priya, attached is the proposal we discussed...",
    timeLabel: "Mon 3:42:07 PM",
    starred: true,
    folder: "sent",
  },
  {
    id: "4",
    to: "Marcus Lee",
    subject: "Invoice #1042 - Thank you",
    preview: "Hi Marcus, thanks again for your business...",
    timeLabel: "Fri 11:05:59 AM",
    starred: false,
    folder: "sent",
  },
];
