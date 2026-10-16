import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import type { Reminder, ReminderPriority, ReminderCategory, ReminderRecurrence } from '../../types';

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  reminder?: Reminder | null;
}

export function ReminderFormModal({ isOpen, onClose, onSave, reminder = null }: ReminderFormModalProps) {
  const { memories } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [priority, setPriority] = useState<ReminderPriority>('Medium');
  const [category, setCategory] = useState<ReminderCategory>('Personal');
  const [linkedMemoryId, setLinkedMemoryId] = useState('');
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>('none');

  const isEditing = Boolean(reminder);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title || '');
      setDescription(reminder.description || '');
      setDate(reminder.date || '');
      setTime(reminder.time || '09:00');
      setPriority(reminder.priority || 'Medium');
      setCategory((reminder.category as ReminderCategory) || 'Personal');
      setLinkedMemoryId(reminder.linkedMemoryId || '');
      setRecurrence(reminder.recurrence || 'none');
    } else {
      setTitle('');
      setDescription('');
      setDate(new Date().toISOString().slice(0, 10));
      setTime('09:00');
      setPriority('Medium');
      setCategory('Personal');
      setLinkedMemoryId('');
      setRecurrence('none');
    }
  }, [reminder, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      priority,
      category,
      linkedMemoryId: linkedMemoryId || null,
      recurrence,
      status: reminder ? reminder.status : 'upcoming',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Reminder' : 'Set New Reminder'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rem-modal-title" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Reminder Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="rem-modal-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Call professor tomorrow at 9 AM"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="rem-modal-desc" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Notes / Details
          </label>
          <textarea
            id="rem-modal-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details, checklist, or preparation notes..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rem-modal-date" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              id="rem-modal-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label htmlFor="rem-modal-time" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Time
            </label>
            <input
              id="rem-modal-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="rem-modal-priority" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Priority
            </label>
            <select
              id="rem-modal-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ReminderPriority)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="rem-modal-cat" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Category
            </label>
            <select
              id="rem-modal-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as ReminderCategory)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="Personal">Personal</option>
              <option value="Academic">Academic</option>
              <option value="Work">Work</option>
              <option value="Project">Project</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="rem-modal-recurrence" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Recurrence
            </label>
            <select
              id="rem-modal-recurrence"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as ReminderRecurrence)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="none">Does Not Repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Optional Link to a saved memory */}
        <div>
          <label htmlFor="rem-modal-linked" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Link to Saved Memory (Optional)
          </label>
          <select
            id="rem-modal-linked"
            value={linkedMemoryId}
            onChange={(e) => setLinkedMemoryId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">-- No linked memory --</option>
            {memories.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.category})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex justify-end space-x-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !date}
            className="px-5 py-2 text-sm font-semibold text-white bg-navy-950 hover:bg-navy-900 disabled:opacity-40 rounded-xl shadow-soft transition-all"
          >
            {isEditing ? 'Save Changes' : 'Set Reminder'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
