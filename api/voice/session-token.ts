import { GoogleGenAI, Modality } from '@google/genai';
import type { ApiRequest, ApiResponse } from '../_utils/serverTypes';
import { getGeminiApiKey } from '../_utils/env';

/**
 * Serverless API Endpoint: /api/voice/session-token
 * Issues short-lived ephemeral tokens for the client to connect
 * securely to the Gemini Live API without exposing the permanent GEMINI_API_KEY.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // Allow GET or POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'Method Not Allowed.' });
    return;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    res.status(200).json({
      fallbackRequired: true,
      error: 'GEMINI_API_KEY is not configured on the server.',
      code: 'MISSING_API_KEY'
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    const tokenResponse = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: 'models/gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO]
          }
        }
      }
    });

    const token = (tokenResponse as any)?.name || (tokenResponse as any)?.token;

    if (!token) {
      throw new Error('Ephemeral token was not returned in the expected format.');
    }

    res.status(200).json({
      token,
      model: 'gemini-3.8-live',
      expireTime,
      fallbackRequired: false
    });
  } catch (err: any) {
    // If the account does not yet have ephemeral tokens enabled or is in a region that defaults to REST,
    // notify the client to seamlessly use the grounded audio pipeline fallback.
    res.status(200).json({
      fallbackRequired: true,
      code: 'EPHEMERAL_TOKEN_FALLBACK',
      message: err?.message || 'Ephemeral token generation fell back to conversational voice pipeline.'
    });
  }
}
