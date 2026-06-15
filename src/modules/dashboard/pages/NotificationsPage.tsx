import React, { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { apiClient } from '@/src/lib/apiClient';
import { formatDistanceToNow } from 'date-fns';
import { srLatn } from 'date-fns/locale';

interface Activity {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: any;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchActivities = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError(false);
    apiClient.get<{ activities: Activity[] }>('/notifications/history?limit=50')
      .then(res => setActivities(res.activities || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE_RECEIVED': case 'NEW_MESSAGE': return 'chat';
      case 'APPLICATION_SUBMITTED': return 'assignment';
      case 'APPLICATION_ACCEPTED': return 'check_circle';
      case 'APPLICATION_REJECTED': return 'cancel';
      case 'WALLET_TRANSACTION': return 'account_balance_wallet';
      case 'PROFILE_VERIFIED': return 'verified';
      default: return 'notifications';
    }
  };

  const parseDate = (createdAt: any): Date => {
    if (!createdAt) return new Date();
    if (typeof createdAt.toDate === 'function') return createdAt.toDate();
    if (typeof createdAt === 'string' || typeof createdAt === 'number') return new Date(createdAt);
    if (createdAt._seconds) return new Date(createdAt._seconds * 1000);
    return new Date();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">OBAVEŠTENJA</h1>
          <p className="text-white/30 font-bold text-xs tracking-[0.3em] uppercase">SVE AKTIVNOSTI · OBAVEŠTENJA · DOGAĐAJI</p>
        </div>

        <div className="bg-[#0A0F14] border border-white/5 rounded-3xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-red-500/40 text-5xl mb-4">error_outline</span>
              <p className="text-sm font-black text-white/30 uppercase tracking-widest">Greška pri učitavanju</p>
              <p className="text-[11px] text-white/20 font-medium mt-2 mb-6">Pokušajte ponovo.</p>
              <button onClick={fetchActivities} className="px-6 py-3 bg-secondary/10 text-secondary text-[10px] font-black rounded-[10px] uppercase tracking-widest hover:bg-secondary hover:text-slate-950 transition-all">POKUŠAJ PONOVO</button>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-white/20 text-5xl mb-4">notifications_off</span>
              <p className="text-sm font-black text-white/30 uppercase tracking-widest">Nema obaveštenja</p>
              <p className="text-[11px] text-white/20 font-medium mt-2">Sve aktivnosti će biti prikazane ovde.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {activities.map((activity) => (
                <div key={activity.id} className={`p-6 flex gap-4 items-start ${!activity.read ? 'bg-secondary/[0.02] border-l-2 border-l-secondary' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!activity.read ? 'bg-secondary/15 text-secondary' : 'bg-white/5 text-white/40'}`}>
                    <span className="material-symbols-outlined text-xl">{getNotificationIcon(activity.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className={`text-sm font-bold truncate ${!activity.read ? 'text-white' : 'text-white/60'}`}>{activity.title}</h4>
                      <span className="text-[10px] font-medium text-white/30 whitespace-nowrap shrink-0">{formatDistanceToNow(parseDate(activity.createdAt), { addSuffix: true, locale: srLatn })}</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">{activity.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
