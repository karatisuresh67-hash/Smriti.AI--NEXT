import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Filter, Brain, Bell, Clock, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { formatShortDate, formatTime12h } from '../services/dateUtils';
import type { Memory, Reminder } from '../types';

export function CalendarPage() {
  const { memories, reminders, toggleReminder } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'memories' | 'reminders'>('all');
  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    title: string;
    type: 'memory' | 'reminder';
    date: string;
    details?: string;
    category?: string;
    priority?: string;
    status?: string;
    originalItem?: Memory | Reminder;
  } | null>(null);

  // Map memories and reminders to FullCalendar events
  const calendarEvents = useMemo(() => {
    const events: any[] = [];

    if (filterType === 'all' || filterType === 'memories') {
      memories.forEach((mem) => {
        if (!mem.date) return;
        const isBirthday = mem.category === 'Birthday';
        events.push({
          id: `mem-${mem.id}`,
          title: `${isBirthday ? '🎂' : '📌'} ${mem.title}`,
          start: mem.date,
          allDay: true,
          backgroundColor: isBirthday ? '#F43F5E' : '#7C3AED',
          borderColor: isBirthday ? '#E11D48' : '#6D28D9',
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

    if (filterType === 'all' || filterType === 'reminders') {
      reminders.forEach((rem) => {
        if (!rem.date) return;
        const isCompleted = rem.status === 'completed';
        const isOverdue = rem.status === 'overdue';

        let bgColor = '#0284C7'; // sky-600
        let bdColor = '#0369A1';
        if (isCompleted) {
          bgColor = '#10B981'; // emerald-500
          bdColor = '#059669';
        } else if (isOverdue) {
          bgColor = '#EF4444'; // red-500
          bdColor = '#DC2626';
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
  }, [memories, reminders, filterType]);

  const handleEventClick = (info: any) => {
    const props = info.event.extendedProps;
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title.replace(/^[🎂📌⏰]\s*/, ''),
      type: props.type,
      date: info.event.startStr,
      details: props.details,
      category: props.category,
      priority: props.priority,
      status: props.status,
      originalItem: props.original,
    });
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-indigo-600" />
            Interactive Calendar
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Unified timeline of saved memory dates, birthdays, anniversaries, and scheduled reminders
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-navy-950 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Events ({calendarEvents.length})
          </button>
          <button
            onClick={() => setFilterType('memories')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors ${
              filterType === 'memories'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memories</span>
          </button>
          <button
            onClick={() => setFilterType('reminders')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors ${
              filterType === 'reminders'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Reminders</span>
          </button>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 shadow-soft">
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
          themeSystem="standard"
        />
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.type === 'memory' ? 'Memory Details' : 'Reminder Details'}
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                selectedEvent.type === 'memory' ? 'bg-violet-100 text-violet-800' : 'bg-sky-100 text-sky-800'
              }`}>
                {selectedEvent.category || selectedEvent.type}
              </span>
              {selectedEvent.priority && (
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
                  {selectedEvent.priority} Priority
                </span>
              )}
              {selectedEvent.status && (
                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                  selectedEvent.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedEvent.status}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-navy-900">{selectedEvent.title}</h3>

            {selectedEvent.details && (
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {selectedEvent.details}
              </p>
            )}

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Date: {formatShortDate(selectedEvent.date)}</span>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              {selectedEvent.type === 'reminder' && selectedEvent.originalItem && (
                <button
                  onClick={() => {
                    toggleReminder((selectedEvent.originalItem as Reminder).id);
                    setSelectedEvent(null);
                  }}
                  className="px-4 py-2 bg-navy-950 text-white rounded-xl text-xs font-semibold hover:bg-navy-900 transition-colors mr-2"
                >
                  {(selectedEvent.originalItem as Reminder).status === 'completed' ? 'Mark Incomplete' : 'Mark Completed'}
                </button>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
