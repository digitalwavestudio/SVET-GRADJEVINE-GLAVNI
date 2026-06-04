import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/context/AuthContext';
import { AvailabilityCalendar, CalendarEvent } from '@/src/modules/core/components/calendar/AvailabilityCalendar';
import { apiClient } from '@/src/lib/apiClient';
import { useUserStore } from '@/src/store/userStore';

export function AvailabilityManager() {
  const { user } = useAuth();
  const events = useUserStore(state => state.availabilityEvents);
  const setEvents = useUserStore(state => state.setAvailabilityEvents);
  const isSaving = useUserStore(state => state.isSavingAvailability);
  const setIsSaving = useUserStore(state => state.setIsSavingAvailability);

  const { data: fetchedEvents } = useQuery<CalendarEvent[]>({
    queryKey: ['user', user?.id || 'anonymous', 'availability-events'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/users/me/events');
      return res?.data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  useEffect(() => {
    if (fetchedEvents) {
      setEvents(fetchedEvents);
    }
  }, [fetchedEvents, setEvents]);

  const handleEventsChange = async (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    setIsSaving(true);
    
    try {
      if (user) {
        await apiClient.put('/users/profile', { events: newEvents });
      }
    } catch (error) {
      console.error("Failed to save availability events", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden group">
      <div className="p-8 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary">calendar_month</span>
            Menadžer Dostupnosti
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mt-2 font-bold max-w-xl leading-relaxed">
            Obeležite dane kada ste angažovani ili kada je vaša oprema na servisu. Klijenti će videti ovu dostupnost na vašem javnom profilu i oglasima.
          </p>
        </div>
        {isSaving && (
           <div className="bg-secondary/10 text-secondary px-3 py-1.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse border border-secondary/20">
             <span className="w-2 h-2 rounded-full border border-secondary border-t-transparent animate-spin"></span>
             Snimanje...
           </div>
        )}
      </div>

      <div className="p-8">
        <AvailabilityCalendar 
          mode="edit"
          events={events}
          onEventsChange={handleEventsChange}
        />
      </div>
    </div>
  );
}
