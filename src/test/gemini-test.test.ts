import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import geminiTestHandler from '../../api/gemini-test';
import type { ApiRequest, ApiResponse } from '../../api/_utils/serverTypes';

function createMockReqRes(method: string = 'POST') {
  const req: Partial<ApiRequest> = {
    method,
    headers: {},
  };

  const resData: { statusCode: number; headers: Record<string, string>; body: any } = {
    statusCode: 200,
    headers: {},
    body: null,
  };

  const res: Partial<ApiResponse> = {
    status(code: number) {
      resData.statusCode = code;
      return res as ApiResponse;
    },
    setHeader(key: string, val: string) {
      resData.headers[key] = val;
      return res as ApiResponse;
    },
    json(data: any) {
      resData.body = data;
    },
    end(data?: any) {
      if (data) resData.body = data;
      return res as ApiResponse;
    },
  };

  return { req: req as ApiRequest, res: res as ApiResponse, resData };
}

describe('/api/gemini-test endpoint', () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
  });

  it('rejects unsupported methods like DELETE with 405', async () => {
    const { req, res, resData } = createMockReqRes('DELETE');

    await geminiTestHandler(req, res);

    expect(resData.statusCode).toBe(405);
    expect(resData.body.error).toContain('Method Not Allowed');
  });

  it('returns 503 and MISSING_API_KEY when GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const { req, res, resData } = createMockReqRes('POST');

    await geminiTestHandler(req, res);

    expect(resData.statusCode).toBe(503);
    expect(resData.body.code).toBe('MISSING_API_KEY');
    expect(resData.body.error).toContain('GEMINI_API_KEY is not configured');
  });

  it('returns 503 when GEMINI_API_KEY is placeholder value', async () => {
    process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
    const { req, res, resData } = createMockReqRes('GET');

    await geminiTestHandler(req, res);

    expect(resData.statusCode).toBe(503);
    expect(resData.body.code).toBe('MISSING_API_KEY');
  });
});
