import { GoogleGenAI } from '@google/genai';
import type { ApiRequest, ApiResponse } from '../_utils/serverTypes';
import { getGeminiApiKey, getGeminiModel } from '../_utils/env.js';

/**
 * Serverless API Endpoint: /api/documents/summarize
 * Processes uploaded document text or files, returning structured summaries, extracted tasks, and memories.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed. Only POST is accepted.' });
    return;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server.',
      code: 'MISSING_API_KEY'
    });
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

  const { fileName, fileContent, mimeType = 'text/plain' } = body || {};

  if (!fileContent || typeof fileContent !== 'string') {
    res.status(400).json({ error: 'fileContent is required.' });
    return;
  }

  const modelName = getGeminiModel() || 'gemini-3.5-flash-lite';

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are Smriti AI's document analysis intelligence.
Analyze the following document "${fileName || 'Uploaded Document'}":
---
${fileContent.slice(0, 15000)}
---

Provide a JSON response with:
1. "summary": A concise executive summary of the document (2-4 sentences).
2. "keyTakeaways": An array of key bullet points.
3. "suggestedTasks": An array of any action items or tasks found (e.g. [{"title": "...", "priority": "High" | "Medium" | "Low"}]).
4. "suggestedMemories": An array of important facts worth remembering permanently (e.g. [{"title": "...", "content": "..."}]).

Respond in pure JSON matching that structure.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 1024,
      }
    });

    const responseText = response.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(cleaned);
    }

    res.status(200).json({
      success: true,
      fileName,
      result: parsed
    });

  } catch (error: any) {
    console.error('[Document Summarize API] Error:', error);
    res.status(500).json({
      error: error?.message || 'Error summarizing document.',
      code: 'SUMMARIZATION_ERROR'
    });
  }
}
