export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

export type EmailFolder = "scheduled" | "sent";

export interface EmailItem {
  id: string;
  to: string;
  subject: string;
  preview: string;
  timeLabel: string;
  starred: boolean;
  folder: EmailFolder;
}
