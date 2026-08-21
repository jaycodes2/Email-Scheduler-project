export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

export type EmailFolder = "scheduled" | "sent";

export interface EmailItem {
  id: string;
  recipient: string;
  subject: string;
  preview: string;
  scheduledAt: string;
  starred: boolean;
  folder: EmailFolder;
}