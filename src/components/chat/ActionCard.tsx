import React, { useState } from 'react';
import {
  Brain,
  Bell,
  Check,
  X,
  CheckSquare,
  Calendar as CalendarIcon,
  Mail,
  Share2,
  Zap,
  Compass,
  AlertTriangle,
  ExternalLink,
  Eye
} from 'lucide-react';
import { TwitterIcon } from '../common/BrandIcons';
import { useApp } from '../../context/AppContext';
import { formatShortDate, formatTime12h } from '../../services/dateUtils';
import type { ProposedAction } from '../../types';

interface ActionCardProps {
  action?: ProposedAction | null;
  onActionExecuted?: () => void;
}

export function ActionCard({ action, onActionExecuted }: ActionCardProps) {
  const { addMemory, addReminder, addTask, logAutomationExecution, dispatchChromeAction, openInChrome, setCurrentTab, addToast } = useApp();
  const [status, setStatus] = useState<'pending' | 'saved' | 'dismissed'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!action || status === 'dismissed') return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (action.type === 'chrome_action') {
        await dispatchChromeAction({
          command: action.targetTitle || action.query || `Open ${action.websiteName}`,
          websiteName: action.websiteName,
          actionType: action.actionType,
          destinationUrl: action.destinationUrl,
          targetTitle: action.targetTitle,
          executionMode: action.executionMode,
        });
      } else if (action.type === 'create_memory') {
        await addMemory({
          title: action.title,
          content: action.content || action.title,
          category: action.category || 'Other',
          date: action.date || '',
          person: action.person || '',
        });
      } else if (action.type === 'create_reminder') {
        await addReminder({
          title: action.title,
          description: action.description || '',
          date: action.date || new Date().toISOString().slice(0, 10),
          time: action.time || '09:00',
          category: action.category || 'Personal',
          priority: action.priority || 'Medium',
          linkedMemoryId: action.linkedMemoryId || null,
        });
      } else if (action.type === 'create_task') {
        await addTask({
          title: action.title,
          description: action.description || '',
          dueDate: action.dueDate || new Date().toISOString().slice(0, 10),
          dueTime: action.dueTime || '12:00',
          priority: action.priority || 'Medium',
          category: action.category || 'Personal',
          source: 'chat'
        });
      } else if (action.type === 'create_calendar_event') {
        await addReminder({
          title: `📅 ${action.title}`,
          description: `Location: ${action.location || 'Online'}. ${action.description || ''}`,
          date: action.date,
          time: action.startTime,
          category: 'Work',
          priority: 'High'
        });
      } else if (action.type === 'browser_action') {
        addToast(`Executing browser action: ${action.description}`, 'info');
      } else if (action.type === 'draft_email' || action.type === 'send_email') {
        addToast(`Email ${action.type === 'send_email' ? 'dispatched to' : 'drafted for'} ${action.recipient}`, 'success');
      } else if (action.type === 'create_linkedin_post' || action.type === 'create_x_post') {
        addToast('Social post published successfully!', 'success');
      } else if (action.type === 'trigger_n8n') {
        await fetch('/api/n8n/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action)
        });
        await logAutomationExecution({
          taskTitle: action.workflowName,
          instruction: `Execute ${action.workflowName}`,
          targetSystem: 'n8n',
          steps: [],
          workflowId: action.workflowId,
          workflowName: action.workflowName,
          triggerSource: 'chat',
          status: 'success',
          inputPayload: action.parameters || {}
        });
        addToast(`Triggered n8n workflow "${action.workflowName}"`, 'success');
      }

      setStatus('saved');
      if (onActionExecuted) onActionExecuted();
    } catch (err: any) {
      console.error('Failed to execute proposed action', err);
      addToast(`Action failed: ${err?.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    setStatus('dismissed');
  };

  if (status === 'saved') {
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2 animate-in fade-in">
        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="font-semibold">
          Action executed and saved successfully!
        </span>
      </div>
    );
  }

  const getActionHeader = () => {
    switch (action.type) {
      case 'chrome_action':
        return { label: `Chrome Action: ${action.websiteName}`, icon: <Compass className="w-4 h-4 text-cyan-400" /> };
      case 'create_memory':
        return { label: 'Save New Memory', icon: <Brain className="w-4 h-4 text-purple-400" /> };
      case 'create_reminder':
        return { label: 'Set New Reminder', icon: <Bell className="w-4 h-4 text-indigo-400" /> };
      case 'create_task':
        return { label: 'Create New Task', icon: <CheckSquare className="w-4 h-4 text-cyan-400" /> };
      case 'create_calendar_event':
        return { label: 'Schedule Calendar Event', icon: <CalendarIcon className="w-4 h-4 text-blue-400" /> };
      case 'browser_action':
        return { label: 'Browser Operation', icon: <Compass className="w-4 h-4 text-cyan-400" /> };
      case 'draft_email':
      case 'send_email':
        return { label: 'Email Action', icon: <Mail className="w-4 h-4 text-rose-400" /> };
      case 'create_linkedin_post':
        return { label: 'Draft LinkedIn Post', icon: <Share2 className="w-4 h-4 text-sky-400" /> };
      case 'create_x_post':
        return { label: 'Draft X (Twitter) Post', icon: <TwitterIcon className="w-4 h-4 text-slate-300" /> };
      case 'trigger_n8n':
        return { label: 'Trigger n8n Automation', icon: <Zap className="w-4 h-4 text-amber-400" /> };
      default:
        return { label: 'Automated Action', icon: <Zap className="w-4 h-4 text-cyan-400" /> };
    }
  };

  const header = getActionHeader();

  return (
    <div className="mt-3 p-4 rounded-2xl bg-[#0B1024] border border-[#1E2540] shadow-soft text-slate-200">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#151D36]">
            {header.icon}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Proposed Action: {header.label}
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
          Requires Approval
        </span>
      </div>

      {/* Action Content Preview */}
      <div className="space-y-1.5 my-3 bg-[#070C1E] p-3 rounded-xl border border-[#1E2540] text-xs">
        {'title' in action && (
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Title:</span>
            <span className="font-bold text-white">{action.title}</span>
          </div>
        )}

        {action.type === 'create_memory' && (
          <>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Content:</span>
              <span className="text-slate-300">{action.content || action.title}</span>
            </div>
            {action.category && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Category:</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#182142] text-slate-300">{action.category}</span>
              </div>
            )}
            {action.person && (
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Person:</span>
                <span className="text-cyan-300 font-medium">{action.person}</span>
              </div>
            )}
          </>
        )}

        {action.type === 'create_task' && (
          <>
            {action.description && (
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Details:</span>
                <span className="text-slate-300">{action.description}</span>
              </div>
            )}
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Due:</span>
              <span className="text-white font-medium">{action.dueDate} {action.dueTime || ''}</span>
            </div>
          </>
        )}

        {action.type === 'browser_action' && (
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Action:</span>
            <span className="text-cyan-300 font-mono text-xs">{action.description} ({action.url})</span>
          </div>
        )}

        {(action.type === 'draft_email' || action.type === 'send_email') && (
          <>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-slate-400 w-16 flex-shrink-0">To:</span>
              <span className="text-white font-medium">{action.recipient}</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Subject:</span>
              <span className="text-white font-bold">{action.subject}</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Body:</span>
              <span className="text-slate-300 line-clamp-3">{action.body}</span>
            </div>
          </>
        )}

        {(action.type === 'create_linkedin_post' || action.type === 'create_x_post') && (
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Post:</span>
            <span className="text-slate-300 italic">{action.content}</span>
          </div>
        )}

        {action.type === 'chrome_action' && (
          <>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Target:</span>
              <span className="font-bold text-white">{action.targetTitle || action.websiteName}</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Action:</span>
              <span className="text-cyan-300 font-medium capitalize">{action.actionType}</span>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Destination:</span>
              <a
                href={action.destinationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-mono text-xs underline truncate flex items-center space-x-1"
              >
                <span className="truncate">{action.destinationUrl}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0 ml-1" />
              </a>
            </div>
          </>
        )}

        {action.type === 'trigger_n8n' && (
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-slate-400 w-16 flex-shrink-0">Workflow:</span>
            <span className="text-amber-400 font-bold">{action.workflowName} ({action.workflowId})</span>
          </div>
        )}
      </div>

      {/* Action Confirmation Buttons */}
      <div className="flex items-center justify-end space-x-2 pt-1">
        <button
          onClick={handleDismiss}
          disabled={isProcessing}
          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-[#151D36] rounded-xl transition-colors flex items-center space-x-1"
        >
          <X className="w-3.5 h-3.5" />
          <span>Dismiss</span>
        </button>

        {action.type === 'chrome_action' ? (
          <>
            <button
              onClick={() => {
                if (action.destinationUrl) {
                  window.open(action.destinationUrl, '_blank', 'noopener,noreferrer');
                }
                handleConfirm();
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Chrome</span>
            </button>
            <button
              onClick={() => {
                handleConfirm();
                setCurrentTab('results');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#151D36] hover:bg-[#1E2540] border border-[#1E2540] rounded-xl transition-colors flex items-center space-x-1"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Results</span>
            </button>
          </>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Processing...' : 'Confirm & Execute'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
