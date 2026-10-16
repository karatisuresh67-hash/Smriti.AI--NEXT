import type { HealthResponse, GeminiTestResponse } from '@api/_utils/serverTypes';
import type { Memory, Reminder, ProposedAction } from '../types';

export interface ChatRequestPayload {
  message: string;
  history?: Array<{ role: string; content: string }>;
  memories?: Memory[];
  reminders?: Reminder[];
  currentDateTime?: string;
  userTimezone?: string;
}

export interface ChatResponsePayload {
  reply: string;
  action: ProposedAction | null;
  model: string;
}

export async function fetchHealthCheck(): Promise<HealthResponse> {
  const response = await fetch('/api/health', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Health check failed with status ${response.status}`);
  }

  return data as HealthResponse;
}

export async function runGeminiConnectivityTest(): Promise<GeminiTestResponse> {
  const response = await fetch('/api/gemini-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data?.error || `Gemini test failed with status ${response.status}`);
    (error as any).code = data?.code;
    (error as any).details = data?.details;
    (error as any).latencyMs = data?.latencyMs;
    throw error;
  }

  return data as GeminiTestResponse;
}

export async function sendChatMessage(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `AI Chat request failed with status ${response.status}`);
  }

  return data as ChatResponsePayload;
}
