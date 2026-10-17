import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
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
      case 'dashboard': return 'Dashboard';
      case 'chat': return 'Ask Smriti AI';
      case 'voice': return 'Voice Assistant';
      case 'memories': return 'My Memories';
      case 'reminders': return 'Reminders';
      case 'calendar': return 'Interactive Calendar';
      case 'settings': return 'Settings';
      default: return 'Smriti AI';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Mobile Branding / Desktop Page Title */}
      <div className="flex items-center space-x-3">
        <div className="md:hidden flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-navy-950 flex items-center justify-center shadow-sm">
            <Brain className="w-4 h-4 text-accent-blue" />
          </div>
          <span className="font-bold text-navy-900 text-base">Smriti AI</span>
        </div>

        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Ask Smriti launcher (when not in chat) */}
        {currentTab !== 'chat' && (
          <button
            onClick={() => setCurrentTab('chat')}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        )}

        {/* Notifications / Reminders Dropdown */}
        <NotificationDropdown />

        {/* User avatar / profile button */}
        <button
          onClick={() => setCurrentTab('settings')}
          className="flex items-center space-x-2 pl-2 pr-2.5 py-1 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
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
    className="w-7 h-7 rounded-full object-cover shadow-sm"
  />
) : (
  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
    {displayName[0]?.toUpperCase() || 'U'}
  </div>
)}
<span className="text-xs font-medium text-slate-700 hidden sm:inline">
  {displayName}
</span>
        </button>
      </div>
    </header>
  );
}
