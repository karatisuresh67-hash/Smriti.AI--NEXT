import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Volume2, 
  Bell, 
  Download, 
  Upload, 
  LogOut, 
  Sparkles, 
  ShieldCheck,
  Terminal,
  KeyRound,
  CheckCircle2,
  Calendar,
  Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface SettingsPageProps {
  onLogout?: () => void;
  userEmail?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
}

export function SettingsPage({ onLogout, userEmail, userName, userAvatar }: SettingsPageProps) {
  const { 
    settings, 
    memories, 
    reminders, 
    updateSettings, 
    importBackup, 
    addToast 
  } = useApp();

  const { user, profile, saveProfile } = useAuth();
  const googleName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    userName ||
    user?.email?.split('@')[0] ||
    '';

  const googleAvatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    userAvatar ||
    null;

  const [displayName, setDisplayName] = useState(
    profile?.display_name || googleName || settings.displayName || ''
  );

  useEffect(() => {
    setDisplayName(
      profile?.display_name || googleName || settings.displayName || ''
    );
  }, [profile?.display_name, googleName, settings.displayName]);

  const [voiceResponse, setVoiceResponse] = useState<boolean>(Boolean(settings.voiceResponse));
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported';
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) {
      addToast('Please enter your name.', 'error');
      return;
    }

    try {
      await saveProfile(name);
      updateSettings({
        displayName: name,
        voiceResponse,
      });
      setDisplayName(name);
      addToast('Profile saved successfully!', 'success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save your profile. Please try again.';
      addToast(message, 'error');
    }
  };

  const handleVoiceToggle = (checked: boolean) => {
    setVoiceResponse(checked);
    updateSettings({ voiceResponse: checked });
  };

  const handleRequestNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      addToast('Browser notifications are not supported in this browser.', 'error');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        updateSettings({ notificationsEnabled: true });
        addToast('Browser notifications enabled!', 'success');
      } else {
        updateSettings({ notificationsEnabled: false });
        addToast(`Notification permission was ${permission}.`, 'info');
      }
    } catch (e: any) {
      addToast('Could not request notification permissions: ' + e?.message, 'error');
    }
  };

  const handleExportData = () => {
    try {
      const backup = storageService.exportBackup(memories, reminders);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `smriti_ai_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addToast('Backup downloaded successfully', 'success');
    } catch (e: any) {
      addToast('Export failed: ' + e?.message, 'error');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importBackup(json);
        addToast('Backup restored successfully!', 'success');
      } catch {
        addToast('Invalid JSON file format.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-500/10 border border-slate-500/30 flex items-center justify-center text-slate-300">
            <Settings className="w-5 h-5" />
          </div>
          <span>System Settings</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure personal credentials, AI voice parameters, data backups, and security.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-[#070C1E] rounded-2xl border border-[#1E2540] p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Identity & Account</h2>
            <p className="text-xs text-slate-400">Authenticated user profile and session</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-[#0B1024] border border-[#1E2540] mb-6">
          {profile?.avatar_url || googleAvatar ? (
            <img
              src={googleAvatar || profile?.avatar_url || undefined}
              alt={displayName || 'User'}
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
              className="w-14 h-14 rounded-full border-2 border-cyan-500/40 shadow-sm object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">{displayName}</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Verified Session
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email || userEmail || 'No email available'}</p>
          </div>

          {onLogout && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label htmlFor="settings-name" className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Display Name
            </label>
            <input
              id="settings-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full sm:w-80 px-3.5 py-2.5 text-sm rounded-xl border border-[#1E2540] bg-[#0B1024] text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="e.g. Alex"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95"
          >
            Save Changes
          </button>
        </form>
      </div>

      {/* AI OS Diagnostics & Integrations Status */}
      <div className="bg-[#070C1E] rounded-2xl border border-[#1E2540] p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Engine Diagnostics</h2>
            <p className="text-xs text-slate-400">Active subsystems and environment interfaces</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0B1024] border border-[#1E2540] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="font-bold text-white">Google Gemini AI</p>
                <p className="text-[11px] text-slate-400">Multimodal & Text Engine</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1024] border border-[#1E2540] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-bold text-white">Cloud Browser Engine</p>
                <p className="text-[11px] text-slate-400">Playwright & Browserbase</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1024] border border-[#1E2540] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <div>
                <p className="font-bold text-white">Supabase Vault</p>
                <p className="text-[11px] text-slate-400">Row-Level Security (RLS)</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Connected
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1024] border border-[#1E2540] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <div>
                <p className="font-bold text-white">Google Calendar API</p>
                <p className="text-[11px] text-slate-400">Schedule Synchronization</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* Voice Assistant Preferences */}
      <div className="bg-[#070C1E] rounded-2xl border border-[#1E2540] p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Voice & Audio</h2>
            <p className="text-xs text-slate-400">Enable automatic spoken replies from Smriti AI</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1024] border border-[#1E2540]">
          <div>
            <p className="text-sm font-semibold text-white">Speak Answers Aloud</p>
            <p className="text-xs text-slate-400 mt-0.5">Read AI answers aloud using voice audio</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={voiceResponse}
              onChange={(e) => handleVoiceToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500" />
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#070C1E] rounded-2xl border border-[#1E2540] p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Notifications & Alerts</h2>
            <p className="text-xs text-slate-400">System alerts for upcoming reminders and tasks</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1024] border border-[#1E2540]">
          <div>
            <p className="text-sm font-semibold text-white">Browser Notifications</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Status: <span className="font-semibold capitalize text-slate-300">{notifPermission}</span>
            </p>
          </div>

          {notifPermission !== 'granted' ? (
            <button
              onClick={handleRequestNotification}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
            >
              Enable Notifications
            </button>
          ) : (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-full">
              Enabled
            </span>
          )}
        </div>
      </div>

      {/* Backup and Data Management */}
      <div className="bg-[#070C1E] rounded-2xl border border-[#1E2540] p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Vault Data Backup & Restore</h2>
            <p className="text-xs text-slate-400">Export or restore your memories, reminders, and directives locally</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#0B1024] hover:bg-[#121A38] text-slate-200 border border-[#1E2540] text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download JSON Backup</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
            id="import-backup-file"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#0B1024] hover:bg-[#121A38] text-slate-200 border border-[#1E2540] text-xs font-semibold rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Restore Backup</span>
          </button>
        </div>
      </div>

      {/* Confirm Dialogs */}
      {showLogoutConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setShowLogoutConfirm(false)}
          title="Are you sure you want to log out?"
          message="You will be returned to the login screen. Your saved memories and tasks will remain securely encrypted."
          confirmText="Log Out"
          confirmVariant="danger"
          onConfirm={() => {
            if (onLogout) onLogout();
          }}
        />
      )}
    </div>
  );
}
