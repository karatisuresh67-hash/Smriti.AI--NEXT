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
  ShieldCheck
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
        try {
          new Notification('Smriti AI Notifications Enabled', {
            body: 'You will receive reminders when this app is active.',
            icon: '/favicon.svg'
          });
        } catch {
          // ignore
        }
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-slate-700" />
          Settings & Account
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          Manage your personal profile, notification preferences, backups, and security
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft">
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-900">User Account</h2>
            <p className="text-xs text-slate-500">Google Authentication Profile</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6">
          {profile?.avatar_url || googleAvatar ? (
  <img
    src={googleAvatar || profile?.avatar_url || undefined}
    alt={displayName || 'User'}
    referrerPolicy="no-referrer"
    onError={(event) => {
      event.currentTarget.style.display = 'none';
    }}
    className="w-14 h-14 rounded-full border-2 border-violet-200 shadow-sm object-cover"
  />
) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-navy-900 text-base">{displayName}</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || userEmail || 'No email available'}</p>
          </div>

          {onLogout && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label htmlFor="settings-name" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Display Name
            </label>
            <input
              id="settings-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full sm:w-80 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Suresh"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-navy-950 hover:bg-navy-900 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Save Changes
          </button>
        </form>
      </div>

      {/* Voice Assistant Preferences */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-900">Voice Response</h2>
            <p className="text-xs text-slate-500">Enable automatic spoken replies from Smriti AI</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-sm font-semibold text-navy-900">Speak Answers Aloud</p>
            <p className="text-xs text-slate-500 mt-0.5">Read AI answers aloud using voice audio</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={voiceResponse}
              onChange={(e) => handleVoiceToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600" />
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-900">Reminders & Notifications</h2>
            <p className="text-xs text-slate-500">Keep up to date with scheduled alerts</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-sm font-semibold text-navy-900">Browser Alerts</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Status: <span className="font-semibold capitalize text-slate-700">{notifPermission}</span>
            </p>
          </div>

          {notifPermission !== 'granted' ? (
            <button
              onClick={handleRequestNotification}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              Enable Notifications
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  notificationService.sendNotification('Smriti AI Test Alert', {
                    body: 'Your scheduled reminders and memory alerts are active!'
                  });
                  addToast('Sent test notification to your system', 'info');
                }}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Send Test Alert
              </button>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                Enabled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Backup and Data Management */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-900">Data Backup & Export</h2>
            <p className="text-xs text-slate-500">Download or restore all your memories, reminders, and activities</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
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
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4" />
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
          message="You will be returned to the login screen. Your saved memories and reminders will remain securely stored."
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
