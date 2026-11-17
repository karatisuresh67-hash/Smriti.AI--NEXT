import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Tag, 
  Sparkles,
  ArrowUpDown,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Task, TaskPriority, TaskStatus, TaskSource } from '../types';

export function TasksPage() {
  const { tasks, addTask, updateTask, toggleTaskStatus, deleteTask, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [category, setCategory] = useState('Personal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Calculate metrics
  const totalCount = tasks.length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const overdueCount = tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr).length;

  const handleOpenAdd = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setDueDate(todayStr);
    setDueTime('12:00');
    setPriority('Medium');
    setStatus('pending');
    setCategory('Personal');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate || '');
    setDueTime(task.dueTime || '');
    setPriority(task.priority);
    setStatus(task.status);
    setCategory(task.category || 'Personal');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Please enter a task title', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          priority,
          status,
          category,
        });
      } else {
        await addTask({
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          priority,
          status,
          category,
          source: 'manual',
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      // Toast already fired in context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const isOverdue = task.status !== 'completed' && task.dueDate && task.dueDate < todayStr;

    if (activeTab === 'pending' && task.status !== 'pending') return false;
    if (activeTab === 'in_progress' && task.status !== 'in_progress') return false;
    if (activeTab === 'completed' && task.status !== 'completed') return false;
    if (activeTab === 'overdue' && !isOverdue) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchCat = task.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;

    return true;
  });

  const categories = ['Personal', 'Work', 'Academic', 'Project', 'Health', 'Other'];

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'High':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'Low':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <CheckSquare className="w-4 h-4" />
            </div>
            Task Management
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            Organize, prioritize, and track your daily commitments across connected services.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#0B1024] border border-[#1E2540] flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Pending</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">{pendingCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B1024] border border-[#1E2540] flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">In Progress</p>
            <p className="text-xl sm:text-2xl font-bold text-cyan-400 mt-1">{inProgressCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <ArrowUpDown className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B1024] border border-[#1E2540] flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Completed</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">{completedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B1024] border border-[#1E2540] flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Overdue</p>
            <p className="text-xl sm:text-2xl font-bold text-rose-400 mt-1">{overdueCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0B1024] border border-[#1E2540] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, note, or category..."
              className="w-full pl-10 pr-4 py-2 bg-[#070C1E] border border-[#1E2540] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-[#070C1E] border border-[#1E2540] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 bg-[#070C1E] border border-[#1E2540] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-1 sm:space-x-2 border-t border-[#1E2540] pt-3 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-[#070C1E]'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'pending' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-[#070C1E]'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'in_progress' 
                ? 'bg-cyan-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-[#070C1E]'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'completed' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-[#070C1E]'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'overdue' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-[#070C1E]'
            }`}
          >
            Overdue ({overdueCount})
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0B1024] border border-[#1E2540]">
            <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No tasks found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'No tasks match your search filter.' : 'Your task list is clear! Click "New Task" or ask Smriti AI to schedule your next goal.'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
              >
                Create Task
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map(task => {
            const isCompleted = task.status === 'completed';
            const isOverdue = !isCompleted && task.dueDate && task.dueDate < todayStr;
            const isDueToday = !isCompleted && task.dueDate === todayStr;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isCompleted 
                    ? 'bg-[#080D21]/60 border-[#151D36] opacity-75' 
                    : isOverdue 
                    ? 'bg-[#150D1E]/80 border-rose-900/40' 
                    : 'bg-[#0B1024] border-[#1E2540] hover:border-[#2C3862]'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTaskStatus(task.id)}
                  aria-label={isCompleted ? "Mark pending" : "Mark completed"}
                  className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 hover:text-cyan-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-sm font-semibold tracking-tight ${
                      isCompleted ? 'line-through text-slate-500' : 'text-white'
                    }`}>
                      {task.title}
                    </h3>

                    {/* Priority Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>

                    {/* Category Tag */}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#182142] text-slate-300 border border-[#233160]">
                      {task.category}
                    </span>

                    {/* Source Tag if automated */}
                    {task.source && task.source !== 'manual' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                        via {task.source}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Date and Time Footer */}
                  <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400">
                    {task.dueDate && (
                      <div className={`flex items-center space-x-1 font-medium ${
                        isOverdue ? 'text-rose-400' : isDueToday ? 'text-cyan-400' : 'text-slate-400'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {isDueToday ? 'Today' : isOverdue ? `Overdue (${task.dueDate})` : task.dueDate}
                        </span>
                      </div>
                    )}
                    {task.dueTime && (
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{task.dueTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151D36] transition-colors"
                    title="Edit task"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#151D36] transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Modal (Create & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#0B1024] border border-[#1E2540] shadow-2xl p-6 text-white relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2540]">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
                <span>{editingTask ? 'Edit Task' : 'Create New Task'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151D36]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Submit quarterly progress report"
                  className="w-full px-3.5 py-2.5 bg-[#070C1E] border border-[#1E2540] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, links, or sub-tasks..."
                  className="w-full px-3.5 py-2 bg-[#070C1E] border border-[#1E2540] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070C1E] border border-[#1E2540] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070C1E] border border-[#1E2540] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-[#070C1E] border border-[#1E2540] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070C1E] border border-[#1E2540] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#1E2540]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#151D36] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
