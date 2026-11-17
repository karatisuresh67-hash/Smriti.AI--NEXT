import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Plus, 
  AlertCircle, 
  Inbox
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReminderCard } from '../components/reminders/ReminderCard';
import { ReminderFormModal } from '../components/reminders/ReminderFormModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import type { Reminder } from '../types';

export function RemindersPage() {
  const { 
    reminders, 
    addReminder, 
    updateReminder, 
    deleteReminder, 
    overdueReminders
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [sortOrder, setSortOrder] = useState<'date-asc' | 'date-desc' | 'priority'>('date-asc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deletingReminder, setDeletingReminder] = useState<Reminder | null>(null);

  // Filter and sort reminders
  const processedReminders = useMemo(() => {
    const list = reminders.filter((r) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'upcoming') return r.status === 'upcoming';
      if (statusFilter === 'overdue') return r.status === 'overdue';
      if (statusFilter === 'completed') return r.status === 'completed';
      return true;
    });

    return list.sort((a, b) => {
      if (sortOrder === 'priority') {
        const priorityScore: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        return (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
      }
      const timeA = new Date(`${a.date || '9999-12-31'}T${a.time || '00:00'}:00`).getTime();
      const timeB = new Date(`${b.date || '9999-12-31'}T${b.time || '00:00'}:00`).getTime();
      return sortOrder === 'date-asc' ? timeA - timeB : timeB - timeA;
    });
  }, [reminders, statusFilter, sortOrder]);

  const counts = {
    all: reminders.length,
    upcoming: reminders.filter(r => r.status === 'upcoming').length,
    overdue: overdueReminders.length,
    completed: reminders.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bell className="w-5 h-5" />
            </div>
            <span>Reminders</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Keep track of deadlines, notifications, and scheduled alerts.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Overdue alert banner if any */}
      {overdueReminders.length > 0 && statusFilter !== 'overdue' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between shadow-soft">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              You have {overdueReminders.length} overdue reminder{overdueReminders.length > 1 ? 's' : ''}!
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('overdue')}
            className="text-xs font-bold text-rose-400 underline hover:text-rose-300"
          >
            Show Overdue Only
          </button>
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B1024] p-3.5 rounded-2xl border border-[#1E2540]">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'upcoming'
                ? 'bg-sky-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upcoming ({counts.upcoming})
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'overdue'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overdue ({counts.overdue})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({counts.completed})
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-2 self-end sm:self-auto text-xs">
          <span className="text-slate-400 font-medium">Sort:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl border border-[#1E2540] bg-[#070C1E] text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="date-asc">Date (Earliest First)</option>
            <option value="date-desc">Date (Latest First)</option>
            <option value="priority">Priority (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Reminders List */}
      {processedReminders.length === 0 ? (
        <div className="bg-[#070C1E] rounded-3xl border border-[#1E2540] p-12 text-center shadow-xl max-w-lg mx-auto my-6 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-2">
            <Inbox className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {statusFilter !== 'all' ? `No ${statusFilter} reminders` : 'No reminders set yet'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {statusFilter !== 'all'
              ? 'Try changing your filter selection above or create a new reminder.'
              : 'Add deadlines, meetings, or alerts to receive timely notifications.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-xl transition-colors shadow-md"
            >
              Set First Reminder
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {processedReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={(r) => setEditingReminder(r)}
              onDelete={(r) => setDeletingReminder(r)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <ReminderFormModal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={addReminder}
        />
      )}

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
          message={`Are you sure you want to delete "${deletingReminder.title}"?`}
          confirmText="Delete"
          onConfirm={() => deleteReminder(deletingReminder.id)}
        />
      )}
    </div>
  );
}
