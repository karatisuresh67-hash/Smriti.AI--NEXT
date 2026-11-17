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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <span>My Memories</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {memories.length} persistent knowledge item{memories.length === 1 ? '' : 's'} indexed in your AI vault.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all active:scale-95"
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
        <div className="bg-[#070C1E] rounded-3xl border border-[#1E2540] p-12 text-center shadow-xl max-w-lg mx-auto my-6 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {searchQuery || selectedCategory !== 'All'
              ? 'No matching memories found'
              : 'No memories saved yet'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try modifying your search keywords or switching category filters.'
              : 'Start by saving birthdays, important project notes, personal preferences, or life goals!'}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {searchQuery || selectedCategory !== 'All' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-[#0B1024] hover:bg-[#121A38] border border-[#1E2540] rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl transition-colors shadow-md"
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
