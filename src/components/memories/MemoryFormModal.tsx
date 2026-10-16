import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import type { Memory, MemoryCategory } from '../../types';

interface MemoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  memory?: Memory | null;
}

export function MemoryFormModal({ isOpen, onClose, onSave, memory = null }: MemoryFormModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('Birthday');
  const [date, setDate] = useState('');
  const [person, setPerson] = useState('');

  const isEditing = Boolean(memory);

  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setContent(memory.content || '');
      setCategory((memory.category as MemoryCategory) || 'Birthday');
      setDate(memory.date || '');
      setPerson(memory.person || '');
    } else {
      setTitle('');
      setContent('');
      setCategory('Birthday');
      setDate('');
      setPerson('');
    }
  }, [memory, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      content: content.trim() || title.trim(),
      category,
      date,
      person: person.trim(),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Memory' : 'Create New Memory'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="mem-modal-title" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="mem-modal-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Rahul's Birthday, Mom's Favorite Flowers"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="mem-modal-content" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Details & Information <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="mem-modal-content"
            rows={3}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write down the details, preferences, dates, or stories you want Smriti to remember..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="mem-modal-category" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Category
            </label>
            <select
              id="mem-modal-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as MemoryCategory)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="Birthday">Birthday</option>
              <option value="People">People</option>
              <option value="Personal Goal">Personal Goal</option>
              <option value="Important Event">Important Event</option>
              <option value="Preference">Preference</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="mem-modal-date" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Date (Optional)
            </label>
            <input
              id="mem-modal-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label htmlFor="mem-modal-person" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Person (Optional)
            </label>
            <input
              id="mem-modal-person"
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="e.g. Rahul, Dr. Rao"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
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
            disabled={!title.trim()}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 rounded-xl shadow-soft transition-all"
          >
            {isEditing ? 'Save Changes' : 'Create Memory'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
