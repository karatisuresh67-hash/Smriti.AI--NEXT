import React from 'react';
import { Database, Cpu, Lock, Smartphone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-700">Google Gemini 3.8</p>
              <p className="text-[11px] text-slate-400">Server-Side @google/genai</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-700">Supabase & RLS</p>
              <p className="text-[11px] text-slate-400">Phase 2 PostgreSQL Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-700">Strict Data Privacy</p>
              <p className="text-[11px] text-slate-400">Human-in-the-Loop Confirms</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-700">PWA & Capacitor</p>
              <p className="text-[11px] text-slate-400">Android APK Ready</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400">
          <p>© {new Date().getFullYear()} Smriti AI Next. Production Architecture.</p>
          <p>Phase 1 Foundation • Never Exposes Secrets • Zero Mock AI Responses</p>
        </div>
      </div>
    </footer>
  );
};
