export type NotificationType = 'invitation' | 'meeting' | 'system' | 'chat';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}
