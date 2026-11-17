import React from 'react';
import { 
  Compass, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  X, 
  Play, 
  RotateCw, 
  ShieldAlert,
  Radio,
  Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function ActiveChromeActionBanner() {
  const { activeChromeJob, openInChrome, cancelChromeJob, resumeChromeJob, setCurrentTab } = useApp();

  if (!activeChromeJob) return null;

  const isCompleted = activeChromeJob.status === 'COMPLETED';
  const isFailed = activeChromeJob.status === 'FAILED';
  const isCancelled = activeChromeJob.status === 'CANCELLED';
  const isWaitingUser = activeChromeJob.status === 'WAITING_FOR_USER' || activeChromeJob.isPopupBlocked;
  const isWaitingApproval = activeChromeJob.status === 'WAITING_FOR_APPROVAL';
  const isRunning = activeChromeJob.status === 'RUNNING' || activeChromeJob.status === 'STARTING' || activeChromeJob.status === 'QUEUED';

  // Do not show banner permanently if completed for more than 10 seconds unless popup was blocked
  if ((isCompleted || isCancelled) && !isWaitingUser) {
    return null;
  }

  const getStatusBadge = () => {
    switch (activeChromeJob.status) {
      case 'QUEUED':
        return <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] font-bold">QUEUED</span>;
      case 'STARTING':
      case 'RUNNING':
        return (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center space-x-1 animate-pulse">
            <Radio className="w-2.5 h-2.5 text-cyan-400" />
            <span>RUNNING IN CHROME</span>
          </span>
        );
      case 'WAITING_FOR_USER':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">WAITING FOR USER</span>;
      case 'WAITING_FOR_APPROVAL':
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">APPROVAL REQUIRED</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">COMPLETED</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">FAILED</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] font-bold">CANCELLED</span>;
    }
  };

  return (
    <aside 
      aria-label="Active Chrome action status and controls"
      className="mb-4 p-3 rounded-2xl bg-[#070C1E]/95 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Icon, Details, and Destination Link */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Compass className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold text-white tracking-wide truncate">
                {activeChromeJob.targetTitle || activeChromeJob.websiteName}
              </span>
              {getStatusBadge()}
            </div>

            <p className="text-[11px] text-slate-300 truncate mt-0.5 flex items-center space-x-1.5">
              <span>Command: "{activeChromeJob.originalCommand}"</span>
              <span>•</span>
              <a 
                href={activeChromeJob.destinationUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center space-x-0.5 truncate"
              >
                <span>{activeChromeJob.destinationUrl}</span>
                <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 ml-0.5" />
              </a>
            </p>
          </div>
        </div>

        {/* Right: Action Controls */}
        <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
          {/* Popup Blocked Warning & Open in Chrome button */}
          {isWaitingUser && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Popup Blocked</span>
            </div>
          )}

          {/* Explicit Open in Chrome Button */}
          <button
            onClick={() => openInChrome(activeChromeJob.id)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md hover:shadow-cyan-500/25 transition-all flex items-center space-x-1.5 active:scale-95"
            title="Open destination in a new Chrome tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Chrome</span>
          </button>

          {/* View Action Results */}
          <button
            onClick={() => {
              setCurrentTab('results');
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[#151D36] hover:bg-[#1E2540] text-slate-200 text-xs font-medium border border-[#1E2540] transition-colors flex items-center space-x-1"
            title="View full action result details"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Results</span>
          </button>

          {/* Cancel button if running */}
          {isRunning && (
            <button
              onClick={() => cancelChromeJob(activeChromeJob.id)}
              className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
              title="Cancel this action"
              aria-label="Cancel this action"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
