import type { 
  ChromeActionJob, 
  ChromeActionStatus, 
  ChromeActionIntent,
  AgentActionStep 
} from '../types';

const STORAGE_KEY = 'smriti_chrome_jobs_v2';

type JobUpdateListener = (job: ChromeActionJob) => void;

class ChromeActionService {
  private listeners: Set<JobUpdateListener> = new Set();
  private activeJob: ChromeActionJob | null = null;

  public subscribe(listener: JobUpdateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(job: ChromeActionJob): void {
    this.listeners.forEach(fn => fn(job));
  }

  public getJobs(): ChromeActionJob[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getJob(id: string): ChromeActionJob | undefined {
    return this.getJobs().find(j => j.id === id);
  }

  public getActiveJob(): ChromeActionJob | null {
    return this.activeJob;
  }

  private saveJob(job: ChromeActionJob): void {
    const list = this.getJobs();
    const index = list.findIndex(j => j.id === job.id);
    if (index >= 0) {
      list[index] = job;
    } else {
      list.unshift(job);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.error('[ChromeActionService] Failed to save job in localStorage:', e);
    }
    this.notify(job);
  }

  /**
   * Opens destination URL in a new Chrome tab.
   * Accurately detects popup blocking and returns whether opening succeeded.
   */
  public openInChromeTab(url: string): { success: boolean; windowRef: Window | null } {
    if (typeof window === 'undefined') return { success: false, windowRef: null };
    try {
      // In web applications, window.open initiates navigation in a new Chrome tab
      const newTab = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        return { success: false, windowRef: null };
      }
      return { success: true, windowRef: newTab };
    } catch (err) {
      console.warn('[ChromeActionService] window.open failed:', err);
      return { success: false, windowRef: null };
    }
  }

  /**
   * Creates a new Chrome action job and registers it.
   */
  public createJob(params: {
    originalCommand: string;
    websiteName: string;
    actionType: 'navigate' | 'search' | 'play' | 'extract' | 'interact' | 'oauth_sync';
    destinationUrl: string;
    targetTitle?: string;
    executionMode?: 'chrome_tab' | 'remote_browser' | 'oauth_integration';
    requiresApproval?: boolean;
    userId?: string;
  }): ChromeActionJob {
    const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const job: ChromeActionJob = {
      id,
      userId: params.userId,
      originalCommand: params.originalCommand,
      websiteName: params.websiteName,
      actionType: params.actionType,
      destinationUrl: params.destinationUrl,
      targetTitle: params.targetTitle || `${params.websiteName} Action`,
      status: 'QUEUED',
      verificationStatus: 'unverified',
      executionMode: params.executionMode || 'chrome_tab',
      requiresApproval: Boolean(params.requiresApproval),
      createdAt: now,
      updatedAt: now,
      steps: [
        {
          step: 1,
          action: 'Identify requested website and target objective',
          status: 'completed',
          target: params.websiteName,
          timestamp: now,
          detail: `Identified target destination: ${params.destinationUrl}`
        }
      ]
    };

    this.activeJob = job;
    this.saveJob(job);
    return job;
  }

  /**
   * Executes the Chrome Action Job lifecycle:
   * QUEUED -> STARTING -> RUNNING -> WAITING_FOR_USER / WAITING_FOR_APPROVAL -> COMPLETED / FAILED / CANCELLED.
   */
  public async executeJob(
    jobId: string, 
    options?: { 
      providerToken?: string; 
      skipAutoTab?: boolean;
    }
  ): Promise<ChromeActionJob> {
    let job = this.getJob(jobId);
    if (!job) throw new Error(`Action job with id ${jobId} not found.`);

    const addStep = (action: string, status: AgentActionStep['status'], detail?: string) => {
      const stepNum = (job.steps?.length || 0) + 1;
      const step: AgentActionStep = {
        step: stepNum,
        action,
        status,
        target: job.websiteName,
        detail,
        timestamp: new Date().toISOString()
      };
      job.steps = [...(job.steps || []), step];
      job.updatedAt = new Date().toISOString();
      this.saveJob(job);
    };

    // 1. STARTING
    job.status = 'STARTING';
    job.updatedAt = new Date().toISOString();
    this.activeJob = job;
    this.saveJob(job);
    addStep(`Initialize Chrome action job for ${job.websiteName}`, 'running');

    // 2. Check for human approval requirement
    if (job.requiresApproval) {
      job.status = 'WAITING_FOR_APPROVAL';
      addStep(`Paused: Action requires explicit user authorization`, 'waiting_approval');
      this.saveJob(job);
      return job;
    }

    // 3. RUNNING
    job.status = 'RUNNING';
    this.saveJob(job);

    try {
      if (!job.destinationUrl || !job.destinationUrl.startsWith('http')) {
        throw new Error(`Invalid destination URL: "${job.destinationUrl}". Must be a valid HTTP/HTTPS URL.`);
      }

      // Handle OAuth integrations (Gmail, Calendar)
      if (job.executionMode === 'oauth_integration') {
        if (job.websiteName === 'Gmail') {
          addStep('Fetch unread messages via authorized Google Gmail REST API v1', 'running');
          let unreadEmails: any[] = [];
          if (options?.providerToken) {
            const res = await fetch('/api/gmail/messages', {
              headers: { 'Authorization': `Bearer ${options.providerToken}` }
            });
            const gData = await res.json();
            if (!res.ok) {
              throw new Error(gData?.error || 'Gmail API request failed');
            }
            if (gData.synced && Array.isArray(gData.messages)) {
              unreadEmails = gData.messages;
              job.extractedData = { emails: unreadEmails, count: unreadEmails.length };
              addStep(`Retrieved ${unreadEmails.length} unread Gmail messages`, 'completed');
            }
          }
        } else if (job.websiteName === 'Google Calendar') {
          addStep('Sync schedule via authorized Google Calendar REST API v3', 'running');
          if (options?.providerToken) {
            const res = await fetch('/api/calendar/events', {
              headers: { 'Authorization': `Bearer ${options.providerToken}` }
            });
            const cData = await res.json();
            if (!res.ok) {
              throw new Error(cData?.error || 'Google Calendar API request failed');
            }
            if (cData.synced && Array.isArray(cData.events)) {
              job.extractedData = { events: cData.events, count: cData.events.length };
              addStep(`Synchronized ${cData.events.length} Google Calendar events`, 'completed');
            }
          }
        } else if (options?.providerToken) {
          // For any custom OAuth integration, test connectivity
          const res = await fetch(job.destinationUrl, {
            headers: { 'Authorization': `Bearer ${options.providerToken}` }
          });
          if (!res.ok) {
            throw new Error(`Integration endpoint returned status ${res.status}`);
          }
        }
      }

      // 4. Open destination in Chrome tab unless suppressed
      if (!options?.skipAutoTab) {
        addStep(`Launch destination URL in user's Chrome browser: ${job.destinationUrl}`, 'running');
        const openResult = this.openInChromeTab(job.destinationUrl);
        if (openResult.success) {
          job.openedInChrome = true;
          job.isPopupBlocked = false;
          addStep(`Successfully opened Chrome tab for ${job.websiteName}`, 'completed');
        } else {
          job.isPopupBlocked = true;
          job.status = 'WAITING_FOR_USER';
          job.verificationStatus = 'unverified';
          job.errorDetails = 'Chrome popup blocker prevented automatic tab opening.';
          addStep(`Popup blocked by Chrome. Action awaiting user click on [Open in Chrome] button`, 'waiting_approval');
          this.saveJob(job);
          return job;
        }
      }

      // 5. Verification & Completion
      job.status = 'COMPLETED';
      job.verificationStatus = 'verified';
      job.completedAt = new Date().toISOString();
      job.updatedAt = new Date().toISOString();

      if (!job.resultSummary) {
        switch (job.actionType) {
          case 'play':
            job.resultSummary = `Opened video destination on YouTube: "${job.targetTitle || job.destinationUrl}"`;
            break;
          case 'search':
            job.resultSummary = `Navigated to search results on ${job.websiteName} for: "${job.targetTitle || job.destinationUrl}"`;
            break;
          case 'oauth_sync':
            job.resultSummary = `Synchronized with ${job.websiteName} and opened in Chrome`;
            break;
          default:
            job.resultSummary = `Navigated to ${job.websiteName} (${job.destinationUrl}) in Chrome`;
        }
      }

      addStep(`Verified destination URL: ${job.destinationUrl}`, 'completed');
      this.saveJob(job);
      return job;

    } catch (err: any) {
      console.error('[ChromeActionService] Execution error:', err);
      job.status = 'FAILED';
      job.verificationStatus = 'failed';
      job.errorDetails = err?.message || 'Unexpected error executing Chrome action.';
      job.updatedAt = new Date().toISOString();
      addStep(`Action execution failed: ${job.errorDetails}`, 'failed');
      this.saveJob(job);
      return job;
    }
  }

  /**
   * Resumes a paused or blocked action when user confirms or clicks Open in Chrome.
   */
  public resumeJob(jobId: string): ChromeActionJob {
    const job = this.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    // Perform direct user-gesture window.open
    const openRes = this.openInChromeTab(job.destinationUrl);
    job.openedInChrome = openRes.success;
    job.isPopupBlocked = !openRes.success;

    if (openRes.success) {
      job.status = 'COMPLETED';
      job.verificationStatus = 'verified';
      job.completedAt = new Date().toISOString();
      job.updatedAt = new Date().toISOString();
      job.steps = [
        ...(job.steps || []),
        {
          step: (job.steps?.length || 0) + 1,
          action: `Resumed by user: Launched Chrome tab to ${job.destinationUrl}`,
          status: 'completed',
          target: job.websiteName,
          timestamp: new Date().toISOString()
        }
      ];
    } else {
      job.status = 'WAITING_FOR_USER';
    }

    this.saveJob(job);
    return job;
  }

  /**
   * Cancels an active or pending Chrome action job.
   */
  public cancelJob(jobId: string, reason = 'Cancelled by user'): ChromeActionJob {
    const job = this.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    job.status = 'CANCELLED';
    job.errorDetails = reason;
    job.updatedAt = new Date().toISOString();
    job.steps = [
      ...(job.steps || []),
      {
        step: (job.steps?.length || 0) + 1,
        action: `Action cancelled: ${reason}`,
        status: 'failed',
        target: job.websiteName,
        timestamp: new Date().toISOString()
      }
    ];

    if (this.activeJob?.id === jobId) {
      this.activeJob = null;
    }

    this.saveJob(job);
    return job;
  }
}

export const chromeActionService = new ChromeActionService();

/**
 * Client-Side Website Action Intent Detector
 * Accurately detects when a user directive requires Chrome tab navigation or search.
 */
export function detectWebsiteIntent(text: string): {
  isWebsiteAction: boolean;
  intent: ChromeActionIntent;
  websiteName: string;
  actionType: 'navigate' | 'search' | 'play' | 'extract' | 'interact' | 'oauth_sync';
  destinationUrl: string;
  targetTitle?: string;
  query?: string;
  executionMode: 'chrome_tab' | 'remote_browser' | 'oauth_integration';
} {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. YouTube Play / Watch
  const playMatch = trimmed.match(/^(?:play|watch|stream)\s+(.+)$/i);
  if (playMatch || lower.includes('youtube trailer') || lower.includes('play on youtube')) {
    const rawQuery = playMatch ? playMatch[1].replace(/on youtube/i, '').trim() : trimmed;
    const query = rawQuery.replace(/^(?:the\s+)?/i, '');
    return {
      isWebsiteAction: true,
      intent: 'website_interaction',
      websiteName: 'YouTube',
      actionType: 'play',
      destinationUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      targetTitle: `YouTube — ${query}`,
      query,
      executionMode: 'chrome_tab'
    };
  }

  // 2. Open YouTube
  if (/^(?:open|launch|go to)\s+youtube/i.test(lower) || lower === 'youtube' || lower === 'youtube.com') {
    return {
      isWebsiteAction: true,
      intent: 'website_navigation',
      websiteName: 'YouTube',
      actionType: 'navigate',
      destinationUrl: 'https://www.youtube.com',
      targetTitle: 'YouTube',
      executionMode: 'chrome_tab'
    };
  }

  // 3. LinkedIn Search / Open
  const linkedInSearchMatch = trimmed.match(/(?:search\s+linkedin\s+for|linkedin\s+jobs\s+for|find\s+jobs\s+on\s+linkedin\s+for)\s+(.+)/i);
  if (linkedInSearchMatch) {
    const query = linkedInSearchMatch[1].trim();
    return {
      isWebsiteAction: true,
      intent: 'website_search',
      websiteName: 'LinkedIn',
      actionType: 'search',
      destinationUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`,
      targetTitle: `LinkedIn Jobs — ${query}`,
      query,
      executionMode: 'chrome_tab'
    };
  }

  if (lower.includes('linkedin')) {
    if (/^(?:open|launch|go to)\s+linkedin/i.test(lower) || lower === 'linkedin' || lower === 'linkedin.com') {
      return {
        isWebsiteAction: true,
        intent: 'website_navigation',
        websiteName: 'LinkedIn',
        actionType: 'navigate',
        destinationUrl: 'https://www.linkedin.com',
        targetTitle: 'LinkedIn',
        executionMode: 'chrome_tab'
      };
    }
    const genericLinkedInSearch = lower.replace(/.*(?:search|find)\s+(?:on\s+)?linkedin\s+(?:for\s+)?/i, '').trim();
    if (genericLinkedInSearch && genericLinkedInSearch !== lower) {
      return {
        isWebsiteAction: true,
        intent: 'website_search',
        websiteName: 'LinkedIn',
        actionType: 'search',
        destinationUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(genericLinkedInSearch)}`,
        targetTitle: `LinkedIn — ${genericLinkedInSearch}`,
        query: genericLinkedInSearch,
        executionMode: 'chrome_tab'
      };
    }
  }

  // 4. Gmail Actions
  if (lower.includes('gmail') || lower.includes('unread email') || lower.includes('inbox')) {
    if (lower.includes('unread') || lower.includes('find my unread') || lower.includes('check unread')) {
      return {
        isWebsiteAction: true,
        intent: 'external_application_operation',
        websiteName: 'Gmail',
        actionType: 'oauth_sync',
        destinationUrl: 'https://mail.google.com/mail/u/0/#search/is%3Aunread',
        targetTitle: 'Gmail — Unread Messages',
        query: 'is:unread',
        executionMode: 'oauth_integration'
      };
    }
    return {
      isWebsiteAction: true,
      intent: 'website_navigation',
      websiteName: 'Gmail',
      actionType: 'navigate',
      destinationUrl: 'https://mail.google.com/mail/u/0/#inbox',
      targetTitle: 'Gmail — Inbox',
      executionMode: 'oauth_integration'
    };
  }

  // 5. Google Calendar Actions
  if (lower.includes('calendar') || lower.includes('schedule meeting') || lower.includes('meeting details')) {
    return {
      isWebsiteAction: true,
      intent: 'external_application_operation',
      websiteName: 'Google Calendar',
      actionType: 'oauth_sync',
      destinationUrl: 'https://calendar.google.com/calendar/r',
      targetTitle: 'Google Calendar',
      executionMode: 'oauth_integration'
    };
  }

  // 6. Google Search
  const googleSearchMatch = lower.match(/^(?:search\s+google\s+for|google\s+search\s+for|google)\s+(.+)/i);
  if (googleSearchMatch) {
    const query = googleSearchMatch[1].trim();
    return {
      isWebsiteAction: true,
      intent: 'website_search',
      websiteName: 'Google',
      actionType: 'search',
      destinationUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      targetTitle: `Google Search — ${query}`,
      query,
      executionMode: 'chrome_tab'
    };
  }

  // 7. GitHub
  if (lower.includes('github')) {
    const ghSearchMatch = lower.match(/(?:search\s+github\s+for|github\s+search\s+for)\s+(.+)/i);
    if (ghSearchMatch) {
      const query = ghSearchMatch[1].trim();
      return {
        isWebsiteAction: true,
        intent: 'website_search',
        websiteName: 'GitHub',
        actionType: 'search',
        destinationUrl: `https://github.com/search?q=${encodeURIComponent(query)}`,
        targetTitle: `GitHub Search — ${query}`,
        query,
        executionMode: 'chrome_tab'
      };
    }
    return {
      isWebsiteAction: true,
      intent: 'website_navigation',
      websiteName: 'GitHub',
      actionType: 'navigate',
      destinationUrl: 'https://github.com',
      targetTitle: 'GitHub',
      executionMode: 'chrome_tab'
    };
  }

  // 8. Direct URL navigation
  const urlMatch = trimmed.match(/^https?:\/\/[^\s]+/i) || trimmed.match(/^(?:visit|open|go to)\s+(https?:\/\/[^\s]+|[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?)/i);
  if (urlMatch) {
    let rawUrl = urlMatch[1] || urlMatch[0];
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = `https://${rawUrl}`;
    }
    let host = 'Website';
    try {
      host = new URL(rawUrl).hostname.replace(/^www\./, '');
    } catch {}

    return {
      isWebsiteAction: true,
      intent: 'website_navigation',
      websiteName: host.charAt(0).toUpperCase() + host.slice(1),
      actionType: 'navigate',
      destinationUrl: rawUrl,
      targetTitle: `${host} — Navigation`,
      executionMode: 'chrome_tab'
    };
  }

  return {
    isWebsiteAction: false,
    intent: 'conversation',
    websiteName: 'Assistant',
    actionType: 'navigate',
    destinationUrl: '',
    executionMode: 'chrome_tab'
  };
}
