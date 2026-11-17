import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chromeActionService, detectWebsiteIntent } from '../services/chromeActionService';
import { detectChromeWebsiteAction } from '../../api/agent/unifiedEngine';

describe('Smriti AI — Chrome-Native Website Actions & Intent Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // Test 1: Normal question remains in Smriti AI (Category A)
  it('1. Normal questions remain inside Smriti AI (Category A) without website actions', () => {
    const generalQuestions = [
      'What is the difference between TCP and UDP?',
      'Can you explain how quicksort works in TypeScript?',
      'How do I make a good pasta sauce?',
      'Tell me a motivational quote for engineers.',
    ];

    for (const q of generalQuestions) {
      const detected = detectWebsiteIntent(q);
      expect(detected.isWebsiteAction).toBe(false);
      expect(detected.intent).toBe('conversation');

      const backendDetected = detectChromeWebsiteAction(q);
      expect(backendDetected.isWebsiteAction).toBe(false);
      expect(backendDetected.intent).toBe('conversation');
    }
  });

  // Test 2: YouTube opens in Chrome
  it('2. "Open YouTube" identifies YouTube and sets destination to https://www.youtube.com', () => {
    const detected = detectWebsiteIntent('Open YouTube');
    expect(detected.isWebsiteAction).toBe(true);
    expect(detected.websiteName).toBe('YouTube');
    expect(detected.actionType).toBe('navigate');
    expect(detected.destinationUrl).toBe('https://www.youtube.com');
    expect(detected.executionMode).toBe('chrome_tab');
  });

  // Test 3: Video playback opens at actual YouTube search/destination
  it('3. "Play Ramayana Telugu trailer" sets actionType play and encodes video query in destination URL', () => {
    const detected = detectWebsiteIntent('Play Ramayana Telugu trailer');
    expect(detected.isWebsiteAction).toBe(true);
    expect(detected.websiteName).toBe('YouTube');
    expect(detected.actionType).toBe('play');
    expect(detected.destinationUrl).toContain('youtube.com/results?search_query=');
    expect(detected.destinationUrl).toContain('Ramayana');
    expect(detected.destinationUrl).toContain('Telugu');
    expect(detected.destinationUrl).toContain('trailer');
  });

  // Test 4: LinkedIn search opens in Chrome
  it('4. "Search LinkedIn for AI internships" generates LinkedIn jobs search URL', () => {
    const detected = detectWebsiteIntent('Search LinkedIn for AI internships in Bangalore');
    expect(detected.isWebsiteAction).toBe(true);
    expect(detected.websiteName).toBe('LinkedIn');
    expect(detected.actionType).toBe('search');
    expect(detected.destinationUrl).toContain('linkedin.com/jobs/search/?keywords=');
    expect(detected.destinationUrl).toContain('AI%20internships');
  });

  // Test 5: Gmail and Calendar use authorized integrations
  it('5. Gmail and Calendar requests configure authorized integration mode', () => {
    const gmailAction = detectWebsiteIntent('Find my unread Gmail messages');
    expect(gmailAction.isWebsiteAction).toBe(true);
    expect(gmailAction.websiteName).toBe('Gmail');
    expect(gmailAction.actionType).toBe('oauth_sync');
    expect(gmailAction.executionMode).toBe('oauth_integration');
    expect(gmailAction.destinationUrl).toContain('mail.google.com');

    const calAction = detectWebsiteIntent('Find meeting details and add them to Calendar');
    expect(calAction.isWebsiteAction).toBe(true);
    expect(calAction.websiteName).toBe('Google Calendar');
    expect(calAction.executionMode).toBe('oauth_integration');
    expect(calAction.destinationUrl).toBe('https://calendar.google.com/calendar/r');
  });

  // Test 6: Action results appear in Chrome & job lifecycle recorded
  it('6. Action job records original command, website name, destination URL, and completed status', async () => {
    // Mock successful tab open
    vi.spyOn(chromeActionService, 'openInChromeTab').mockReturnValue({
      success: true,
      windowRef: {} as Window
    });

    const job = chromeActionService.createJob({
      originalCommand: 'Open YouTube',
      websiteName: 'YouTube',
      actionType: 'navigate',
      destinationUrl: 'https://www.youtube.com'
    });

    expect(job.status).toBe('QUEUED');
    expect(job.originalCommand).toBe('Open YouTube');
    expect(job.destinationUrl).toBe('https://www.youtube.com');

    const executed = await chromeActionService.executeJob(job.id);
    expect(executed.status).toBe('COMPLETED');
    expect(executed.verificationStatus).toBe('verified');
    expect(executed.openedInChrome).toBe(true);
    expect(executed.completedAt).toBeDefined();
    expect(executed.steps?.length).toBeGreaterThanOrEqual(2);
  });

  // Test 7: Popup blocking is handled properly
  it('7. Handles Chrome popup blocking gracefully and pauses in WAITING_FOR_USER', async () => {
    // Simulate window.open returning null (popup blocked)
    vi.spyOn(chromeActionService, 'openInChromeTab').mockReturnValue({
      success: false,
      windowRef: null
    });

    const job = chromeActionService.createJob({
      originalCommand: 'Open YouTube',
      websiteName: 'YouTube',
      actionType: 'navigate',
      destinationUrl: 'https://www.youtube.com'
    });

    const executed = await chromeActionService.executeJob(job.id);
    expect(executed.status).toBe('WAITING_FOR_USER');
    expect(executed.isPopupBlocked).toBe(true);
    expect(executed.verificationStatus).toBe('unverified');

    // Resuming by user click successfully completes the job
    vi.spyOn(chromeActionService, 'openInChromeTab').mockReturnValue({
      success: true,
      windowRef: {} as Window
    });

    const resumed = chromeActionService.resumeJob(job.id);
    expect(resumed.status).toBe('COMPLETED');
    expect(resumed.verificationStatus).toBe('verified');
    expect(resumed.isPopupBlocked).toBe(false);
  });

  // Test 8: Remote browser and local Chrome are never confused
  it('8. Explicitly separates local chrome_tab, remote_browser, and oauth_integration modes', () => {
    const localJob = chromeActionService.createJob({
      originalCommand: 'Open YouTube',
      websiteName: 'YouTube',
      actionType: 'navigate',
      destinationUrl: 'https://www.youtube.com',
      executionMode: 'chrome_tab'
    });
    expect(localJob.executionMode).toBe('chrome_tab');

    const remoteJob = chromeActionService.createJob({
      originalCommand: 'Scrape dynamic table from site',
      websiteName: 'TargetSite',
      actionType: 'extract',
      destinationUrl: 'https://example.com',
      executionMode: 'remote_browser'
    });
    expect(remoteJob.executionMode).toBe('remote_browser');
    expect(remoteJob.executionMode).not.toBe('chrome_tab');
  });

  // Test 9: Failed actions are never marked completed
  it('9. Failed actions transition to FAILED and are never marked COMPLETED', async () => {
    const job = chromeActionService.createJob({
      originalCommand: 'Trigger faulty workflow',
      websiteName: 'FaultyService',
      actionType: 'oauth_sync',
      destinationUrl: 'https://example.com/oauth',
      executionMode: 'oauth_integration'
    });

    // Mock fetch throwing network error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));

    const executed = await chromeActionService.executeJob(job.id, {
      providerToken: 'test-token',
      skipAutoTab: true
    });

    expect(executed.status).toBe('FAILED');
    expect(executed.verificationStatus).toBe('failed');
    expect(executed.status).not.toBe('COMPLETED');
    expect(executed.errorDetails).toContain('Network connection timeout');
  });

  // Test 10: Cancellation control works as expected
  it('10. Jobs can be cancelled by user and reflect CANCELLED status', () => {
    const job = chromeActionService.createJob({
      originalCommand: 'Navigate to heavy site',
      websiteName: 'HeavySite',
      actionType: 'navigate',
      destinationUrl: 'https://heavysite.example'
    });

    const cancelled = chromeActionService.cancelJob(job.id, 'User clicked stop');
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.errorDetails).toBe('User clicked stop');
  });
});
