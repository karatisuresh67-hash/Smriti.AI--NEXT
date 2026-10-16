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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-sky-600" />
            Reminders
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Keep track of tasks, appointments, and event alerts
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-navy-950 hover:bg-navy-900 text-white font-bold text-sm rounded-xl shadow-soft transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Overdue alert banner if any */}
      {overdueReminders.length > 0 && statusFilter !== 'overdue' && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between shadow-soft">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              You have {overdueReminders.length} overdue reminder{overdueReminders.length > 1 ? 's' : ''}!
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('overdue')}
            className="text-xs font-bold text-rose-700 underline hover:text-rose-900"
          >
            Show Overdue Only
          </button>
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-navy-950 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'upcoming'
                ? 'bg-sky-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Upcoming ({counts.upcoming})
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'overdue'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Overdue ({counts.overdue})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
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
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="date-asc">Date (Earliest First)</option>
            <option value="date-desc">Date (Latest First)</option>
            <option value="priority">Priority (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Reminders List */}
      {processedReminders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-soft max-w-lg mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-navy-900">
            {statusFilter !== 'all' ? `No ${statusFilter} reminders` : 'No reminders set yet'}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed">
            {statusFilter !== 'all'
              ? 'Try changing your filter selection above or create a new reminder.'
              : 'Add tasks, meetings, calls, or deadlines to receive timely notifications.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-navy-950 hover:bg-navy-900 rounded-xl transition-colors"
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
