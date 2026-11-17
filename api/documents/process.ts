import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import type { ApiRequest, ApiResponse } from '../_utils/serverTypes';
import { getGeminiApiKey, getGeminiModel } from '../_utils/env.js';

/**
 * Serverless API Endpoint: /api/documents/process
 * Processes uploaded documents (.pdf, .docx, .txt, .csv, images).
 * Extracts raw or multimodal text, generates structured executive summaries,
 * and extracts actionable tasks and persistent memory nuggets.
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
      code: 'MISSING_API_KEY',
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

  const { fileName, fileData, mimeType = 'text/plain', plainText } = body || {};

  if (!fileData && !plainText) {
    res.status(400).json({ error: 'fileData (base64) or plainText is required.' });
    return;
  }

  const modelName = getGeminiModel() || 'gemini-2.5-flash';

  try {
    const ai = new GoogleGenAI({ apiKey });
    let extractedText = plainText || '';
    let isDocx = fileName?.toLowerCase().endsWith('.docx') || mimeType.includes('wordprocessingml');
    let isPdf = fileName?.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';
    let isImage = mimeType.startsWith('image/');

    // 1. If DOCX, extract text with mammoth
    if (isDocx && fileData) {
      try {
        const buffer = Buffer.from(fileData, 'base64');
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || '';
      } catch (err: any) {
        console.warn('[Document Process] Mammoth extraction failed, falling back to Gemini:', err);
      }
    }

    // 2. If plain text or CSV base64 without extracted text
    if (!extractedText && fileData && (mimeType.startsWith('text/') || mimeType === 'application/json' || fileName?.match(/\.(txt|csv|md|json)$/i))) {
      try {
        const buffer = Buffer.from(fileData, 'base64');
        extractedText = buffer.toString('utf-8');
      } catch (err: any) {
        console.warn('[Document Process] UTF-8 decoding failed:', err);
      }
    }

    const systemPrompt = `You are Smriti AI's autonomous document intelligence engine.
Analyze the provided document ("${fileName || 'Uploaded Document'}").
Extract:
1. "extractedText": A clean transcript or comprehensive text representation of the document contents (up to 4000 characters).
2. "summary": A concise executive summary of the document (2-4 sentences).
3. "keyTakeaways": An array of 3-6 critical bullet points.
4. "suggestedTasks": An array of any action items, deadlines, or follow-ups found in the document (format: [{"title": "...", "priority": "High" | "Medium" | "Low"}]).
5. "suggestedMemories": An array of important personal or project facts worth remembering permanently (format: [{"title": "...", "content": "..."}]).

Respond strictly in valid JSON matching this structure:
{
  "extractedText": "...",
  "summary": "...",
  "keyTakeaways": ["..."],
  "suggestedTasks": [{ "title": "...", "priority": "Medium" }],
  "suggestedMemories": [{ "title": "...", "content": "..." }]
}`;

    const parts: any[] = [];

    // Multimodal input for PDF or image if we don't have raw extracted text
    if ((isPdf || isImage) && fileData) {
      parts.push({
        inlineData: {
          mimeType: isPdf ? 'application/pdf' : mimeType,
          data: fileData,
        },
      });
      parts.push({ text: `${systemPrompt}\n\nDocument file name: ${fileName}` });
    } else {
      // Text-based input
      const contentSnippet = (extractedText || fileData).slice(0, 30000);
      parts.push({
        text: `${systemPrompt}\n\nDocument Contents:\n---\n${contentSnippet}\n---`,
      });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 2048,
      },
    });

    const responseText = response.text || '{}';
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
      result: {
        extractedText: parsed.extractedText || extractedText || 'Document content analyzed.',
        summary: parsed.summary || 'Summary generated.',
        keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
        suggestedTasks: Array.isArray(parsed.suggestedTasks) ? parsed.suggestedTasks : [],
        suggestedMemories: Array.isArray(parsed.suggestedMemories) ? parsed.suggestedMemories : [],
      },
    });
  } catch (error: any) {
    console.error('[Document Process API] Error:', error);
    res.status(500).json({
      error: error?.message || 'Error analyzing document with Gemini.',
      code: 'DOCUMENT_PROCESSING_ERROR',
    });
  }
}
