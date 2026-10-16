export type MemoryCategory = 
  | 'Birthday' 
  | 'People' 
  | 'Personal Goal' 
  | 'Important Event' 
  | 'Preference' 
  | 'Academic' 
  | 'Project' 
  | 'Personal' 
  | 'Other';

export type ReminderCategory = 
  | 'Personal' 
  | 'Academic' 
  | 'Work' 
  | 'Project' 
  | 'Health' 
  | 'Other';

export type ReminderPriority = 'Low' | 'Medium' | 'High';

export type ReminderStatus = 'upcoming' | 'overdue' | 'completed';

export type ReminderRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Memory {
  id: string;
  userId?: string;
  title: string;
  content: string;
  category: MemoryCategory | string;
  date?: string;
  person?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  category: ReminderCategory | string;
  priority: ReminderPriority;
  status: ReminderStatus;
  linkedMemoryId?: string | null;
  recurrence?: ReminderRecurrence;
  snoozeUntil?: string | null;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  displayName: string;
  voiceResponse: boolean;
  notificationsEnabled: boolean;
  email?: string;
  avatarUrl?: string;
}

export type ActivityType = 
  | 'create_memory'
  | 'update_memory'
  | 'delete_memory'
  | 'create_reminder'
  | 'update_reminder'
  | 'complete_reminder'
  | 'reopen_reminder'
  | 'snooze_reminder'
  | 'delete_reminder';

export interface ActivityItem {
  id: string;
  userId?: string;
  type: ActivityType;
  title: string;
  description?: string;
  category?: string;
  timestamp: string;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: ProposedAction | null;
}

export type ProposedAction = 
  | {
      type: 'create_memory';
      title: string;
      content: string;
      category?: string;
      date?: string;
      person?: string;
    }
  | {
      type: 'create_reminder';
      title: string;
      description?: string;
      date: string;
      time?: string;
      category?: string;
      priority?: ReminderPriority;
      linkedMemoryId?: string | null;
    };

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export type AppTab = 'dashboard' | 'chat' | 'voice' | 'memories' | 'reminders' | 'calendar' | 'settings';
