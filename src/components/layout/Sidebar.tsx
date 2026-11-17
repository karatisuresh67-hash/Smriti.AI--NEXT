import React, { useState } from 'react';
import {
  Bot,
  Brain,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Zap,
  FileText,
  LogOut,
  Sparkles,
  Compass
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type { AppTab } from '../../types';

export function Sidebar() {
  const {
    currentTab,
    setCurrentTab,
    memories,
    pendingTasks,
    actions,
    documents,
    chromeJobs
  } = useApp();
  const { user, profile, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User';

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;

  const runningActionsCount = actions.filter(a => a.status === 'running').length;

  const navItems: Array<{
    id: AppTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number | null;
    badgeColor?: string;
  }> = [
    {
      id: 'assistant',
      label: 'Assistant',
      icon: Bot,
      badge: null
    },
    {
      id: 'memories',
      label: 'Memories',
      icon: Brain,
      badge: memories.length > 0 ? memories.length : null,
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: pendingTasks.length > 0 ? pendingTasks.length : null,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      badge: null
    },
    {
      id: 'actions',
      label: 'Action History',
      icon: Zap,
      badge: runningActionsCount > 0 ? 'Live' : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
    },
    {
      id: 'results',
      label: 'Chrome Results',
      icon: Compass,
      badge: chromeJobs.filter(j => j.status === 'RUNNING' || j.status === 'STARTING').length > 0 ? 'Live' : (chromeJobs.length > 0 ? chromeJobs.length : null),
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      badge: documents.length > 0 ? documents.length : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
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
      className={`hidden md:flex flex-col bg-[#030712] text-slate-200 border-r border-[#1E2540] transition-all duration-300 relative select-none z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#1E2540]">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-600 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-wider text-white uppercase">
                  Smriti<span className="text-cyan-400">.AI</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Autonomous AI Assistant
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 bg-[#070C1E] border border-[#1E2540] text-slate-400 hover:text-white p-1 rounded-full shadow-md hover:bg-[#0D142E] transition-colors z-30"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'assistant' && (currentTab === 'dashboard' || currentTab === 'chat' || currentTab === 'voice')) ||
            (item.id === 'actions' && currentTab === 'automations');

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-[0_0_18px_rgba(6,182,212,0.3)] font-semibold'
                  : 'text-slate-400 hover:bg-[#070C1E] hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
              }`} />

              {!isCollapsed && (
                <div className="flex-1 ml-3 flex items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor || 'bg-[#182142] text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: User Profile & Sign Out */}
      <div className="p-3 border-t border-[#1E2540] bg-[#030712]">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-[#070C1E] border border-[#1A2346] flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-cyan-500/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center text-xs font-bold border border-cyan-400/40">
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || 'Authenticated'}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              title="Sign out"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-[#131B3A] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-[#070C1E]"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
