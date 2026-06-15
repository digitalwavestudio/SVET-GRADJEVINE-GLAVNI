import React from 'react';
import { WorkerStatus, CalendarEvent } from '@/src/modules/real_estate/components/construction/types';

interface LiveFeedWidgetProps {
  setIsHistoryModalOpen: (open: boolean) => void;
  sites: { id: string; name: string }[];
  siteWorkers: Record<string, WorkerStatus[]>;
  diaryLogs: Record<number, string>;
  events: CalendarEvent[];
  today: Date;
}

interface FeedItem {
  id: number;
  time: string;
  action: string;
  desc: string;
  site: string;
  color: string;
  bg: string;
  alert?: boolean;
}

function parseTime(timeStr: string): number {
  const clean = timeStr.trim();
  if (clean.includes(':')) {
    const [h, m] = clean.split(':');
    return Number(h) * 60 + Number(m || 0);
  }
  const num = Number(clean);
  if (isNaN(num)) return 0;
  if (num >= 100) {
    const s = clean.toString();
    return s.length >= 4
      ? Number(s.substring(0, 2)) * 60 + Number(s.substring(2, 4))
      : Number(s.substring(0, 1)) * 60 + Number(s.substring(1, 3));
  }
  return num * 60;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function LiveFeedWidget({
  setIsHistoryModalOpen,
  sites,
  siteWorkers,
  diaryLogs,
  events,
  today,
}: LiveFeedWidgetProps) {

  const feedItems: FeedItem[] = React.useMemo(() => {
    const items: FeedItem[] = [];
    let id = 1;

    // 1. Worker check-ins per site
    sites.forEach((site) => {
      const workers = siteWorkers[site.id] || [];
      const presentWorkers = workers.filter(w => w.isPresent);
      if (presentWorkers.length > 0) {
        const checkInMinutes = presentWorkers
          .filter(w => w.checkIn)
          .map(w => parseTime(w.checkIn))
          .sort((a, b) => a - b);
        const earliestTime = checkInMinutes.length > 0
          ? formatTime(checkInMinutes[0])
          : '00:00';

        items.push({
          id: id++,
          time: earliestTime,
          action: 'Prijava radnika',
          desc: `${presentWorkers.length} radnika prijavljeno na gradilištu.`,
          site: site.name,
          color: 'text-green-500',
          bg: 'bg-green-500',
        });
      }
    });

    // 2. Today's calendar events
    const todayEvents = events.filter(e => e.day === today.getDate());
    todayEvents.forEach((event) => {
      const eventColors: Record<string, { color: string; bg: string }> = {
        interview: { color: 'text-purple-400', bg: 'bg-purple-400' },
        site: { color: 'text-cyan-400', bg: 'bg-cyan-400' },
        meeting: { color: 'text-blue-400', bg: 'bg-blue-400' },
        phase: { color: 'text-yellow-400', bg: 'bg-yellow-400' },
        payment: { color: 'text-green-400', bg: 'bg-green-400' },
        bill: { color: 'text-orange-400', bg: 'bg-orange-400' },
      };
      const colors = eventColors[event.type] || { color: 'text-white/60', bg: 'bg-white/60' };
      items.push({
        id: id++,
        time: '00:00',
        action: event.title,
        desc: `Kalendarski događaj: ${event.title}`,
        site: '',
        color: colors.color,
        bg: colors.bg,
      });
    });

    // 3. Diary entry for today
    if (today) {
      const diaryContent = diaryLogs[today.getDate()];
      if (diaryContent && diaryContent.trim()) {
        items.push({
          id: id++,
          time: '07:30',
          action: 'Dnevnik otvoren',
          desc: diaryContent.length > 80
            ? diaryContent.substring(0, 80) + '...'
            : diaryContent,
          site: '',
          color: 'text-green-500',
          bg: 'bg-green-500',
        });
      }
    }

    // Sort by time ascending
    items.sort((a, b) => parseTime(a.time) - parseTime(b.time));

    // Reset IDs after sort
    items.forEach((item, idx) => { item.id = idx + 1; });

    return items;
  }, [sites, siteWorkers, diaryLogs, events, today]);

  return (
    <div className="w-full xl:w-[40%] 2xl:w-[35%] bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 lg:p-8 flex flex-col relative h-fit shadow-2xl shrink-0">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
          <h2 className="text-sm font-black uppercase tracking-widest text-white">LIVE TEREN</h2>
        </div>
        <span className="text-[9px] font-black text-white/20 tracking-[0.2em] uppercase border border-white/10 px-2 py-1 rounded bg-[#131920]">Danas</span>
      </div>

      <div className="mb-8 relative z-20">
         <div className="bg-[#070B0F] border border-white/10 rounded-[10px] p-4 focus-within:border-secondary/50 focus-within:shadow-[0_0_15px_rgba(255,204,0,0.1)] transition-all flex flex-col gap-3">
            <textarea 
              rows={2} 
              placeholder="Napiši brzi izveštaj sa gradilišta..."
              className="bg-transparent border-none outline-none text-xs text-white/80 placeholder:text-white/30 resize-none font-sans"
            ></textarea>
            <div className="flex justify-between items-center border-t border-white/5 pt-3">
               <div className="flex gap-2">
                 <button className="w-7 h-7 rounded-[10px] hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-cyan-400 transition-colors tooltip-target" title="Zakači fotografiju">
                    <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                 </button>
                 <button className="w-7 h-7 rounded-[10px] hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-red-500 transition-colors tooltip-target" title="Prijavi Hitnost / Problem">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                 </button>
                 <button className="w-7 h-7 rounded-[10px] hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-green-500 transition-colors tooltip-target" title="Prijavi isporuku">
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                 </button>
               </div>
               <button className="px-4 py-1.5 bg-secondary/10 hover:bg-secondary text-secondary hover:text-slate-900 border border-secondary/20 rounded-[10px] text-[9px] font-black uppercase tracking-widest transition-all">
                  OBJAVI
               </button>
            </div>
         </div>
      </div>

      <div className="relative pl-5 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/10 z-10">
         {feedItems.length === 0 ? (
           <div className="text-center py-8">
             <span className="material-symbols-outlined text-3xl text-white/10 mb-2 block">radio_button_unchecked</span>
             <p className="text-[11px] font-bold text-white/30">Nema aktivnosti danas.</p>
           </div>
         ) : (
           feedItems.map((item) => (
            <div key={item.id} className="relative z-10 group">
               <div className={`absolute -left-[24px] top-1.5 w-2.5 h-2.5 rounded-full ${item.bg} ring-4 ring-[#0A0F14] group-hover:scale-125 transition-transform`}></div>
               
               <div className="flex flex-col gap-1.5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors p-3 rounded-[10px] border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-mono font-bold text-white/40">{item.time}</span>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.action}</span>
                     {item.alert && <span className="bg-red-500/10 text-red-500 text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest border border-red-500/20">HITNO</span>}
                  </div>
                  <span className="text-xs font-sans font-medium text-white/80 leading-relaxed pr-2">{item.desc}</span>
                  {item.site && (
                    <span className="text-[9px] font-bold text-white/30 flex items-center gap-1 mt-1 uppercase tracking-wider">
                       <span className="material-symbols-outlined text-[10px]">location_on</span> {item.site}
                    </span>
                  )}
               </div>
            </div>
           ))
         )}
      </div>
      
      <button 
          onClick={() => setIsHistoryModalOpen(true)}
          className="w-full mt-6 bg-transparent border border-white/5 hover:border-white/20 text-white/50 hover:text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-[10px] transition-all flex items-center justify-center gap-2 z-10 cursor-pointer"
      >
          UČITAJ SVE REKORDE
      </button>
    </div>
  );
}
