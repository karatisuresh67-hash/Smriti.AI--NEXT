import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  Paperclip, 
  CheckSquare, 
  Clock, 
  Plus, 
  ArrowRight, 
  Terminal,
  Globe,
  FileText,
  Calendar as CalendarIcon,
  Brain,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { RobotMascot } from '../components/dashboard/RobotMascot';
import { executeBrowserTask } from '../services/browserAgentService';
import { processDocumentApi } from '../services/apiService';
import { detectWebsiteIntent } from '../services/chromeActionService';
import type { Task, ActionExecution, AgentActionStep } from '../types';

export function DashboardPage() {
  const { 
    tasks, 
    toggleTaskStatus, 
    setCurrentTab, 
    setChatMessages, 
    actions,
    logActionExecution,
    addDocument,
    memories,
    activeChromeJob,
    dispatchChromeAction,
    addToast 
  } = useApp();
  const { user, profile } = useAuth();

  const [promptText, setPromptText] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<ActionExecution | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = 
    profile?.display_name || 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name || 
    user?.email?.split('@')[0] || 
    'Commander';

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(t => !t.dueDate || t.dueDate <= todayStr);
  const completedToday = todayTasks.filter(t => t.status === 'completed').length;
  const totalToday = todayTasks.length;

  // Determine current JARVIS core state
  let jarvisState: 'idle' | 'listening' | 'thinking' | 'executing' | 'waiting_approval' | 'completed' = 'idle';
  if (isExecuting || activeChromeJob?.status === 'RUNNING' || activeChromeJob?.status === 'STARTING') {
    jarvisState = 'executing';
  } else if (currentExecution?.status === 'waiting_approval' || currentExecution?.status === 'requires_approval' || activeChromeJob?.status === 'WAITING_FOR_USER' || activeChromeJob?.status === 'WAITING_FOR_APPROVAL') {
    jarvisState = 'waiting_approval';
  } else if (currentExecution?.status === 'completed' || activeChromeJob?.status === 'COMPLETED') {
    jarvisState = 'completed';
  }

  const handleCommandSubmit = async (customText?: string) => {
    const text = (customText || promptText).trim();
    if (!text || isExecuting) return;

    // 1. Check if command is a Chrome-native website action (Category B)
    const websiteIntent = detectWebsiteIntent(text);
    if (websiteIntent.isWebsiteAction) {
      setIsExecuting(true);
      setPromptText('');
      addToast(`Initiating Chrome website action for ${websiteIntent.websiteName}...`, 'info');

      try {
        const job = await dispatchChromeAction({
          command: text,
          websiteName: websiteIntent.websiteName,
          actionType: websiteIntent.actionType,
          destinationUrl: websiteIntent.destinationUrl,
          targetTitle: websiteIntent.targetTitle,
          executionMode: websiteIntent.executionMode
        });

        if (job.isPopupBlocked) {
          addToast(`Popup blocked by Chrome. Click [Open in Chrome] in the banner above.`, 'info', 6000);
        } else {
          addToast(`Navigated to ${job.websiteName} in Chrome!`, 'success');
        }
      } catch (err: any) {
        console.error('[Dashboard] Chrome action dispatch error:', err);
        addToast(`Failed to launch Chrome action: ${err?.message}`, 'error');
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    // 2. Check if command is a deep DOM scraping or remote cloud browser directive
    const isDeepBrowserDirective = 
      /^(scrape|extract\s+from|read\s+http|summarize\s+http)/i.test(text);

    if (isDeepBrowserDirective) {
      setIsExecuting(true);
      setPromptText('');
      addToast('Launching Autonomous Remote Browser Agent...', 'info');

      try {
        const execution = await executeBrowserTask({ instruction: text });
        setCurrentExecution(execution);
        await logActionExecution({
          taskTitle: execution.taskTitle,
          instruction: execution.instruction,
          targetSystem: execution.targetSystem,
          status: execution.status,
          steps: execution.steps,
          resultSummary: execution.resultSummary,
          screenshotUrl: execution.screenshotUrl,
        });

        if (execution.status === 'waiting_approval' || execution.status === 'requires_approval') {
          addToast('Action paused: explicit confirmation required.', 'info');
        } else if (execution.status === 'completed') {
          addToast('Browser mission completed successfully!', 'success');
        }
      } catch (err: any) {
        console.error('[Dashboard] Browser execution error:', err);
        addToast(`Execution error: ${err.message}`, 'error');
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    // 3. Otherwise route as normal conversational question (Category A)
    // Conversations remain strictly inside Smriti AI chat!
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: text,
      timestamp: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setPromptText('');
    setCurrentTab('chat');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommandSubmit();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExecuting(true);
    addToast(`Processing "${file.name}" with Gemini...`, 'info');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          const base64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const fileData = await base64Promise;

      const res = await processDocumentApi({
        fileName: file.name,
        fileData,
        mimeType: file.type || 'application/octet-stream',
      });

      if (res.success && res.result) {
        const doc = await addDocument({
          name: file.name,
          size: file.size,
          mimeType: file.type || 'text/plain',
          extractedText: res.result.extractedText,
          summary: res.result.summary,
          keyTakeaways: res.result.keyTakeaways,
          suggestedTasks: res.result.suggestedTasks,
          suggestedMemories: res.result.suggestedMemories,
        });

        addToast(`Analyzed "${file.name}". View in Documents tab.`, 'success');
        setCurrentTab('documents');
      }
    } catch (err: any) {
      addToast(`Document processing failed: ${err.message}`, 'error');
    } finally {
      setIsExecuting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApproveCurrentAction = async () => {
    if (!currentExecution) return;
    setIsExecuting(true);
    try {
      const res = await fetch('/api/browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'click_button',
          url: currentExecution.targetSystem,
          approved: true,
          payload: { actionId: currentExecution.id }
        })
      });
      const data = await res.json();
      const updated: ActionExecution = {
        ...currentExecution,
        status: 'completed',
        completedAt: new Date().toISOString(),
        resultSummary: data.message || 'Action executed following user authorization.',
        steps: [
          ...(currentExecution.steps || []),
          {
            step: (currentExecution.steps?.length || 0) + 1,
            action: 'Authorized by User',
            target: currentExecution.targetSystem,
            status: 'completed',
            detail: 'User gave explicit consent.',
            timestamp: new Date().toISOString()
          }
        ]
      };
      setCurrentExecution(updated);
      logActionExecution(updated);
      addToast('Action confirmed and completed.', 'success');
    } catch (err: any) {
      addToast(`Execution failed: ${err.message}`, 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 animate-in fade-in duration-200">
      {/* =========================================================================
          LEFT / CENTER: JARVIS Autonomous Command Center
         ========================================================================= */}
      <div className="lg:col-span-8 space-y-6 flex flex-col justify-between">
        {/* Header Greeting & Core Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Welcome back, {displayName}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.9)]" />
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              Autonomous AI Operating System. Ready to browse, remember, and execute directives.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 bg-[#070C1E] px-3 py-1.5 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CORE: {jarvisState.toUpperCase()}</span>
          </div>
        </div>

        {/* 3D Animated Robot Mascot / Core Orb */}
        <div className="py-2">
          <RobotMascot />
        </div>

        {/* Autonomous Command Bar */}
        <div className="space-y-3">
          <div className="relative p-1.5 rounded-2xl bg-[#070C1E] border border-[#1E2540] shadow-[0_0_30px_rgba(6,182,212,0.15)] focus-within:border-cyan-500 focus-within:shadow-[0_0_35px_rgba(6,182,212,0.3)] transition-all">
            <div className="flex items-center space-x-2 px-3 py-1.5">
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Instruct Smriti AI: Browse websites, analyze files, create tasks, or recall memories..."
                disabled={isExecuting}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
              />

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.csv,.json,.md,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Attach File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExecuting}
                title="Attach & analyze document"
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#151D36] transition-colors disabled:opacity-50"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Voice Trigger Button */}
              <button
                type="button"
                onClick={() => setCurrentTab('voice')}
                title="Start Gemini Live voice conversation"
                className="p-2 text-slate-400 hover:text-cyan-400 rounded-xl hover:bg-[#151D36] transition-colors"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Run Directive Button */}
              <button
                type="button"
                onClick={() => handleCommandSubmit()}
                disabled={!promptText.trim() || isExecuting}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white shadow-md hover:from-cyan-400 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
              >
                {isExecuting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Mission Launchers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => handleCommandSubmit("Go to https://news.ycombinator.com and summarize the top technology stories")}
              className="p-3 rounded-xl bg-[#070C1E] border border-[#1E2540] hover:border-cyan-500/40 text-left transition-all group"
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Web Research</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Autonomous browsing</p>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-[#070C1E] border border-[#1E2540] hover:border-indigo-500/40 text-left transition-all group"
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Analyze File</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">PDF, Word, or CSV</p>
            </button>

            <button
              onClick={() => setCurrentTab('calendar')}
              className="p-3 rounded-xl bg-[#070C1E] border border-[#1E2540] hover:border-blue-500/40 text-left transition-all group"
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <span>Calendar Audit</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">View directives & sync</p>
            </button>

            <button
              onClick={() => handleCommandSubmit("What are the most important saved memories, preferences, and facts in my vault?")}
              className="p-3 rounded-xl bg-[#070C1E] border border-[#1E2540] hover:border-violet-500/40 text-left transition-all group"
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-white group-hover:text-violet-400 transition-colors">
                <Brain className="w-4 h-4 text-violet-400" />
                <span>Memory Vault</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{memories.length} facts indexed</p>
            </button>
          </div>
        </div>

        {/* Live Active Execution Box (Shows when an autonomous browser action ran or is pending) */}
        {currentExecution && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#070C1E] border border-cyan-500/30 space-y-3 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between border-b border-[#1E2540] pb-2.5">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Active Mission: {currentExecution.taskTitle}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                currentExecution.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : currentExecution.status === 'waiting_approval'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
              }`}>
                {currentExecution.status}
              </span>
            </div>

            {/* Instruction & result summary */}
            <p className="text-xs text-slate-300">
              <span className="text-slate-500 font-semibold">Directive: </span>
              {currentExecution.instruction}
            </p>

            {currentExecution.resultSummary && (
              <div className="p-3 rounded-xl bg-[#030712] border border-[#1E2540] text-xs text-slate-200 leading-relaxed max-h-40 overflow-y-auto">
                {currentExecution.resultSummary}
              </div>
            )}

            {/* Screenshot if present */}
            {currentExecution.screenshotUrl && (
              <div className="rounded-xl border border-[#1E2540] overflow-hidden max-h-48 bg-black">
                <img src={currentExecution.screenshotUrl} alt="Browser Capture" className="w-full object-cover" />
              </div>
            )}

            {/* Human in the loop confirmation button if waiting */}
            {(currentExecution.status === 'waiting_approval' || currentExecution.status === 'requires_approval') && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs text-amber-300 font-medium">
                  <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Action requires your confirmation before external mutation.</span>
                </div>
                <button
                  onClick={handleApproveCurrentAction}
                  disabled={isExecuting}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Run</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          RIGHT COLUMN: System Diagnostics & Today's Directives
         ========================================================================= */}
      <div className="lg:col-span-4 space-y-5">
        {/* System Diagnostics Panel */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#070C1E] border border-[#1E2540] space-y-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Agent Architecture Status</span>
          </h2>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#0B1024] border border-[#1A2346]">
              <span className="text-slate-400">AI Model</span>
              <span className="text-cyan-400 font-bold">Gemini 2.5 / 3.5</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#0B1024] border border-[#1A2346]">
              <span className="text-slate-400">Cloud Browser</span>
              <span className="text-emerald-400 font-bold">Playwright Engine</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#0B1024] border border-[#1A2346]">
              <span className="text-slate-400">Memory Layer</span>
              <span className="text-violet-400 font-bold">Supabase (RLS)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#0B1024] border border-[#1A2346]">
              <span className="text-slate-400">Safety Protocol</span>
              <span className="text-amber-400 font-bold">Human Confirmation</span>
            </div>
          </div>
        </div>

        {/* Today's Directives (Tasks) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#070C1E] border border-[#1E2540] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Today's Directives</span>
            </h2>
            <button
              onClick={() => setCurrentTab('tasks')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-[#0B1024] border border-[#1E2540] text-slate-400 text-xs space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="font-medium text-slate-300">All clear for today!</p>
              <p className="text-[11px] text-slate-500">
                Ask Smriti AI to schedule new tasks or analyze a document to create directives.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0, 5).map(task => {
                const isCompleted = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                      isCompleted 
                        ? 'bg-[#050918] border-[#161D36] text-slate-500 opacity-60' 
                        : 'bg-[#0B1024] border-[#1E2540] hover:border-indigo-500/40 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isCompleted ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-500'
                      }`}>
                        {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={`text-xs truncate ${isCompleted ? 'line-through text-slate-500' : 'font-medium text-white'}`}>
                        {task.title}
                      </span>
                    </div>

                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                      task.priority === 'High' 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
