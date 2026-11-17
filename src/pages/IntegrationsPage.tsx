import React, { useState } from 'react';
import { 
  Layers, 
  Mail, 
  Calendar as CalendarIcon, 
  Database, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Settings2, 
  RefreshCw, 
  X,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { LinkedinIcon, InstagramIcon, TwitterIcon, SlackIcon } from '../components/common/BrandIcons';
import { useApp } from '../context/AppContext';
import type { IntegrationItem, IntegrationProvider } from '../types';

interface ServiceConfig {
  provider: IntegrationProvider;
  name: string;
  description: string;
  category: 'Google Workspace' | 'Social' | 'Productivity' | 'Automation';
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  scopes: string[];
  fields: Array<{ key: string; label: string; placeholder: string; type?: string }>;
}

const SERVICES: ServiceConfig[] = [
  {
    provider: 'gmail',
    name: 'Gmail',
    description: 'Read and search unread emails, generate intelligent summaries, draft replies, and send with user approval.',
    category: 'Google Workspace',
    icon: Mail,
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.compose'],
    fields: [
      { key: 'accountEmail', label: 'Google Account Email', placeholder: 'user@gmail.com' },
      { key: 'apiKey', label: 'Service OAuth Client ID (Optional for custom domain)', placeholder: 'client-id.apps.googleusercontent.com' }
    ]
  },
  {
    provider: 'google_calendar',
    name: 'Google Calendar',
    description: 'Bi-directional sync of meetings, memory anniversaries, reminders, and automated conflict detection.',
    category: 'Google Workspace',
    icon: CalendarIcon,
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    scopes: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'],
    fields: [
      { key: 'accountEmail', label: 'Calendar Account Email', placeholder: 'user@gmail.com' },
      { key: 'calendarId', label: 'Primary Calendar ID', placeholder: 'primary' }
    ]
  },
  {
    provider: 'linkedin',
    name: 'LinkedIn',
    description: 'Draft professional updates, schedule career milestones, and analyze engagement recommendations.',
    category: 'Social',
    icon: LinkedinIcon,
    iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    scopes: ['w_member_social', 'r_liteprofile'],
    fields: [
      { key: 'accountName', label: 'LinkedIn Profile / Company ID', placeholder: 'in/username or org ID' },
      { key: 'accessToken', label: 'OAuth Access Token (or Webhook token)', placeholder: 'AQV... (Bearer token)', type: 'password' }
    ]
  },
  {
    provider: 'instagram',
    name: 'Instagram',
    description: 'Plan personal content, preview carousel ideas, and draft captions for saved memorable moments.',
    category: 'Social',
    icon: InstagramIcon,
    iconBg: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    scopes: ['instagram_basic', 'instagram_content_publish'],
    fields: [
      { key: 'accountName', label: 'Instagram Handle', placeholder: '@username' },
      { key: 'apiToken', label: 'Meta Graph User Token', placeholder: 'IGQVJ...', type: 'password' }
    ]
  },
  {
    provider: 'x',
    name: 'X (Twitter)',
    description: 'Broadcast short thoughts, schedule threads, and convert saved memories into social insights.',
    category: 'Social',
    icon: TwitterIcon,
    iconBg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    scopes: ['tweet.read', 'tweet.write', 'users.read'],
    fields: [
      { key: 'accountName', label: 'X Handle', placeholder: '@handle' },
      { key: 'bearerToken', label: 'X API v2 Bearer Token', placeholder: 'AAAAAAAAAAAAAAAAAAAAA...', type: 'password' }
    ]
  },
  {
    provider: 'n8n',
    name: 'n8n Workflow Automation',
    description: 'Execute powerful multi-step automations, background webhooks, data pipelines, and agent tools via n8n.',
    category: 'Automation',
    icon: Zap,
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    scopes: ['webhook.trigger', 'workflow.read'],
    fields: [
      { key: 'webhookUrl', label: 'n8n Webhook Base URL', placeholder: 'https://n8n.your-domain.com/webhook/' },
      { key: 'apiKey', label: 'n8n API Key (Header: X-N8N-API-KEY)', placeholder: 'n8n_api_key_...', type: 'password' }
    ]
  },
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Send task notifications, daily memory briefings, and urgent reminder alerts to designated channels.',
    category: 'Productivity',
    icon: SlackIcon,
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    scopes: ['chat:write', 'channels:read'],
    fields: [
      { key: 'webhookUrl', label: 'Slack Incoming Webhook URL', placeholder: 'https://hooks.slack.com/services/...' },
      { key: 'channelName', label: 'Default Notification Channel', placeholder: '#personal-briefs' }
    ]
  },
  {
    provider: 'notion',
    name: 'Notion Workspace',
    description: 'Sync memories and task databases directly with your Notion workspace pages.',
    category: 'Productivity',
    icon: Database,
    iconBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    scopes: ['notion.database.read', 'notion.database.write'],
    fields: [
      { key: 'apiKey', label: 'Notion Internal Integration Token', placeholder: 'secret_...', type: 'password' },
      { key: 'databaseId', label: 'Target Database ID', placeholder: '32-character hex database ID' }
    ]
  }
];

export function IntegrationsPage() {
  const { integrations, updateIntegration, addToast } = useApp();
  const [selectedService, setSelectedService] = useState<ServiceConfig | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const getIntegrationState = (provider: IntegrationProvider): IntegrationItem | undefined => {
    return integrations.find(i => i.provider === provider);
  };

  const handleOpenConfig = (service: ServiceConfig) => {
    setSelectedService(service);
    const existing = getIntegrationState(service.provider);
    const initial: Record<string, string> = {
      accountEmail: existing?.accountEmail || '',
      accountName: existing?.accountName || '',
    };
    if (existing?.settings) {
      Object.entries(existing.settings).forEach(([k, v]) => {
        initial[k] = typeof v === 'string' ? v : JSON.stringify(v);
      });
    }
    setFormValues(initial);
  };

  const handleToggleConnection = async (service: ServiceConfig) => {
    const existing = getIntegrationState(service.provider);
    const nextStatus = !existing?.isConnected;

    try {
      await updateIntegration(service.provider, {
        isConnected: nextStatus,
        lastSyncedAt: nextStatus ? new Date().toISOString() : null,
      });
      addToast(
        nextStatus 
          ? `Connected ${service.name} successfully` 
          : `Disconnected ${service.name}`,
        'success'
      );
    } catch (err: any) {
      addToast(`Failed to update ${service.name}: ${err?.message}`, 'error');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setIsSaving(true);
    try {
      const { accountEmail, accountName, ...settings } = formValues;

      await updateIntegration(selectedService.provider, {
        isConnected: true,
        accountEmail: accountEmail || undefined,
        accountName: accountName || undefined,
        settings,
        scopes: selectedService.scopes,
        lastSyncedAt: new Date().toISOString(),
      });

      addToast(`${selectedService.name} configuration saved & connected!`, 'success');
      setSelectedService(null);
    } catch (err: any) {
      addToast(`Error saving configuration: ${err?.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['all', 'Google Workspace', 'Social', 'Productivity', 'Automation'];

  const filteredServices = SERVICES.filter(service => {
    if (activeCategory === 'all') return true;
    return service.category === activeCategory;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center text-white shadow-md">
              <Layers className="w-4 h-4" />
            </div>
            Connected Integrations
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            Securely link your personal email, calendar, social accounts, and automated webhooks.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>OAuth 2.0 & TLS 1.3 Encrypted</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-[#1E2540]">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#0B1024]'
            }`}
          >
            {cat === 'all' ? 'All Services' : cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map(service => {
          const Icon = service.icon;
          const state = getIntegrationState(service.provider);
          const isConnected = state?.isConnected ?? false;

          return (
            <div
              key={service.provider}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isConnected 
                  ? 'bg-[#0B1024] border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.08)]' 
                  : 'bg-[#070C1E] border-[#1E2540] hover:border-[#2C3862]'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${service.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {service.name}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-400">
                        {service.category}
                      </span>
                    </div>
                  </div>

                  {/* Connection Status Badge */}
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'
                    }`} />
                    <span className={`text-xs font-semibold ${
                      isConnected ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  {service.description}
                </p>

                {/* Account Details if Connected */}
                {isConnected && (
                  <div className="mt-3 p-2.5 rounded-xl bg-[#070C1E] border border-[#1E2540] text-xs text-slate-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Account:</span>
                      <span className="font-medium text-white truncate max-w-[200px]">
                        {state?.accountEmail || state?.accountName || 'Active Connection'}
                      </span>
                    </div>
                    {state?.lastSyncedAt && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Last Synced:</span>
                        <span className="text-slate-400">
                          {new Date(state.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-4 mt-4 border-t border-[#1E2540]">
                <button
                  onClick={() => handleToggleConnection(service)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    isConnected
                      ? 'bg-[#151D36] text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 border border-rose-900/40'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md'
                  }`}
                >
                  {isConnected ? 'Disconnect' : 'Connect Service'}
                </button>

                <button
                  onClick={() => handleOpenConfig(service)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#151D36] border border-[#1E2540] transition-colors"
                  title="Configure parameters & credentials"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#0B1024] border border-[#1E2540] shadow-2xl p-6 text-white relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2540]">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${selectedService.iconBg}`}>
                  <selectedService.icon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    Configure {selectedService.name}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Secure credentials stored in Supabase with Row Level Security.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedService(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151D36]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 mt-4">
              {selectedService.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type || 'text'}
                    value={formValues[field.key] || ''}
                    onChange={(e) => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3.5 py-2.5 bg-[#070C1E] border border-[#1E2540] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
              ))}

              <div className="p-3 rounded-xl bg-[#070C1E] border border-[#1E2540] text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Required Scopes:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-400">
                  {selectedService.scopes.map(s => (
                    <li key={s} className="truncate font-mono">{s}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#1E2540]">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#151D36] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Verifying & Saving...' : 'Save & Enable Integration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
