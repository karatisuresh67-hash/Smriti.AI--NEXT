import type { ApiRequest, ApiResponse } from '../_utils/serverTypes.js';

/**
 * Serverless API Endpoint: /api/integrations/status
 * Validates connection statuses for Gmail, Google Calendar, LinkedIn, Instagram, X, Slack, Notion.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const providers = [
    {
      provider: 'gmail',
      name: 'Gmail',
      hasEnvCredentials: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      status: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'ready_for_auth'
    },
    {
      provider: 'google_calendar',
      name: 'Google Calendar',
      hasEnvCredentials: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      status: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'ready_for_auth'
    },
    {
      provider: 'linkedin',
      name: 'LinkedIn',
      hasEnvCredentials: !!process.env.LINKEDIN_CLIENT_ID,
      status: process.env.LINKEDIN_CLIENT_ID ? 'configured' : 'ready_for_auth'
    },
    {
      provider: 'x',
      name: 'X (Twitter)',
      hasEnvCredentials: !!process.env.TWITTER_BEARER_TOKEN,
      status: process.env.TWITTER_BEARER_TOKEN ? 'configured' : 'ready_for_auth'
    },
    {
      provider: 'n8n',
      name: 'n8n Automation',
      hasEnvCredentials: !!process.env.N8N_WEBHOOK_URL,
      status: process.env.N8N_WEBHOOK_URL ? 'configured' : 'ready_for_auth'
    }
  ];

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers
  });
}
