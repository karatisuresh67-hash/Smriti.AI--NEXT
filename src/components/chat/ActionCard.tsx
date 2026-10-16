import React, { useState } from 'react';
import { Brain, Bell, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatShortDate, formatTime12h } from '../../services/dateUtils';
import { CategoryBadge, PriorityBadge } from '../common/Badge';
import type { ProposedAction } from '../../types';

interface ActionCardProps {
  action?: ProposedAction | null;
  onActionExecuted?: () => void;
}

export function ActionCard({ action, onActionExecuted }: ActionCardProps) {
  const { addMemory, addReminder } = useApp();
  const [status, setStatus] = useState<'pending' | 'saved' | 'dismissed'>('pending');

  if (!action || status === 'dismissed') return null;

  const isMemory = action.type === 'create_memory';
  const isReminder = action.type === 'create_reminder';

  const handleConfirm = () => {
    try {
      if (isMemory && action.type === 'create_memory') {
        addMemory({
          title: action.title,
          content: action.content || action.title,
          category: action.category || 'Other',
          date: action.date || '',
          person: action.person || '',
        });
      } else if (isReminder && action.type === 'create_reminder') {
        addReminder({
          title: action.title,
          description: action.description || '',
          date: action.date || new Date().toISOString().slice(0, 10),
          time: action.time || '09:00',
          category: action.category || 'Personal',
          priority: action.priority || 'Medium',
          linkedMemoryId: action.linkedMemoryId || null,
        });
      }
      setStatus('saved');
      if (onActionExecuted) onActionExecuted();
    } catch (err) {
      console.error('Failed to execute proposed action', err);
    }
  };

  const handleDismiss = () => {
    setStatus('dismissed');
  };

  if (status === 'saved') {
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span className="font-semibold">
          {isMemory ? 'Memory saved to your records!' : 'Reminder added to your schedule!'}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-2xl bg-white border-2 border-violet-200 shadow-soft text-slate-800">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
            {isMemory ? <Brain className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-violet-900">
            Proposed Action: {isMemory ? 'Save New Memory' : 'Set New Reminder'}
          </span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
          Requires Confirmation
        </span>
      </div>

      {/* Action Content Preview */}
      <div className="space-y-1.5 my-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
        <div className="flex items-baseline space-x-2">
          <span className="font-semibold text-slate-500 w-16 flex-shrink-0">Title:</span>
          <span className="font-bold text-navy-900">{action.title}</span>
        </div>

        {isMemory && action.type === 'create_memory' && (
          <>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-slate-500 w-16 flex-shrink-0">Content:</span>
              <span className="text-slate-700">{action.content || action.title}</span>
            </div>
            {action.category && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-500 w-16 flex-shrink-0">Category:</span>
                <CategoryBadge category={action.category} />
              </div>
            )}
            {action.person && (
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold text-slate-500 w-16 flex-shrink-0">Person:</span>
                <span className="text-slate-700 font-medium">{action.person}</span>
              </div>
            )}
            {action.date && (
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold text-slate-500 w-16 flex-shrink-0">Date:</span>
                <span className="text-slate-700 font-medium">{formatShortDate(action.date)}</span>
              </div>
            )}
          </>
        )}

        {isReminder && action.type === 'create_reminder' && (
          <>
            {action.description && (
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold text-slate-500 w-16 flex-shrink-0">Details:</span>
                <span className="text-slate-700">{action.description}</span>
              </div>
            )}
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-slate-500 w-16 flex-shrink-0">Scheduled:</span>
              <span className="text-slate-700 font-medium">
                {formatShortDate(action.date)} {action.time ? `at ${formatTime12h(action.time)}` : ''}
              </span>
            </div>
            {action.priority && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-500 w-16 flex-shrink-0">Priority:</span>
                <PriorityBadge priority={action.priority} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Confirmation Buttons */}
      <div className="flex items-center justify-end space-x-2 pt-1">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-1"
        >
          <X className="w-3.5 h-3.5" />
          <span>Dismiss</span>
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg shadow-sm transition-all flex items-center space-x-1.5 active:scale-95"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Confirm & Save</span>
        </button>
      </div>
    </div>
  );
}
