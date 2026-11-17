import type { ApiRequest, ApiResponse } from './_utils/serverTypes.js';
import { validateAuthToken } from './_utils/auth.js';
import { runUnifiedAgent } from './agent/unifiedEngine.js';

/**
 * Serverless API Endpoint: /api/chat
 * Handles conversational and autonomous agent directives.
 * Powered by the unified Smriti AI reasoning engine.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({
      error: 'Method Not Allowed. Only POST requests are accepted.'
    });
    return;
  }

  // Parse request body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON request body.' });
      return;
    }
  }

  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Missing request body.' });
    return;
  }

  const {
    message,
    history = [],
    memories = [],
    reminders = [],
    tasks = [],
    documents = [],
    currentDateTime,
    userTimezone
  } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message text is required.' });
    return;
  }

  if (message.length > 3000) {
    res.status(400).json({ error: 'Message exceeds character limit.' });
    return;
  }

  // Validate optional session authentication
  const authResult = await validateAuthToken(req);

  try {
    const result = await runUnifiedAgent({
      message,
      history,
      memories,
      reminders,
      tasks,
      documents,
      currentDateTime,
      userTimezone,
      isVoice: false
    });

    res.status(200).json({
      reply: result.reply,
      speechText: result.speechText,
      intent: result.intent,
      action: result.action,
      chromeAction: result.chromeAction,
      plan: result.plan,
      model: result.model,
      requiresApproval: result.requiresApproval,
      userId: authResult.userId || undefined
    });
  } catch (error: any) {
    console.error('[Smriti Chat API] Error during agent execution:', error);
    res.status(500).json({
      error: error?.message || 'Internal server error while processing AI agent directive.',
      code: error?.code || 'AGENT_ERROR'
    });
  }
}
