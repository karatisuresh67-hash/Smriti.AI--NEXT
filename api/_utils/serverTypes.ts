import type { IncomingMessage, ServerResponse } from 'http';

export interface ApiRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  body?: any;
  method?: string;
}

export interface ApiResponse extends ServerResponse {
  status: (statusCode: number) => ApiResponse;
  json: (data: any) => void;
}

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    geminiConfigured: boolean;
    geminiModel: string;
    supabaseConfigured: boolean;
  };
  version: string;
}

export interface GeminiTestResponse {
  ok: boolean;
  model: string;
  timestamp: string;
  latencyMs: number;
  responsePreview: string;
  verificationMessage: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: string;
}
