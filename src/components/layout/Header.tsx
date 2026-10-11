import React from 'react';
import { Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { Badge } from '../common/Badge';

export const Header: React.FC = () => {
  return (
    <header className="bg-navy-900 text-white border-b border-navy-800 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Smriti AI <span className="text-violet-400 font-semibold">Next</span>
                </h1>
                <Badge variant="violet" className="text-[10px] py-0.5 px-2">
                  Phase 1
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Remember what matters. Let AI handle the rest.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant="success" dot className="bg-navy-800 border-navy-700 text-emerald-400">
              <Activity className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              Foundation Active
            </Badge>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-navy-800/80 px-3 py-1.5 rounded-lg border border-navy-700">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
              <span>Zero-Leak Architecture</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
