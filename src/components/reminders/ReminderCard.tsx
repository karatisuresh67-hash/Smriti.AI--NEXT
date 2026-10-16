import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle, 
  Edit3, 
  Trash2, 
  Link as LinkIcon, 
  AlertTriangle,
  RotateCcw,
  Repeat
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { formatShortDate, formatTime12h, getRelativeDays } from '../../services/dateUtils';
import { useApp } from '../../context/AppContext';
import type { Reminder } from '../../types';

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
}

export function ReminderCard({ reminder, onEdit, onDelete }: ReminderCardProps) {
  const { toggleReminder, updateReminder, memories } = useApp();
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

  const isCompleted = reminder.status === 'completed';
  const isOverdue = reminder.status === 'overdue';

  // Check if linked to a memory
  const linkedMemory = reminder.linkedMemoryId 
    ? memories.find(m => m.id === reminder.linkedMemoryId)
    : null;

  const relativeText = getRelativeDays(reminder.date);

  const handleSnooze = (days: number) => {
    const current = new Date(`${reminder.date}T${reminder.time || '09:00'}:00`);
    current.setDate(current.getDate() + days);
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDate = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;

    updateReminder(reminder.id, {
      date: newDate,
      status: 'upcoming',
      snoozeUntil: current.toISOString(),
    });
    setShowSnoozeMenu(false);
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-all shadow-soft hover:shadow-soft-lg flex flex-col justify-between group ${
        isCompleted
          ? 'bg-slate-50/80 border-slate-200 opacity-75'
          : isOverdue
          ? 'bg-rose-50/40 border-rose-200'
          : 'bg-white border-slate-100'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Complete Checkbox Toggle */}
            <button
              onClick={() => toggleReminder(reminder.id)}
              aria-label={isCompleted ? `Mark ${reminder.title} as incomplete` : `Mark ${reminder.title} as completed`}
              className="flex-shrink-0 text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <Circle className="w-5 h-5 hover:text-slate-600" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <h3
                className={`text-base font-bold text-navy-900 leading-snug break-words ${
                  isCompleted ? 'line-through text-slate-400' : ''
                }`}
              >
                {reminder.title}
              </h3>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 relative">
            {/* Snooze Button */}
            {!isCompleted && (
              <div className="relative">
                <button
                  onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                  aria-label="Snooze reminder"
                  title="Snooze reminder"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {showSnoozeMenu && (
                  <div className="absolute right-0 top-8 z-30 bg-white border border-slate-200 shadow-soft-lg rounded-xl p-1.5 w-36 text-xs animate-in fade-in">
                    <button
                      onClick={() => handleSnooze(1)}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700"
                    >
                      Snooze 1 Day
                    </button>
                    <button
                      onClick={() => handleSnooze(2)}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700"
                    >
                      Snooze 2 Days
                    </button>
                    <button
                      onClick={() => handleSnooze(7)}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700"
                    >
                      Snooze 1 Week
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => onEdit(reminder)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
              aria-label={`Edit ${reminder.title}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(reminder)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              aria-label={`Delete ${reminder.title}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {reminder.description && (
          <p className={`text-sm mb-3 pl-8 leading-relaxed ${isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
            {reminder.description}
          </p>
        )}

        {/* Linked memory and recurrence badges */}
        <div className="flex flex-wrap items-center gap-2 ml-8 mb-3">
          {linkedMemory && (
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs border border-violet-100">
              <LinkIcon className="w-3 h-3 text-violet-500" />
              <span className="truncate max-w-xs">Linked: {linkedMemory.title}</span>
            </div>
          )}

          {reminder.recurrence && reminder.recurrence !== 'none' && (
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs border border-sky-100">
              <Repeat className="w-3 h-3 text-sky-500" />
              <span className="capitalize">{reminder.recurrence}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer metadata */}
      <div className="mt-3 pt-3 border-t border-slate-100 pl-8 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1 font-medium">
            <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-600' : 'text-slate-400'}`} />
            <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
              {formatShortDate(reminder.date)}
              {relativeText && ` (${relativeText})`}
            </span>
          </div>

          {reminder.time && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatTime12h(reminder.time)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <PriorityBadge priority={reminder.priority} />
          <StatusBadge status={reminder.status} />
        </div>
      </div>
    </div>
  );
}
