import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey, getGeminiModel } from '../_utils/env.js';

export type ChromeActionIntent = 
  | 'conversation' 
  | 'website_navigation' 
  | 'website_search' 
  | 'website_interaction' 
  | 'external_application_operation' 
  | 'action_result_presentation';

export interface AgentContextInput {
  message: string;
  history?: Array<{ role: string; content: string }>;
  memories?: any[];
  reminders?: any[];
  tasks?: any[];
  documents?: any[];
  currentDateTime?: string;
  userTimezone?: string;
  isVoice?: boolean;
}

export interface AgentUnifiedResult {
  reply: string;
  speechText: string;
  intent: ChromeActionIntent;
  action: any | null;
  plan?: Array<{ step: number; action: string; target?: string }>;
  model: string;
  requiresApproval?: boolean;
  chromeAction?: any | null;
}

/**
 * Deterministic Website Action Detector
 * Enhances model output and guarantees accurate URL destinations for common Chrome-native commands.
 */
export function detectChromeWebsiteAction(text: string): {
  isWebsiteAction: boolean;
  intent: ChromeActionIntent;
  websiteName?: string;
  actionType?: 'navigate' | 'search' | 'play' | 'extract' | 'interact' | 'oauth_sync';
  destinationUrl?: string;
  targetTitle?: string;
  query?: string;
} {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. YouTube Play / Watch
  const playMatch = lower.match(/^(?:play|watch|stream)\s+(.+)$/i);
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
      query
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
    };
  }

  // 3. LinkedIn Search / Open
  const linkedInSearchMatch = lower.match(/(?:search\s+linkedin\s+for|linkedin\s+jobs\s+for|find\s+jobs\s+on\s+linkedin\s+for)\s+(.+)/i);
  if (linkedInSearchMatch) {
    const query = linkedInSearchMatch[1].trim();
    return {
      isWebsiteAction: true,
      intent: 'website_search',
      websiteName: 'LinkedIn',
      actionType: 'search',
      destinationUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`,
      targetTitle: `LinkedIn Jobs — ${query}`,
      query
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
        query: genericLinkedInSearch
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
        query: 'is:unread'
      };
    }
    return {
      isWebsiteAction: true,
      intent: 'website_navigation',
      websiteName: 'Gmail',
      actionType: 'navigate',
      destinationUrl: 'https://mail.google.com/mail/u/0/#inbox',
      targetTitle: 'Gmail — Inbox',
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
      query
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
        query
      };
    }
    return {
      isWebsiteAction: true,
      intent: 'website_navigation',
      websiteName: 'GitHub',
      actionType: 'navigate',
      destinationUrl: 'https://github.com',
      targetTitle: 'GitHub',
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
    };
  }

  return { isWebsiteAction: false, intent: 'conversation' };
}

/**
 * Unified Autonomous AI Agent Reasoning Engine
 * Shared single intelligence layer for both Text Chat and Gemini Live Voice interaction.
 * Differentiates Category A (conversational queries) from Category B (Chrome website actions).
 */
export async function runUnifiedAgent(input: AgentContextInput): Promise<AgentUnifiedResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const {
    message,
    history = [],
    memories = [],
    reminders = [],
    tasks = [],
    documents = [],
    currentDateTime = new Date().toISOString(),
    userTimezone = 'UTC',
    isVoice = false
  } = input;

  const modelName = getGeminiModel() || 'gemini-2.5-flash';
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: 30000 },
  });

  // Prepare grounded context strings (bounded to prevent token bloat)
  const memoriesText = (memories || []).slice(0, 30).map((m: any) => 
    `- [Memory ID: ${m.id}] ${m.title}: ${m.content} (Category: ${m.category || 'General'}${m.date ? `, Date: ${m.date}` : ''}${m.person ? `, Person: ${m.person}` : ''})`
  ).join('\n') || 'No saved memories yet.';

  const remindersText = (reminders || []).slice(0, 30).map((r: any) => 
    `- [Reminder ID: ${r.id}] ${r.title} (Due: ${r.date || 'Someday'} ${r.time || ''}, Status: ${r.status}, Priority: ${r.priority})`
  ).join('\n') || 'No saved reminders yet.';

  const tasksText = (tasks || []).slice(0, 30).map((t: any) => 
    `- [Task ID: ${t.id}] ${t.title} (Due: ${t.dueDate || 'No date'} ${t.dueTime || ''}, Status: ${t.status}, Priority: ${t.priority}, Category: ${t.category || 'General'})`
  ).join('\n') || 'No saved tasks yet.';

  const docsText = (documents || []).slice(0, 10).map((d: any) => 
    `- [Doc: ${d.name}] Summary: ${d.summary || 'Uploaded document'} (Uploaded: ${d.uploadedAt})`
  ).join('\n') || 'No uploaded documents yet.';

  // Check deterministic detector
  const detected = detectChromeWebsiteAction(message);

  const systemInstruction = `You are Smriti AI, a caring, powerful, autonomous personal AI assistant and personal operating system.
Tagline: "Remember what matters. Let AI handle the rest."

CRITICAL RESPONSE CLASSIFICATION ARCHITECTURE:
Separate responses strictly into two categories:

CATEGORY A: NORMAL CONVERSATIONAL RESPONSES
- Explanations, general questions, coding help, discussions, general AI assistance.
- These MUST remain inside Smriti AI chat.
- Set "intent": "conversation" and "action": null.

CATEGORY B: WEBSITE ACTIONS & ACTION RESPONSES
- Opening websites, searching websites, watching videos, navigating pages, searching LinkedIn, reading Gmail, interacting with Google Calendar, performing website operations, extracting information from websites, reporting results of website actions.
- These MUST be presented in the user's Chrome browser and as an action response.
- Classify "intent" as one of: "website_navigation", "website_search", "website_interaction", "external_application_operation", or "action_result_presentation".
- Formulate an "action" of type "chrome_action":
  {
    "type": "chrome_action",
    "websiteName": "YouTube" | "LinkedIn" | "Gmail" | "Google Calendar" | "Google" | "GitHub" | "...",
    "actionType": "navigate" | "search" | "play" | "extract" | "interact" | "oauth_sync",
    "destinationUrl": "https://...",
    "targetTitle": "...",
    "query": "...",
    "requiresApproval": false,
    "executionMode": "chrome_tab" | "remote_browser" | "oauth_integration",
    "instructions": "..."
  }

DESTINATION URL GUIDELINES:
- YouTube open: https://www.youtube.com
- YouTube search / play trailer: https://www.youtube.com/results?search_query=[encoded_query]
- LinkedIn jobs search: https://www.linkedin.com/jobs/search/?keywords=[encoded_query]
- LinkedIn open: https://www.linkedin.com
- Gmail unread emails: https://mail.google.com/mail/u/0/#search/is%3Aunread
- Gmail inbox: https://mail.google.com/mail/u/0/#inbox
- Google Calendar: https://calendar.google.com/calendar/r
- Google Search: https://www.google.com/search?q=[encoded_query]
- GitHub: https://github.com

PERSONAL MEMORY / TASK TOOLS:
If the user wants to save memories, reminders, or tasks locally:
- "create_memory": { "type": "create_memory", "title": "...", "content": "...", "category": "..." }
- "create_task": { "type": "create_task", "title": "...", "dueDate": "YYYY-MM-DD", "priority": "Medium" }
- "create_reminder": { "type": "create_reminder", "title": "...", "date": "YYYY-MM-DD", "time": "HH:MM" }

OUTPUT FORMAT:
Respond strictly in valid JSON matching this schema:
{
  "reply": "Conversational markdown text for chat",
  "speechText": "Concise natural 1-2 sentence spoken reply",
  "intent": "conversation" | "website_navigation" | "website_search" | "website_interaction" | "external_application_operation" | "action_result_presentation",
  "action": null | { ...action object... },
  "plan": null | [{ "step": 1, "action": "...", "target": "..." }]
}

TEMPORAL GROUNDING:
- Current date & time: ${currentDateTime}
- User timezone: ${userTimezone}

SAVED MEMORIES:
${memoriesText}

ACTIVE REMINDERS:
${remindersText}

CURRENT TASKS:
${tasksText}

INDEXED DOCUMENTS:
${docsText}`;

  const contents: any[] = [];
  const cappedHistory = (history || []).slice(-8);

  for (const item of cappedHistory) {
    const role = (item.role === 'user') ? 'user' : 'model';
    if (typeof item.content === 'string' && item.content.trim()) {
      contents.push({ role, parts: [{ text: item.content.slice(0, 2000) }] });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      maxOutputTokens: 1500,
    }
  });

  const rawText = response.text || '{}';
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const cleaned = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    parsed = JSON.parse(cleaned);
  }

  let reply = parsed.reply || "I've processed your directive.";
  const speechText = parsed.speechText || parsed.reply?.slice(0, 200) || "Understood.";
  let intent: ChromeActionIntent = parsed.intent || 'conversation';
  let action = parsed.action || null;
  const plan = parsed.plan || null;

  // Merge with deterministic detector if a website action was detected
  if (detected.isWebsiteAction) {
    intent = detected.intent;
    if (!action || action.type !== 'chrome_action') {
      action = {
        type: 'chrome_action',
        websiteName: detected.websiteName || 'Website',
        actionType: detected.actionType || 'navigate',
        destinationUrl: detected.destinationUrl || 'https://www.google.com',
        targetTitle: detected.targetTitle,
        query: detected.query,
        requiresApproval: false,
        executionMode: detected.websiteName === 'Gmail' || detected.websiteName === 'Google Calendar' ? 'oauth_integration' : 'chrome_tab',
      };
    } else if (action && action.type === 'chrome_action') {
      if (!action.destinationUrl && detected.destinationUrl) {
        action.destinationUrl = detected.destinationUrl;
      }
      if (!action.websiteName && detected.websiteName) {
        action.websiteName = detected.websiteName;
      }
    }
  }

  // Format tailored response if this is a website action opening in Chrome
  let chromeAction = null;
  if (action && (action.type === 'chrome_action' || action.type === 'browser_action')) {
    chromeAction = {
      websiteName: action.websiteName || 'Browser',
      actionType: action.actionType || 'navigate',
      destinationUrl: action.destinationUrl || action.url || 'https://www.google.com',
      targetTitle: action.targetTitle || action.description || action.websiteName,
      query: action.query,
      executionMode: action.executionMode || 'chrome_tab',
      requiresApproval: Boolean(action.requiresApproval),
    };

    // If intent was still conversation, promote it to appropriate website action
    if (intent === 'conversation') {
      intent = 'website_navigation';
    }
  }

  // Determine if action requires explicit approval
  const MUTATING_TYPES = ['send_email', 'publish_post', 'delete_resource', 'browser_mutation'];
  const requiresApproval = action && (
    action.requiresApproval === true || 
    MUTATING_TYPES.includes(action.type) ||
    (action.type === 'browser_action' && action.actionType === 'click')
  );

  return {
    reply,
    speechText,
    intent,
    action,
    plan,
    model: modelName,
    requiresApproval: Boolean(requiresApproval),
    chromeAction,
  };
}
