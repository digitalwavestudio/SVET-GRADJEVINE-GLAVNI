import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { CalendarWidget } from '@/src/modules/real_estate/components/construction/CalendarWidget';
import { DayReportModal } from '@/src/modules/real_estate/components/construction/DayReportModal';
import { LiveHistoryModal } from '@/src/modules/real_estate/components/construction/LiveHistoryModal';
import { NewProjectWizard } from '@/src/modules/real_estate/components/construction/NewProjectWizard';
import { PayrollModal } from '@/src/modules/real_estate/components/construction/PayrollModal';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { useConstructionSite } from '@/src/modules/real_estate/hooks/useConstructionSiteNode';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/apiClient';

import { ConstructionStatsGrid } from '@/src/modules/real_estate/components/construction/ConstructionStatsGrid';
import { WeatherConditionsWidget } from '@/src/modules/real_estate/components/construction/WeatherConditionsWidget';
import { MapRadarWidget } from '@/src/modules/real_estate/components/construction/MapRadarWidget';
import { DigitalDiaryWidget } from '@/src/modules/real_estate/components/construction/DigitalDiaryWidget';
import { MachineryWidget } from '@/src/modules/real_estate/components/construction/MachineryWidget';
import { ZonePlanAndNotesWidget } from '@/src/modules/real_estate/components/construction/ZonePlanAndNotesWidget';
import { PayrollWidget } from '@/src/modules/real_estate/components/construction/PayrollWidget';
import { PortfolioGridWidget } from '@/src/modules/real_estate/components/construction/PortfolioGridWidget';
import { LiveFeedWidget } from '@/src/modules/real_estate/components/construction/LiveFeedWidget';

import { WorkerStatus, ResourceStatus, CalendarEvent, DayData } from '@/src/modules/real_estate/components/construction/types';

export default function ConstructionSitePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const [activeSiteId, setActiveSiteId] = useState('');
  
  const { data: constructionData, isLoading: loading, error: fetchError, refetch } = useConstructionSite(user, activeSiteId);
  const sites = React.useMemo(() => constructionData?.sites || [], [constructionData]);
  const events = React.useMemo(() => constructionData?.events || [], [constructionData]);
  const diaryLogs = React.useMemo(() => constructionData?.diaryLogs || {}, [constructionData]);
  const siteWorkers = React.useMemo(() => constructionData?.siteWorkers || {}, [constructionData]);
  const siteResources = React.useMemo(() => constructionData?.siteResources || {}, [constructionData]);
  const siteMetrics = React.useMemo(() => constructionData?.siteMetrics || {}, [constructionData]);

  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editSiteName, setEditSiteName] = useState('');

  useEffect(() => {
    if (sites.length > 0 && !activeSiteId) {
      setActiveSiteId(sites[0].id);
    }
  }, [sites, activeSiteId]);

  const updateQueryCache = (updater: (oldData: any) => any) => {
    queryClient.setQueriesData<any>({ queryKey: ['construction', 'all-data'] }, (old: any) => {
      if (!old) return old;
      return updater({ ...old });
    });
  };

  const updateWorkerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<WorkerStatus> }) => {
      return apiClient.put(`/construction/${activeSiteId}/workers/${id}`, data);
    },
    onSuccess: (responseData: any, variables) => {
      updateQueryCache((old) => {
        const workers = old.siteWorkers[activeSiteId] || [];
        const updatedWorkers = workers.map((w: any) => w.id === variables.id ? { ...w, ...variables.data } : w);
        return {
          ...old,
          siteWorkers: {
            ...old.siteWorkers,
            [activeSiteId]: updatedWorkers
          }
        };
      });
    }
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ResourceStatus> }) => {
      return apiClient.put(`/construction/${activeSiteId}/resources/${id}`, data);
    },
    onSuccess: (responseData: any, variables) => {
      updateQueryCache((old) => {
        const resources = old.siteResources[activeSiteId] || [];
        const updatedResources = resources.map((r: any) => r.id === variables.id ? { ...r, ...variables.data } : r);
        return {
          ...old,
          siteResources: {
            ...old.siteResources,
            [activeSiteId]: updatedResources
          }
        };
      });
    }
  });

  const addResourceMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/construction/${activeSiteId}/resources`, {
        type: 'MEHANIZACIJA',
        name: 'NOVI RESURS',
        amount: 1,
        unit: 'h',
        unitPrice: 0
      });
    },
    onSuccess: (newResource: any) => {
      updateQueryCache((old) => {
        const resources = old.siteResources[activeSiteId] || [];
        return {
          ...old,
          siteResources: {
            ...old.siteResources,
            [activeSiteId]: [...resources, newResource]
          }
        };
      });
    }
  });

  const removeResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/construction/${activeSiteId}/resources/${id}`);
    },
    onSuccess: (responseData: any, id) => {
      updateQueryCache((old) => {
        const resources = old.siteResources[activeSiteId] || [];
        const filteredResources = resources.filter((r: any) => r.id !== id);
        return {
          ...old,
          siteResources: {
            ...old.siteResources,
            [activeSiteId]: filteredResources
          }
        };
      });
    }
  });

  const deleteSiteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/construction/${id}`);
    },
    onSuccess: (data, id) => {
      if (activeSiteId === id) setActiveSiteId('ALL');
      queryClient.invalidateQueries({ queryKey: ['construction', 'all-data'] });
    }
  });

  const [newSiteName, setNewSiteName] = useState('');

  const addSiteMutation = useMutation({
    mutationFn: async () => {
      const siteName = newSiteName.trim() || `NOVA LOKACIJA ${sites.length + 1}`;
      return apiClient.post<any>(`/construction/sites`, {
        site: { name: siteName, address: '', description: '' }
      });
    },
    onSettled: (data) => {
      if (data?.id) setActiveSiteId(data.id);
      setIsNewProjectModalOpen(false);
      setNewProjectStep(1);
      setNewSiteName('');
      queryClient.invalidateQueries({ queryKey: ['construction', 'all-data'] });
    }
  });

  const updateSiteMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => {
      return apiClient.patch(`/construction/${id}`, { name });
    },
    onSuccess: (responseData: any, variables) => {
      updateQueryCache((old) => {
        const updatedSites = old.sites.map((s: any) => s.id === variables.id ? { ...s, name: variables.name } : s);
        return {
          ...old,
          sites: updatedSites
        };
      });
    }
  });

  const saveDiaryMutation = useMutation({
    mutationFn: async ({ day, content }: { day: number, content: string }) => {
      return apiClient.post(`/calendar/diary`, {
        day,
        month: today.getMonth(),
        year: today.getFullYear(),
        content
      });
    }
  });

  const addWorkerMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/construction/${activeSiteId}/workers`, {
        name: 'NOVI RADNIK',
        profession: 'RADNIK',
        isPresent: true,
        checkIn: '07:00',
        checkOut: '17:00',
        hourlyRate: 5,
        workDescription: '',
        location: { x: 50, y: 80 }
      });
    },
    onSuccess: (newWorker: any) => {
      updateQueryCache((old) => {
        const workers = old.siteWorkers[activeSiteId] || [];
        return {
          ...old,
          siteWorkers: {
            ...old.siteWorkers,
            [activeSiteId]: [...workers, newWorker]
          }
        };
      });
    }
  });

  const updateMetricsMutation = useMutation({
    mutationFn: async (metrics: any) => {
      return apiClient.post('/construction/metrics', { ...metrics, siteId: activeSiteId });
    }
  });

  // Moving state
  const [workerToMove, setWorkerToMove] = useState<string | null>(null);

  // Helper da bezbedno vadimo trenutne radnike
  const workers = siteWorkers[activeSiteId] || [];
  const resources = siteResources[activeSiteId] || [];

  const updateResource = async (id: string, field: keyof ResourceStatus, value: unknown) => {
    if (!activeSiteId) return;
    updateResourceMutation.mutate({ id, data: { [field]: value } });
  };

  const handleAddResource = async () => {
    addResourceMutation.mutate();
  };
  
  const handleRemoveResource = async (id: string) => {
    removeResourceMutation.mutate(id);
  };
  
  // Računanje sati ... (Ovo ostaje isto)
  const getHours = (inTime?: string, outTime?: string) => {
    if (!inTime || !outTime) return 0;
    
    // Helper funkcija da izvuče sate i minute iz bilo kakvog formata ('8', '08', '8:30', '1630')
    const parseTime = (timeStr: string) => {
      const cleanTime = timeStr.trim();
      if (cleanTime.includes(':')) {
        const parts = cleanTime.split(':');
        return { h: Number(parts[0]), m: Number(parts[1] || 0) };
      } else {
        const numPattern = Number(cleanTime);
        if(!isNaN(numPattern)) {
           // Ako neko ukuca nešto suludo poput 1630 bez dvotačke:
           if(numPattern >= 100) { // To mora da znaci '16' i '30' npr.
              const srtNum = cleanTime.toString();
              let h,m;
              if (srtNum.length === 3) {
                  // npr 830 -> 8:30
                  h = Number(srtNum.substring(0, 1));
                  m = Number(srtNum.substring(1));
              } else if (srtNum.length === 4) {
                  // npr 1630 -> 16:30
                  h = Number(srtNum.substring(0, 2));
                  m = Number(srtNum.substring(2));
              } else {
                  return { h: 0, m: 0 }; // Ako lik kuca 5 karaktera haosa.
              }
              // Normalizacija za matematički raspon časova
              return { h: Math.min(h, 24), m: Math.min(m, 59) };
           }

           // Ako neko ukuca samo 8, 15... (Sati max do 24, inace izbaci grešku)
           return { h: Math.min(numPattern, 24), m: 0 };
        }
        return {h: 0, m: 0};
      }
    };

    const inData = parseTime(inTime);
    const outData = parseTime(outTime);
    
    if (isNaN(inData.h) || isNaN(inData.m) || isNaN(outData.h) || isNaN(outData.m)) return 0;
    
    const inTotalHours = inData.h + inData.m / 60;
    const outTotalHours = outData.h + outData.m / 60;
    
    let diff = outTotalHours - inTotalHours;
    // Ako je razlika negativna, prosla je ponoc (nocna smena)
    if (diff < 0) {
      diff += 24;
    }
    
    // Maksimum sati po danu u fizickom svetu provere, ne dajte mu više od 24h
    if (diff > 24) return 0; 
    return diff > 0 ? diff : 0;
  };

  const updateWorker = async (id: string, field: keyof WorkerStatus, value: unknown) => {
    if (!activeSiteId) return;
    updateWorkerMutation.mutate({ id, data: { [field]: value } });
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!workerToMove || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;

    newX = Math.max(2, Math.min(98, newX));
    newY = Math.max(2, Math.min(98, newY));

    updateWorker(workerToMove, 'location', { x: newX, y: newY });
    setWorkerToMove(null); // Završeno premeštanje
  };

  const handleDeleteSite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Da li ste sigurni da želite da obrišete ovo gradilište?')) {
      deleteSiteMutation.mutate(id);
    }
  };

  const currentSite = sites.find(s => s.id === activeSiteId) || sites[0];
  const isAllSites = activeSiteId === 'ALL';

  const handleAddSite = () => {
    setIsNewProjectModalOpen(true);
    setNewProjectStep(1);
  };

  const confirmAddSite = async () => {
    addSiteMutation.mutate();
  };

  const saveEditName = async (id: string) => {
    updateSiteMutation.mutate({ id, name: editSiteName || 'BEZ IMENA' });
    setEditingSiteId(null);
  };

  const allWorkers = Object.values(siteWorkers).flat();
  const allResources = Object.values(siteResources).flat();
  
  const activeWorkersArray = isAllSites ? allWorkers : workers;
  const activeResourcesArray = isAllSites ? allResources : resources;

  const activeCount = activeWorkersArray.filter(w => w.isPresent).length;
  const totalWorkersCount = activeWorkersArray.length;

  const workersCost = activeWorkersArray.reduce((acc, w) => acc + (w.isPresent && w.checkIn && w.checkOut ? w.hourlyRate * getHours(w.checkIn, w.checkOut) : 0), 0);
  const resourcesCost = activeResourcesArray.reduce((acc, r) => acc + (r.amount * r.unitPrice), 0);
  const totalDailyCost = workersCost + resourcesCost;

  // SAVE METRICS TO FIRESTORE FOR GLOBAL CALENDAR SYNC (DEBOUNCED)
  useEffect(() => {
    if (!user) return;
    
    const metrics = {
      totalWorkers: totalWorkersCount,
      activeWorkers: activeCount,
      dailyCost: totalDailyCost,
    };
    
    const handler = setTimeout(async () => {
      updateMetricsMutation.mutate(metrics);
    }, 3000);
    
    localStorage.setItem(`site_metrics_${user.id}`, JSON.stringify(metrics));
    window.dispatchEvent(new Event('storage'));
    
    return () => clearTimeout(handler);
  }, [totalWorkersCount, activeCount, totalDailyCost, user]);

  const saveDiaryEntry = async (day: number, content: string) => {
    saveDiaryMutation.mutate({ day, content });
  };

  // Mesečna projekcija i arhiviranje (Kapacitet prošlih dana)
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date());
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  
  const [localDiaryText, setLocalDiaryText] = useState('');
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setLocalDiaryText(diaryLogs[selectedDay] || '');
  }, [selectedDay, diaryLogs]);

  const handleDiaryChange = (val: string) => {
    setLocalDiaryText(val);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      saveDiaryEntry(selectedDay, val);
    }, 1000);
  };

  // MODAL I RASPON (OBRAČUN) STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectStep, setNewProjectStep] = useState(1);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(today.getDate());

  useEffect(() => {
    if (isNewProjectModalOpen || isModalOpen || isPayrollModalOpen || isHistoryModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isNewProjectModalOpen, isModalOpen, isPayrollModalOpen, isHistoryModalOpen]);

  // HISTORICAL DATA — stvarni podaci sa servera
  const historicalData = React.useMemo(() => {
    const data: Record<number, { cost: number, hours: number, isAnomaly: boolean, isMilestone: boolean, workerCount: number }> = {};
    const metrics = activeSiteId && activeSiteId !== 'ALL' ? (siteMetrics[activeSiteId] || []) : [];
    const todayDate = today.getDate();
    for (let i = 1; i < todayDate; i++) {
      const metric = metrics.find((m: any) => m.day === i);
      if (metric && metric.dailyCost != null) {
        data[i] = {
          cost: metric.dailyCost,
          hours: metric.totalHours || 0,
          isAnomaly: metric.isAnomaly || false,
          isMilestone: metric.isMilestone || false,
          workerCount: metric.activeWorkers || 0,
        };
      } else {
        data[i] = { cost: 0, hours: 0, isAnomaly: false, isMilestone: false, workerCount: 0 };
      }
    }
    return data;
  }, [siteMetrics, activeSiteId, today]);

  const pastSum = Object.values(historicalData).reduce((acc: number, curr: DayData) => acc + curr.cost, 0);
  const avgDailyCost = today.getDate() > 1 ? Math.round(pastSum / (today.getDate() - 1)) : totalDailyCost;
  const estimatedMonthly = pastSum + totalDailyCost + (avgDailyCost * (daysInMonth - today.getDate()));

  // Formatiranje dana za "TROŠAK"
  const daysSrFull = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
  const dateStr = `${daysSrFull[today.getDay()]} ${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Kalendar Mreža Logic
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Ponedeljak = 0
  const emptyStartDays = React.useMemo(() => Array.from({ length: startDayIndex }, (_, i) => null), [startDayIndex]);
  const daysArray = React.useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const weekDaysStrs = ['PO', 'UT', 'SR', 'ČE', 'PE', 'SU', 'NE'];

  // Računanje ukupnog broja sati za Kalendar Widget
  const totalHours = activeWorkersArray.reduce((acc, w) => acc + (w.isPresent && w.checkIn && w.checkOut ? getHours(w.checkIn, w.checkOut) : 0), 0);

  // Dodavanje novog radnika
  const handleAddWorker = async () => {
    addWorkerMutation.mutate();
  };

  // Real chart data izračunat iz stvarnih radnika i resursa
  const avgHourlyRate = activeWorkersArray.reduce((acc, w) => acc + (w.hourlyRate || 0), 0) / (activeWorkersArray.length || 1);
  const plannedDaily = Math.round(8 * activeWorkersArray.length * avgHourlyRate);
  const currentDayOfWeek = today.getDay(); // 0=Ned, 1=Pon... 6=Sub
  const dayNames = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
  const chartData = dayNames.map((day, i) => ({
    day,
    planned: (i === 0 || i === 6) ? 0 : plannedDaily,
    actual: i === currentDayOfWeek ? totalDailyCost : 0,
  }));

  // AI Smart Insights — računati iz stvarnih podataka
  const smartInsights = React.useMemo(() => {
    const insights: { id: number; type: string; text: string; icon: string; color: string; bg: string; border: string; }[] = [];
    const totalHours = activeWorkersArray.reduce((acc, w) => acc + (w.isPresent && w.checkIn && w.checkOut ? getHours(w.checkIn, w.checkOut) : 0), 0);
    if (totalDailyCost > plannedDaily && plannedDaily > 0) {
      insights.push({ id: 1, type: 'warning', text: `Današnja potrošnja (${totalDailyCost} rsd) premašuje plan (${plannedDaily} rsd).`, icon: 'warning', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' });
    }
    if (totalHours > activeWorkersArray.length * 10) {
      insights.push({ id: 2, type: 'warning', text: `Zabeleženi prekovremeni sati (${Math.round(totalHours)}h za ${activeWorkersArray.length} radnika).`, icon: 'schedule', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' });
    }
    if (activeWorkersArray.length === 0 && !isAllSites) {
      insights.push({ id: 3, type: 'critical', text: 'Nema radnika na gradilištu danas.', icon: 'group_off', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' });
    }
    if (totalDailyCost > 0 && totalDailyCost <= plannedDaily) {
      insights.push({ id: 4, type: 'good', text: `Potrošnja je u okviru plana (${totalDailyCost} rsd od ${plannedDaily} rsd).`, icon: 'trending_down', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' });
    }
    if (insights.length === 0) {
      insights.push({ id: 5, type: 'info', text: 'Sistem radi normalno. Nema odstupanja za prikaz.', icon: 'info', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' });
    }
    return insights;
  }, [activeWorkersArray, totalDailyCost, plannedDaily, isAllSites, getHours]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
        
        {fetchError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500">error_outline</span>
              <p className="text-[11px] font-black text-red-500 uppercase tracking-widest">Nismo mogli da učitamo podatke. Pokušaj ponovo.</p>
            </div>
            <button onClick={() => refetch()} className="px-4 py-2 bg-red-500/20 text-red-500 text-[9px] font-black rounded-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">POKUŠAJ PONOVO</button>
          </div>
        )}

        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-secondary text-2xl">radar</span>
              <h1 className="text-2xl md:text-4xl font-headline font-black uppercase tracking-tighter">
                NADZORNI CENTAR
              </h1>
            </div>
            <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
              KONTROLA GRADILIŠTA I LISTA PRISUTNOSTI RADNIKA
            </p>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-[10px] border border-white/10 overflow-x-auto w-full md:w-auto items-center">
            <button 
              onClick={() => refetch()}
              disabled={loading}
              className="px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors flex items-center justify-center border-r border-white/5"
              title="Osveži podatke"
            >
              <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <button 
              onClick={() => {
                setActiveSiteId('ALL');
                setEditingSiteId(null);
              }}
              className={`flex items-center gap-2 min-w-max px-6 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all ${
                isAllSites ? 'bg-secondary text-slate-950 shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-[14px]">🌍</span> SVA GRADILIŠTA
            </button>
            <div className="w-px h-6 bg-white/10 mx-2 hidden md:block"></div>
            {sites.map(site => (
              <button 
                key={site.id}
                onClick={() => {
                  if (activeSiteId !== site.id) {
                    setActiveSiteId(site.id);
                    setEditingSiteId(null);
                  }
                }}
                className={`flex items-center gap-2 min-w-max px-6 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeSiteId === site.id ? 'bg-secondary text-slate-950 shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {editingSiteId === site.id ? (
                  <input
                    autoFocus
                    value={editSiteName}
                    onChange={(e) => setEditSiteName(e.target.value)}
                    onBlur={() => saveEditName(site.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditName(site.id);
                    }}
                    className="bg-transparent border-b border-slate-950/30 outline-none text-center w-32"
                  />
                ) : (
                  <>
                    {site.name}
                    {activeSiteId === site.id && (
                      <div className="flex items-center gap-1 ml-1">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditSiteName(site.name);
                            setEditingSiteId(site.id);
                          }}
                          className="material-symbols-outlined text-[14px] opacity-50 hover:opacity-100 cursor-pointer"
                        >
                          edit
                        </span>
                        <span 
                          onClick={(e) => handleDeleteSite(site.id, e)}
                          className="material-symbols-outlined text-[14px] text-error opacity-50 hover:opacity-100 cursor-pointer"
                        >
                          close
                        </span>
                      </div>
                    )}
                  </>
                )}
              </button>
            ))}
            <button 
              onClick={handleAddSite}
              className="px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-xl">add</span>
            </button>
          </div>
        </div>

        {/* Stats Grid - Novi Raspored */}
        <ConstructionStatsGrid 
          isAllSites={isAllSites}
          currentSiteName={currentSite?.name}
          activeCount={activeCount}
          totalWorkersCount={totalWorkersCount}
          totalDailyCost={totalDailyCost}
          estimatedMonthly={estimatedMonthly}
          dateStr={dateStr}
        />

        {/* VIZUELNA ANALITIKA I AI FEED */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] shadow-2xl relative overflow-hidden flex flex-col h-full min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">monitoring</span>
                <h3 className="text-sm font-black uppercase tracking-widest leading-none">ANALITIKA POTROŠNJE (7 DANA)</h3>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white/20"></span> <span className="text-[10px] uppercase font-bold text-white/50">Planirano</span></div>
                 <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-400"></span> <span className="text-[10px] uppercase font-bold text-white/50">Ostvareno</span></div>
              </div>
            </div>
            <div className="flex-1 w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#ffffff', opacity: 0.3, fontSize: 10, fontWeight: 700}} dy={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0F14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="planned" stroke="#ffffff" strokeOpacity={0.2} strokeWidth={2} fillOpacity={1} fill="url(#colorPlanned)" />
                  <Area type="monotone" dataKey="actual" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-1 bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] shadow-2xl relative overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-secondary animate-pulse">memory</span>
              <h3 className="text-sm font-black uppercase tracking-widest leading-none">SISTEMSKA OTKRIVANJA</h3>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1">
              {smartInsights.map((insight) => (
                <div key={insight.id} className={`flex items-start gap-3 p-3 rounded-[10px] border ${insight.border} ${insight.bg}`}>
                  <span className={`material-symbols-outlined text-[18px] ${insight.color}`}>{insight.icon}</span>
                  <p className="text-[11px] font-bold text-white/80 leading-relaxed pt-0.5">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* VREMENSKI I TERENSKI USLOVI WIDGET */}
        <WeatherConditionsWidget />

        {/* MAP RADAR SECTION - VRACEN I UNAPREDJEN */}
        {!isAllSites && (
          <MapRadarWidget 
             workers={workers}
             workerToMove={workerToMove}
             setWorkerToMove={setWorkerToMove}
             mapRef={mapRef}
             handleMapClick={handleMapClick}
             getHours={getHours}
          />
        )}

        {/* PORTFOLIO GRID + LIVE FEED - uvek vidljivi */}
        <div className="flex flex-col xl:flex-row gap-6 mt-4">
           <PortfolioGridWidget 
              sites={sites}
              siteWorkers={siteWorkers}
              siteResources={siteResources}
              setActiveSiteId={(id) => setActiveSiteId(id || '')}
              handleAddSite={handleAddSite}
              getHours={getHours}
           />

           <LiveFeedWidget 
              setIsHistoryModalOpen={setIsHistoryModalOpen}
              sites={sites}
              siteWorkers={siteWorkers}
              diaryLogs={diaryLogs}
              events={events}
              today={today}
           />
        </div>

        {/* Site-specific widgets */}
        {!isAllSites && (
          <>
            <DigitalDiaryWidget 
               workers={workers}
               updateWorker={updateWorker}
               getHours={getHours}
               handleAddWorker={handleAddWorker}
            />

            <MachineryWidget 
               resources={resources}
               resourcesCost={resourcesCost}
               updateResource={updateResource}
               handleRemoveResource={handleRemoveResource}
               handleAddResource={handleAddResource}
            />
          </>
        )}

        {/* SECKCIJA ZONA GRADILISTA (PLAN I BELESKE) */}
        <ZonePlanAndNotesWidget 
           activeCount={activeCount}
           activeResourcesArray={activeResourcesArray}
           localDiaryText={localDiaryText}
           handleDiaryChange={handleDiaryChange}
        />

         {/* WIDGETI: KALENDAR I OBRAČUN */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">KALENDAR KADROVA</h1>
              <div className="flex items-center gap-2 text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                PRAĆENJE DNEVNIH I MESEČNIH TROŠKOVA
              </div>
            </div>

            <div className="flex items-center gap-4 bg-[#0A0F14] border border-white/5 rounded-[10px] p-2 shrink-0">
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 hover:bg-white/5 rounded-[10px] transition-all flex"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
              <span className="text-xs font-black tracking-widest uppercase px-4">{viewDate.toLocaleString('sr-Latn', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 hover:bg-white/5 rounded-[10px] transition-all flex"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* LEVA STRANA: KALENDAR */}
            <CalendarWidget
              emptyStartDays={emptyStartDays}
              daysArray={daysArray}
              date={viewDate}
              selectedDay={selectedDay || 0}
              workers={workers}
              historicalData={historicalData}
              totalDailyCost={totalDailyCost}
              totalHours={totalHours}
              events={events}
              getShiftedDay={(day: number) => day}
              estimatedMonthly={estimatedMonthly}
              isPast={React.useCallback((day: number) => day < today.getDate(), [today])}
              isFuture={React.useCallback((day: number) => day > today.getDate(), [today])}
              isToday={React.useCallback((day: number) => day === today.getDate(), [today])}
              handleDayClick={React.useCallback((day: number, dayData: any, dayEvents: any[]) => {
                const isPast = day < today.getDate();
                const isToday = day === today.getDate();
                if (!isPast && !isToday && dayEvents.length === 0) return;
                if (!dayData?.cost && !isToday && dayEvents.length === 0) return; 
                setSelectedDay(day);
                setIsModalOpen(true);
              }, [today])}
            />

            {/* DESNA STRANA: OBRAČUN PLATA */}
            <PayrollWidget 
               date={viewDate}
               rangeStart={rangeStart}
               setRangeStart={setRangeStart}
               rangeEnd={rangeEnd}
               setRangeEnd={setRangeEnd}
               daysArray={daysArray}
               activeWorkersArray={activeWorkersArray}
               setIsPayrollModalOpen={setIsPayrollModalOpen}
            />

          </div>
        </div>

      </div>

      {/* ZAJEDNIČKI WRAPPER ZA SVE MODALE ZBOG ANIMACIJE */}
      <AnimatePresence>
        {/* DAILY REPORT MODAL (ZATAMNJENI MODAL) */}
        <DayReportModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          selectedDay={selectedDay} 
          date={viewDate} 
          events={events} 
          getShiftedDay={(day: number) => day} 
          totalDailyCost={totalDailyCost} 
          historicalData={historicalData} 
          activeWorkersArray={activeWorkersArray} 
          getHours={getHours} 
        />

        {/* PAYROLL MODAL (PLATNI SPISAK) */}
        <PayrollModal 
          isOpen={isPayrollModalOpen} 
          onClose={() => setIsPayrollModalOpen(false)} 
          rangeStart={rangeStart} 
          rangeEnd={rangeEnd} 
          date={viewDate} 
          activeWorkersArray={activeWorkersArray} 
        />

        {/* LIVE HISTORY MODAL (SVI REKORDI) */}
        <LiveHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} />

        {/* NEW PROJECT WIZARD MODAL */}
        <NewProjectWizard 
          isOpen={isNewProjectModalOpen} 
          onClose={() => setIsNewProjectModalOpen(false)} 
          step={newProjectStep} 
          setStep={setNewProjectStep} 
          onConfirm={confirmAddSite}
          siteName={newSiteName}
          onSiteNameChange={setNewSiteName}
        />

      </AnimatePresence>

    </DashboardLayout>
  );
}

