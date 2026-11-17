import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storageService } from '../services/storageService';
import { chromeActionService } from '../services/chromeActionService';
import { useAuth } from './AuthContext';
import type { 
  Memory, 
  Reminder, 
  Task,
  TaskStatus,
  IntegrationItem,
  IntegrationProvider,
  ActionExecution,
  AutomationExecution,
  DocumentItem,
  UserSettings, 
  ActivityItem, 
  ChatMessageItem, 
  ToastItem, 
  AppTab,
  ChromeActionJob
} from '../types';

interface AppContextValue {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  memories: Memory[];
  reminders: Reminder[];
  tasks: Task[];
  documents: DocumentItem[];
  actions: ActionExecution[];
  integrations: IntegrationItem[];
  automations: AutomationExecution[];
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
  // Memory
  addMemory: (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Memory>;
  updateMemory: (id: string, updates: Partial<Memory>) => Promise<Memory>;
  deleteMemory: (id: string) => Promise<void>;
  // Reminder
  addReminder: (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Reminder['status'] }) => Promise<Reminder>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<Reminder>;
  toggleReminder: (id: string) => Promise<Reminder>;
  deleteReminder: (id: string) => Promise<void>;
  // Tasks
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: TaskStatus }) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  toggleTaskStatus: (id: string) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  // Documents
  addDocument: (docData: Omit<DocumentItem, 'id' | 'uploadedAt'>) => Promise<DocumentItem>;
  deleteDocument: (id: string) => Promise<void>;
  // Actions & Automations
  logActionExecution: (entry: Omit<ActionExecution, 'id' | 'startedAt'>) => Promise<ActionExecution>;
  updateIntegration: (provider: IntegrationProvider, updates: Partial<IntegrationItem>) => Promise<IntegrationItem>;
  logAutomationExecution: (entry: Omit<AutomationExecution, 'id' | 'startedAt'>) => Promise<AutomationExecution>;
  // Chrome Native Actions
  chromeJobs: ChromeActionJob[];
  activeChromeJob: ChromeActionJob | null;
  dispatchChromeAction: (params: {
    command: string;
    websiteName: string;
    actionType: 'navigate' | 'search' | 'play' | 'extract' | 'interact' | 'oauth_sync';
    destinationUrl: string;
    targetTitle?: string;
    executionMode?: 'chrome_tab' | 'remote_browser' | 'oauth_integration';
    requiresApproval?: boolean;
    skipAutoTab?: boolean;
  }) => Promise<ChromeActionJob>;
  openInChrome: (jobId: string) => void;
  cancelChromeJob: (jobId: string) => void;
  resumeChromeJob: (jobId: string) => void;
  // Theme & Settings
  darkMode: boolean;
  setDarkMode: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  toggleDarkMode: () => void;
  updateSettings: (updates: Partial<UserSettings>) => UserSettings;
  resetToDemo: () => void;
  clearAllData: () => void;
  importBackup: (backup: any) => Promise<boolean>;
  // Derived state
  dueReminders: Reminder[];
  overdueReminders: Reminder[];
  todayTasks: Task[];
  completedTasks: Task[];
  pendingTasks: Task[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, profile, session, loading: authLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [actions, setActions] = useState<ActionExecution[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [automations, setAutomations] = useState<AutomationExecution[]>([]);
  const [chromeJobs, setChromeJobs] = useState<ChromeActionJob[]>([]);
  const [activeChromeJob, setActiveChromeJob] = useState<ChromeActionJob | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    displayName: '',
    voiceResponse: true,
    notificationsEnabled: false,
    darkMode: true,
  });
  const [darkMode, setDarkModeState] = useState<boolean>(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: "Hello! I'm Smriti AI, your autonomous personal AI assistant. I can browse the web, analyze documents, manage tasks, and coordinate your schedule. What would you like to achieve today?",
      timestamp: new Date().toISOString(),
      action: null,
    }
  ]);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Always enforce dark mode and subscribe to Chrome actions
  useEffect(() => {
    document.documentElement.classList.add('dark');

    setChromeJobs(chromeActionService.getJobs());
    setActiveChromeJob(chromeActionService.getActiveJob());
    const unsub = chromeActionService.subscribe((job) => {
      setChromeJobs(chromeActionService.getJobs());
      if (['RUNNING', 'STARTING', 'WAITING_FOR_USER', 'WAITING_FOR_APPROVAL'].includes(job.status)) {
        setActiveChromeJob(job);
      } else {
        setActiveChromeJob(prev => prev?.id === job.id ? job : prev);
      }
    });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['dashboard', 'chat', 'voice', 'tasks', 'memories', 'reminders', 'calendar', 'actions', 'documents', 'settings', 'results'].includes(tabParam)) {
        setCurrentTab(tabParam as AppTab);
      }
    }

    return unsub;
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkModeState(true);
  }, []);

  const setDarkMode = useCallback(() => {
    setDarkModeState(true);
  }, []);

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
        const [userMems, userRems, userTasks, userDocs, userInts, userAutos, userActs] = await Promise.all([
          storageService.getMemories(user.id),
          storageService.getReminders(user.id),
          storageService.getTasks(user.id),
          storageService.getDocuments(user.id),
          storageService.getIntegrations(user.id),
          storageService.getAutomations(user.id),
          storageService.getActivities(user.id),
        ]);
        setMemories(userMems);
        setReminders(userRems);
        setTasks(userTasks);
        setDocuments(userDocs);
        setIntegrations(userInts);
        setAutomations(userAutos);
        setActions(userAutos);
        setActivities(userActs);
      } else {
        storageService.init();
        setMemories(storageService.getLocalMemories());
        setReminders(storageService.getLocalReminders());
        setTasks(storageService.getLocalTasks());
        setDocuments(storageService.getLocalDocuments());
        setIntegrations(storageService.getLocalIntegrations());
        setAutomations(storageService.getLocalAutomations());
        setActions(storageService.getLocalAutomations());
        setActivities(storageService.getLocalActivities());
      }
      const savedSettings = storageService.getSettings();

      setSettings({
        ...savedSettings,
        displayName: profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || savedSettings.displayName || '',
      });
    } catch (err: any) {
      console.warn('[AppContext] Error refreshing data from Supabase:', err);
      setDataError(err?.message || 'Error synchronizing with Supabase');
      setMemories(storageService.getLocalMemories(user?.id));
      setReminders(storageService.getLocalReminders(user?.id));
      setTasks(storageService.getLocalTasks(user?.id));
      setDocuments(storageService.getLocalDocuments(user?.id));
      setIntegrations(storageService.getLocalIntegrations(user?.id));
      setAutomations(storageService.getLocalAutomations(user?.id));
      setActions(storageService.getLocalAutomations(user?.id));
      setActivities(storageService.getLocalActivities(user?.id));
    } finally {
      setIsLoaded(true);
      setIsLoadingData(false);
    }
  }, [user, profile]);

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
  // TASK ACTIONS
  // ============================================================================

  const addTask = useCallback(async (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: TaskStatus }
  ): Promise<Task> => {
    try {
      const taskWithDefaults = {
        ...taskData,
        status: taskData.status || 'pending',
      };
      const created = await storageService.saveTask(taskWithDefaults, user?.id);
      setTasks(prev => [created, ...prev.filter(t => t.id !== created.id)]);
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      addToast(`Task added: "${created.title}"`, 'success');
      return created;
    } catch (err: any) {
      addToast(`Failed to add task: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<Task> => {
    try {
      const updated = await storageService.updateTask(id, updates, user?.id);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      addToast(`Task updated: "${updated.title}"`, 'success');
      return updated;
    } catch (err: any) {
      addToast(`Failed to update task: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  const toggleTaskStatus = useCallback(async (id: string): Promise<Task> => {
    try {
      const current = tasks.find(t => t.id === id);
      const updated = await storageService.toggleTaskStatus(id, current?.status, user?.id);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      const statusMsg = updated.status === 'completed' ? 'Completed' : 'Pending';
      addToast(`Task ${statusMsg}: "${updated.title}"`, 'info');
      return updated;
    } catch (err: any) {
      addToast(`Failed to toggle task: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [tasks, user, addToast]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      await storageService.deleteTask(id, user?.id);
      setTasks(prev => prev.filter(t => t.id !== id));
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      addToast('Task deleted', 'info');
    } catch (err: any) {
      addToast(`Failed to delete task: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  // ============================================================================
  // DOCUMENTS ACTIONS
  // ============================================================================

  const addDocument = useCallback(async (docData: Omit<DocumentItem, 'id' | 'uploadedAt'>): Promise<DocumentItem> => {
    try {
      const created = await storageService.saveDocument(docData, user?.id);
      setDocuments(prev => [created, ...prev.filter(d => d.id !== created.id)]);
      addToast(`Document analyzed: "${created.name}"`, 'success');
      return created;
    } catch (err: any) {
      addToast(`Failed to save document: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    try {
      await storageService.deleteDocument(id, user?.id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      addToast('Document removed', 'info');
    } catch (err: any) {
      addToast(`Failed to delete document: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  // ============================================================================
  // ACTION EXECUTION & INTEGRATIONS
  // ============================================================================

  const logActionExecution = useCallback(async (
    entry: Omit<ActionExecution, 'id' | 'startedAt'>
  ): Promise<ActionExecution> => {
    try {
      const logged = await storageService.logAutomationExecution(entry, user?.id);
      setActions(prev => [logged, ...prev.filter(a => a.id !== logged.id)]);
      setAutomations(prev => [logged, ...prev.filter(a => a.id !== logged.id)]);
      return logged;
    } catch (err: any) {
      console.warn('Failed to log action execution:', err);
      throw err;
    }
  }, [user]);

  const updateIntegration = useCallback(async (
    provider: IntegrationProvider,
    updates: Partial<IntegrationItem>
  ): Promise<IntegrationItem> => {
    try {
      const updated = await storageService.updateIntegration(provider, updates, user?.id);
      setIntegrations(prev => prev.map(i => i.provider === provider ? updated : i));
      const freshActs = await storageService.getActivities(user?.id);
      setActivities(freshActs);
      addToast(`Integration updated: ${provider.toUpperCase()}`, 'success');
      return updated;
    } catch (err: any) {
      addToast(`Failed to update integration: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  }, [user, addToast]);

  const logAutomationExecution = useCallback(async (
    entry: Omit<AutomationExecution, 'id' | 'startedAt'>
  ): Promise<AutomationExecution> => {
    return logActionExecution(entry);
  }, [logActionExecution]);

  // ============================================================================
  // CHROME NATIVE ACTIONS
  // ============================================================================

  const dispatchChromeAction = useCallback(async (params: {
    command: string;
    websiteName: string;
    actionType: 'navigate' | 'search' | 'play' | 'extract' | 'interact' | 'oauth_sync';
    destinationUrl: string;
    targetTitle?: string;
    executionMode?: 'chrome_tab' | 'remote_browser' | 'oauth_integration';
    requiresApproval?: boolean;
    skipAutoTab?: boolean;
  }): Promise<ChromeActionJob> => {
    const job = chromeActionService.createJob({
      originalCommand: params.command,
      websiteName: params.websiteName,
      actionType: params.actionType,
      destinationUrl: params.destinationUrl,
      targetTitle: params.targetTitle,
      executionMode: params.executionMode || 'chrome_tab',
      requiresApproval: params.requiresApproval,
      userId: user?.id,
    });
    setActiveChromeJob(job);

    const executed = await chromeActionService.executeJob(job.id, {
      providerToken: (session as any)?.provider_token,
      skipAutoTab: params.skipAutoTab,
    });

    if (executed.isPopupBlocked) {
      addToast('Chrome popup blocked automatic tab. Click [Open in Chrome] to launch.', 'info', 6000);
    } else if (executed.status === 'COMPLETED') {
      addToast(`Opened ${executed.websiteName} in Chrome!`, 'success');
    }

    return executed;
  }, [user, session, addToast]);

  const openInChrome = useCallback((jobId: string) => {
    const job = chromeActionService.getJob(jobId);
    if (!job) return;
    const res = chromeActionService.openInChromeTab(job.destinationUrl);
    if (res.success) {
      chromeActionService.resumeJob(jobId);
      addToast(`Launched ${job.websiteName} in Chrome!`, 'success');
    } else {
      addToast('Could not open tab. Please check Chrome popup permissions.', 'error');
    }
  }, [addToast]);

  const cancelChromeJob = useCallback((jobId: string) => {
    const cancelled = chromeActionService.cancelJob(jobId);
    setActiveChromeJob(null);
    addToast(`Cancelled action: ${cancelled.websiteName}`, 'info');
  }, [addToast]);

  const resumeChromeJob = useCallback((jobId: string) => {
    const resumed = chromeActionService.resumeJob(jobId);
    setActiveChromeJob(resumed);
    addToast(`Resumed action for ${resumed.websiteName}`, 'info');
  }, [addToast]);

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
    addToast('All data reset to clean state', 'info');
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

  // Derived reminders
  const todayStr = new Date().toISOString().slice(0, 10);
  const dueReminders = reminders.filter(r => r.status === 'overdue' || (r.status === 'upcoming' && r.date === todayStr));
  const overdueReminders = reminders.filter(r => r.status === 'overdue');

  // Derived tasks
  const todayTasks = tasks.filter(t => !t.dueDate || t.dueDate <= todayStr);
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  const value: AppContextValue = {
    currentTab,
    setCurrentTab,
    memories,
    reminders,
    tasks,
    documents,
    actions,
    integrations,
    automations,
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
    addTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    addDocument,
    deleteDocument,
    logActionExecution,
    updateIntegration,
    logAutomationExecution,
    chromeJobs,
    activeChromeJob,
    dispatchChromeAction,
    openInChrome,
    cancelChromeJob,
    resumeChromeJob,
    darkMode,
    setDarkMode,
    toggleDarkMode,
    updateSettings,
    resetToDemo,
    clearAllData,
    importBackup,
    dueReminders,
    overdueReminders,
    todayTasks,
    completedTasks,
    pendingTasks,
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
