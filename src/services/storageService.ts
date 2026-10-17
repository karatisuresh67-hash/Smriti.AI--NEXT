import type { 
  Memory, 
  Reminder, 
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
  SETTINGS: 'smriti_settings_v2',
  ACTIVITIES: 'smriti_activities_v2',
  INITIALIZED: 'smriti_initialized_v2',
  MIGRATED_PREFIX: 'smriti_migrated_',
};

/**
 * Database schema row interfaces matching public.memories, public.reminders, public.activities
 * in docs/supabase-schema.sql exactly.
 */
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


export interface DbActivityRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
}


function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
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
    
    id: data.id && isUuid(data.id)
      ? data.id
      : crypto.randomUUID(),

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
   
    id: data.id && isUuid(data.id)
      ? data.id
      : crypto.randomUUID(),

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

const getDemoMemories = (): Memory[] => {
  const currentYear = new Date().getFullYear();
  return [
    {
      id: 'demo-mem-1',
      title: "Rahul's Birthday",
      content: "Rahul's birthday is November 15. He loves reading science fiction novels and drinking double espresso.",
      category: "Birthday",
      date: `${currentYear}-11-15`,
      person: "Rahul",
      isDemo: true,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'demo-mem-2',
      title: "Prof. Sharma's Office Hours",
      content: "Professor Sharma has walk-in office hours in Building B, Room 402 on Tuesdays & Thursdays from 2:00 PM to 4:00 PM.",
      category: "Important Event",
      date: "",
      person: "Prof. Sharma",
      isDemo: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'demo-mem-3',
      title: "Personal Coffee Order",
      content: "Oat milk flat white with cinnamon on top, strictly unsweetened.",
      category: "Preference",
      date: "",
      person: "Me",
      isDemo: true,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'demo-mem-4',
      title: "Quarterly Learning Goal",
      content: "Complete personal AI memory assistant project setup and prepare live demonstration.",
      category: "Personal Goal",
      date: `${currentYear}-10-10`,
      person: "Suresh",
      isDemo: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ];
};

const getDemoReminders = (): Reminder[] => {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = formatYMD(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatYMD(tomorrow);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatYMD(yesterday);

  return [
    {
      id: 'demo-rem-1',
      title: "Call Professor Sharma regarding thesis",
      description: "Discuss draft chapter feedback and scheduling follow-up consultation.",
      date: tomorrowStr,
      time: "09:00",
      category: "Academic",
      priority: "High",
      status: "upcoming",
      linkedMemoryId: "demo-mem-2",
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-rem-2',
      title: "Project Milestone Review",
      description: "Final walkthrough and feature demonstration prep.",
      date: todayStr,
      time: "17:00",
      category: "Project",
      priority: "High",
      status: "upcoming",
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-rem-3',
      title: "Submit Lab Progress Report",
      description: "Send compiled progress notes to academic advisor.",
      date: yesterdayStr,
      time: "14:00",
      category: "Academic",
      priority: "Medium",
      status: "overdue",
      isDemo: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    }
  ];
};

const defaultSettings: UserSettings = {
  displayName: '',
  voiceResponse: true,
  notificationsEnabled: false,
};

class StorageService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Retrieves the currently authenticated Supabase user.
   * Validates authentication state securely with Supabase Auth.
   */
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
    } else {
      this.recalculateOverdueStatuses();
    }
  }

  // ============================================================================
  // MEMORY CRUD (Connected to public.memories with RLS enforcement)
  // ============================================================================

  /**
   * Reads memories for the authenticated user from public.memories.
   * Automatically enforces Row Level Security (auth.uid() = user_id).
   * Falls back to local cached storage on network failure.
   */
  public async getMemories(passedUserId?: string): Promise<Memory[]> {
    const user = await this.getCurrentUser();
    const activeUserId = user?.id || passedUserId;

    if (activeUserId && supabase && isSupabaseConfigured) {
      try {
        // Run one-time migration for legacy non-demo local memories if any
        await this.syncLocalDataToSupabase(activeUserId);

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
        console.warn('[StorageService] Network failure loading memories, using cache:', err);
        return this.getLocalMemories(activeUserId);
      }
    }

    // Guest mode / unauthenticated local storage
    return this.getLocalMemories();
  }

  /**
   * Inserts a new memory into public.memories.
   * Strictly uses the authenticated user's ID as user_id. Never trusts client input.
   */
  public async saveMemory(
    memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>,
    _untrustedUserId?: string
  ): Promise<Memory> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id; // Strictly from authenticated Supabase session
      const row = memoryToRow(memoryData, verifiedUserId);

      const { data, error } = await supabase
        .from('memories')
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error('[StorageService] Failed to insert memory into Supabase:', error);
        throw new Error(error.message || 'Failed to save memory to Supabase');
      }

      const createdMemory = rowToMemory(data);
      const cached = this.getLocalMemories(verifiedUserId);
      this.cacheUserMemories(
        verifiedUserId,
        [createdMemory, ...cached.filter(m => m.id !== createdMemory.id)]
      );

      await this.logActivity(
        'create_memory',
        createdMemory.title,
        createdMemory.category,
        undefined,
        verifiedUserId
      );

      return createdMemory;
    }

    // Fallback for guest mode / local storage
    return this.saveLocalMemory(memoryData);
  }

  /**
   * Updates an existing memory in public.memories.
   * Scoped to the authenticated user's ID and enforced by Supabase RLS.
   */
  public async updateMemory(
    id: string,
    updates: Partial<Memory>,
    _untrustedUserId?: string
  ): Promise<Memory> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const now = new Date().toISOString();

      const dbUpdates: Record<string, any> = {
        updated_at: now,
      };
      if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
      if (updates.content !== undefined) dbUpdates.content = updates.content.trim();
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.date !== undefined) dbUpdates.date = updates.date ? updates.date : null;
      if (updates.person !== undefined) dbUpdates.person = updates.person && updates.person.trim() ? updates.person.trim() : null;

      const { data, error } = await supabase
        .from('memories')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', verifiedUserId) // Defense-in-depth on top of database RLS
        .select()
        .single();

      if (error) {
        console.error('[StorageService] Failed to update memory in Supabase:', error);
        throw new Error(error.message || 'Failed to update memory in Supabase');
      }

      const updatedMemory = rowToMemory(data);
      const cached = this.getLocalMemories(verifiedUserId);
      this.cacheUserMemories(
        verifiedUserId,
        cached.map(m => m.id === id ? updatedMemory : m)
      );

      await this.logActivity(
        'update_memory',
        updatedMemory.title,
        updatedMemory.category,
        undefined,
        verifiedUserId
      );

      return updatedMemory;
    }

    return this.updateLocalMemory(id, updates);
  }

  /**
   * Deletes a memory from public.memories.
   * Scoped to the authenticated user's ID and protected by Supabase RLS.
   */
  public async deleteMemory(id: string, _untrustedUserId?: string): Promise<void> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const cached = this.getLocalMemories(verifiedUserId);
      const existing = cached.find(m => m.id === id);

      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id)
        .eq('user_id', verifiedUserId); // Enforce owner matching + RLS

      if (error) {
        console.error('[StorageService] Failed to delete memory from Supabase:', error);
        throw new Error(error.message || 'Failed to delete memory from Supabase');
      }

      this.cacheUserMemories(verifiedUserId, cached.filter(m => m.id !== id));
      if (existing) {
        await this.logActivity(
          'delete_memory',
          existing.title,
          existing.category,
          undefined,
          verifiedUserId
        );
      }
      return;
    }

    this.deleteLocalMemory(id);
  }

  // ============================================================================
  // REMINDER CRUD (Connected to public.reminders with RLS enforcement)
  // ============================================================================

  /**
   * Reads reminders for the authenticated user from public.reminders.
   * Enforced by database RLS policies.
   */
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

        if (error) {
          console.warn('[StorageService] Error loading reminders from Supabase:', error.message);
          return this.checkOverdueList(this.getLocalReminders(activeUserId));
        }

        const list = this.checkOverdueList((data || []).map(rowToReminder));
        this.cacheUserReminders(activeUserId, list);
        return list;
      } catch (err) {
        console.warn('[StorageService] Network failure loading reminders, using cache:', err);
        return this.checkOverdueList(this.getLocalReminders(activeUserId));
      }
    }

    return this.checkOverdueList(this.getLocalReminders());
  }

  /**
   * Inserts a new reminder into public.reminders.
   * Strictly assigns user_id from the verified authenticated session.
   */
  public async saveReminder(
    reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Reminder['status'] },
    _untrustedUserId?: string
  ): Promise<Reminder> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const row = reminderToRow(reminderData, verifiedUserId);

      const { data, error } = await supabase
        .from('reminders')
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error('[StorageService] Failed to insert reminder into Supabase:', error);
        throw new Error(error.message || 'Failed to save reminder to Supabase');
      }

      const createdReminder = rowToReminder(data);
      const cached = this.getLocalReminders(verifiedUserId);
      this.cacheUserReminders(
        verifiedUserId,
        [createdReminder, ...cached.filter(r => r.id !== createdReminder.id)]
      );

      await this.logActivity(
        'create_reminder',
        createdReminder.title,
        createdReminder.category,
        undefined,
        verifiedUserId
      );

      return createdReminder;
    }

    return this.saveLocalReminder(reminderData);
  }

  /**
   * Updates an existing reminder in public.reminders.
   * Matches the exact columns: title, description, date, time, category, priority, status, linked_memory_id, recurrence, snooze_until.
   */
  public async updateReminder(
    id: string,
    updates: Partial<Reminder>,
    _untrustedUserId?: string
  ): Promise<Reminder> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const now = new Date().toISOString();

      const dbUpdates: Record<string, any> = {
        updated_at: now,
      };
      if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
      if (updates.description !== undefined) {
        dbUpdates.description = updates.description && updates.description.trim() ? updates.description.trim() : null;
      }
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

      if (error) {
        console.error('[StorageService] Failed to update reminder in Supabase:', error);
        throw new Error(error.message || 'Failed to update reminder in Supabase');
      }

      const updatedReminder = rowToReminder(data);
      const cached = this.getLocalReminders(verifiedUserId);
      this.cacheUserReminders(
        verifiedUserId,
        cached.map(r => r.id === id ? updatedReminder : r)
      );

      await this.logActivity(
        'update_reminder',
        updatedReminder.title,
        updatedReminder.category,
        undefined,
        verifiedUserId
      );

      return updatedReminder;
    }

    return this.updateLocalReminder(id, updates);
  }

  /**
   * Toggles reminder completion status.
   */
  public async toggleReminderStatus(
    id: string,
    currentStatus?: ReminderStatus,
    _untrustedUserId?: string
  ): Promise<Reminder> {
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

  /**
   * Deletes a reminder from public.reminders.
   * Scoped to the authenticated user's ID and enforced by RLS.
   */
  public async deleteReminder(id: string, _untrustedUserId?: string): Promise<void> {
    const user = await this.getCurrentUser();

    if (user && supabase && isSupabaseConfigured) {
      const verifiedUserId = user.id;
      const cached = this.getLocalReminders(verifiedUserId);
      const existing = cached.find(r => r.id === id);

      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', verifiedUserId);

      if (error) {
        console.error('[StorageService] Failed to delete reminder from Supabase:', error);
        throw new Error(error.message || 'Failed to delete reminder from Supabase');
      }

      this.cacheUserReminders(verifiedUserId, cached.filter(r => r.id !== id));
      if (existing) {
        await this.logActivity(
          'delete_reminder',
          existing.title,
          existing.category,
          undefined,
          verifiedUserId
        );
      }
      return;
    }

    this.deleteLocalReminder(id);
  }

  // ============================================================================
  // ACTIVITIES (Audit Trail connected to public.activities)
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

        if (error) {
          return this.getLocalActivities(activeUserId);
        }

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
      const actId = `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

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
        userId: verifiedUserId,
        type,
        title,
        category,
        description,
        timestamp: new Date().toISOString(),
        id: ''
      };
      this.cacheUserActivities(verifiedUserId, [item, ...current].slice(0, 30));
      return;
    }

    this.logLocalActivity(type, title, category, description);
  }

  // ============================================================================
  // BACKWARD-COMPATIBLE LOCAL STORAGE MIGRATION
  // ============================================================================

  /**
   * Safely migrates existing local non-demo memories and reminders to Supabase
   * when a user first logs in. Preserves existing local data and does not delete it.
   */
  public async syncLocalDataToSupabase(userId: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured || !this.isBrowser()) return;

    const migrationKey = `${STORAGE_KEYS.MIGRATED_PREFIX}${userId}`;
    if (localStorage.getItem(migrationKey)) {
      return; // Already synchronized
    }

    try {
      // Check if user already has records in Supabase
      const { count, error } = await supabase
        .from('memories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) return;

      // If user account is new with zero records, migrate existing non-demo local items
      if (count === 0) {
        const localMemories = this.getLocalMemories();
        const nonDemoMemories = localMemories.filter(m => !m.isDemo);

        if (nonDemoMemories.length > 0) {
          const rows = nonDemoMemories.map(m => memoryToRow(m, userId));
          await supabase.from('memories').insert(rows);
        }

        const localReminders = this.getLocalReminders();
        const nonDemoReminders = localReminders.filter(r => !r.isDemo);

        if (nonDemoReminders.length > 0) {
          const rows = nonDemoReminders.map(r => reminderToRow(r, userId));
          await supabase.from('reminders').insert(rows);
        }
      }

      // Mark migration complete for this user without deleting local data
      localStorage.setItem(migrationKey, 'true');
    } catch (e) {
      console.warn('[StorageService] Note during local data migration:', e);
    }
  }

  // ============================================================================
  // SETTINGS & LOCAL STORAGE HELPERS
  // ============================================================================

  
  public getSettings(userId?: string): UserSettings {
    if (!this.isBrowser()) return defaultSettings;

    try {
      const settingsKey = userId
        ? `${STORAGE_KEYS.SETTINGS}_${userId}`
        : STORAGE_KEYS.SETTINGS;

      const data = localStorage.getItem(settingsKey);

      return data
        ? { ...defaultSettings, ...JSON.parse(data) }
        : defaultSettings;
    } catch {
      return defaultSettings;
    }
  }

  public updateSettings(
    updates: Partial<UserSettings>,
    userId?: string
  ): UserSettings {
    const current = this.getSettings(userId);
    const merged = { ...current, ...updates };

    const settingsKey = userId
      ? `${STORAGE_KEYS.SETTINGS}_${userId}`
      : STORAGE_KEYS.SETTINGS;

    this.saveToStorage(settingsKey, merged);

    return merged;
  }


  public resetToDemo(): void {
    if (!this.isBrowser()) return;
    this.saveToStorage(STORAGE_KEYS.MEMORIES, getDemoMemories());
    this.saveToStorage(STORAGE_KEYS.REMINDERS, getDemoReminders());
    this.saveToStorage(STORAGE_KEYS.SETTINGS, defaultSettings);
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, [
      {
        id: 'act-init-1',
        type: 'create_memory',
        title: "Loaded Rahul's Birthday demo memory",
        category: 'Birthday',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'act-init-2',
        type: 'create_reminder',
        title: "Loaded Professor Sharma consultation demo reminder",
        category: 'Academic',
        timestamp: new Date().toISOString(),
      }
    ]);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  public clearAll(): void {
    if (!this.isBrowser()) return;
    this.saveToStorage(STORAGE_KEYS.MEMORIES, []);
    this.saveToStorage(STORAGE_KEYS.REMINDERS, []);
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, []);
  }

  public exportBackup(
    currentMemories?: Memory[],
    currentReminders?: Reminder[]
  ): {
    version: string;
    exportedAt: string;
    memories: Memory[];
    reminders: Reminder[];
    settings: UserSettings;
  } {
    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      memories: currentMemories || this.getLocalMemories(),
      reminders: currentReminders || this.getLocalReminders(),
      settings: this.getSettings(),
    };
  }

  public async importBackup(backup: any, userId?: string): Promise<void> {
    if (!backup || typeof backup !== 'object') {
      throw new Error('Invalid backup file format');
    }

    const user = await this.getCurrentUser();
    const activeUserId = user?.id || userId;

    if (activeUserId && supabase && isSupabaseConfigured) {
      if (Array.isArray(backup.memories) && backup.memories.length > 0) {
        const rows = backup.memories.map((m: any) => memoryToRow(m, activeUserId));
        await supabase.from('memories').upsert(rows);
      }
      if (Array.isArray(backup.reminders) && backup.reminders.length > 0) {
        const rows = backup.reminders.map((r: any) => reminderToRow(r, activeUserId));
        await supabase.from('reminders').upsert(rows);
      }
    }

    if (Array.isArray(backup.memories)) {
      this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.MEMORIES, activeUserId), backup.memories);
    }
    if (Array.isArray(backup.reminders)) {
      this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.REMINDERS, activeUserId), backup.reminders);
    }
    if (backup.settings && typeof backup.settings === 'object') {
      this.saveToStorage(STORAGE_KEYS.SETTINGS, { ...defaultSettings, ...backup.settings });
    }
  }

  // ============================================================================
  // LOCAL STORAGE FALLBACK METHODS
  // ============================================================================

  public getLocalMemories(userId?: string): Memory[] {
    if (!this.isBrowser()) return [];
    try {
      const key = this.getUserStorageKey(STORAGE_KEYS.MEMORIES, userId);
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      if (!userId) {
        const base = localStorage.getItem(STORAGE_KEYS.MEMORIES);
        return base ? JSON.parse(base) : getDemoMemories();
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
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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
        return base ? JSON.parse(base) : getDemoReminders();
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
      id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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

  public getLocalActivities(userId?: string): ActivityItem[] {
    if (!this.isBrowser()) return [];
    try {
      const key = this.getUserStorageKey(STORAGE_KEYS.ACTIVITIES, userId);
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      if (!userId) {
        const base = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
        return base ? JSON.parse(base) : [];
      }
      return [];
    } catch {
      return [];
    }
  }

  public logLocalActivity(type: ActivityType, title: string, category?: string, description?: string): void {
    const activities = this.getLocalActivities();
    const item: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      category,
      description,
      timestamp: new Date().toISOString(),
    };
    activities.unshift(item);
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, activities.slice(0, 30));
  }

  // ============================================================================
  // INTERNAL CACHING & UTILITIES
  // ============================================================================

  private getUserStorageKey(baseKey: string, userId?: string): string {
    return userId ? `${baseKey}_${userId}` : baseKey;
  }

  private cacheUserMemories(userId: string, memories: Memory[]): void {
    this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.MEMORIES, userId), memories);
  }

  private cacheUserReminders(userId: string, reminders: Reminder[]): void {
    this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.REMINDERS, userId), reminders);
  }

  private cacheUserActivities(userId: string, activities: ActivityItem[]): void {
    this.saveToStorage(this.getUserStorageKey(STORAGE_KEYS.ACTIVITIES, userId), activities);
  }

  private recalculateOverdueStatuses(): void {
    const reminders = this.getLocalReminders();
    this.saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
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
