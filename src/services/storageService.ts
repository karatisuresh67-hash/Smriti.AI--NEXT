import type { 
  Memory, 
  Reminder, 
  Task,
  TaskPriority,
  TaskStatus,
  IntegrationItem,
  IntegrationProvider,
  AutomationExecution,
  DocumentItem,
  UserSettings, 
  ActivityItem, 
  ActivityType,
  ReminderPriority,
  ReminderStatus,
  ReminderRecurrence
} from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  MEMORIES: 'smriti_memories_v2',
  REMINDERS: 'smriti_reminders_v2',
  TASKS: 'smriti_tasks_v2',
  INTEGRATIONS: 'smriti_integrations_v2',
  AUTOMATIONS: 'smriti_automations_v2',
  DOCUMENTS: 'smriti_documents_v2',
  SETTINGS: 'smriti_settings_v2',
  ACTIVITIES: 'smriti_activities_v2',
  INITIALIZED: 'smriti_initialized_v2',
  MIGRATED_PREFIX: 'smriti_migrated_',
};

export interface DbMemoryRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string | null;
  date: string | null;
  person: string | null;
  is_demo: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DbReminderRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  linked_memory_id: string | null;
  recurrence: string | null;
  snooze_until: string | null;
  is_demo: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DbTaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: string | null;
  status: string | null;
  category: string | null;
  linked_reminder_id: string | null;
  source: string | null;
  is_demo: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DbIntegrationRow {
  id: string;
  user_id: string;
  provider: string;
  account_email: string | null;
  account_name: string | null;
  is_connected: boolean;
  scopes: any;
  settings: any;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAutomationRow {
  id: string;
  user_id: string;
  workflow_id: string;
  workflow_name: string;
  trigger_source: string;
  status: string;
  input_payload: any;
  output_payload: any;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface DbActivityRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// Model transformation helpers
function rowToMemory(row: DbMemoryRow | any): Memory {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || '',
    content: row.content || '',
    category: row.category || 'Other',
    date: row.date || '',
    person: row.person || '',
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function memoryToRow(
  data: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; isDemo?: boolean },
  userId: string
): DbMemoryRow {
  const now = new Date().toISOString();
  return {
    id: data.id || generateId('mem'),
    user_id: userId,
    title: data.title.trim(),
    content: (data.content || data.title).trim(),
    category: data.category || 'Other',
    date: data.date ? data.date : null,
    person: data.person && data.person.trim() ? data.person.trim() : null,
    is_demo: Boolean(data.isDemo),
    created_at: now,
    updated_at: now,
  };
}

function rowToReminder(row: DbReminderRow | any): Reminder {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || '',
    description: row.description || '',
    date: row.date || '',
    time: row.time || '',
    category: row.category || 'Personal',
    priority: (row.priority as ReminderPriority) || 'Medium',
    status: (row.status as ReminderStatus) || 'upcoming',
    linkedMemoryId: row.linked_memory_id || null,
    recurrence: (row.recurrence as ReminderRecurrence) || 'none',
    snoozeUntil: row.snooze_until || null,
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function reminderToRow(
  data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
    id?: string;
    status?: Reminder['status'];
    isDemo?: boolean;
  },
  userId: string
): DbReminderRow {
  const now = new Date().toISOString();
  return {
    id: data.id || generateId('rem'),
    user_id: userId,
    title: data.title.trim(),
    description: data.description && data.description.trim() ? data.description.trim() : null,
    date: data.date,
    time: data.time || null,
    category: data.category || 'Personal',
    priority: data.priority || 'Medium',
    status: data.status || 'upcoming',
    linked_memory_id: data.linkedMemoryId || null,
    recurrence: data.recurrence || 'none',
    snooze_until: data.snoozeUntil || null,
    is_demo: Boolean(data.isDemo),
    created_at: now,
    updated_at: now,
  };
}

function rowToTask(row: DbTaskRow | any): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || '',
    description: row.description || '',
    dueDate: row.due_date || '',
    dueTime: row.due_time || '',
    priority: (row.priority as TaskPriority) || 'Medium',
    status: (row.status as TaskStatus) || 'pending',
    category: row.category || 'General',
    linkedReminderId: row.linked_reminder_id || null,
    source: row.source || 'manual',
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function taskToRow(
  data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; isDemo?: boolean },
  userId: string
): DbTaskRow {
  const now = new Date().toISOString();
  return {
    id: data.id || generateId('task'),
    user_id: userId,
    title: data.title.trim(),
    description: data.description ? data.description.trim() : null,
    due_date: data.dueDate || null,
    due_time: data.dueTime || null,
    priority: data.priority || 'Medium',
    status: data.status || 'pending',
    category: data.category || 'General',
    linked_reminder_id: data.linkedReminderId || null,
    source: data.source || 'manual',
    is_demo: Boolean(data.isDemo),
    created_at: now,
    updated_at: now,
  };
}

function rowToIntegration(row: DbIntegrationRow | any): IntegrationItem {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider as IntegrationProvider,
    accountEmail: row.account_email || null,
    accountName: row.account_name || null,
    isConnected: Boolean(row.is_connected),
    scopes: Array.isArray(row.scopes) ? row.scopes : [],
    settings: row.settings || {},
    lastSyncedAt: row.last_synced_at || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function rowToAutomation(row: DbAutomationRow | any): AutomationExecution {
  return {
    id: row.id,
    userId: row.user_id,
    taskTitle: row.workflow_name || 'Agent Action',
    instruction: row.workflow_name || 'Autonomous execution',
    targetSystem: 'System',
    steps: [],
    workflowId: row.workflow_id,
    workflowName: row.workflow_name,
    triggerSource: row.trigger_source || 'chat',
    status: row.status || 'completed',
    inputPayload: row.input_payload || null,
    outputPayload: row.output_payload || null,
    errorMessage: row.error_message || null,
    startedAt: row.started_at || new Date().toISOString(),
    completedAt: row.completed_at || null,
  };
}

function rowToActivity(row: DbActivityRow | any): ActivityItem {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as ActivityType,
    title: row.title || '',
    description: row.description || undefined,
    category: row.category || undefined,
    timestamp: row.created_at || new Date().toISOString(),
  };
}

const getDemoTasks = (): Task[] => [];

const getDemoIntegrations = (): IntegrationItem[] => [];

const getDemoAutomations = (): AutomationExecution[] => [];

const defaultSettings: UserSettings = {
  displayName: '',
  voiceResponse: true,
  notificationsEnabled: false,
  darkMode: true,
};

class StorageService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  public async getCurrentUser(): Promise<User | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user ?? null;
      }
      return user;
    } catch {
      return null;
    }
  }

  public init(): void {
    if (!this.isBrowser()) return;

    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      this.resetToDemo();
    }
  }

  // ============================================================================
  // MEMORIES CRUD
  // ============================================================================

  public async getMemories(passedUserId?: string): Promise<Memory[]> {
    const user = await this.getCurrentUser();
    const activeUserId = user?.id || passedUserId;

    if (activeUserId && supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('memories')
          .select('*')
          .eq('user_id', activeUserId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[StorageService] Error loading memories from Supabase:', error.message);
          return this.getLocalMemories(activeUserId);
        }

        const list = (data || []).map(rowToMemory);
        this.cacheUserMemories(activeUserId, list);
        return list;
      } catch (err) {
        return this.getLocalMemories(activeUserId);
      }
    }

    return this.getLocalMemories();
  }

  public async saveMemory(
    memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>,
    _untrustedUserId?: string
  ): Promise<Memory> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const row = memoryToRow(memoryData, verifiedUserId);

      const { data, error } = await supabase
        .from('memories')
        .insert(row)
        .select()
        .single();

      if (error) throw new Error(error.message);

      const createdMemory = rowToMemory(data);
      const cached = this.getLocalMemories(verifiedUserId);
      this.cacheUserMemories(verifiedUserId, [createdMemory, ...cached.filter(m => m.id !== createdMemory.id)]);
      await this.logActivity('create_memory', createdMemory.title, createdMemory.category, undefined, verifiedUserId);
      return createdMemory;
    }

    return this.saveLocalMemory(memoryData);
  }

  public async updateMemory(id: string, updates: Partial<Memory>, _untrustedUserId?: string): Promise<Memory> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
      if (updates.content !== undefined) dbUpdates.content = updates.content.trim();
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.date !== undefined) dbUpdates.date = updates.date ? updates.date : null;
      if (updates.person !== undefined) dbUpdates.person = updates.person ? updates.person.trim() : null;

      const { data, error } = await supabase
        .from('memories')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', verifiedUserId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      const updated = rowToMemory(data);
      const cached = this.getLocalMemories(verifiedUserId);
      this.cacheUserMemories(verifiedUserId, cached.map(m => m.id === id ? updated : m));
      await this.logActivity('update_memory', updated.title, updated.category, undefined, verifiedUserId);
      return updated;
    }

    return this.updateLocalMemory(id, updates);
  }

  public async deleteMemory(id: string, _untrustedUserId?: string): Promise<void> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const cached = this.getLocalMemories(verifiedUserId);
      const existing = cached.find(m => m.id === id);

      const { error } = await supabase.from('memories').delete().eq('id', id).eq('user_id', verifiedUserId);
      if (error) throw new Error(error.message);

      this.cacheUserMemories(verifiedUserId, cached.filter(m => m.id !== id));
      if (existing) {
        await this.logActivity('delete_memory', existing.title, existing.category, undefined, verifiedUserId);
      }
      return;
    }

    this.deleteLocalMemory(id);
  }

  // ============================================================================
  // REMINDERS CRUD
  // ============================================================================

  public async getReminders(passedUserId?: string): Promise<Reminder[]> {
    const user = await this.getCurrentUser();
    const activeUserId = user?.id || passedUserId;

    if (activeUserId && supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', activeUserId)
          .order('created_at', { ascending: false });

        if (error) return this.checkOverdueList(this.getLocalReminders(activeUserId));

        const list = this.checkOverdueList((data || []).map(rowToReminder));
        this.cacheUserReminders(activeUserId, list);
        return list;
      } catch {
        return this.checkOverdueList(this.getLocalReminders(activeUserId));
      }
    }

    return this.checkOverdueList(this.getLocalReminders());
  }

  public async saveReminder(
    reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Reminder['status'] },
    _untrustedUserId?: string
  ): Promise<Reminder> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const row = reminderToRow(reminderData, verifiedUserId);

      const { data, error } = await supabase.from('reminders').insert(row).select().single();
      if (error) throw new Error(error.message);

      const created = rowToReminder(data);
      const cached = this.getLocalReminders(verifiedUserId);
      this.cacheUserReminders(verifiedUserId, [created, ...cached.filter(r => r.id !== created.id)]);
      await this.logActivity('create_reminder', created.title, created.category, undefined, verifiedUserId);
      return created;
    }

    return this.saveLocalReminder(reminderData);
  }

  public async updateReminder(id: string, updates: Partial<Reminder>, _untrustedUserId?: string): Promise<Reminder> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
      if (updates.description !== undefined) dbUpdates.description = updates.description?.trim() || null;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.time !== undefined) dbUpdates.time = updates.time || null;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.linkedMemoryId !== undefined) dbUpdates.linked_memory_id = updates.linkedMemoryId || null;
      if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence || 'none';
      if (updates.snoozeUntil !== undefined) dbUpdates.snooze_until = updates.snoozeUntil || null;

      const { data, error } = await supabase
        .from('reminders')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', verifiedUserId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      const updated = rowToReminder(data);
      const cached = this.getLocalReminders(verifiedUserId);
      this.cacheUserReminders(verifiedUserId, cached.map(r => r.id === id ? updated : r));
      await this.logActivity('update_reminder', updated.title, updated.category, undefined, verifiedUserId);
      return updated;
    }

    return this.updateLocalReminder(id, updates);
  }

  public async toggleReminderStatus(id: string, currentStatus?: ReminderStatus, _untrustedUserId?: string): Promise<Reminder> {
    let status = currentStatus;
    if (!status) {
      const user = await this.getCurrentUser();
      const cached = this.getLocalReminders(user?.id);
      const target = cached.find(r => r.id === id);
      status = target?.status;
    }

    const nextStatus = status === 'completed' ? 'upcoming' : 'completed';
    return this.updateReminder(id, { status: nextStatus }, _untrustedUserId);
  }

  public async deleteReminder(id: string, _untrustedUserId?: string): Promise<void> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const cached = this.getLocalReminders(verifiedUserId);
      const existing = cached.find(r => r.id === id);

      const { error } = await supabase.from('reminders').delete().eq('id', id).eq('user_id', verifiedUserId);
      if (error) throw new Error(error.message);

      this.cacheUserReminders(verifiedUserId, cached.filter(r => r.id !== id));
      if (existing) {
        await this.logActivity('delete_reminder', existing.title, existing.category, undefined, verifiedUserId);
      }
      return;
    }

    this.deleteLocalReminder(id);
  }

  // ============================================================================
  // TASKS CRUD (Unified task management connected to public.tasks)
  // ============================================================================

  public async getTasks(passedUserId?: string): Promise<Task[]> {
    const user = await this.getCurrentUser();
    const activeUserId = user?.id || passedUserId;

    if (activeUserId && supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', activeUserId)
          .order('due_date', { ascending: true });

        if (error) {
          return this.getLocalTasks(activeUserId);
        }

        const list = (data || []).map(rowToTask);
        this.cacheUserTasks(activeUserId, list);
        return list;
      } catch {
        return this.getLocalTasks(activeUserId);
      }
    }

    return this.getLocalTasks();
  }

  public async saveTask(
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
    _untrustedUserId?: string
  ): Promise<Task> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const row = taskToRow(taskData, verifiedUserId);

      const { data, error } = await supabase.from('tasks').insert(row).select().single();
      if (error) throw new Error(error.message);

      const created = rowToTask(data);
      const cached = this.getLocalTasks(verifiedUserId);
      this.cacheUserTasks(verifiedUserId, [created, ...cached.filter(t => t.id !== created.id)]);
      await this.logActivity('create_task', created.title, created.category, undefined, verifiedUserId);
      return created;
    }

    return this.saveLocalTask(taskData);
  }

  public async updateTask(id: string, updates: Partial<Task>, _untrustedUserId?: string): Promise<Task> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
      if (updates.description !== undefined) dbUpdates.description = updates.description ? updates.description.trim() : null;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
      if (updates.dueTime !== undefined) dbUpdates.due_time = updates.dueTime || null;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.category !== undefined) dbUpdates.category = updates.category;

      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', verifiedUserId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      const updated = rowToTask(data);
      const cached = this.getLocalTasks(verifiedUserId);
      this.cacheUserTasks(verifiedUserId, cached.map(t => t.id === id ? updated : t));
      await this.logActivity('update_task', updated.title, updated.category, undefined, verifiedUserId);
      return updated;
    }

    return this.updateLocalTask(id, updates);
  }

  public async toggleTaskStatus(id: string, currentStatus?: TaskStatus, _untrustedUserId?: string): Promise<Task> {
    let status = currentStatus;
    if (!status) {
      const user = await this.getCurrentUser();
      const cached = this.getLocalTasks(user?.id);
      const target = cached.find(t => t.id === id);
      status = target?.status;
    }

    const nextStatus: TaskStatus = status === 'completed' ? 'pending' : 'completed';
    return this.updateTask(id, { status: nextStatus }, _untrustedUserId);
  }

  public async deleteTask(id: string, _untrustedUserId?: string): Promise<void> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const cached = this.getLocalTasks(verifiedUserId);
      const existing = cached.find(t => t.id === id);

      const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', verifiedUserId);
      if (error) throw new Error(error.message);

      this.cacheUserTasks(verifiedUserId, cached.filter(t => t.id !== id));
      if (existing) {
        await this.logActivity('delete_task', existing.title, existing.category, undefined, verifiedUserId);
      }
      return;
    }

    this.deleteLocalTask(id);
  }

  // ============================================================================
  // INTEGRATIONS (Connected Services Management)
  // ============================================================================

  public async getIntegrations(passedUserId?: string): Promise<IntegrationItem[]> {
    const user = await this.getCurrentUser();
    const activeUserId = user?.id || passedUserId;

    if (activeUserId && supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('integrations')
          .select('*')
          .eq('user_id', activeUserId);

        if (error || !data || data.length === 0) {
          return this.getLocalIntegrations(activeUserId);
        }

        const list = data.map(rowToIntegration);
        this.cacheUserIntegrations(activeUserId, list);
        return list;
      } catch {
        return this.getLocalIntegrations(activeUserId);
      }
    }

    return this.getLocalIntegrations();
  }

  public async updateIntegration(
    provider: IntegrationProvider,
    updates: Partial<IntegrationItem>,
    _untrustedUserId?: string
  ): Promise<IntegrationItem> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('integrations')
        .upsert({
          id: `int-${verifiedUserId}-${provider}`,
          user_id: verifiedUserId,
          provider,
          account_email: updates.accountEmail || null,
          account_name: updates.accountName || null,
          is_connected: updates.isConnected ?? false,
          scopes: updates.scopes || [],
          settings: updates.settings || {},
          last_synced_at: updates.lastSyncedAt || now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      const updated = rowToIntegration(data);
      const cached = this.getLocalIntegrations(verifiedUserId);
      this.cacheUserIntegrations(
        verifiedUserId,
        cached.map(i => i.provider === provider ? updated : i)
      );
      return updated;
    }

    // Local fallback
    const list = this.getLocalIntegrations();
    const index = list.findIndex(i => i.provider === provider);
    const updated: IntegrationItem = index !== -1
      ? { ...list[index], ...updates, updatedAt: new Date().toISOString() }
      : {
          id: `int-${provider}`,
          provider,
          accountEmail: updates.accountEmail || null,
          accountName: updates.accountName || null,
          isConnected: updates.isConnected ?? false,
          scopes: updates.scopes || [],
          settings: updates.settings || {},
          lastSyncedAt: updates.lastSyncedAt || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    if (index !== -1) list[index] = updated;
    else list.push(updated);

    this.saveToStorage(STORAGE_KEYS.INTEGRATIONS, list);
    return updated;
  }

  // ============================================================================
  // AUTOMATION EXECUTIONS (n8n & Agent History)
  // ============================================================================

  public async getAutomations(passedUserId?: string): Promise<AutomationExecution[]> {
    const user = await this.getCurrentUser();
    const activeUserId = user?.id || passedUserId;

    if (activeUserId && supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('automation_executions')
          .select('*')
          .eq('user_id', activeUserId)
          .order('started_at', { ascending: false })
          .limit(50);

        if (error || !data) {
          return this.getLocalAutomations(activeUserId);
        }

        const list = data.map(rowToAutomation);
        this.cacheUserAutomations(activeUserId, list);
        return list;
      } catch {
        return this.getLocalAutomations(activeUserId);
      }
    }

    return this.getLocalAutomations();
  }

  public async logAutomationExecution(
    exec: Omit<AutomationExecution, 'id' | 'startedAt'>,
    _untrustedUserId?: string
  ): Promise<AutomationExecution> {
    const user = await this.getCurrentUser();
    const now = new Date().toISOString();
    const id = generateId('exec');

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;

      try {
        await supabase.from('automation_executions').insert({
          id,
          user_id: verifiedUserId,
          workflow_id: exec.workflowId,
          workflow_name: exec.workflowName,
          trigger_source: exec.triggerSource,
          status: exec.status,
          input_payload: exec.inputPayload || null,
          output_payload: exec.outputPayload || null,
          error_message: exec.errorMessage || null,
          started_at: now,
          completed_at: exec.completedAt || now,
        });
      } catch (err) {
        console.warn('[StorageService] Error logging automation execution to Supabase:', err);
      }
    }

    const item: AutomationExecution = {
      ...exec,
      id,
      startedAt: now,
    };
    const current = this.getLocalAutomations(user?.id);
    this.cacheUserAutomations(user?.id, [item, ...current].slice(0, 50));
    return item;
  }

  // ============================================================================
  // DOCUMENTS MANAGEMENT
  // ============================================================================

  public async getDocuments(passedUserId?: string): Promise<DocumentItem[]> {
    const user = await this.getCurrentUser();
    const activeUserId = user?.id || passedUserId;
    if (activeUserId && supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', activeUserId)
          .order('created_at', { ascending: false });
        if (!error && data) {
          const list: DocumentItem[] = data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            name: d.name,
            size: d.size,
            mimeType: d.mime_type,
            extractedText: d.extracted_text,
            summary: d.summary,
            keyTakeaways: d.key_takeaways,
            suggestedTasks: d.suggested_tasks,
            uploadedAt: d.created_at
          }));
          this.cacheUserDocuments(activeUserId, list);
          return list;
        }
      } catch {
        return this.getLocalDocuments(activeUserId);
      }
    }
    return this.getLocalDocuments(activeUserId);
  }

  public async saveDocument(docData: Omit<DocumentItem, 'id' | 'uploadedAt'>, passedUserId?: string): Promise<DocumentItem> {
    const user = await this.getCurrentUser();
    const activeUserId = user?.id || passedUserId;
    const now = new Date().toISOString();
    const id = generateId('doc');

    if (activeUserId && supabase && isSupabaseConfigured) {
      try {
        await supabase.from('documents').insert({
          id,
          user_id: activeUserId,
          name: docData.name,
          size: docData.size,
          mime_type: docData.mimeType,
          extracted_text: docData.extractedText,
          summary: docData.summary || null,
          key_takeaways: docData.keyTakeaways || [],
          suggested_tasks: docData.suggestedTasks || [],
          created_at: now
        });
      } catch (err) {
        console.warn('Failed to save document to Supabase:', err);
      }
    }

    const doc: DocumentItem = { ...docData, id, uploadedAt: now };
    const current = this.getLocalDocuments(activeUserId);
    this.cacheUserDocuments(activeUserId, [doc, ...current]);
    await this.logActivity('document_analyzed', doc.name, 'Document', undefined, activeUserId);
    return doc;
  }

  public async deleteDocument(id: string, passedUserId?: string): Promise<void> {
    const user = await this.getCurrentUser();
    const activeUserId = user?.id || passedUserId;
    if (activeUserId && supabase && isSupabaseConfigured) {
      try {
        await supabase.from('documents').delete().eq('id', id).eq('user_id', activeUserId);
      } catch (e) {
        console.warn('Could not delete document from Supabase:', e);
      }
    }
    const current = this.getLocalDocuments(activeUserId);
    this.cacheUserDocuments(activeUserId, current.filter(d => d.id !== id));
  }

  public getLocalDocuments(userId?: string): DocumentItem[] {
    if (!this.isBrowser()) return [];
    try {
      const key = this.getUserStorageKey(STORAGE_KEYS.DOCUMENTS, userId);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private cacheUserDocuments(userId?: string, docs: DocumentItem[] = []): void {
    this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.DOCUMENTS, userId), docs);
  }

  // ============================================================================
  // ACTIVITIES AUDIT TRAIL
  // ============================================================================

  public async getActivities(passedUserId?: string): Promise<ActivityItem[]> {
    const user = await this.getCurrentUser();
    const activeUserId = user?.id || passedUserId;

    if (activeUserId && supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', activeUserId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) return this.getLocalActivities(activeUserId);

        const list = (data || []).map(rowToActivity);
        this.cacheUserActivities(activeUserId, list);
        return list;
      } catch {
        return this.getLocalActivities(activeUserId);
      }
    }

    return this.getLocalActivities();
  }

  public async logActivity(
    type: ActivityType,
    title: string,
    category?: string,
    description?: string,
    _untrustedUserId?: string
  ): Promise<void> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const actId = generateId('act');

      try {
        await supabase.from('activities').insert({
          id: actId,
          user_id: verifiedUserId,
          type,
          title,
          description: description || null,
          category: category || null,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[StorageService] Could not log activity to Supabase:', e);
      }

      const current = this.getLocalActivities(verifiedUserId);
      const item: ActivityItem = {
        id: actId,
        userId: verifiedUserId,
        type,
        title,
        category,
        description,
        timestamp: new Date().toISOString(),
      };
      this.cacheUserActivities(verifiedUserId, [item, ...current].slice(0, 30));
      return;
    }

    this.logLocalActivity(type, title, category, description);
  }

  // ============================================================================
  // SETTINGS & LOCAL STORAGE HELPERS
  // ============================================================================

  public getSettings(): UserSettings {
    if (!this.isBrowser()) return defaultSettings;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  }

  public updateSettings(updates: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const merged = { ...current, ...updates };
    this.saveToStorage(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  }

  public resetToDemo(): void {
    if (!this.isBrowser()) return;
    this.saveToStorage(STORAGE_KEYS.MEMORIES, []);
    this.saveToStorage(STORAGE_KEYS.REMINDERS, []);
    this.saveToStorage(STORAGE_KEYS.TASKS, []);
    this.saveToStorage(STORAGE_KEYS.INTEGRATIONS, []);
    this.saveToStorage(STORAGE_KEYS.AUTOMATIONS, []);
    this.saveToStorage(STORAGE_KEYS.SETTINGS, defaultSettings);
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, []);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  public clearAll(): void {
    if (!this.isBrowser()) return;
    this.saveToStorage(STORAGE_KEYS.MEMORIES, []);
    this.saveToStorage(STORAGE_KEYS.REMINDERS, []);
    this.saveToStorage(STORAGE_KEYS.TASKS, []);
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, []);
  }

  public exportBackup(
    currentMemories?: Memory[],
    currentReminders?: Reminder[],
    currentTasks?: Task[]
  ): {
    version: string;
    exportedAt: string;
    memories: Memory[];
    reminders: Reminder[];
    tasks: Task[];
    settings: UserSettings;
  } {
    return {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      memories: currentMemories || this.getLocalMemories(),
      reminders: currentReminders || this.getLocalReminders(),
      tasks: currentTasks || this.getLocalTasks(),
      settings: this.getSettings(),
    };
  }

  public async importBackup(backup: any, userId?: string): Promise<void> {
    if (!backup || typeof backup !== 'object') {
      throw new Error('Invalid backup file format');
    }
    if (Array.isArray(backup.memories)) {
      for (const m of backup.memories) {
        await this.saveMemory(m, userId);
      }
    }
    if (Array.isArray(backup.reminders)) {
      for (const r of backup.reminders) {
        await this.saveReminder(r, userId);
      }
    }
    if (Array.isArray(backup.tasks)) {
      for (const t of backup.tasks) {
        await this.saveTask(t, userId);
      }
    }
    if (backup.settings) {
      this.updateSettings(backup.settings);
    }
  }

  // ============================================================================
  // LOCAL STORAGE HELPERS
  // ============================================================================

  public getLocalMemories(userId?: string): Memory[] {
    if (!this.isBrowser()) return [];
    try {
      const key = this.getUserStorageKey(STORAGE_KEYS.MEMORIES, userId);
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      if (!userId) {
        const base = localStorage.getItem(STORAGE_KEYS.MEMORIES);
        return base ? JSON.parse(base) : [];
      }
      return [];
    } catch {
      return [];
    }
  }

  public saveLocalMemory(memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Memory {
    const memories = this.getLocalMemories();
    const newMemory: Memory = {
      ...memoryData,
      id: generateId('mem'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memories.unshift(newMemory);
    this.saveToStorage(STORAGE_KEYS.MEMORIES, memories);
    this.logLocalActivity('create_memory', newMemory.title, newMemory.category);
    return newMemory;
  }

  public updateLocalMemory(id: string, updates: Partial<Memory>): Memory {
    const memories = this.getLocalMemories();
    const index = memories.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Memory not found');

    const updated: Memory = {
      ...memories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    memories[index] = updated;
    this.saveToStorage(STORAGE_KEYS.MEMORIES, memories);
    this.logLocalActivity('update_memory', updated.title, updated.category);
    return updated;
  }

  public deleteLocalMemory(id: string): void {
    const memories = this.getLocalMemories();
    const memory = memories.find(m => m.id === id);
    const filtered = memories.filter(m => m.id !== id);
    this.saveToStorage(STORAGE_KEYS.MEMORIES, filtered);
    if (memory) {
      this.logLocalActivity('delete_memory', memory.title, memory.category);
    }
  }

  public getLocalReminders(userId?: string): Reminder[] {
    if (!this.isBrowser()) return [];
    try {
      const key = this.getUserStorageKey(STORAGE_KEYS.REMINDERS, userId);
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      if (!userId) {
        const base = localStorage.getItem(STORAGE_KEYS.REMINDERS);
        return base ? JSON.parse(base) : [];
      }
      return [];
    } catch {
      return [];
    }
  }

  public saveLocalReminder(
    reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Reminder['status'] }
  ): Reminder {
    const reminders = this.getLocalReminders();
    const newReminder: Reminder = {
      ...reminderData,
      id: generateId('rem'),
      status: reminderData.status || 'upcoming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reminders.unshift(newReminder);
    this.saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
    this.logLocalActivity('create_reminder', newReminder.title, newReminder.category);
    return newReminder;
  }

  public updateLocalReminder(id: string, updates: Partial<Reminder>): Reminder {
    const reminders = this.getLocalReminders();
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reminder not found');

    const updated: Reminder = {
      ...reminders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    reminders[index] = updated;
    this.saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
    this.logLocalActivity('update_reminder', updated.title, updated.category);
    return updated;
  }

  public deleteLocalReminder(id: string): void {
    const reminders = this.getLocalReminders();
    const reminder = reminders.find(r => r.id === id);
    const filtered = reminders.filter(r => r.id !== id);
    this.saveToStorage(STORAGE_KEYS.REMINDERS, filtered);
    if (reminder) {
      this.logLocalActivity('delete_reminder', reminder.title, reminder.category);
    }
  }

  public getLocalTasks(userId?: string): Task[] {
    if (!this.isBrowser()) return [];
    try {
      const key = this.getUserStorageKey(STORAGE_KEYS.TASKS, userId);
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      if (!userId) {
        const base = localStorage.getItem(STORAGE_KEYS.TASKS);
        return base ? JSON.parse(base) : getDemoTasks();
      }
      return [];
    } catch {
      return [];
    }
  }

  public saveLocalTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const tasks = this.getLocalTasks();
    const newTask: Task = {
      ...taskData,
      id: generateId('task'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    this.saveToStorage(STORAGE_KEYS.TASKS, tasks);
    this.logLocalActivity('create_task', newTask.title, newTask.category);
    return newTask;
  }

  public updateLocalTask(id: string, updates: Partial<Task>): Task {
    const tasks = this.getLocalTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');

    const updated: Task = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    tasks[index] = updated;
    this.saveToStorage(STORAGE_KEYS.TASKS, tasks);
    this.logLocalActivity('update_task', updated.title, updated.category);
    return updated;
  }

  public deleteLocalTask(id: string): void {
    const tasks = this.getLocalTasks();
    const task = tasks.find(t => t.id === id);
    const filtered = tasks.filter(t => t.id !== id);
    this.saveToStorage(STORAGE_KEYS.TASKS, filtered);
    if (task) {
      this.logLocalActivity('delete_task', task.title, task.category);
    }
  }

  public getLocalIntegrations(userId?: string): IntegrationItem[] {
    if (!this.isBrowser()) return getDemoIntegrations();
    try {
      const key = this.getUserStorageKey(STORAGE_KEYS.INTEGRATIONS, userId);
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      return getDemoIntegrations();
    } catch {
      return getDemoIntegrations();
    }
  }

  public getLocalAutomations(userId?: string): AutomationExecution[] {
    if (!this.isBrowser()) return getDemoAutomations();
    try {
      const key = this.getUserStorageKey(STORAGE_KEYS.AUTOMATIONS, userId);
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      return getDemoAutomations();
    } catch {
      return getDemoAutomations();
    }
  }

  public getLocalActivities(userId?: string): ActivityItem[] {
    if (!this.isBrowser()) return [];
    try {
      const key = this.getUserStorageKey(STORAGE_KEYS.ACTIVITIES, userId);
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  }

  public logLocalActivity(type: ActivityType, title: string, category?: string, description?: string): void {
    const activities = this.getLocalActivities();
    const item: ActivityItem = {
      id: generateId('act'),
      type,
      title,
      category,
      description,
      timestamp: new Date().toISOString(),
    };
    activities.unshift(item);
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, activities.slice(0, 30));
  }

  private getUserStorageKey(baseKey: string, userId?: string): string {
    return userId ? `${baseKey}_${userId}` : baseKey;
  }

  private cacheUserMemories(userId?: string, memories: Memory[] = []): void {
    this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.MEMORIES, userId), memories);
  }

  private cacheUserReminders(userId?: string, reminders: Reminder[] = []): void {
    this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.REMINDERS, userId), reminders);
  }

  private cacheUserTasks(userId?: string, tasks: Task[] = []): void {
    this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.TASKS, userId), tasks);
  }

  private cacheUserIntegrations(userId?: string, integrations: IntegrationItem[] = []): void {
    this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.INTEGRATIONS, userId), integrations);
  }

  private cacheUserAutomations(userId?: string, automations: AutomationExecution[] = []): void {
    this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.AUTOMATIONS, userId), automations);
  }

  private cacheUserActivities(userId?: string, activities: ActivityItem[] = []): void {
    this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.ACTIVITIES, userId), activities);
  }

  private checkOverdueList(list: Reminder[]): Reminder[] {
    const now = new Date();
    return list.map(r => {
      if (r.status === 'completed') return r;
      if (!r.date) return r;
      const target = r.time ? new Date(`${r.date}T${r.time}:00`) : new Date(`${r.date}T23:59:59`);
      if (!isNaN(target.getTime()) && target < now) {
        return { ...r, status: 'overdue' as const };
      }
      return r;
    });
  }

  private saveToStorage(key: string, data: any): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`[StorageService] Failed to write to localStorage for key ${key}:`, e);
    }
  }
}

export const storageService = new StorageService();
