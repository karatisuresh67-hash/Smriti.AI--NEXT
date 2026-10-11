import { describe, it, expect, vi } from 'vitest';
import healthHandler from '../../api/health';
import type { ApiRequest, ApiResponse } from '../../api/_utils/serverTypes';

function createMockReqRes(method: string = 'GET') {
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

describe('/api/health endpoint', () => {
  it('returns 200 with ok status and environment metadata on GET', async () => {
    const { req, res, resData } = createMockReqRes('GET');

    await healthHandler(req, res);

    expect(resData.statusCode).toBe(200);
    expect(resData.body).toBeDefined();
    expect(resData.body.status).toBe('ok');
    expect(resData.body.version).toBe('0.1.0');
    expect(typeof resData.body.timestamp).toBe('string');
    expect(typeof resData.body.services.geminiConfigured).toBe('boolean');
    expect(typeof resData.body.services.geminiModel).toBe('string');
  });

  it('rejects POST with 405 Method Not Allowed', async () => {
    const { req, res, resData } = createMockReqRes('POST');

    await healthHandler(req, res);

    expect(resData.statusCode).toBe(405);
    expect(resData.body.error).toContain('Method Not Allowed');
    expect(resData.headers['Allow']).toBe('GET, HEAD');
  });

  it('rejects DELETE with 405 Method Not Allowed', async () => {
    const { req, res, resData } = createMockReqRes('DELETE');

    await healthHandler(req, res);

    expect(resData.statusCode).toBe(405);
  });
});
