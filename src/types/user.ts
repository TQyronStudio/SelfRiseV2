import { BaseEntity } from './common';

export interface User extends BaseEntity {
  email: string;
  displayName: string;
  isAuthenticated: boolean;
}

export interface UserSettings {
  language: 'en' | 'de' | 'es';
  morningNotificationTime: string; // HH:MM format
  eveningNotificationTime: string; // HH:MM format
  notificationsEnabled: boolean;
}