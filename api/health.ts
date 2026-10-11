import type { ApiRequest, ApiResponse, HealthResponse } from './_utils/serverTypes';
import { getGeminiApiKey, getGeminiModel, isSupabaseConfigured, getAppEnvironment } from './_utils/env';

/**
 * Health Check Endpoint (/api/health)
 * Reports system status, serverless execution readiness, and service configurations.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const method = req.method?.toUpperCase();

  if (method !== 'GET' && method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).json({
      error: 'Method Not Allowed. Only GET or HEAD requests are supported.'
    });
    return;
  }

  const geminiApiKey = getGeminiApiKey();
  const geminiModel = getGeminiModel();
  const supabaseOk = isSupabaseConfigured();

  const healthData: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: getAppEnvironment(),
    services: {
      geminiConfigured: Boolean(geminiApiKey),
      geminiModel,
      supabaseConfigured: supabaseOk,
    },
    version: '0.1.0'
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.status(200).json(healthData);
}
