import React from 'react';
import { Bot, CheckSquare, Brain, Calendar, Zap, FileText, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppTab } from '../../types';

export function MobileNav() {
  const { currentTab, setCurrentTab, pendingTasks, documents } = useApp();

  const navItems: Array<{
    id: AppTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
    badge?: number;
  }> = [
    { id: 'assistant', label: 'Assistant', icon: Bot, highlight: true },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingTasks.length },
    { id: 'memories', label: 'Memories', icon: Brain },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'documents', label: 'Docs', icon: FileText, badge: documents.length },
    { id: 'actions', label: 'Actions', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#030712]/95 backdrop-blur-md border-t border-[#1E2540] px-2 py-1.5 shadow-lg safe-area-bottom"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'assistant' && (currentTab === 'dashboard' || currentTab === 'chat' || currentTab === 'voice')) ||
            (item.id === 'actions' && currentTab === 'automations');

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className="flex flex-col items-center justify-center -mt-5 group"
                aria-label="Smriti Assistant"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-tr from-cyan-400 via-indigo-600 to-violet-600 text-white ring-4 ring-cyan-500/30'
                    : 'bg-[#070C1E] text-cyan-400 border border-cyan-500/40 hover:bg-[#0D142E]'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-indigo-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] mt-1 font-medium ${isActive ? 'font-bold text-cyan-400' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
