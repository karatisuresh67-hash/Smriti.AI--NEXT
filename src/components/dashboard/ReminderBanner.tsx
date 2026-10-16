import React from 'react';
import { AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function ReminderBanner() {
  const { overdueReminders, reminders, setCurrentTab } = useApp();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayReminders = reminders.filter(
    (r) => r.status === 'upcoming' && r.date === todayStr
  );

  if (overdueReminders.length === 0 && todayReminders.length === 0) {
    return null;
  }

  const isOverdue = overdueReminders.length > 0;

  return (
    <div
      className={`mb-6 p-4 rounded-2xl border shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isOverdue
          ? 'bg-gradient-to-r from-rose-50 to-orange-50 border-rose-200 text-rose-900'
          : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-900'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          className={`p-2 rounded-xl flex-shrink-0 ${
            isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isOverdue ? <AlertCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
        </div>
        <div>
          <h2 className="text-sm font-bold">
            {isOverdue
              ? `Attention: You have ${overdueReminders.length} overdue reminder${overdueReminders.length > 1 ? 's' : ''}!`
              : `You have ${todayReminders.length} reminder${todayReminders.length > 1 ? 's' : ''} scheduled for today.`}
          </h2>
          <p className="text-xs opacity-80 mt-0.5">
            {isOverdue
              ? `Latest: "${overdueReminders[0]?.title}" needs your attention.`
              : `Latest: "${todayReminders[0]?.title}" at ${todayReminders[0]?.time || 'today'}.`}
          </p>
        </div>
      </div>

      <button
        onClick={() => setCurrentTab('reminders')}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 self-end sm:self-auto transition-colors shadow-sm ${
          isOverdue
            ? 'bg-rose-600 hover:bg-rose-700 text-white'
            : 'bg-amber-600 hover:bg-amber-700 text-white'
        }`}
      >
        <span>Review Reminders</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
