import { GoogleGenAI } from '@google/genai';
import type { ApiRequest, ApiResponse, GeminiTestResponse } from './_utils/serverTypes';
import { getGeminiApiKey, getGeminiModel } from './_utils/env';

/**
 * Gemini Connectivity Test Endpoint (/api/gemini-test)
 * Real server-side integration test endpoint that connects to Google Gemini API
 * using @google/genai. Never simulates responses.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const method = req.method?.toUpperCase();

  // Accept GET or POST for testing convenience
  if (method !== 'GET' && method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({
      error: 'Method Not Allowed. Use GET or POST.'
    });
    return;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please set a valid key in .env.local or deployment environment.',
      code: 'MISSING_API_KEY',
      details: 'Get an API key from Google AI Studio: https://aistudio.google.com/'
    });
    return;
  }

  const model = 'gemini-3.5-flash-lite';
  const testPrompt = 'Smriti AI connection verification. Reply with: "Smriti AI connection active." and nothing else.';

  const startTime = Date.now();

  try {
    const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    timeout: 15000,
  },
});

    const response = await ai.models.generateContent({
      model,
      contents: testPrompt,
      config: {
        maxOutputTokens: 64,
      }
    });

    const latencyMs = Date.now() - startTime;
    const responseText = (
      response.text ||
      response.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join(' ') ||
      ''
    ).trim();

    if (!responseText.trim()) {
      res.status(502).json({
        error: 'Gemini API returned an empty response.',
        code: 'EMPTY_RESPONSE',
        latencyMs,
      });
      return;
    }

    const payload: GeminiTestResponse = {
      ok: true,
      model,
      timestamp: new Date().toISOString(),
      latencyMs,
      responsePreview: responseText.trim(),
      verificationMessage: 'Real Gemini model communication verified successfully.'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(200).json(payload);

  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    const rawMessage = error?.message || 'Unknown Gemini API failure';

    let statusCode = 500;
    let userMessage = `Gemini API Error: ${rawMessage}`;
    let code = 'GEMINI_ERROR';

    if (rawMessage.includes('401') || rawMessage.includes('403') || /api key/i.test(rawMessage)) {
      statusCode = 401;
      code = 'INVALID_API_KEY';
      userMessage = 'Gemini API authentication failed: The provided API key is invalid or unauthorized.';
    } else if (rawMessage.includes('429') || /quota|rate limit/i.test(rawMessage)) {
      statusCode = 429;
      code = 'RATE_LIMIT_EXCEEDED';
      userMessage = 'Gemini API quota or rate limit exceeded. Please wait or check your Google AI Studio plan.';
    } else if (rawMessage.includes('404') || /model/i.test(rawMessage)) {
      statusCode = 404;
      code = 'MODEL_NOT_FOUND';
      userMessage = `The configured Gemini model "${model}" was not found or is not supported.`;
    }

    res.status(statusCode).json({
      error: userMessage,
      code,
      latencyMs,
      details: 'Check your Google AI Studio quota and network connectivity.'
    });
  }
}
