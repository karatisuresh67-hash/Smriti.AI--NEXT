import { createClient } from '@supabase/supabase-js';
import type { ApiRequest } from './serverTypes';

export interface AuthValidationResult {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  error?: string;
}

/**
 * Validates the Supabase JWT token from request headers (Authorization: Bearer <jwt>).
 * Guarantees that serverless API endpoints authenticate the caller and prevent unauthorized quota drainage.
 */
export async function validateAuthToken(req: ApiRequest): Promise<AuthValidationResult> {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
    // If Supabase credentials are not yet configured in local environment, allow graceful developer bypass
    return {
      authenticated: false,
      userId: null,
      email: null,
      error: 'Supabase environment is not configured.',
    };
  }

  if (!token) {
    return {
      authenticated: false,
      userId: null,
      email: null,
      error: 'Authorization header with Bearer token is missing.',
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        authenticated: false,
        userId: null,
        email: null,
        error: error?.message || 'Invalid or expired authentication token.',
      };
    }

    return {
      authenticated: true,
      userId: user.id,
      email: user.email || null,
    };
  } catch (err: any) {
    return {
      authenticated: false,
      userId: null,
      email: null,
      error: err?.message || 'Authentication check failed.',
    };
  }
}
