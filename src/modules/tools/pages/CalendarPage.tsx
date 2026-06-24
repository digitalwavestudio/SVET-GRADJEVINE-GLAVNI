import { AnimatePresence, motion } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { useCalendarNode } from '@/src/modules/tools/hooks/useCalendarNode';
import { CalendarEventModal } from '@/src/modules/tools/components/calendar/CalendarEventModal';
import { DiaryModal } from '@/src/modules/tools/components/calendar/DiaryModal';
import { PaymentModal } from '@/src/modules/tools/components/calendar/PaymentModal';
import { CalendarGrid } from '@/src/modules/tools/components/calendar/CalendarGrid';
import { CalendarSidebar } from '@/src/modules/tools/components/calendar/CalendarSidebar';
import { CalendarDayModal } from '@/src/modules/tools/components/calendar/CalendarDayModal';

interface CalendarEvent {
  id?: string;
  day: number;
  month: number;
  year: number;
  endDay?: number;
  title: string;
  type: 'interview' | 'site' | 'meeting' | 'phase' | 'payment' | 'bill';
  color?: string;
  hasAlarm?: boolean;
  authorId?: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // April 2026
  const currentMonthLabel = currentDate.toLocaleString('sr-RS', { month: 'long', year: 'numeric' }).toUpperCase();
  
  const {
    events,
    diaryLogs,
    siteMetrics,
    aiShift,
    loading,
    fetchData,
    addCalendarEvent,
    deleteCalendarEvent,
    saveDiaryEntry
  } = useCalendarNode(user?.id, currentDate);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [localDiaryText, setLocalDiaryText] = useState('');
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedDay !== null) {
      setLocalDiaryText(diaryLogs[selectedDay] || '');
    }
  }, [selectedDay, diaryLogs, isDiaryOpen]);

  const handleDiaryChange = (val: string) => {
    setLocalDiaryText(val);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      if (selectedDay !== null) {
        saveDiaryEntry(selectedDay, val);
      }
    }, 1000);
  };

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAlarmDismissed, setIsAlarmDismissed] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState({ day: 1, title: '', type: 'interview' as CalendarEvent['type'] });
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const weather: Record<number, { icon: string, temp: number, risk: boolean, msg?: string }> = {
    3: { icon: 'sunny', temp: 24, risk: false },
    12: { icon: 'cloudy', temp: 18, risk: false },
    15: { icon: 'rainy', temp: 14, risk: true, msg: 'MOGUĆE PADAVINE - RIZIK ZA BETONIRANJE' },
    18: { icon: 'sunny', temp: 22, risk: false },
    22: { icon: 'partly_cloudy_day', temp: 20, risk: false },
    25: { icon: 'storm', temp: 15, risk: true, msg: 'NEVREME - OGRANIČEN RAD NA OTVORENOM' },
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthEvents = (events as any[]).filter((e: any) => e.month === currentDate.getMonth() && e.year === currentDate.getFullYear());

  const handleMouseDown = (day: number) => {
    setDragStart(day);
    setDragEnd(day);
    setIsDragging(true);
  };

  const handleMouseEnter = (day: number) => {
    if (isDragging) setDragEnd(day);
  };

  const handleMouseUp = async () => {
    if (isDragging && dragStart !== null && dragEnd !== null && user) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);
      
      if (start !== end) {
        const phaseName = prompt('KOJA JE OVO FAZA?', 'Nova Faza Radova');
        if (phaseName) {
          try {
            await addCalendarEvent({
              day: start,
              endDay: end,
              month: currentDate.getMonth(),
              year: currentDate.getFullYear(),
              title: phaseName.toUpperCase(),
              type: 'phase',
              color: 'bg-secondary',
              authorId: user.id
            });
          } catch (err) {
            console.error("Error adding event:", err);
          }
        }
      } else {
        setSelectedDay(start);
        setIsModalOpen(true);
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const getShiftedDay = (day: number) => {
    if (day > 15) return day + aiShift;
    return day;
  };

  const isDaySelected = (day: number) => {
    if (!isDragging) return false;
    const start = Math.min(dragStart || 0, dragEnd || 0);
    const end = Math.max(dragStart || 0, dragEnd || 0);
    return day >= start && day <= end;
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">KALENDAR AKTIVNOSTI</h1>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-[10px] text-[9px] font-black text-secondary uppercase tracking-widest">
                PROJEKAT: BELA VILA - SEKTOR A
              </div>
              <div className="flex items-center gap-2 text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE SYNC AKTIVAN
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
             <button 
               onClick={() => fetchData()}
               disabled={loading}
               className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-2 rounded-[10px] flex items-center gap-2 transition-all group active:scale-95 disabled:opacity-50"
             >
               <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>refresh</span>
               <span className="text-[10px] font-black uppercase tracking-widest">Osveži podatke</span>
             </button>
             
             <div className="flex items-center gap-4 bg-[#0A0F14] border border-white/5 rounded-[10px] p-2">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="p-2 hover:bg-white/5 rounded-[10px] transition-all"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-xs font-black tracking-widest uppercase px-4">{currentMonthLabel}</span>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="p-2 hover:bg-white/5 rounded-[10px] transition-all"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <CalendarGrid 
          days={days} 
          monthEvents={monthEvents}
          getShiftedDay={getShiftedDay}
          aiShift={aiShift}
          weather={weather}
          isDaySelected={isDaySelected}
          selectedDay={selectedDay}
          isDragging={isDragging}
          currentMonthLabel={currentMonthLabel}
          siteMetrics={siteMetrics}
          diaryLogs={diaryLogs}
          handleMouseDown={handleMouseDown}
          handleMouseEnter={handleMouseEnter}
          handleMouseUp={handleMouseUp}
        />
        
        <div className="lg:col-span-1">
          <CalendarSidebar
            siteMetrics={siteMetrics}
            events={monthEvents}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            setNewEvent={setNewEvent}
            setIsPaymentModalOpen={setIsPaymentModalOpen}
            setIsEventModalOpen={setIsEventModalOpen}
            setIsDiaryOpen={setIsDiaryOpen}
            setIsModalOpen={setIsModalOpen}
            newEvent={newEvent}
          />
        </div>
      </div>

      <AnimatePresence>
        <CalendarDayModal
          isOpen={isModalOpen}
          selectedDay={selectedDay}
          currentMonthLabel={currentMonthLabel}
          monthEvents={monthEvents}
          getShiftedDay={getShiftedDay}
          deleteCalendarEvent={deleteCalendarEvent as any}
          setIsModalOpen={setIsModalOpen}
          setIsDiaryOpen={setIsDiaryOpen}
        />
      </AnimatePresence>

      {/* Modal: DAN ISPLATE (Quick Payment) */}
      <AnimatePresence>
        <PaymentModal 
          isOpen={isPaymentModalOpen} 
          onClose={() => setIsPaymentModalOpen(false)} 
          newEvent={newEvent} 
          setNewEvent={setNewEvent} 
          onConfirm={async (hasAlarm) => {
            try {
              await addCalendarEvent({
                day: newEvent.day, 
                month: currentDate.getMonth(),
                year: currentDate.getFullYear(),
                title: newEvent.title || 'ISPLATA', 
                type: 'payment',
                hasAlarm,
                authorId: user?.id
              });
              setIsPaymentModalOpen(false);
              setNewEvent({ day: 1, title: '', type: 'interview' as CalendarEvent['type'] });
            } catch (err) {
              console.error("Error adding payment event:", err);
            }
          }} 
        />
      </AnimatePresence>

      {/* ALARM NOTIFICATION SYSTEM (Top Bar) */}
      <AnimatePresence>
        {!isAlarmDismissed && (events as any[]).some((e: any) => e.hasAlarm && (e.day === 18 || e.day === 19 || e.day === 15)) && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md bg-secondary border border-slate-950/20 rounded-[10px] p-6 shadow-2xl flex items-center justify-between pointer-events-auto"
          >
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-950 rounded-[10px] flex items-center justify-center text-secondary animate-bounce">
                   <span className="material-symbols-outlined">notifications_active</span>
                </div>
                <div>
                   <span className="text-[9px] font-black !text-black/40 uppercase tracking-[0.2em] block">AKTIVAN ALARM</span>
                   <span className="text-sm font-black !text-black uppercase tracking-tighter">DANAS JE ROK ZA ISPLATU!</span>
                </div>
             </div>
             <button 
              onClick={() => setIsAlarmDismissed(true)}
              className="bg-slate-950 text-white p-3 rounded-full material-symbols-outlined text-sm hover:scale-110 transition-transform"
             >
               close
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        <DiaryModal 
          isOpen={isDiaryOpen} 
          onClose={() => setIsDiaryOpen(false)} 
          selectedDay={selectedDay} 
          currentMonthLabel={currentMonthLabel} 
          localDiaryText={localDiaryText} 
          handleDiaryChange={handleDiaryChange} 
          onSave={() => {
            if (selectedDay !== null) {
              saveDiaryEntry(selectedDay, localDiaryText);
            }
          }} 
        />
      </AnimatePresence>

      {/* Modal: Brzo Zakazivanje (Dodaj Termin) */}
      <AnimatePresence>
        <CalendarEventModal 
          isOpen={isEventModalOpen} 
          onClose={() => setIsEventModalOpen(false)} 
          newEvent={newEvent} 
          setNewEvent={setNewEvent} 
          currentMonthLabel={currentMonthLabel} 
          onAddEvent={async (hasAlarm) => {
            try {
              await addCalendarEvent({ 
                ...newEvent, 
                month: currentDate.getMonth(),
                year: currentDate.getFullYear(),
                hasAlarm,
                authorId: user?.id
              });
              setIsEventModalOpen(false);
              setNewEvent({ day: 1, title: '', type: 'interview' as CalendarEvent['type'] });
            } catch (err) {
              console.error("Error adding event:", err);
            }
          }} 
        />
      </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

