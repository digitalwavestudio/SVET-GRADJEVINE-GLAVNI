import React from 'react';

interface CalendarEvent {
  id?: string;
  day: number;
  month: number;
  year: number;
  endDay?: number;
  title: string;
  type: string;
  color?: string;
  hasAlarm?: boolean;
}

interface CalendarGridProps {
  days: number[];
  monthEvents: CalendarEvent[];
  getShiftedDay: (day: number) => number;
  aiShift: number;
  weather: Record<number, { icon: string, temp: number, risk: boolean, msg?: string }>;
  isDaySelected: (day: number) => boolean;
  selectedDay: number | null;
  isDragging: boolean;
  currentMonthLabel: string;
  siteMetrics: {
    activeWorkers: number;
    totalWorkers: number;
    dailyCost: number;
  };
  diaryLogs: Record<number, string>;
  handleMouseDown: (day: number) => void;
  handleMouseEnter: (day: number) => void;
  handleMouseUp: () => void;
}

export function CalendarGrid({
  days,
  monthEvents,
  getShiftedDay,
  aiShift,
  weather,
  isDaySelected,
  selectedDay,
  isDragging,
  currentMonthLabel,
  siteMetrics,
  diaryLogs,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp
}: CalendarGridProps) {
  return (
    <div className="lg:col-span-3 bg-[#0A0F14] border border-white/5 rounded-[10px] p-10">
      <div className="grid grid-cols-7 gap-4 mb-8">
        {['PON', 'UTO', 'SRE', 'ČET', 'PET', 'SUB', 'NED'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-white/20 tracking-widest uppercase">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-4" onMouseLeave={() => isDragging && handleMouseUp()}>
        {days.map(day => {
          const shiftedDay = getShiftedDay(day);
          const dayEvents = monthEvents.filter(e => {
            const start = getShiftedDay(e.day);
            const end = e.endDay ? getShiftedDay(e.endDay) : start;
            return day >= start && day <= end;
          });
          
          const isConflict = aiShift > 0 && day > 15 && day <= 15 + aiShift;
          const dayWeather = weather[day as keyof typeof weather];
          const selected = isDaySelected(day);

          return (
            <div 
              key={day} 
              onMouseDown={() => handleMouseDown(day)}
              onMouseEnter={() => handleMouseEnter(day)}
              onMouseUp={handleMouseUp}
              className={`aspect-square rounded-[10px] border transition-all relative group cursor-pointer flex flex-col p-3 gap-1 ${
                selected ? 'border-secondary bg-secondary/10' : 
                isConflict ? 'border-error/50 bg-error/5' : 
                dayEvents.length > 0 ? 'bg-white/[0.02] border-white/10' : 'border-white/5'
              } hover:border-secondary/30 hover:z-50`}
            >
              {/* Unified Hover Insight Card */}
              <div className="hidden group-hover:flex absolute bottom-[calc(100%+10px)] left-[calc(100%-20px)] w-[280px] bg-slate-900/80 backdrop-blur-3xl rounded-[10px] border border-white/10 p-6 flex-col gap-4 z-[200] shadow-[0_40px_80px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out origin-bottom-left">
                 <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{day}. {currentMonthLabel}</span>
                       <span className="text-sm font-black text-white uppercase tracking-tighter">OPERATIVNI IZVEŠTAJ</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       <span className="text-[9px] font-black text-emerald-500 uppercase">Live</span>
                    </div>
                 </div>

                 {/* Gazdinski Metrics Snasphot */}
                 <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-[10px]">
                       <span className="text-[7px] font-black text-white/30 uppercase tracking-widest block mb-1">RADNA SNAGA</span>
                       <div className="text-sm font-black text-white">{siteMetrics?.activeWorkers} <span className="text-[8px] opacity-40">MAJSTORA</span></div>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-[10px]">
                       <span className="text-[7px] font-black text-white/30 uppercase tracking-widest block mb-1">DNEVNI TROŠAK</span>
                       <div className="text-sm font-black text-emerald-400">{siteMetrics?.dailyCost}€</div>
                    </div>
                 </div>

                 {dayWeather?.risk && (
                    <div className="bg-error/30 border border-error/40 p-4 rounded-[10px] flex flex-col gap-1 border-l-4">
                       <div className="flex items-center gap-2 text-white">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          <span className="text-[9px] font-black uppercase tracking-widest">METEO ALARM</span>
                       </div>
                       <span className="text-[11px] font-black text-white leading-tight uppercase italic">{dayWeather.msg}</span>
                    </div>
                 )}

                 {dayEvents.length > 0 && (
                    <div className="flex flex-col gap-3">
                       <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">LOGISTIKA & AKTIVNOSTI</span>
                       <div className="space-y-2">
                          {dayEvents.map((e, idx) => (
                             <div key={idx} className="flex items-center gap-3 bg-white/[0.03] p-2 rounded-[10px] border border-white/5">
                                <div className={`w-1.5 h-6 rounded-full shrink-0 ${
                                   e.type === 'phase' ? (e.color || 'bg-secondary') :
                                   e.type === 'interview' ? 'bg-blue-500' :
                                   e.type === 'site' ? 'bg-cyan-500' :
                                   e.type === 'payment' ? 'bg-emerald-500' :
                                   e.type === 'bill' ? 'bg-orange-500' : 'bg-green-500'
                                }`} />
                                <div className="flex flex-col overflow-hidden flex-1">
                                   <span className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{e.title}</span>
                                   <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{e.type === 'site' ? 'LOGISTIKA' : e.type}</span>
                                </div>
                                {e.hasAlarm && (
                                  <span className="material-symbols-outlined text-[14px] text-yellow-400 animate-pulse shrink-0">notifications_active</span>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {diaryLogs[day] && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                       <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">IZVOD IZ DNEVNIKA</span>
                          <span className="material-symbols-outlined text-[12px] text-white/20">history_edu</span>
                       </div>
                       <p className="text-[10px] font-medium text-white/60 leading-relaxed italic line-clamp-2 bg-white/5 p-3 rounded-[10px] border border-white/5">
                          "{diaryLogs[day]}"
                       </p>
                    </div>
                 )}

                 <div className="absolute -bottom-2 left-6 w-4 h-4 bg-slate-900/60 backdrop-blur-3xl rotate-45 border-r border-b border-white/10"></div>
              </div>

              {dayWeather && (
                <div className="absolute top-2 right-2 group-hover:opacity-0 transition-opacity">
                  <span className={`material-symbols-outlined text-[14px] ${dayWeather.risk ? 'text-error animate-pulse' : 'text-white/40'}`}>
                    {dayWeather.icon}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black ${
                    dayEvents.length > 0 ? 'text-secondary' : 
                    isConflict ? 'text-error' : 'text-white/20'
                  }`}>
                    {day}
                  </span>
                  {dayEvents.some(e => e.hasAlarm) && (
                    <span className="material-symbols-outlined text-[14px] text-yellow-400 animate-pulse">notifications_active</span>
                  )}
                  {isConflict && <span className="text-[8px] font-black text-error/60 tracking-wider">CONFLICT</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-auto">
                {dayEvents.map((e, i) => {
                  const isStart = day === getShiftedDay(e.day);
                  return (
                    <div 
                      key={i} 
                      className={`w-full group/event relative ${
                        e.type === 'phase' ? 'h-3 rounded-[10px] ' + (e.color || 'bg-secondary') : 'h-1.5 rounded-full'
                      } ${
                        e.type === 'interview' ? 'bg-blue-500' : 
                        e.type === 'site' ? 'bg-secondary' : 
                        e.type === 'payment' ? 'bg-emerald-500' :
                        e.type === 'bill' ? 'bg-orange-500' : 
                        e.type === 'meeting' ? 'bg-green-500' : ''
                      }`}
                    >
                      {e.type === 'payment' && isStart && (
                        <span className="material-symbols-outlined text-[10px] absolute -top-4 left-0 text-emerald-500">payments</span>
                      )}
                      {e.type === 'bill' && isStart && (
                        <span className="material-symbols-outlined text-[10px] absolute -top-4 left-0 text-orange-500">receipt_long</span>
                      )}
                      {e.type === 'phase' && isStart && (
                        <span className="absolute left-2 top-0 text-[7px] font-black !text-black truncate max-w-full">
                          {e.title}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {isDragging && selected && (
                <div className="absolute inset-0 bg-secondary/5 pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
