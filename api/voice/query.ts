import type { ApiRequest, ApiResponse } from '../_utils/serverTypes';
import { validateAuthToken } from '../_utils/auth';
import { runUnifiedAgent } from '../agent/unifiedEngine';

/**
 * Serverless API Endpoint: /api/voice/query
 * Real-time voice processing endpoint.
 * Powered by the exact same unified Smriti AI agent reasoning engine as text chat.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed. Only POST is accepted.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON request body.' });
      return;
    }
  }

  const {
    query,
    memories = [],
    reminders = [],
    tasks = [],
    documents = [],
    currentDateTime = new Date().toISOString(),
    userTimezone
  } = body || {};

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query text is required.' });
    return;
  }

  await validateAuthToken(req);

  try {
    const result = await runUnifiedAgent({
      message: query,
      memories,
      reminders,
      tasks,
      documents,
      currentDateTime,
      userTimezone,
      isVoice: true
    });

    res.status(200).json({
      speechText: result.speechText,
      displayText: result.reply,
      intent: result.intent,
      action: result.action,
      chromeAction: result.chromeAction,
      plan: result.plan,
      recognizedQuery: query,
      model: result.model
    });
  } catch (error: any) {
    console.error('[Voice Query API] Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to process voice query.',
      code: 'VOICE_QUERY_ERROR'
    });
  }
}
