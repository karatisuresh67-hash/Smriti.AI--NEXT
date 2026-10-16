import React from 'react';
import { History, Brain, Bell, CheckCircle2, RotateCcw, Trash2, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatTimeAgo } from '../../services/dateUtils';
import type { ActivityType } from '../../types';

export function ActivityList() {
  const { activities } = useApp();

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'create_memory':
      case 'update_memory':
        return <Brain className="w-3.5 h-3.5 text-violet-600" />;
      case 'create_reminder':
      case 'update_reminder':
        return <Bell className="w-3.5 h-3.5 text-sky-600" />;
      case 'complete_reminder':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'reopen_reminder':
        return <RotateCcw className="w-3.5 h-3.5 text-amber-600" />;
      case 'snooze_reminder':
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
      case 'delete_memory':
      case 'delete_reminder':
        return <Trash2 className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
          <History className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-bold text-navy-900">Recent Activity</h2>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">
          No recent activity logged yet.
        </div>
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 6).map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-navy-900 truncate">
                  {activity.title}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {activity.description || activity.category}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 flex-shrink-0 whitespace-nowrap">
                {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
