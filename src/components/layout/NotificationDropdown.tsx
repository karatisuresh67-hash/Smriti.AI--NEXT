import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  AlertCircle, 
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { notificationService } from '../../services/notificationService';
import { formatShortDate, formatTime12h, getRelativeDays } from '../../services/dateUtils';
import type { Reminder } from '../../types';

export function NotificationDropdown() {
  const { 
    reminders, 
    overdueReminders, 
    setCurrentTab, 
    updateReminder,
    addToast 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    return notificationService.getPermission();
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Periodic check for due reminders
  useEffect(() => {
    notificationService.checkDueReminders(reminders);
    const interval = setInterval(() => {
      notificationService.checkDueReminders(reminders);
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders]);

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      addToast('System notifications enabled! You will be alerted when reminders are due.', 'success');
      notificationService.sendNotification('Smriti AI Notifications Enabled', {
        body: 'You will receive timely alerts for your scheduled reminders.'
      });
    } else {
      addToast('Notification permission was not granted.', 'info');
    }
  };

  const handleQuickComplete = (reminder: Reminder, e: React.MouseEvent) => {
    e.stopPropagation();
    updateReminder(reminder.id, { status: 'completed' });
    addToast(`Marked "${reminder.title}" as completed`, 'success');
  };

  const handleQuickSnooze = (reminder: Reminder, e: React.MouseEvent) => {
    e.stopPropagation();
    const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const tomorrowStr =
  `${tomorrow.getFullYear()}-` +
  `${String(tomorrow.getMonth() + 1).padStart(2, '0')}-` +
  `${String(tomorrow.getDate()).padStart(2, '0')}`;
    updateReminder(reminder.id, { date: tomorrowStr, status: 'upcoming' });
    addToast(`Snoozed "${reminder.title}" to tomorrow`, 'info');
  };

  // Urgent / overdue items first, then upcoming
  const now = new Date();

const today =
  `${now.getFullYear()}-` +
  `${String(now.getMonth() + 1).padStart(2, '0')}-` +
  `${String(now.getDate()).padStart(2, '0')}`;

const currentTime =
  `${String(now.getHours()).padStart(2, '0')}:` +
  `${String(now.getMinutes()).padStart(2, '0')}`;

// All reminders that are not completed.
const activeReminders = reminders.filter(
  reminder => reminder.status !== 'completed'
);

// A reminder is overdue when its date has passed,
// or its scheduled time has passed today.
const overdueRemindersLocal = activeReminders.filter(reminder => {
  if (reminder.date < today) return true;

  if (reminder.date === today && reminder.time) {
    return reminder.time <= currentTime;
  }

  return false;
});

// Show overdue reminders first, followed by other active reminders.
const urgentReminders = [
  ...overdueRemindersLocal,
  ...activeReminders.filter(
    reminder =>
      !overdueRemindersLocal.some(
        overdue => overdue.id === reminder.id
      )
  )
];

const alertCount = overdueRemindersLocal.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications and reminders"
        className="relative p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {alertCount > 0 ? (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
            {alertCount}
          </span>
        ) : urgentReminders.length > 0 ? (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-violet-600 ring-2 ring-white" />
        ) : null}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-soft-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-bold text-navy-900">Notifications</h3>
              {alertCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold">
                  {alertCount} Due
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setCurrentTab('reminders');
              }}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Browser Permission Prompt Banner */}
          {notifPermission !== 'granted' && (
            <div className="p-3 bg-violet-50/70 border-b border-violet-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-violet-900">
                <ShieldCheck className="w-4 h-4 text-violet-600 flex-shrink-0" />
                <span className="font-medium">Enable desktop alerts?</span>
              </div>
              <button
                onClick={handleRequestPermission}
                className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-colors text-[11px]"
              >
                Enable
              </button>
            </div>
          )}

          {/* List of Active Reminders */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {activeReminders.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-navy-900">All caught up!</p>
                <p className="text-xs text-slate-500 mt-0.5">No overdue or pending reminders.</p>
              </div>
            ) : (
              urgentReminders.slice(0, 5).map((reminder) => {
                const isOverdue = overdueRemindersLocal.some(
  overdue => overdue.id === reminder.id
);

                return (
                  <div
                    key={reminder.id}
                    className={`p-3.5 hover:bg-slate-50 transition-colors ${
                      isOverdue ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {isOverdue && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                          )}
                          <h4 className="text-xs font-bold text-navy-900 truncate">
                            {reminder.title}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                          <span className={isOverdue ? 'font-semibold text-rose-600' : ''}>
                            {getRelativeDays(reminder.date)}
                          </span>
                          {reminder.time && (
                            <>
                              <span>•</span>
                              <span>{formatTime12h(reminder.time)}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="capitalize">{reminder.category}</span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          onClick={(e) => handleQuickSnooze(reminder, e)}
                          title="Snooze 1 day"
                          className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleQuickComplete(reminder, e)}
                          title="Mark complete"
                          className="p-1 rounded-lg hover:bg-emerald-100 text-slate-500 hover:text-emerald-700 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                setCurrentTab('reminders');
              }}
              className="text-xs font-semibold text-slate-600 hover:text-navy-900 transition-colors"
            >
              Manage all reminders & alerts →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
