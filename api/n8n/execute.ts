import type { ApiRequest, ApiResponse } from '../_utils/serverTypes';
import { validateAuthToken } from '../_utils/auth';

/**
 * Serverless API Endpoint: /api/n8n/execute
 * Triggers live n8n workflow webhooks.
 * Validates authentication and dispatches payloads to configured n8n instances.
 * If N8N_WEBHOOK_URL is not configured, returns a clear unconfigured status without fake mocks.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed. Only POST is accepted.' });
    return;
  }

  // Optional authentication check
  await validateAuthToken(req);

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON request body.' });
      return;
    }
  }

  const { workflowId, workflowName, parameters = {}, triggerSource = 'manual' } = body || {};

  if (!workflowId) {
    res.status(400).json({ error: 'Missing workflowId.' });
    return;
  }

  const n8nWebhookBaseUrl = process.env.N8N_WEBHOOK_URL;
  const n8nApiKey = process.env.N8N_API_KEY;

  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const startedAt = new Date().toISOString();

  // If n8n webhook URL is not configured, inform the user cleanly
  if (!n8nWebhookBaseUrl) {
    res.status(200).json({
      success: false,
      executionId,
      workflowId,
      workflowName: workflowName || workflowId,
      status: 'not_configured',
      message: 'N8N_WEBHOOK_URL is not configured in your environment. Set N8N_WEBHOOK_URL in .env.local to connect to your live n8n workflow server.',
      startedAt,
      completedAt: new Date().toISOString(),
      liveWebhookDispatched: false
    });
    return;
  }

  // Live n8n webhook dispatch
  try {
    const targetUrl = n8nWebhookBaseUrl.endsWith(`/${workflowId}`) 
      ? n8nWebhookBaseUrl 
      : `${n8nWebhookBaseUrl.replace(/\/$/, '')}/${workflowId}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (n8nApiKey) {
      headers['X-N8N-API-KEY'] = n8nApiKey;
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        executionId,
        workflowId,
        workflowName: workflowName || workflowId,
        parameters,
        triggerSource,
        timestamp: startedAt,
      }),
    });

    const responseData = await response.json().catch(() => ({ status: response.statusText || 'received' }));

    res.status(200).json({
      success: response.ok,
      executionId,
      workflowId,
      workflowName: workflowName || workflowId,
      status: response.ok ? 'success' : 'failed',
      result: responseData,
      statusCode: response.status,
      startedAt,
      completedAt: new Date().toISOString(),
      liveWebhookDispatched: true
    });
  } catch (err: any) {
    console.error('[n8n execute] Error dispatching webhook:', err);
    res.status(500).json({
      success: false,
      executionId,
      workflowId,
      workflowName: workflowName || workflowId,
      status: 'error',
      error: err?.message || 'Failed to dispatch workflow to n8n webhook endpoint.',
      startedAt,
      completedAt: new Date().toISOString(),
      liveWebhookDispatched: true
    });
  }
}
