import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquareText, 
  Mic,
  Brain, 
  Bell, 
  Calendar, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppTab } from '../../types';

export function Sidebar() {
  const { currentTab, setCurrentTab, memories, reminders, overdueReminders } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: Array<{
    id: AppTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number | null;
    badgeColor?: string;
  }> = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      id: 'chat', 
      label: 'Ask Smriti AI', 
      icon: MessageSquareText,
      badge: null,
    },
    { 
      id: 'voice', 
      label: 'Voice Assistant', 
      icon: Mic,
      badge: 'Live',
      badgeColor: 'bg-violet-500/20 text-violet-300 font-semibold'
    },
    { 
      id: 'memories', 
      label: 'My Memories', 
      icon: Brain,
      badge: memories.length,
      badgeColor: 'bg-slate-100 text-slate-600'
    },
    { 
      id: 'reminders', 
      label: 'Reminders', 
      icon: Bell,
      badge: overdueReminders.length > 0 ? `${overdueReminders.length} Due` : reminders.filter(r => r.status === 'upcoming').length,
      badgeColor: overdueReminders.length > 0 ? 'bg-rose-100 text-rose-700 font-semibold' : 'bg-slate-100 text-slate-600'
    },
    { 
      id: 'calendar', 
      label: 'Calendar', 
      icon: Calendar,
      badge: null
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      badge: null
    },
  ];

  return (
    <aside 
      className={`hidden md:flex flex-col bg-navy-950 text-slate-200 border-r border-navy-800 transition-all duration-300 relative select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-navy-800/80">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-accent-blue flex items-center justify-center shadow-glow flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg text-white tracking-tight">
                Smriti AI
              </h1>
              <p className="text-xs text-slate-400 truncate">
                Remember what matters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 bg-navy-800 border border-navy-700 text-slate-300 hover:text-white p-1 rounded-full shadow-md hover:bg-navy-700 transition-colors z-20"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-soft font-semibold'
                  : 'text-slate-300 hover:bg-navy-900 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-violet-400'
              }`} />
              
              {!isCollapsed && (
                <div className="flex-1 ml-3.5 flex items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${item.badgeColor || 'bg-navy-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Status / Brand Footer */}
      {!isCollapsed ? (
        <div className="p-4 m-3 rounded-2xl bg-navy-900/90 border border-navy-800 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center space-x-2 text-violet-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
            <span>AI Memory Assistant</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Remember what matters. Let AI handle the rest.
          </p>
        </div>
      ) : (
        <div className="p-3 text-center text-slate-500">
          <Sparkles className="w-4 h-4 mx-auto text-violet-400" />
        </div>
      )}
    </aside>
  );
}
