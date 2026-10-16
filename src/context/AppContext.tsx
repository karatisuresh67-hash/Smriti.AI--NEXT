import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storageService } from '../services/storageService';
import { useAuth } from './AuthContext';
import type { 
  Memory, 
  Reminder, 
  UserSettings, 
  ActivityItem, 
  ChatMessageItem, 
  ToastItem, 
  AppTab 
} from '../types';

interface AppContextValue {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  memories: Memory[];
  reminders: Reminder[];
  settings: UserSettings;
  activities: ActivityItem[];
  isLoaded: boolean;
  isLoadingData: boolean;
  dataError: string | null;
  refreshData: () => Promise<void>;
  chatMessages: ChatMessageItem[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>>;
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastItem['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  addMemory: (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Memory>;
  updateMemory: (id: string, updates: Partial<Memory>) => Promise<Memory>;
  deleteMemory: (id: string) => Promise<void>;
  addReminder: (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Reminder['status'] }) => Promise<Reminder>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<Reminder>;
  toggleReminder: (id: string) => Promise<Reminder>;
  deleteReminder: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => UserSettings;
  resetToDemo: () => void;
  clearAllData: () => void;
  importBackup: (backup: any) => Promise<boolean>;
  dueReminders: Reminder[];
  overdueReminders: Reminder[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    displayName: 'Suresh',
    voiceResponse: true,
    notificationsEnabled: false,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: "Hello! I'm Smriti AI, your personal memory assistant. Ask me anything about your saved facts, birthdays, and reminders, or tell me what to remember!",
      timestamp: new Date().toISOString(),
      action: null,
    }
  ]);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * Refreshes data from Supabase for authenticated users,
   * or loads from local guest storage if unauthenticated.
   */
  const refreshData = useCallback(async () => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      if (user) {
        // Authenticated user: fetch from Supabase public tables with RLS
        const [userMems, userRems, userActs] = await Promise.all([
          storageService.getMemories(user.id),
          storageService.getReminders(user.id),
          storageService.getActivities(user.id),
        ]);
        setMemories(userMems);
        setReminders(userRems);
        setActivities(userActs);
      } else {
        // Guest mode / unauthenticated preview: load from localStorage
        storageService.init();
        setMemories(storageService.getLocalMemories());
        setReminders(storageService.getLocalReminders());
        setActivities(storageService.getLocalActivities());
      }
      setSettings(storageService.getSettings());
    } catch (err: any) {
      console.warn('[AppContext] Error refreshing data from Supabase:', err);
      setDataError(err?.message || 'Error synchronizing with Supabase');
      // Fallback to local cached data for resilience
      setMemories(storageService.getLocalMemories(user?.id));
      setReminders(storageService.getLocalReminders(user?.id));
      setActivities(storageService.getLocalActivities(user?.id));
    } finally {
      setIsLoaded(true);
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      refreshData();
    }
  }, [authLoading, refreshData]);

  // ============================================================================
  // MEMORY ACTIONS
  // ============================================================================

  const addMemory = useCallback(async (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> => {
    try {
      const created = await storageService.saveMemory(memoryData, user?.id);
      setMemories(prev => [created, ...prev.filter(m => m.id !== created.id)]);
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      addToast(`Saved memory: "${created.title}"`, 'success');
      return created;
    } catch (err: any) {
      addToast(`Failed to save memory: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  const updateMemory = useCallback(async (id: string, updates: Partial<Memory>): Promise<Memory> => {
    try {
      const updated = await storageService.updateMemory(id, updates, user?.id);
      setMemories(prev => prev.map(m => m.id === id ? updated : m));
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      addToast(`Updated memory: "${updated.title}"`, 'success');
      return updated;
    } catch (err: any) {
      addToast(`Failed to update memory: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  const deleteMemory = useCallback(async (id: string): Promise<void> => {
    try {
      await storageService.deleteMemory(id, user?.id);
      setMemories(prev => prev.filter(m => m.id !== id));
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      addToast('Memory deleted', 'info');
    } catch (err: any) {
      addToast(`Failed to delete memory: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  // ============================================================================
  // REMINDER ACTIONS
  // ============================================================================

  const addReminder = useCallback(async (
    reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Reminder['status'] }
  ): Promise<Reminder> => {
    try {
      const created = await storageService.saveReminder(reminderData, user?.id);
      setReminders(prev => [created, ...prev.filter(r => r.id !== created.id)]);
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      addToast(`Reminder set: "${created.title}"`, 'success');
      return created;
    } catch (err: any) {
      addToast(`Failed to set reminder: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>): Promise<Reminder> => {
    try {
      const updated = await storageService.updateReminder(id, updates, user?.id);
      setReminders(prev => prev.map(r => r.id === id ? updated : r));
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      addToast(`Updated reminder: "${updated.title}"`, 'success');
      return updated;
    } catch (err: any) {
      addToast(`Failed to update reminder: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  const toggleReminder = useCallback(async (id: string): Promise<Reminder> => {
    try {
      const current = reminders.find(r => r.id === id);
      const updated = await storageService.toggleReminderStatus(id, current?.status, user?.id);
      setReminders(prev => prev.map(r => r.id === id ? updated : r));
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      const statusMsg = updated.status === 'completed' ? 'Completed' : 'Reopened';
      addToast(`Reminder ${statusMsg}: "${updated.title}"`, 'info');
      return updated;
    } catch (err: any) {
      addToast(`Failed to update reminder: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [reminders, user, addToast]);

  const deleteReminder = useCallback(async (id: string): Promise<void> => {
    try {
      await storageService.deleteReminder(id, user?.id);
      setReminders(prev => prev.filter(r => r.id !== id));
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      addToast('Reminder deleted', 'info');
    } catch (err: any) {
      addToast(`Failed to delete reminder: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  // ============================================================================
  // SETTINGS & BACKUP ACTIONS
  // ============================================================================

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    const updated = storageService.updateSettings(updates);
    setSettings(updated);
    addToast('Settings saved', 'success');
    return updated;
  }, [addToast]);

  const resetToDemo = useCallback(() => {
    storageService.resetToDemo();
    refreshData();
    addToast('Reset to demo memories and reminders', 'info');
  }, [refreshData, addToast]);

  const clearAllData = useCallback(() => {
    storageService.clearAll();
    refreshData();
    addToast('All local data cleared', 'info');
  }, [refreshData, addToast]);

  const importBackup = useCallback(async (backup: any): Promise<boolean> => {
    try {
      await storageService.importBackup(backup, user?.id);
      await refreshData();
      addToast('Backup imported successfully', 'success');
      return true;
    } catch (e: any) {
      addToast(`Import failed: ${e?.message || 'Invalid format'}`, 'error');
      return false;
    }
  }, [user, refreshData, addToast]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const dueReminders = reminders.filter(r => r.status === 'overdue' || (r.status === 'upcoming' && r.date === todayStr));
  const overdueReminders = reminders.filter(r => r.status === 'overdue');

  const value: AppContextValue = {
    currentTab,
    setCurrentTab,
    memories,
    reminders,
    settings,
    activities,
    isLoaded,
    isLoadingData,
    dataError,
    refreshData,
    chatMessages,
    setChatMessages,
    toasts,
    addToast,
    removeToast,
    addMemory,
    updateMemory,
    deleteMemory,
    addReminder,
    updateReminder,
    toggleReminder,
    deleteReminder,
    updateSettings,
    resetToDemo,
    clearAllData,
    importBackup,
    dueReminders,
    overdueReminders,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
