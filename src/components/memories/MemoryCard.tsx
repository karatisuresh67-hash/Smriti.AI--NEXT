import React from 'react';
import { Calendar, User, Edit3, Trash2 } from 'lucide-react';
import { CategoryBadge } from '../common/Badge';
import { formatShortDate } from '../../services/dateUtils';
import type { Memory } from '../../types';

interface MemoryCardProps {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
}

export function MemoryCard({ memory, onEdit, onDelete }: MemoryCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft hover:shadow-soft-lg transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={memory.category} />
            {memory.isDemo && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Demo
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(memory)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
              aria-label={`Edit ${memory.title}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(memory)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              aria-label={`Delete ${memory.title}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="text-base font-bold text-navy-900 mb-2 leading-snug">
          {memory.title}
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
          {memory.content}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-3">
          {memory.person && (
            <span className="flex items-center space-x-1 text-slate-600">
              <User className="w-3.5 h-3.5 text-violet-500" />
              <span className="font-medium">{memory.person}</span>
            </span>
          )}

          {memory.date && (
            <span className="flex items-center space-x-1 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-sky-500" />
              <span>{formatShortDate(memory.date)}</span>
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-400">
          Saved {formatShortDate(memory.createdAt)}
        </span>
      </div>
    </div>
  );
}
