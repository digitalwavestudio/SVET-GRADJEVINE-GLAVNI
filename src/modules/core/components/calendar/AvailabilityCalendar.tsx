import { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay, parseISO } from 'date-fns';
import { srLatn } from 'date-fns/locale';

export type DateStatus = 'free' | 'busy' | 'maintenance';

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  status: DateStatus;
}

interface AvailabilityCalendarProps {
  mode: 'view' | 'edit';
  events?: CalendarEvent[];
  onEventsChange?: (events: CalendarEvent[]) => void;
  onBookRequest?: (startDate: Date, endDate: Date) => void;
}

export function AvailabilityCalendar({
  mode = 'view',
  events = [],
  onEventsChange,
  onBookRequest
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<DateStatus>('busy');

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
  }, [currentMonth]);

  const eventMap = useMemo(() => {
    const map = new Map<string, DateStatus>();
    events.forEach(e => map.set(e.date, e.status));
    return map;
  }, [events]);

  const getStatusForDate = (date: Date): DateStatus => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return eventMap.get(dateStr) || 'free';
  };

  const handleMouseDown = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return; // Can't select past
    setSelectionStart(date);
    setSelectionEnd(date);
    setIsDragging(true);
  };

  const handleMouseEnter = (date: Date) => {
    if (isDragging && selectionStart) {
      if (isBefore(date, startOfDay(new Date()))) return;
      setSelectionEnd(date);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (mode === 'edit' && selectionStart && selectionEnd && onEventsChange) {
      // Apply selected status to the range
      const start = selectionStart < selectionEnd ? selectionStart : selectionEnd;
      const end = selectionStart > selectionEnd ? selectionStart : selectionEnd;
      
      const rangeDocs = eachDayOfInterval({ start, end });
      const newEvents = [...events];
      
      rangeDocs.forEach(d => {
        const dStr = format(d, 'yyyy-MM-dd');
        // Remove existing
        const idx = newEvents.findIndex(e => e.date === dStr);
        if (idx >= 0) newEvents.splice(idx, 1);
        
        if (activeTab !== 'free') {
          newEvents.push({ date: dStr, status: activeTab });
        }
      });
      
      onEventsChange(newEvents);
    }
  };

  const handleBookClick = () => {
    if (selectionStart && selectionEnd && onBookRequest) {
      const start = selectionStart < selectionEnd ? selectionStart : selectionEnd;
      const end = selectionStart > selectionEnd ? selectionStart : selectionEnd;
      onBookRequest(start, end);
    }
  };

  const isInSelection = (date: Date) => {
    if (!selectionStart || !selectionEnd) return false;
    const start = selectionStart < selectionEnd ? selectionStart : selectionEnd;
    const end = selectionStart > selectionEnd ? selectionStart : selectionEnd;
    return date >= start && date <= end;
  };

  return (
    <div className="bg-[#0A1015] border border-white/10 rounded-[10px] overflow-hidden select-none" onMouseLeave={handleMouseUp} onMouseUp={handleMouseUp}>
      <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Dostupnost i Rezervacije</h3>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
              {mode === 'edit' ? 'Obeležite zauzete i slobodne kapacitete' : 'Proverite slobodne termine za angažovanje'}
            </p>
          </div>
        </div>

        {mode === 'edit' && (
          <div className="flex bg-[#05080A] rounded-[8px] p-1 border border-white/5">
            <button
              onClick={() => setActiveTab('busy')}
              className={`px-4 py-2 rounded-[6px] text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'busy' 
                  ? 'bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Zauzeto
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 rounded-[6px] text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'maintenance' 
                  ? 'bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Servis
            </button>
            <button
              onClick={() => setActiveTab('free')}
              className={`px-4 py-2 rounded-[6px] text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'free' 
                  ? 'bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Slobodno
            </button>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-black text-white uppercase tracking-widest">
            {format(currentMonth, 'LLLL yyyy', { locale: srLatn })}
          </h4>
          <div className="flex gap-2">
            <button 
              onClick={prevMonth}
              className="w-8 h-8 rounded-[6px] bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextMonth}
              className="w-8 h-8 rounded-[6px] bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'].map(day => (
            <div key={day} className="text-center text-[10px] font-black text-white/40 uppercase tracking-widest py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2 relative">
          {/* Empty days offset */}
          {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square opacity-20 pointer-events-none" />
          ))}

          {daysInMonth.map((date) => {
            const isSelected = isInSelection(date);
            const status = getStatusForDate(date);
            const isPast = isBefore(date, startOfDay(new Date()));
            
            let bgClass = 'bg-[#05080A] hover:bg-white/5';
            let textClass = 'text-white/70';
            let indicatorClass = '';

            if (isPast) {
              bgClass = 'bg-transparent';
              textClass = 'text-white/20';
            } else if (isSelected) {
              bgClass = 'bg-secondary/20';
              textClass = 'text-secondary font-black';
            } else if (status === 'busy') {
              bgClass = 'bg-red-500/10';
              textClass = 'text-red-400 font-bold';
              indicatorClass = 'bg-red-500';
            } else if (status === 'maintenance') {
              bgClass = 'bg-orange-500/10';
              textClass = 'text-orange-400 font-bold';
              indicatorClass = 'bg-orange-500';
            } else {
              indicatorClass = 'bg-green-500/30';
            }

            return (
              <div
                key={date.toString()}
                onMouseDown={() => handleMouseDown(date)}
                onMouseEnter={() => handleMouseEnter(date)}
                className={`aspect-square rounded-[8px] flex flex-col items-center justify-center relative cursor-pointer transition-all border border-transparent ${
                  isSelected ? 'border-secondary/30 ring-2 ring-secondary/20' : 'hover:border-white/10'
                } ${bgClass}`}
              >
                <span className={`text-xs md:text-sm ${textClass}`}>
                  {format(date, 'd')}
                </span>
                
                {isToday(date) && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-secondary rounded-full"></div>
                )}
                
                {!isPast && status === 'free' && mode === 'edit' && !isSelected && (
                   <div className="absolute bottom-[4px] w-1 h-1 rounded-full bg-green-500/30"></div>
                )}
                
                {!isPast && status !== 'free' && !isSelected && (
                   <div className={`absolute bottom-[4px] w-1.5 h-1.5 rounded-full ${indicatorClass} shadow-[0_0_8px_currentColor]`}></div>
                )}

              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-4 mt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500/50"></span>
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Slobodno</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Angažovano</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Servis / Odsustvo</span>
            </div>
        </div>

        {/* View Mode Footer actions */}
        {mode === 'view' && selectionStart && selectionEnd && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-secondary/5 border border-secondary/20 rounded-[8px] flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div>
              <span className="block text-[10px] font-bold text-secondary/60 uppercase tracking-widest mb-1">Odabrani period:</span>
              <span className="text-sm font-black text-secondary tracking-tight">
                {format(selectionStart < selectionEnd ? selectionStart : selectionEnd, 'dd.MM')} - {format(selectionStart > selectionEnd ? selectionStart : selectionEnd, 'dd.MM.yyyy')}
              </span>
            </div>
            <button 
              onClick={handleBookClick}
              className="w-full md:w-auto px-6 py-3 bg-secondary !text-black font-black text-[10px] uppercase tracking-widest rounded-[6px] hover:bg-yellow-400 transition-colors shadow-[0_0_20px_rgba(254,191,13,0.15)] flex items-center justify-center gap-2"
            >
              <MessageSquare size={14} />
              Pošalji Upit za Ove Datume
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
