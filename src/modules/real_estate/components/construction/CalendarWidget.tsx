import React from 'react';
import { WorkerStatus, CalendarEvent, DayData } from '@/src/modules/real_estate/components/construction/types';

interface CalendarWidgetProps {
  emptyStartDays: null[];
  daysArray: number[];
  date: Date;
  selectedDay: number;
  workers: WorkerStatus[];
  historicalData: Record<number, DayData>;
  totalDailyCost: number;
  totalHours: number;
  events: CalendarEvent[];
  getShiftedDay: (day: number) => number;
  isPast: (day: number) => boolean;
  isToday: (day: number) => boolean;
  isFuture: (day: number) => boolean;
  handleDayClick: (day: number, dayData: DayData | null, dayEvents: CalendarEvent[]) => void;
  estimatedMonthly: number;
}

export const CalendarWidget = React.memo(function CalendarWidget({
  emptyStartDays,
  daysArray,
  date,
  selectedDay,
  workers,
  historicalData,
  totalDailyCost,
  totalHours,
  events,
  getShiftedDay,
  estimatedMonthly,
  handleDayClick
}: CalendarWidgetProps) {
  const activeWorkers = React.useMemo(() => workers.filter(w => w.isPresent).length, [workers]);
  
  const eventsByDay = React.useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    daysArray.forEach(day => map[day] = []);
    events.forEach(e => {
      const start = getShiftedDay(e.day);
      const end = e.endDay ? getShiftedDay(e.endDay) : start;
      for (let day = start; day <= end; day++) {
        if (map[day]) map[day].push(e);
      }
    });
    return map;
  }, [events, daysArray, getShiftedDay]);

  return (
    <div className="flex-1 lg:w-[70%] flex flex-col gap-6">
      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 lg:p-8">
        <div className="grid grid-cols-7 gap-3 mb-6">
          {['PON', 'UTO', 'SRE', 'ČET', 'PET', 'SUB', 'NED'].map(d => (
            <div key={d} className="text-center text-[9px] font-black text-white/20 tracking-[0.2em] uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {emptyStartDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-[10px] p-2"></div>
          ))}
          {daysArray.map((day) => {
            const isToday = day === date.getDate();
            const isPast = day < date.getDate();
            const isFuture = day > date.getDate();
            const dayOfWeek = new Date(date.getFullYear(), date.getMonth(), day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isSelected = selectedDay === day;
            const dayData = isPast ? historicalData[day] : (isToday ? { cost: totalDailyCost, hours: totalHours, isAnomaly: false, isMilestone: false, workerCount: activeWorkers } : null);

            const dayEvents = eventsByDay[day] || [];

            let bgClass = 'bg-[#0A0F14]/30 border border-white/5 hover:border-white/10';
            let transformClass = '';
            
            if (dayData && dayData.cost > 0) {
                bgClass = 'bg-gradient-to-br from-[#1A222C] to-[#0A0F14] border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.8)]';
                transformClass = 'hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(0,0,0,0.9)]';
            }
            
            if (isWeekend && !dayData?.cost && !isToday) bgClass = 'bg-[#030507]/60 border border-transparent opacity-40';
            
            if (isToday) {
                bgClass = 'bg-gradient-to-br from-[#243142] to-[#121A24] border border-white/20 border-t-white/30 border-b-black shadow-[0_15px_30px_rgba(0,0,0,0.9)] z-10';
                transformClass = 'scale-[1.04] hover:scale-[1.06]';
            }
            
            if (isSelected && !isToday) {
                bgClass = 'bg-gradient-to-br from-[#131E2A] to-[#0A0F14] border-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.15)] z-10';
                transformClass = 'scale-[1.02] -translate-y-1';
            }

            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day, dayData, dayEvents)}
                className={`aspect-square rounded-[10px] p-2 sm:p-3 flex flex-col justify-between transition-all duration-300 ${dayData?.cost || isToday ? 'cursor-pointer' : ''} ${bgClass} ${transformClass}`}
              >
                <div className="flex justify-between items-start w-full">
                    <span className={`text-xs md:text-sm font-black ${isToday ? 'text-white drop-shadow-md' : isSelected ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : dayData?.cost || dayEvents.length > 0 ? 'text-white/80' : isWeekend ? 'text-white/20' : 'text-white/40'}`}>
                        {day}
                    </span>
                    <div className="flex gap-1">
                        {dayData?.isAnomaly && <span title="Upozorenje" className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>}
                        {dayData?.isMilestone && <span title="Milestone" className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>}
                        {dayEvents.some(e => e.type === 'phase') && <span title="Aktivna Faza" className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(247,150,26,0.5)]"></span>}
                    </div>
                </div>
                
                <div className="flex flex-col gap-0.5 items-end mt-auto w-full">
                  {dayData && dayData.cost > 0 ? (
                    <>
                      <div className="flex w-full justify-between items-end mb-0.5">
                        <span className={`flex items-center gap-0.5 text-[8px] md:text-[10px] font-black tracking-widest ${isSelected ? 'text-cyan-400/80' : isToday ? 'text-white/70' : 'text-white/40'}`}>
                          <span className="material-symbols-outlined text-[10px] md:text-[12px]">group</span>
                          {dayData.workerCount}
                        </span>
                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-cyan-400' : 'text-white/50'}`}>
                          {dayData.hours.toFixed(0)}h
                        </span>
                      </div>
                      <span className={`text-base md:text-xl font-black leading-none tracking-tighter ${isSelected ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-white/90'}`}>
                        {dayData.cost.toFixed(0)} <span className="text-[8px] md:text-[10px] font-bold opacity-40">EUR</span>
                      </span>
                    </>
                  ) : isFuture || (!dayData?.cost) ? (
                    <>
                      <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">- h</span>
                      <span className="text-xs md:text-sm font-black text-white/10 leading-tight">-</span>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mesečni Total Ispod Kalendara */}
      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 lg:p-8 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-[-50%] right-[10%] w-64 h-64 bg-cyan-400/5 blur-3xl rounded-full pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <span className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40"><span className="material-symbols-outlined text-2xl">account_balance_wallet</span></span>
            <span className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase block">UKUPAN TROŠAK<br/>{date.toLocaleString('sr-Latn', { month: 'long' })}</span>
          </div>
          <span className="text-3xl md:text-5xl font-black text-white tracking-tighter line-clamp-1 relative z-10">
          {Math.round(estimatedMonthly).toLocaleString('de-DE')} <span className="text-lg md:text-xl font-black opacity-30 text-white">EUR</span>
          </span>
      </div>
    </div>
  );
});
