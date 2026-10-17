import { GoogleGenAI } from '@google/genai';
import type { ApiRequest, ApiResponse } from '../_utils/serverTypes';
import { getGeminiApiKey, getGeminiModel } from '../_utils/env.js';

/**
 * Serverless API Endpoint: /api/voice/query
 * Real conversational voice pipeline: processes transcribed speech or audio queries,
 * grounds them in the user's memories & reminders, and returns natural spoken replies
 * and structured action items.
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

  const {
    query,
    audioBase64,
    mimeType = 'audio/webm',
    memories = [],
    reminders = [],
    currentDateTime = new Date().toISOString()
  } = body || {};

  if (!query && !audioBase64) {
    res.status(400).json({ error: 'Either query text or audio data is required.' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = getGeminiModel();

    // Prepare personal context
    const memoriesContext = (memories || [])
      .map((m: any) => `- [Memory ID: ${m.id}] ${m.title}: ${m.content} (${m.category}${m.date ? `, Date: ${m.date}` : ''}${m.person ? `, Person: ${m.person}` : ''})`)
      .join('\n');

    const remindersContext = (reminders || [])
      .map((r: any) => `- [Reminder ID: ${r.id}] ${r.title} (Due: ${r.date}${r.time ? ` at ${r.time}` : ''}, Priority: ${r.priority}, Status: ${r.status})`)
      .join('\n');

    const systemInstruction = `You are Smriti AI, a caring, precise personal AI memory and reminder assistant.
The official product name is "Smriti AI". Tagline: "Remember What Matters. Let AI Handle the Rest."

You are interacting through a natural real-time voice interface.
Current date/time: ${currentDateTime}

User's saved memories:
${memoriesContext || '(No saved memories yet)'}

User's active reminders:
${remindersContext || '(No active reminders yet)'}

Voice Guidelines:
1. Keep spoken replies concise, friendly, and natural (1-3 sentences).
2. Directly answer questions about the user's memories, birthdays, upcoming reminders, and personal preferences using the provided context.
3. If the user asks to save a new memory or reminder, acknowledge warmly and formulate the structured action.
4. Output your response as a valid JSON object matching this schema:
{
  "speechText": "The exact concise spoken response to read aloud to the user.",
  "displayText": "The full helpful response to show in the transcript.",
  "action": null or {
    "type": "create_memory",
    "title": "short title",
    "content": "detailed facts",
    "category": "Birthday" | "People" | "Personal Goal" | "Important Event" | "Preference" | "Personal",
    "date": "YYYY-MM-DD" (optional),
    "person": "Name" (optional)
  } or {
    "type": "create_reminder",
    "title": "short title",
    "description": "optional details",
    "date": "YYYY-MM-DD",
    "time": "HH:MM" (optional),
    "priority": "Low" | "Medium" | "High"
  }
}
Return only the raw JSON object without markdown code blocks.`;

    const contents: any[] = [];
    if (audioBase64) {
      contents.push({
        inlineData: {
          mimeType,
          data: audioBase64
        }
      });
      contents.push({
        text: query || 'Listen to this voice query and respond as Smriti AI according to the instructions.'
      });
    } else {
      contents.push({
        text: query
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Clean up markdown code fences if present
      const cleaned = rawText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    res.status(200).json({
      speechText: parsed.speechText || parsed.displayText || 'I heard you clearly.',
      displayText: parsed.displayText || parsed.speechText || 'Understood.',
      action: parsed.action || null,
      recognizedQuery: query || null
    });
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || 'Failed to process voice query.',
      code: 'VOICE_QUERY_ERROR'
    });
  }
}
