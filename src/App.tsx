import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  Server,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  KeyRound
} from 'lucide-react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Card } from './components/common/Card';
import { Badge } from './components/common/Badge';
import { fetchHealthCheck, runGeminiConnectivityTest } from './services/apiService';
import type { HealthResponse, GeminiTestResponse } from '@api/_utils/serverTypes';

export const App: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [geminiResult, setGeminiResult] = useState<GeminiTestResponse | null>(null);
  const [geminiLoading, setGeminiLoading] = useState<boolean>(false);
  const [geminiError, setGeminiError] = useState<{ message: string; code?: string; details?: string; latencyMs?: number } | null>(null);

  const loadHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await fetchHealthCheck();
      setHealthData(data);
    } catch (err: any) {
      setHealthError(err.message || 'Failed to connect to health endpoint.');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleTestGemini = async () => {
    setGeminiLoading(true);
    setGeminiError(null);
    setGeminiResult(null);
    try {
      const result = await runGeminiConnectivityTest();
      setGeminiResult(result);
    } catch (err: any) {
      setGeminiError({
        message: err.message || 'Gemini connectivity test failed.',
        code: err.code,
        details: err.details,
        latencyMs: err.latencyMs,
      });
    } finally {
      setGeminiLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Intro Banner */}
        <section className="mb-8" aria-label="Project Status">
          <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-soft-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-violet-600/10 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <Badge variant="violet" className="mb-3 bg-violet-900/60 border-violet-700 text-violet-300">
                Phase 1 Complete — Foundation & Verification
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                Smriti AI Next Architecture Ready
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
                A clean, production-oriented version of Smriti AI built from the ground up.
                Strict server-side Gemini orchestration, zero mock AI responses, TypeScript safety,
                and ready for Supabase Auth, PostgreSQL RLS, and FullCalendar.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 bg-navy-800/80 px-2.5 py-1 rounded-md border border-navy-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Keys Kept on Server
                </span>
                <span className="flex items-center gap-1 bg-navy-800/80 px-2.5 py-1 rounded-md border border-navy-700">
                  <Terminal className="w-3.5 h-3.5 text-violet-400" />
                  Strict TypeScript
                </span>
                <span className="flex items-center gap-1 bg-navy-800/80 px-2.5 py-1 rounded-md border border-navy-700">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  Vercel Serverless Ready
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Health Check Endpoint */}
          <Card
            title="Backend Health & Environment"
            subtitle="GET /api/health (Serverless Route)"
            action={
              <button
                onClick={loadHealth}
                disabled={healthLoading}
                aria-label="Refresh health check"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-navy-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            }
          >
            {healthLoading && !healthData ? (
              <div className="py-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-violet-600" />
                <span>Checking system health...</span>
              </div>
            ) : healthError ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Health check failed</p>
                  <p className="text-xs text-rose-700 mt-0.5">{healthError}</p>
                </div>
              </div>
            ) : healthData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs font-medium text-slate-600">Endpoint Status</span>
                  <Badge variant={healthData.status === 'ok' ? 'success' : 'warning'} dot>
                    {healthData.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-slate-500 font-medium">Environment</p>
                    <p className="font-semibold text-navy-900 mt-0.5">{healthData.environment}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-slate-500 font-medium">Version</p>
                    <p className="font-semibold text-navy-900 mt-0.5">v{healthData.version}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Service Detection</h4>
                  
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-violet-600" />
                      Gemini API Key
                    </span>
                    <Badge variant={healthData.services.geminiConfigured ? 'success' : 'warning'}>
                      {healthData.services.geminiConfigured ? 'Detected on Server' : 'Missing in .env.local'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      Gemini Model
                    </span>
                    <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {healthData.services.geminiModel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-emerald-600" />
                      Supabase (Phase 2)
                    </span>
                    <Badge variant={healthData.services.supabaseConfigured ? 'success' : 'neutral'}>
                      {healthData.services.supabaseConfigured ? 'Configured' : 'Pending Phase 2 Setup'}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>

          {/* Card 2: Real Gemini Connectivity Test */}
          <Card
            title="Real Gemini API Test"
            subtitle="POST /api/gemini-test (Never Simulates)"
            action={
              <button
                onClick={handleTestGemini}
                disabled={geminiLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${geminiLoading ? 'animate-bounce' : ''}`} />
                <span>{geminiLoading ? 'Contacting AI...' : 'Run Real Test'}</span>
              </button>
            }
          >
            {!geminiResult && !geminiError && !geminiLoading && (
              <div className="py-8 text-center text-xs text-slate-500">
                <p className="mb-2">Click <strong>Run Real Test</strong> to execute a genuine server-side ping to Gemini 3.8 Flash.</p>
                <p className="text-[11px] text-slate-400">
                  Rule 6: Never simulates success. Real errors are rendered if credentials or quotas fail.
                </p>
              </div>
            )}

            {geminiLoading && (
              <div className="py-8 text-center text-xs text-slate-600 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-violet-600" />
                <p className="font-medium">Connecting to Google Gemini 3.8 via official @google/genai SDK...</p>
                <p className="text-[11px] text-slate-400">Executing serverless route on backend</p>
              </div>
            )}

            {geminiError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold text-rose-900">
                    {geminiError.code ? `[${geminiError.code}] ` : ''}API Verification Error
                  </span>
                </div>
                <p className="text-rose-700 leading-relaxed">{geminiError.message}</p>
                {geminiError.details && (
                  <p className="text-rose-600 text-[11px] font-mono bg-rose-100/60 p-2 rounded">
                    {geminiError.details}
                  </p>
                )}
                {typeof geminiError.latencyMs === 'number' && (
                  <p className="text-slate-500 text-[11px]">Round-trip time: {geminiError.latencyMs}ms</p>
                )}
              </div>
            )}

            {geminiResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-900">Real Gemini Response Confirmed</span>
                  </div>
                  <Badge variant="success">200 OK</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">Model:</span>
                    <span className="font-mono font-medium text-slate-800">{geminiResult.model}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Latency:
                    </span>
                    <span className="font-mono font-medium text-emerald-700">{geminiResult.latencyMs}ms</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono">
                  <p className="text-slate-400 text-[10px] uppercase mb-1">Model Output (Live from Gemini):</p>
                  <p className="text-emerald-400 font-semibold">{geminiResult.responsePreview}</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Phase Roadmap & Next Steps */}
        <section aria-label="Development Roadmap">
          <Card title="Smriti AI Next — Phase Roadmap" subtitle="Small, testable, production-ready increments">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border-2 border-violet-500 bg-violet-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-violet-700">Phase 1</span>
                  <Badge variant="violet">Current</Badge>
                </div>
                <h4 className="font-semibold text-sm text-navy-900 mb-1">Foundation & AI Pipeline</h4>
                <p className="text-xs text-slate-600">
                  Vite, TypeScript, Tailwind, safe serverless API runner, real Gemini endpoint, automated tests.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Phase 2</span>
                  <Badge variant="neutral">Upcoming</Badge>
                </div>
                <h4 className="font-semibold text-sm text-navy-900 mb-1">Auth & PostgreSQL RLS</h4>
                <p className="text-xs text-slate-600">
                  Supabase accounts, sign-in/up, recovery, user ID RLS database migration, user session security.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Phase 3</span>
                  <Badge variant="neutral">Planned</Badge>
                </div>
                <h4 className="font-semibold text-sm text-navy-900 mb-1">Memories, Reminders & Calendar</h4>
                <p className="text-xs text-slate-600">
                  Full CRUD with FullCalendar, recurring reminders, human-in-the-loop action proposals.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Phase 4</span>
                  <Badge variant="neutral">Planned</Badge>
                </div>
                <h4 className="font-semibold text-sm text-navy-900 mb-1">Gemini Live Voice & Capacitor</h4>
                <p className="text-xs text-slate-600">
                  Conversational audio with Gemini Live API, interruption handling, Capacitor Android build.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default App;
