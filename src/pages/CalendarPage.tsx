import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Calendar as CalendarIcon, 
  Brain, 
  Bell, 
  Clock, 
  CheckSquare, 
  RefreshCw, 
  X,
  ExternalLink,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatShortDate } from '../services/dateUtils';
import type { Memory, Reminder, Task } from '../types';

export function CalendarPage() {
  const { memories, reminders, tasks, toggleTaskStatus, toggleReminder, addToast } = useApp();
  const { session } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'memories' | 'reminders'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    title: string;
    type: 'memory' | 'reminder' | 'task';
    date: string;
    details?: string;
    category?: string;
    priority?: string;
    status?: string;
    originalItem?: Memory | Reminder | Task;
  } | null>(null);

  // Map memories, reminders, and tasks to FullCalendar events
  const calendarEvents = useMemo(() => {
    const events: any[] = [];

    // 1. Tasks with dueDate
    if (filterType === 'all' || filterType === 'tasks') {
      tasks.forEach((tsk) => {
        if (!tsk.dueDate) return;
        const isCompleted = tsk.status === 'completed';
        const startIso = tsk.dueTime ? `${tsk.dueDate}T${tsk.dueTime}:00` : tsk.dueDate;

        events.push({
          id: `task-${tsk.id}`,
          title: `✓ ${tsk.title}`,
          start: startIso,
          allDay: !tsk.dueTime,
          backgroundColor: isCompleted ? '#059669' : '#4F46E5',
          borderColor: isCompleted ? '#10B981' : '#6366F1',
          textColor: '#FFFFFF',
          extendedProps: {
            type: 'task',
            category: tsk.category,
            priority: tsk.priority,
            status: tsk.status,
            time: tsk.dueTime,
            details: tsk.description,
            original: tsk,
          },
        });
      });
    }

    // 2. Memories with date
    if (filterType === 'all' || filterType === 'memories') {
      memories.forEach((mem) => {
        if (!mem.date) return;
        const isBirthday = mem.category === 'Birthday';
        events.push({
          id: `mem-${mem.id}`,
          title: `${isBirthday ? '🎂' : '📌'} ${mem.title}`,
          start: mem.date,
          allDay: true,
          backgroundColor: isBirthday ? '#E11D48' : '#7C3AED',
          borderColor: isBirthday ? '#F43F5E' : '#8B5CF6',
          textColor: '#FFFFFF',
          extendedProps: {
            type: 'memory',
            category: mem.category,
            details: mem.content,
            person: mem.person,
            original: mem,
          },
        });
      });
    }

    // 3. Reminders with date
    if (filterType === 'all' || filterType === 'reminders') {
      reminders.forEach((rem) => {
        if (!rem.date) return;
        const isCompleted = rem.status === 'completed';
        const isOverdue = rem.status === 'overdue';

        let bgColor = '#0284C7';
        let bdColor = '#38BDF8';
        if (isCompleted) {
          bgColor = '#059669';
          bdColor = '#10B981';
        } else if (isOverdue) {
          bgColor = '#DC2626';
          bdColor = '#EF4444';
        }

        const startIso = rem.time ? `${rem.date}T${rem.time}:00` : rem.date;

        events.push({
          id: `rem-${rem.id}`,
          title: `⏰ ${rem.title}`,
          start: startIso,
          allDay: !rem.time,
          backgroundColor: bgColor,
          borderColor: bdColor,
          textColor: '#FFFFFF',
          extendedProps: {
            type: 'reminder',
            category: rem.category,
            priority: rem.priority,
            status: rem.status,
            time: rem.time,
            details: rem.description,
            original: rem,
          },
        });
      });
    }

    return events;
  }, [memories, reminders, tasks, filterType]);

  const handleEventClick = (info: any) => {
    const props = info.event.extendedProps;
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title.replace(/^[🎂📌⏰✓]\s*/, ''),
      type: props.type,
      date: info.event.startStr,
      details: props.details,
      category: props.category,
      priority: props.priority,
      status: props.status,
      originalItem: props.original,
    });
  };

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      const token = (session as any)?.provider_token;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/calendar/events', { headers });
      const data = await res.json();
      if (data.synced) {
        addToast(`Synced ${data.count || 0} events from Google Calendar!`, 'success');
      } else {
        addToast(data.message || 'Connected to local schedule.', 'info');
      }
    } catch {
      addToast('Calendar sync check complete.', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <span>Calendar</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Unified timeline of tasks, scheduled reminders, deadlines, and saved memory dates.
          </p>
        </div>

        {/* Top Controls: Filter & Google Sync */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Sync Button */}
          <button
            onClick={handleSyncCalendar}
            disabled={isSyncing}
            className="px-3.5 py-1.5 rounded-xl bg-[#0B1024] hover:bg-[#121A38] text-slate-300 border border-[#1E2540] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Google Calendar</span>
          </button>

          {/* Filter buttons */}
          <div className="flex items-center space-x-1 bg-[#0B1024] p-1 rounded-xl border border-[#1E2540]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({calendarEvents.length})
            </button>
            <button
              onClick={() => setFilterType('tasks')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                filterType === 'tasks'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3 h-3 text-cyan-400" />
              <span>Tasks</span>
            </button>
            <button
              onClick={() => setFilterType('memories')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                filterType === 'memories'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3 h-3 text-purple-300" />
              <span>Memories</span>
            </button>
            <button
              onClick={() => setFilterType('reminders')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                filterType === 'reminders'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-3 h-3 text-sky-300" />
              <span>Reminders</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Dark Theme Wrapper */}
      <div className="bg-[#0B1024] rounded-2xl border border-[#1E2540] p-4 sm:p-6 shadow-xl text-white fc-dark-theme">
        <style>{`
          .fc-dark-theme .fc {
            --fc-border-color: #1E2540;
            --fc-page-bg-color: #0B1024;
            --fc-neutral-bg-color: #070C1E;
            --fc-today-bg-color: rgba(99, 102, 241, 0.1);
            color: #E2E8F0;
            font-family: inherit;
          }
          .fc-dark-theme .fc-theme-standard th {
            border-color: #1E2540;
            background-color: #070C1E;
            padding: 8px 0;
            font-size: 12px;
            text-transform: uppercase;
            color: #94A3B8;
          }
          .fc-dark-theme .fc-theme-standard td {
            border-color: #1E2540;
          }
          .fc-dark-theme .fc-button {
            background-color: #070C1E !important;
            border-color: #1E2540 !important;
            color: #E2E8F0 !important;
            font-size: 12px !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
          }
          .fc-dark-theme .fc-button:hover {
            background-color: #1E2540 !important;
            color: #FFFFFF !important;
          }
          .fc-dark-theme .fc-button-active {
            background-color: #4F46E5 !important;
            border-color: #6366F1 !important;
            color: #FFFFFF !important;
          }
          .fc-dark-theme .fc-toolbar-title {
            font-size: 18px !important;
            font-weight: 700 !important;
            color: #FFFFFF !important;
          }
          .fc-dark-theme .fc-daygrid-day-number {
            color: #CBD5E1;
            font-size: 12px;
            font-weight: 500;
          }
          .fc-dark-theme .fc-event {
            border-radius: 6px;
            padding: 2px 4px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          height="auto"
          dayMaxEvents={3}
          nowIndicator={true}
        />
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#070C1E] border border-[#1E2540] rounded-2xl shadow-2xl p-5 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-[#1E2540] pb-3">
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  selectedEvent.type === 'memory' 
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                    : selectedEvent.type === 'task'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}>
                  {selectedEvent.category || selectedEvent.type}
                </span>
                {selectedEvent.priority && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {selectedEvent.priority} Priority
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#151D36] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-bold text-white">{selectedEvent.title}</h3>

            {selectedEvent.details && (
              <p className="text-xs text-slate-300 leading-relaxed bg-[#0B1024] p-3.5 rounded-xl border border-[#1E2540]">
                {selectedEvent.details}
              </p>
            )}

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Date: {formatShortDate(selectedEvent.date)}</span>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#1E2540] space-x-2">
              {selectedEvent.type === 'task' && selectedEvent.originalItem && (
                <button
                  onClick={() => {
                    toggleTaskStatus((selectedEvent.originalItem as Task).id);
                    setSelectedEvent(null);
                    addToast('Task status updated', 'success');
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Toggle Complete</span>
                </button>
              )}

              {selectedEvent.type === 'reminder' && selectedEvent.originalItem && (
                <button
                  onClick={() => {
                    toggleReminder((selectedEvent.originalItem as Reminder).id);
                    setSelectedEvent(null);
                    addToast('Reminder status updated', 'success');
                  }}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Toggle Complete
                </button>
              )}

              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3.5 py-1.5 bg-[#0B1024] hover:bg-[#151D36] text-slate-300 rounded-xl text-xs font-semibold border border-[#1E2540] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
