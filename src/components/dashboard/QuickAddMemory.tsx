import React, { useState } from 'react';
import { Brain, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { MemoryCategory } from '../../types';

export function QuickAddMemory() {
  const { addMemory } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('Important Event');
  const [date, setDate] = useState('');
  const [person, setPerson] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addMemory({
      title: title.trim(),
      content: content.trim() || title.trim(),
      category,
      date,
      person: person.trim(),
    });

    // Reset form
    setTitle('');
    setContent('');
    setCategory('Important Event');
    setDate('');
    setPerson('');
    setIsExpanded(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
            <Brain className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-navy-900">Quick Add Memory</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-violet-600 font-semibold hover:text-violet-700"
        >
          {isExpanded ? 'Collapse' : 'Expand Form'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="quick-mem-title" className="sr-only">Memory Title</label>
          <input
            id="quick-mem-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Remember something... (e.g. Maya loves matcha lattes)"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-slate-400"
            required
          />
        </div>

        {isExpanded && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-150">
            <div>
              <label htmlFor="quick-mem-content" className="block text-xs font-medium text-slate-700 mb-1">
                Detailed notes or context:
              </label>
              <textarea
                id="quick-mem-content"
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Additional details, reasons, or memorable context..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="quick-mem-category" className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  id="quick-mem-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MemoryCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                <label htmlFor="quick-mem-date" className="block text-xs font-medium text-slate-700 mb-1">
                  Date (optional)
                </label>
                <input
                  id="quick-mem-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label htmlFor="quick-mem-person" className="block text-xs font-medium text-slate-700 mb-1">
                  Person (optional)
                </label>
                <input
                  id="quick-mem-person"
                  type="text"
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-navy-950 hover:bg-navy-900 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Memory</span>
          </button>
        </div>
      </form>
    </div>
  );
}
