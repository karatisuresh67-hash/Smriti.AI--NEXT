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

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type TaskSource = 'manual' | 'gmail' | 'chat' | 'voice' | 'agent' | 'document' | 'n8n';

export interface Task {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  linkedReminderId?: string | null;
  source?: TaskSource;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type IntegrationProvider = 
  | 'gmail' 
  | 'google_calendar' 
  | 'linkedin' 
  | 'instagram' 
  | 'x' 
  | 'n8n' 
  | 'slack' 
  | 'notion';

export interface IntegrationItem {
  id: string;
  userId?: string;
  provider: IntegrationProvider;
  accountEmail?: string | null;
  accountName?: string | null;
  isConnected: boolean;
  scopes?: string[];
  settings?: Record<string, any>;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentActionStep {
  step: number;
  action: string;
  target?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  detail?: string;
  timestamp: string;
}

export type ActionStatus = 'running' | 'completed' | 'failed' | 'waiting_approval' | 'cancelled' | 'success' | 'pending' | 'requires_approval';

export type ChromeActionStatus = 
  | 'QUEUED' 
  | 'STARTING' 
  | 'RUNNING' 
  | 'WAITING_FOR_USER' 
  | 'WAITING_FOR_APPROVAL' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED';

export type ChromeActionIntent = 
  | 'conversation' 
  | 'website_navigation' 
  | 'website_search' 
  | 'website_interaction' 
  | 'external_application_operation' 
  | 'action_result_presentation';

export interface ChromeActionJob {
  id: string;
  userId?: string;
  originalCommand: string;
  websiteName: string;
  actionType: 'navigate' | 'search' | 'play' | 'extract' | 'interact' | 'oauth_sync';
  destinationUrl: string;
  targetTitle?: string;
  status: ChromeActionStatus;
  verificationStatus: 'unverified' | 'verified' | 'failed' | 'requires_auth';
  resultSummary?: string;
  extractedData?: any;
  errorDetails?: string;
  isPopupBlocked?: boolean;
  openedInChrome?: boolean;
  requiresApproval?: boolean;
  executionMode: 'chrome_tab' | 'remote_browser' | 'oauth_integration';
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  steps?: AgentActionStep[];
}

export interface ActionExecution {
  id: string;
  userId?: string;
  taskTitle: string;
  instruction: string;
  targetSystem: string;
  status: ActionStatus;
  steps: AgentActionStep[];
  resultSummary?: string;
  screenshotUrl?: string;
  documentRefs?: string[];
  errorDetails?: string;
  startedAt: string;
  completedAt?: string | null;
  // Legacy / n8n workflow compatibility fields
  workflowId?: string;
  workflowName?: string;
  triggerSource?: 'chat' | 'voice' | 'webhook' | 'scheduled' | 'manual';
  inputPayload?: Record<string, any> | null;
  outputPayload?: Record<string, any> | null;
  errorMessage?: string | null;
}

export type AutomationStatus = ActionStatus;
export type AutomationExecution = ActionExecution;

export interface DocumentItem {
  id: string;
  userId?: string;
  name: string;
  size: number;
  mimeType: string;
  extractedText: string;
  summary?: string;
  keyTakeaways?: string[];
  suggestedTasks?: Array<{ title: string; priority: string }>;
  suggestedMemories?: Array<{ title: string; content: string }>;
  uploadedAt: string;
}

export interface UserSettings {
  displayName: string;
  voiceResponse: boolean;
  notificationsEnabled: boolean;
  darkMode?: boolean;
  timezone?: string;
  email?: string;
  avatarUrl?: string;
  googleCalendarLinked?: boolean;
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
  | 'delete_reminder'
  | 'create_task'
  | 'update_task'
  | 'complete_task'
  | 'delete_task'
  | 'sync_integration'
  | 'trigger_automation'
  | 'browser_action'
  | 'document_analyzed'
  | 'calendar_event_created'
  | 'social_post_published'
  | 'send_email'
  | 'publish_post';

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
  steps?: AgentActionStep[];
  screenshot?: string;
  toolCalls?: Array<{ name: string; args: any; result?: any }>;
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
    }
  | {
      type: 'create_task';
      title: string;
      description?: string;
      dueDate?: string;
      dueTime?: string;
      priority?: TaskPriority;
      category?: string;
      source?: TaskSource;
    }
  | {
      type: 'create_calendar_event';
      title: string;
      description?: string;
      date: string;
      startTime: string;
      endTime?: string;
      location?: string;
    }
  | {
      type: 'browser_action';
      actionType: 'navigate' | 'click' | 'type' | 'extract' | 'search';
      url: string;
      description: string;
      requiresApproval?: boolean;
    }
  | {
      type: 'draft_email';
      recipient: string;
      subject: string;
      body: string;
    }
  | {
      type: 'send_email';
      recipient: string;
      subject: string;
      body: string;
    }
  | {
      type: 'create_linkedin_post';
      content: string;
      hashtags?: string[];
      documentName?: string;
    }
  | {
      type: 'create_x_post';
      content: string;
    }
  | {
      type: 'trigger_n8n';
      workflowId: string;
      workflowName: string;
      parameters?: Record<string, any>;
    }
  | {
      type: 'chrome_action';
      websiteName: string;
      actionType: 'navigate' | 'search' | 'play' | 'extract' | 'interact' | 'oauth_sync';
      destinationUrl: string;
      targetTitle?: string;
      query?: string;
      instructions?: string;
      requiresApproval?: boolean;
      executionMode?: 'chrome_tab' | 'remote_browser' | 'oauth_integration';
      resultSummary?: string;
      extractedData?: any;
    };

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export type AppTab = 
  | 'assistant' 
  | 'memories' 
  | 'tasks' 
  | 'calendar' 
  | 'actions' 
  | 'documents' 
  | 'settings'
  | 'dashboard'
  | 'chat'
  | 'voice'
  | 'reminders'
  | 'integrations'
  | 'automations'
  | 'results';
