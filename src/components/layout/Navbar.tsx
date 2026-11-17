import React from 'react';
import { Sparkles, Terminal } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

export function Navbar() {
  const { currentTab, setCurrentTab, settings } = useApp();
  const { user, profile } = useAuth();

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    settings.displayName ||
    'User';

  const getPageTitle = () => {
    switch (currentTab) {
      case 'assistant':
      case 'dashboard':
      case 'chat':
      case 'voice':
        return 'Assistant Command Center';
      case 'tasks':
        return 'Tasks & Directives';
      case 'memories':
      case 'reminders':
        return 'Memory Core';
      case 'calendar':
        return 'Calendar';
      case 'actions':
      case 'automations':
        return 'Action History';
      case 'results':
        return 'Chrome Action Results';
      case 'documents':
        return 'Document Intelligence';
      case 'settings':
        return 'System Settings';
      default:
        return 'Smriti AI';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#030712]/90 backdrop-blur-md border-b border-[#1E2540] px-4 sm:px-8 py-3.5 flex items-center justify-between text-white transition-colors">
      {/* Mobile Branding / Desktop Page Title */}
      <div className="flex items-center space-x-3">
        <div className="md:hidden flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-white text-base tracking-wide">
            Smriti<span className="text-cyan-400">.AI</span>
          </span>
        </div>

        <div className="hidden md:block">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>{getPageTitle()}</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </h2>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User profile button */}
        <button
          onClick={() => setCurrentTab('settings')}
          className="flex items-center space-x-2 pl-2 pr-2.5 py-1 rounded-xl text-slate-300 hover:bg-[#070C1E] transition-colors border border-transparent hover:border-[#1E2540]"
          aria-label="User settings"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
              className="w-7 h-7 rounded-full object-cover border border-cyan-500/40"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center text-xs font-bold">
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <span className="text-xs font-medium text-slate-300 hidden sm:inline">
            {displayName}
          </span>
        </button>
      </div>
    </header>
  );
}
