import React from 'react';
import { LayoutDashboard, MessageSquareText, Brain, Bell, Calendar, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppTab } from '../../types';

export function MobileNav() {
  const { currentTab, setCurrentTab, overdueReminders } = useApp();

  const navItems: Array<{
    id: AppTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'memories', label: 'Memories', icon: Brain },
    { id: 'chat', label: 'Ask AI', icon: MessageSquareText, highlight: true },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reminders', label: 'Alerts', icon: Bell, badge: overdueReminders.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg safe-area-bottom"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className="flex flex-col items-center justify-center -mt-5 group"
                aria-label="Ask Smriti AI"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive 
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white ring-4 ring-violet-100'
                    : 'bg-navy-950 text-white hover:bg-navy-900'
                }`}>
                  <Icon className="w-5 h-5 text-accent-blue" />
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-violet-600 font-bold' : 'text-slate-500'}`}>
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
                isActive ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold text-violet-600' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
