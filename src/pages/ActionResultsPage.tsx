import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  AlertTriangle, 
  Copy, 
  Check, 
  Play, 
  Mail, 
  Calendar as CalendarIcon, 
  ArrowRight,
  ShieldCheck,
  Radio,
  XCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTimeAgo } from '../services/dateUtils';
import type { ChromeActionJob, ChromeActionStatus } from '../types';

export function ActionResultsPage() {
  const { chromeJobs, activeChromeJob, openInChrome, resumeChromeJob, cancelChromeJob, addToast } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  // Check URL query parameters for ?jobId=...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const jId = params.get('jobId');
      if (jId) {
        setSelectedJobId(jId);
      } else if (chromeJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(chromeJobs[0].id);
      }
    }
  }, [chromeJobs]);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlId(id);
    addToast('Destination URL copied to clipboard', 'info');
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  const filteredJobs = chromeJobs.filter(job => {
    if (filterStatus === 'completed' && job.status !== 'COMPLETED') return false;
    if (filterStatus === 'running' && !['RUNNING', 'STARTING', 'QUEUED'].includes(job.status)) return false;
    if (filterStatus === 'waiting' && !['WAITING_FOR_USER', 'WAITING_FOR_APPROVAL'].includes(job.status)) return false;
    if (filterStatus === 'verified' && job.verificationStatus !== 'verified') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        job.originalCommand.toLowerCase().includes(q) ||
        job.websiteName.toLowerCase().includes(q) ||
        job.destinationUrl.toLowerCase().includes(q) ||
        (job.resultSummary && job.resultSummary.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const selectedJob = chromeJobs.find(j => j.id === selectedJobId) || filteredJobs[0] || null;

  const getStatusBadge = (status: ChromeActionStatus) => {
    switch (status) {
      case 'QUEUED':
        return <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/20 text-xs font-semibold">QUEUED</span>;
      case 'STARTING':
      case 'RUNNING':
        return (
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-bold flex items-center space-x-1.5 animate-pulse">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>RUNNING IN CHROME</span>
          </span>
        );
      case 'WAITING_FOR_USER':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">WAITING FOR USER</span>;
      case 'WAITING_FOR_APPROVAL':
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-bold">NEEDS APPROVAL</span>;
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>COMPLETED</span>
          </span>
        );
      case 'FAILED':
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-bold">FAILED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/20 text-xs font-medium">CANCELLED</span>;
    }
  };

  const getVerificationBadge = (verificationStatus: ChromeActionJob['verificationStatus']) => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Destination</span>
          </div>
        );
      case 'requires_auth':
        return (
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Auth Required on Site</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs">
            <span>Unverified</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Compass className="w-4 h-4" />
            </div>
            Chrome Action Results
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            Verified website destinations, search queries, media playback, and live actions executed in your Chrome browser.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Chrome Native • Zero Extension Required</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#070C1E] p-2 rounded-2xl border border-[#1E2540]">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Actions' },
            { id: 'completed', label: 'Completed' },
            { id: 'running', label: 'In Progress' },
            { id: 'waiting', label: 'Blocked / Waiting' },
            { id: 'verified', label: 'Verified' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#151D36]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] sm:min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search commands or websites..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0B1024] border border-[#1E2540] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Grid: Left List + Right Detail */}
      {chromeJobs.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#070C1E] border border-[#1E2540]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Website Actions Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Ask Smriti AI to open websites, search LinkedIn, play videos on YouTube, or check Gmail, and your actions will appear here!
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Open YouTube",
              "Play Ramayana Telugu trailer",
              "Search LinkedIn for AI internships",
              "Find my unread Gmail messages"
            ].map(cmd => (
              <span key={cmd} className="px-3 py-1.5 rounded-xl bg-[#151D36] border border-[#1E2540] text-xs text-cyan-300 font-mono">
                {cmd}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Action Jobs List */}
          <div className="lg:col-span-5 space-y-3">
            {filteredJobs.map(job => {
              const isSelected = selectedJob?.id === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0B1024] border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50'
                      : 'bg-[#070C1E] border-[#1E2540] hover:border-slate-700 hover:bg-[#0B1024]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      {job.websiteName}
                    </span>
                    {getStatusBadge(job.status)}
                  </div>

                  <h4 className="text-sm font-semibold text-white line-clamp-1 mb-1">
                    "{job.originalCommand}"
                  </h4>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {job.resultSummary || `Target URL: ${job.destinationUrl}`}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-[#1E2540]">
                    <span>{formatTimeAgo(job.createdAt)}</span>
                    <span className="capitalize text-slate-400 font-medium">Mode: {job.executionMode.replace('_', ' ')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Job Detail Panel */}
          <div className="lg:col-span-7">
            {selectedJob ? (
              <div className="p-6 rounded-3xl bg-[#070C1E] border border-[#1E2540] shadow-xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2540]">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        {selectedJob.websiteName}
                      </span>
                      {getStatusBadge(selectedJob.status)}
                      {getVerificationBadge(selectedJob.verificationStatus)}
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white">
                      "{selectedJob.originalCommand}"
                    </h2>
                  </div>

                  {/* Primary CTA */}
                  <button
                    onClick={() => openInChrome(selectedJob.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 active:scale-95 flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in Chrome Tab</span>
                  </button>
                </div>

                {/* Destination URL Box */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Verified Destination URL
                  </label>
                  <div className="flex items-center space-x-2 p-3 rounded-xl bg-[#0B1024] border border-[#1E2540]">
                    <a
                      href={selectedJob.destinationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-mono truncate flex-1 flex items-center space-x-1"
                    >
                      <span className="truncate">{selectedJob.destinationUrl}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 ml-1" />
                    </a>
                    <button
                      onClick={() => handleCopyUrl(selectedJob.destinationUrl, selectedJob.id)}
                      className="p-1.5 rounded-lg hover:bg-[#151D36] text-slate-400 hover:text-white transition-colors"
                      title="Copy URL"
                    >
                      {copiedUrlId === selectedJob.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Result Summary */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Execution Result
                  </label>
                  <div className="p-4 rounded-xl bg-[#0B1024] border border-[#1E2540] text-sm text-slate-200 leading-relaxed">
                    {selectedJob.resultSummary || "Action prepared and verified."}
                  </div>
                </div>

                {/* Extracted Data Section (e.g. Gmail messages, Calendar events) */}
                {selectedJob.extractedData && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Extracted / Synchronized Items
                    </label>

                    {/* Gmail Emails */}
                    {Array.isArray(selectedJob.extractedData.emails) && (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {selectedJob.extractedData.emails.map((msg: any) => (
                          <div key={msg.id} className="p-3 rounded-xl bg-[#0B1024] border border-[#1E2540] text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-white truncate">{msg.subject}</span>
                              <span className="text-[10px] text-slate-500">{msg.date}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">From: {msg.from}</p>
                            <p className="text-slate-300 mt-1 line-clamp-2">{msg.snippet}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Calendar Events */}
                    {Array.isArray(selectedJob.extractedData.events) && (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {selectedJob.extractedData.events.map((evt: any) => (
                          <div key={evt.id} className="p-3 rounded-xl bg-[#0B1024] border border-[#1E2540] text-xs flex items-center justify-between">
                            <div>
                              <p className="font-bold text-white">{evt.title}</p>
                              <p className="text-[11px] text-slate-400">{evt.start} {evt.location ? `• ${evt.location}` : ''}</p>
                            </div>
                            {evt.htmlLink && (
                              <a href={evt.htmlLink} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 p-1">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Execution Steps */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Action Execution Telemetry
                  </label>
                  <div className="space-y-2 p-3 rounded-xl bg-[#0B1024] border border-[#1E2540]">
                    {(selectedJob.steps || []).map(step => (
                      <div key={step.step} className="flex items-start space-x-2.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-[#151D36] flex items-center justify-center text-[10px] font-bold text-cyan-400 flex-shrink-0 mt-0.5">
                          {step.step}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-200">{step.action}</p>
                          {step.detail && <p className="text-[11px] text-slate-400 mt-0.5">{step.detail}</p>}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#1E2540] text-xs text-slate-400">
                  <span>Job ID: <code className="text-slate-300 font-mono">{selectedJob.id}</code></span>
                  <span>Started: {new Date(selectedJob.createdAt).toLocaleString()}</span>
                  <span>Execution: <strong className="text-cyan-400 capitalize">{selectedJob.executionMode.replace('_', ' ')}</strong></span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
