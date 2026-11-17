import type { ApiRequest, ApiResponse } from '../_utils/serverTypes';
import { createClient } from '@supabase/supabase-js';

/**
 * Serverless Inbound API Endpoint: /api/n8n/webhook
 * Receives callbacks and asynchronous workflow triggers from n8n.
 * Allows n8n workflows to persist memories, tasks, reminders, and log automation results.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed. Only POST is accepted.' });
    return;
  }

  // Security check: optional secret verification
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
  if (expectedSecret) {
    const providedSecret = 
      req.headers['x-n8n-webhook-secret'] || 
      req.headers['x-webhook-secret'] ||
      (req.headers['authorization'] ? (req.headers['authorization'] as string).replace(/^Bearer\s+/i, '') : '');

    if (providedSecret !== expectedSecret) {
      res.status(401).json({ error: 'Unauthorized: Invalid or missing webhook secret.' });
      return;
    }
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
    event,
    userId,
    executionId,
    workflowId,
    workflowName,
    status = 'completed',
    data = {},
    error: executionError
  } = body || {};

  if (!event && !executionId) {
    res.status(400).json({ error: 'Either "event" or "executionId" must be provided in payload.' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

  try {
    // 1. If an executionId is provided, update or insert into public.automation_executions
    if (supabase && executionId && userId) {
      const now = new Date().toISOString();
      await supabase.from('automation_executions').upsert({
        id: executionId,
        user_id: userId,
        workflow_id: workflowId || 'n8n_external',
        workflow_name: workflowName || 'External n8n Pipeline',
        trigger_source: 'n8n_webhook',
        status: status === 'failed' || executionError ? 'failed' : 'success',
        output_payload: data,
        error_message: executionError || null,
        completed_at: now
      });
    }

    // 2. Process specific incoming events
    if (supabase && userId) {
      if (event === 'create_task' && data.title) {
        await supabase.from('tasks').insert({
          id: `task-n8n-${Date.now()}`,
          user_id: userId,
          title: data.title,
          description: data.description || 'Created via n8n workflow',
          due_date: data.dueDate || null,
          due_time: data.dueTime || null,
          priority: data.priority || 'Medium',
          status: 'pending',
          category: data.category || 'Automated',
          source: 'n8n'
        });
      } else if (event === 'create_memory' && data.title) {
        await supabase.from('memories').insert({
          id: `mem-n8n-${Date.now()}`,
          user_id: userId,
          title: data.title,
          content: data.content || data.title,
          category: data.category || 'Other',
          date: data.date || null,
          person: data.person || null
        });
      } else if (event === 'create_reminder' && data.title) {
        await supabase.from('reminders').insert({
          id: `rem-n8n-${Date.now()}`,
          user_id: userId,
          title: data.title,
          description: data.description || null,
          date: data.date || new Date().toISOString().split('T')[0],
          time: data.time || null,
          category: data.category || 'Personal',
          priority: data.priority || 'Medium',
          status: 'upcoming'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'n8n webhook event processed successfully.',
      event: event || 'workflow_status_updated',
      executionId: executionId || null,
      receivedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[n8n webhook] Inbound handling error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Error processing inbound n8n webhook event.'
    });
  }
}
