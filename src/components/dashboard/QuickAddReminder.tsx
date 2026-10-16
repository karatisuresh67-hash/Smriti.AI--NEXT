import React, { useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ReminderPriority, ReminderCategory } from '../../types';

export function QuickAddReminder() {
  const { addReminder } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [time, setTime] = useState('09:00');
  const [priority, setPriority] = useState<ReminderPriority>('Medium');
  const [category, setCategory] = useState<ReminderCategory>('Personal');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    addReminder({
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      priority,
      category,
      status: 'upcoming',
    });

    // Reset
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setIsExpanded(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
            <Bell className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-navy-900">Quick Add Reminder</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-sky-600 font-semibold hover:text-sky-700"
        >
          {isExpanded ? 'Collapse' : 'Expand Form'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="quick-rem-title" className="sr-only">Reminder Title</label>
          <input
            id="quick-rem-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Set a reminder... (e.g. Call dentist tomorrow at 10 AM)"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder:text-slate-400"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="quick-rem-date" className="block text-xs font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              id="quick-rem-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label htmlFor="quick-rem-time" className="block text-xs font-medium text-slate-700 mb-1">
              Time
            </label>
            <input
              id="quick-rem-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-150">
            <div>
              <label htmlFor="quick-rem-desc" className="block text-xs font-medium text-slate-700 mb-1">
                Description / Notes:
              </label>
              <textarea
                id="quick-rem-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details or checklist..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="quick-rem-priority" className="block text-xs font-medium text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  id="quick-rem-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ReminderPriority)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label htmlFor="quick-rem-cat" className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  id="quick-rem-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReminderCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Personal">Personal</option>
                  <option value="Academic">Academic</option>
                  <option value="Work">Work</option>
                  <option value="Project">Project</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!title.trim() || !date}
            className="flex items-center space-x-1.5 px-4 py-2 bg-navy-950 hover:bg-navy-900 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Reminder</span>
          </button>
        </div>
      </form>
    </div>
  );
}
