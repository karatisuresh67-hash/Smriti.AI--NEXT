import React, { useState } from 'react';
import { 
  Brain, 
  Bell, 
  Calendar, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Mic,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/dashboard/MetricCard';
import { ReminderBanner } from '../components/dashboard/ReminderBanner';
import { QuickAddMemory } from '../components/dashboard/QuickAddMemory';
import { QuickAddReminder } from '../components/dashboard/QuickAddReminder';
import { ActivityList } from '../components/dashboard/ActivityList';
import { ReminderCard } from '../components/reminders/ReminderCard';
import { ReminderFormModal } from '../components/reminders/ReminderFormModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { getGreeting, formatCurrentDate } from '../services/dateUtils';
import type { Reminder } from '../types';

export function DashboardPage() {
  const { 
    settings, 
    memories, 
    reminders, 
    overdueReminders, 
    setCurrentTab,
    updateReminder,
    deleteReminder
  } = useApp();

  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deletingReminder, setDeletingReminder] = useState<Reminder | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayReminders = reminders.filter(r => r.status === 'upcoming' && r.date === todayStr);
  const upcomingReminders = reminders.filter(r => r.status === 'upcoming' && r.date > todayStr);

  const suggestedPrompts = [
    "When is Rahul's birthday?",
    "Remind me two days before Rahul's birthday",
    "Show my upcoming reminders",
    "What is my coffee preference?",
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            {getGreeting()}, {settings.displayName || 'Suresh'} 👋
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            {formatCurrentDate()} • Smriti AI is active and ready
          </p>
        </div>
      </div>

      {/* Due / Overdue Banner */}
      <ReminderBanner />

      {/* Prominent "Ask Smriti" Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-indigo-950 text-white shadow-soft-lg relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-20 -bottom-8 w-36 h-36 bg-sky-500/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
              <span>Personal AI Assistant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Ask Smriti Anything About Your Memories
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Smriti AI remembers your personal facts, dates, preferences, and contacts, and can intelligently schedule reminders for you.
            </p>

            {/* Quick Prompt Pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTab('chat')}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium border border-white/10 transition-colors"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => setCurrentTab('voice')}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm"
            >
              <Mic className="w-4 h-4 text-violet-300" />
              <span>Voice Assistant</span>
            </button>
            <button
              onClick={() => setCurrentTab('chat')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <span>Ask Smriti</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Saved Memories"
          count={memories.length}
          subtitle="facts & notes"
          icon={Brain}
          color="violet"
          onClick={() => setCurrentTab('memories')}
        />
        <MetricCard
          title="Due Today"
          count={todayReminders.length}
          subtitle="scheduled tasks"
          icon={Calendar}
          color="blue"
          onClick={() => setCurrentTab('reminders')}
        />
        <MetricCard
          title="Upcoming"
          count={upcomingReminders.length}
          subtitle="future dates"
          icon={Clock}
          color="emerald"
          onClick={() => setCurrentTab('reminders')}
        />
        <MetricCard
          title="Overdue"
          count={overdueReminders.length}
          subtitle={overdueReminders.length > 0 ? "needs attention" : "all on time"}
          icon={AlertCircle}
          color="rose"
          onClick={() => setCurrentTab('reminders')}
        />
      </div>

      {/* Quick Add Forms Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <QuickAddMemory />
        <QuickAddReminder />
      </div>

      {/* Today's & Upcoming Reminders Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-navy-900">
                Active & Upcoming Reminders
              </h2>
            </div>
            <button
              onClick={() => setCurrentTab('reminders')}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {reminders.filter(r => r.status !== 'completed').length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm shadow-soft">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-navy-900">All clear!</p>
              <p className="text-xs text-slate-500 mt-1">You have no pending reminders right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders
                .filter(r => r.status !== 'completed')
                .slice(0, 4)
                .map(reminder => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onEdit={(r) => setEditingReminder(r)}
                    onDelete={(r) => setDeletingReminder(r)}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Recent Activity Column */}
        <div>
          <ActivityList />
        </div>
      </div>

      {/* Modals */}
      {editingReminder && (
        <ReminderFormModal
          isOpen={true}
          onClose={() => setEditingReminder(null)}
          reminder={editingReminder}
          onSave={(data) => updateReminder(editingReminder.id, data)}
        />
      )}

      {deletingReminder && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingReminder(null)}
          title="Delete Reminder?"
          message={`Are you sure you want to remove the reminder "${deletingReminder.title}"?`}
          confirmText="Delete"
          onConfirm={() => deleteReminder(deletingReminder.id)}
        />
      )}
    </div>
  );
}
