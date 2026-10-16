import React from 'react';
import { Search, X } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Birthday',
  'People',
  'Personal Goal',
  'Important Event',
  'Preference',
  'Other',
];

interface MemoryFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export function MemoryFilter({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
}: MemoryFilterProps) {
  return (
    <div className="space-y-3 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <label htmlFor="memory-search" className="sr-only">Search memories</label>
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="memory-search"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search memories by title, person, or keywords..."
          className="w-full pl-10 pr-10 py-2.5 bg-white text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-sm placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            aria-label="Clear search query"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategorySelect(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-navy-950 text-white shadow-sm font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
