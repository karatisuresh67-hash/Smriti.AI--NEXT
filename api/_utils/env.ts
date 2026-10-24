/**
 * Server-side Environment Helpers
 * Safely inspects configuration without leaking secret contents in logs or responses.
 */

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') {
    return null;
  }
  return key.trim();
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    !url.includes('your-project-id') &&
    anonKey &&
    !anonKey.includes('your_supabase_anon')
  );
}

export function getAppEnvironment(): string {
  return process.env.NODE_ENV || process.env.VITE_APP_ENV || 'development';
}
