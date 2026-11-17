import React, { useState } from 'react';
import { 
  Zap, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  ArrowRight, 
  X, 
  Globe, 
  Mail, 
  Calendar, 
  Share2, 
  ShieldCheck, 
  ShieldAlert, 
  Terminal, 
  Check, 
  Loader2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ActionExecution, ActionStatus, AgentActionStep } from '../types';

export function ActionHistoryPage() {
  const { actions, logActionExecution, addToast } = useApp();

  const [selectedAction, setSelectedAction] = useState<ActionExecution | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isApproving, setIsApproving] = useState<string | null>(null);

  const filteredActions = actions.filter(action => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'running') return action.status === 'running';
    if (filterStatus === 'completed') return action.status === 'completed' || action.status === 'success';
    if (filterStatus === 'waiting_approval') return action.status === 'waiting_approval' || action.status === 'requires_approval';
    if (filterStatus === 'failed') return action.status === 'failed';
    return true;
  });

  const getStatusBadge = (status: ActionStatus) => {
    switch (status) {
      case 'completed':
      case 'success':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Running</span>
          </span>
        );
      case 'waiting_approval':
      case 'requires_approval':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Waiting Approval</span>
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>{status}</span>
          </span>
        );
    }
  };

  const getTargetIcon = (target: string) => {
    const t = target?.toLowerCase() || '';
    if (t.includes('web') || t.includes('browser') || t.includes('http')) {
      return <Globe className="w-4 h-4 text-cyan-400" />;
    }
    if (t.includes('mail') || t.includes('gmail')) {
      return <Mail className="w-4 h-4 text-rose-400" />;
    }
    if (t.includes('calendar')) {
      return <Calendar className="w-4 h-4 text-blue-400" />;
    }
    if (t.includes('social') || t.includes('linkedin') || t.includes('x')) {
      return <Share2 className="w-4 h-4 text-sky-400" />;
    }
    return <Zap className="w-4 h-4 text-amber-400" />;
  };

  const handleApproveAction = async (action: ActionExecution) => {
    setIsApproving(action.id);
    try {
      // Execute approved action via browser API
      const response = await fetch('/api/browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'click_button',
          url: action.targetSystem,
          approved: true,
          payload: { actionId: action.id }
        })
      });
      const data = await response.json();

      const updatedAction: ActionExecution = {
        ...action,
        status: 'completed',
        completedAt: new Date().toISOString(),
        resultSummary: data.message || 'Action executed successfully following user confirmation.',
        steps: [
          ...action.steps,
          {
            step: action.steps.length + 1,
            action: 'User Approved Execution',
            target: action.targetSystem,
            status: 'completed',
            detail: 'User gave explicit consent. Final payload executed.',
            timestamp: new Date().toISOString()
          }
        ]
      };

      logActionExecution(updatedAction);
      setSelectedAction(updatedAction);
      addToast('Action approved and executed successfully!', 'success');
    } catch (err: any) {
      addToast(`Execution failed: ${err.message}`, 'error');
    } finally {
      setIsApproving(null);
    }
  };

  const handleRejectAction = (action: ActionExecution) => {
    const updatedAction: ActionExecution = {
      ...action,
      status: 'cancelled',
      completedAt: new Date().toISOString(),
      resultSummary: 'Execution cancelled by user.',
      steps: [
        ...action.steps,
        {
          step: action.steps.length + 1,
          action: 'Execution Cancelled',
          target: action.targetSystem,
          status: 'failed',
          detail: 'User declined approval for this action.',
          timestamp: new Date().toISOString()
        }
      ]
    };
    logActionExecution(updatedAction);
    setSelectedAction(updatedAction);
    addToast('Action cancelled.', 'info');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <span>Agent Action & Execution History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time audit log of autonomous browser navigations, API calls, and multi-step executions.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#1E2540] pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All Executions' },
          { id: 'running', label: 'Active / Running' },
          { id: 'waiting_approval', label: 'Needs Approval' },
          { id: 'completed', label: 'Completed' },
          { id: 'failed', label: 'Failed' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterStatus === tab.id
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-[#0B1024]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Action Execution List */}
      {actions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#070C1E] border border-[#1E2540] space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0D142E] border border-[#1E2540] flex items-center justify-center text-slate-500 mx-auto">
            <Terminal className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No agent executions recorded yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            When you ask Smriti AI to browse the web, verify links, summarize files, or automate workflows, full step-by-step audit logs will be displayed here.
          </p>
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#070C1E] border border-[#1E2540] text-slate-400 text-sm">
          No actions found matching status filter "{filterStatus}".
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActions.map(action => (
            <div
              key={action.id}
              className="p-4 sm:p-5 rounded-2xl bg-[#0B1024] border border-[#1E2540] hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5 overflow-hidden">
                <div className="p-2.5 rounded-xl bg-[#070C1E] border border-[#1E2540] flex-shrink-0 mt-0.5">
                  {getTargetIcon(action.targetSystem)}
                </div>

                <div className="overflow-hidden">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <h3 className="text-sm font-bold text-white truncate">
                      {action.taskTitle || action.workflowName || 'Autonomous Action'}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-[#070C1E] border border-[#1E2540]">
                      {action.targetSystem || 'Cloud Browser'}
                    </span>
                    {getStatusBadge(action.status)}
                  </div>

                  <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                    {action.instruction || action.resultSummary || 'Execution in progress...'}
                  </p>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(action.startedAt).toLocaleString()}
                    </span>
                    {action.steps && action.steps.length > 0 && (
                      <span>• {action.steps.length} steps recorded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end md:self-center flex-shrink-0">
                {(action.status === 'waiting_approval' || action.status === 'requires_approval') && (
                  <button
                    onClick={() => handleApproveAction(action)}
                    disabled={isApproving === action.id}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    {isApproving === action.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Approve</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedAction(action)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#070C1E] hover:bg-[#151D36] text-slate-300 hover:text-white border border-[#1E2540] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect Audit Log</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execution Inspection Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl max-h-[85vh] bg-[#070C1E] border border-[#1E2540] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#1E2540] flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2.5 rounded-xl bg-[#0D142E] border border-[#1E2540]">
                  {getTargetIcon(selectedAction.targetSystem)}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white truncate">
                      {selectedAction.taskTitle || 'Execution Inspection'}
                    </h3>
                    {getStatusBadge(selectedAction.status)}
                  </div>
                  <p className="text-xs text-slate-400">
                    Target: {selectedAction.targetSystem} • ID: {selectedAction.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAction(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#151D36] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Approval Banner if waiting */}
              {(selectedAction.status === 'waiting_approval' || selectedAction.status === 'requires_approval') && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                        Human Confirmation Required
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        This action involves publishing, submitting data, or executing an external mutation. Do you want to proceed?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleRejectAction(selectedAction)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveAction(selectedAction)}
                      disabled={isApproving === selectedAction.id}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {isApproving === selectedAction.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approve & Run</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Instruction */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Natural Language Instruction
                </h4>
                <div className="p-3.5 rounded-xl bg-[#0B1024] border border-[#1E2540] text-xs text-slate-200">
                  {selectedAction.instruction || 'Direct agent instruction'}
                </div>
              </div>

              {/* Step by step timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Execution Steps ({selectedAction.steps?.length || 0})
                </h4>
                {selectedAction.steps && selectedAction.steps.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAction.steps.map((st, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#0B1024] border border-[#1E2540] flex items-start space-x-3 text-xs"
                      >
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                          {st.step || idx + 1}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{st.action}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(st.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {st.target && (
                            <p className="text-[11px] font-mono text-cyan-400 truncate mt-0.5">
                              {st.target}
                            </p>
                          )}
                          {st.detail && (
                            <p className="text-xs text-slate-400 mt-1">{st.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 bg-[#0B1024] rounded-xl border border-[#1E2540]">
                    No intermediate steps logged for this execution.
                  </p>
                )}
              </div>

              {/* Result Summary */}
              {selectedAction.resultSummary && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Execution Summary
                  </h4>
                  <div className="p-3.5 rounded-xl bg-[#0B1024] border border-[#1E2540] text-xs text-slate-200 leading-relaxed">
                    {selectedAction.resultSummary}
                  </div>
                </div>
              )}

              {/* Screenshot Preview */}
              {selectedAction.screenshotUrl && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Browser Screenshot Capture
                  </h4>
                  <div className="rounded-xl border border-[#1E2540] overflow-hidden bg-black">
                    <img
                      src={selectedAction.screenshotUrl}
                      alt="Browser Screenshot"
                      className="w-full h-auto object-contain max-h-72"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export as AutomationHistoryPage alias for backward-compatibility
export { ActionHistoryPage as AutomationHistoryPage };
