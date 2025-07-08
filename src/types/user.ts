import { BaseEntity } from './common';

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
}

export enum UserSubscriptionStatus {
  FREE = 'free',
  PREMIUM = 'premium',
}

export interface User extends BaseEntity {
  email: string;
  displayName: string;
  isAuthenticated: boolean;
  authProvider: AuthProvider;
  profileImageUrl?: string;
  subscriptionStatus: UserSubscriptionStatus;
  subscriptionExpiresAt?: Date;
  lastLoginAt: Date;
  isEmailVerified: boolean;
}

export interface UserSettings {
  language: 'en' | 'de' | 'es';
  morningNotificationTime: string; // HH:MM format
  eveningNotificationTime: string; // HH:MM format
  notificationsEnabled: boolean;
  morningNotificationEnabled: boolean;
  eveningNotificationEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  dataBackupEnabled: boolean;
  analyticsEnabled: boolean;
}

export interface UserStats {
  userId: string;
  totalHabits: number;
  activeHabits: number;
  totalGratitudes: number;
  currentGratitudeStreak: number;
  totalGoals: number;
  completedGoals: number;
  joinedAt: Date;
  lastActiveAt: Date;
}

// Authentication interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Profile update interface
export interface UpdateProfileInput {
  displayName?: string;
  profileImageUrl?: string;
}

// Settings update interface
export interface UpdateSettingsInput {
  language?: 'en' | 'de' | 'es';
  morningNotificationTime?: string;
  eveningNotificationTime?: string;
  notificationsEnabled?: boolean;
  morningNotificationEnabled?: boolean;
  eveningNotificationEnabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  theme?: 'light' | 'dark' | 'system';
  dataBackupEnabled?: boolean;
  analyticsEnabled?: boolean;
}