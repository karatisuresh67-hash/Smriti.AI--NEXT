import React, { useState, useMemo } from 'react';
import { Brain, Plus, FolderOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MemoryCard } from '../components/memories/MemoryCard';
import { MemoryFilter } from '../components/memories/MemoryFilter';
import { MemoryFormModal } from '../components/memories/MemoryFormModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import type { Memory } from '../types';

export function MemoriesPage() {
  const { memories, addMemory, updateMemory, deleteMemory } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [deletingMemory, setDeletingMemory] = useState<Memory | null>(null);

  // Filter memories based on search query and category
  const filteredMemories = useMemo(() => {
    return memories.filter((mem) => {
      const matchesCategory =
        selectedCategory === 'All' || mem.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (mem.title && mem.title.toLowerCase().includes(q)) ||
        (mem.content && mem.content.toLowerCase().includes(q)) ||
        (mem.person && mem.person.toLowerCase().includes(q)) ||
        (mem.category && mem.category.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [memories, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight flex items-center gap-2.5">
            <Brain className="w-7 h-7 text-violet-600" />
            My Memories
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            {memories.length} total saved knowledge item{memories.length === 1 ? '' : 's'} in your personal store
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-soft transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Memory</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <MemoryFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Memories Grid or Empty State */}
      {filteredMemories.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-soft max-w-lg mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-navy-900">
            {searchQuery || selectedCategory !== 'All'
              ? 'No matching memories found'
              : 'No memories saved yet'}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try modifying your search keywords or switching category filters.'
              : 'Start by saving your friends’ birthdays, important office hours, personal preferences, or life goals!'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {searchQuery || selectedCategory !== 'All' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors"
              >
                Create First Memory
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onEdit={(m) => setEditingMemory(m)}
              onDelete={(m) => setDeletingMemory(m)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <MemoryFormModal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={addMemory}
        />
      )}

      {editingMemory && (
        <MemoryFormModal
          isOpen={true}
          onClose={() => setEditingMemory(null)}
          memory={editingMemory}
          onSave={(data) => updateMemory(editingMemory.id, data)}
        />
      )}

      {deletingMemory && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingMemory(null)}
          title="Delete Memory?"
          message={`Are you sure you want to delete "${deletingMemory.title}"?`}
          confirmText="Delete"
          onConfirm={() => deleteMemory(deletingMemory.id)}
        />
      )}
    </div>
  );
}
