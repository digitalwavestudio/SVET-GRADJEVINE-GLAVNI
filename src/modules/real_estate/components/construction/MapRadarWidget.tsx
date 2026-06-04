import React, { RefObject } from 'react';
import { AnimatePresence } from 'motion/react';
import { WorkerStatus } from '@/src/modules/real_estate/components/construction/types';

interface MapRadarWidgetProps {
  workers: WorkerStatus[];
  workerToMove: string | null;
  setWorkerToMove: React.Dispatch<React.SetStateAction<string | null>>;
  mapRef: RefObject<HTMLDivElement | null>;
  handleMapClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  getHours: (inTime?: string, outTime?: string) => number;
}

export function MapRadarWidget({
  workers,
  workerToMove,
  setWorkerToMove,
  mapRef,
  handleMapClick,
  getHours
}: MapRadarWidgetProps) {
  return (
    <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 lg:p-10 shadow-2xl flex flex-col mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            RADARSKO STANJE / ZONA GRADILIŠTA
          </h2>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Live praćenje pozicija radnika i mehanizacije</p>
        </div>
        
        <div className="flex gap-4 bg-[#070B0F] p-2 rounded-[10px] border border-white/5">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/5 rounded-[10px]">
             <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
             <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Aktivni</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary/5 rounded-[10px]">
             <div className="w-2 h-2 bg-secondary rounded-full shadow-[0_0_10px_rgba(247,150,26,0.5)]"></div>
             <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Mehanizacija</span>
          </div>
        </div>
      </div>

      {/* Stylized Map Container */}
      <div 
        ref={mapRef} 
        onClick={handleMapClick}
        className={`flex-1 min-h-[450px] bg-[#070B0F] border border-white/5 rounded-[10px] relative overflow-hidden group/map ${workerToMove ? 'cursor-crosshair ring-2 ring-brand-yellow/50' : 'cursor-default transition-all duration-500'}`}
      >
        {workerToMove && (
            <div className="absolute top-0 left-0 w-full p-2 bg-brand-yellow/10 border-b border-brand-yellow/20 text-brand-yellow text-[10px] uppercase text-center z-40 font-bold tracking-widest pointer-events-none">
              KLIKNI NA MAPU ZA PROMENU POZICIJE KADRA
            </div>
        )}
        
        {/* Grid Background */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Radar Sweepers / Aesthetics */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-white/5 rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full pointer-events-none opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/10 rounded-full pointer-events-none opacity-20"></div>
        
        {/* Radar Beam Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
          <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0%,rgba(34,197,94,0.05)_50%,transparent_100%)] animate-[spin_10s_linear_infinite]"></div>
        </div>

        {/* Blueprint Building Shapes - DYNAMIC */}
        <div className="absolute top-[15%] left-[25%] w-56 h-36 border-2 border-dashed border-secondary/20 bg-secondary/5 rounded-[10px] flex flex-col items-center justify-center group/obj transition-all hover:bg-secondary/10 hover:border-secondary/40">
           <span className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.3em] rotate-[-5deg] group-hover/obj:text-secondary group-hover/obj:rotate-0 transition-all">OBJEKAT A</span>
           <span className="text-[8px] font-bold text-secondary/20 uppercase tracking-widest mt-1">GLAVNA STRUKTURA</span>
        </div>
        
        <div className="absolute bottom-[20%] right-[20%] w-40 h-56 border-2 border-dashed border-white/10 bg-white/[0.02] rounded-[10px] flex flex-col items-center justify-center group/obj transition-all hover:bg-white/[0.05] hover:border-white/20">
           <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] rotate-[10deg] group-hover/obj:text-white/40 group-hover/obj:rotate-0 transition-all">OBJEKAT B</span>
           <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest mt-1">POMOĆNI ANEKS</span>
        </div>

        <div className="absolute top-[40%] right-[10%] w-32 h-32 border-2 border-dashed border-blue-500/20 bg-blue-500/5 rounded-full flex flex-col items-center justify-center group/obj transition-all hover:bg-blue-500/10 hover:border-blue-500/40">
           <span className="text-[9px] font-black text-blue-500/30 uppercase tracking-[0.2em] group-hover/obj:text-blue-500 transition-all">BAZEN / SPA</span>
        </div>

        {/* UPLOADER NA MAPI - PRAVA OPCIJA */}
        <div className="absolute bottom-6 left-6 z-20">
          <button className="bg-[#131920]/80 backdrop-blur-md border border-white/10 p-4 rounded-[10px] flex items-center gap-4 hover:bg-white/5 transition-all group/upload shadow-2xl">
            <div className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center group-hover/upload:bg-green-500 transition-all">
              <span className="material-symbols-outlined text-white group-hover/upload:text-black">3d_rotation</span>
            </div>
            <div className="text-left">
              <span className="text-[10px] font-black text-white uppercase tracking-widest block">Učitaj 3D Model Terena</span>
              <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest">DRONE SCAN / LiDAR (.obj, .fbx)</span>
            </div>
          </button>
        </div>

        {/* Workers Pins */}
        <AnimatePresence>
          {workers.map(worker => {
            if (!worker.isPresent || !worker.location) return null;
            const hours = getHours(worker.checkIn, worker.checkOut);
            
            return (
              <div
                key={worker.id}
                onClick={(e) => { e.stopPropagation(); setWorkerToMove(worker.id); }}
                className={`absolute group z-10 -ml-2 -mt-2 ${workerToMove === worker.id ? 'ring-2 ring-brand-yellow ring-offset-2 ring-offset-[#111] rounded-full' : 'cursor-pointer hover:scale-110 transition-transform'}`}
                style={{ left: `${worker.location.x}%`, top: `${worker.location.y}%` }}
              >
                {/* Pulse effect */}
                <div className="absolute -inset-2 bg-green-500/20 rounded-full animate-ping"></div>
                
                {/* Pin */}
                <div className="relative w-4 h-4 rounded-full border-2 border-[#070B0F] shadow-lg bg-green-500 group-hover:bg-white transition-colors"></div>

                {/* Tooltip visible on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
                  <div className="bg-[#141B23] border border-white/10 py-3 px-4 rounded-[10px] shadow-xl w-max flex flex-col items-center backdrop-blur-sm">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{worker.name}</span>
                    <span className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-0.5">{worker.profession}</span>
                    
                    <div className="mt-2 pt-2 border-t border-white/10 w-full grid grid-cols-2 gap-4 text-center">
                       <div>
                         <span className="text-[8px] text-white/30 block mb-0.5 font-bold">START</span>
                         <span className="text-[10px] font-black text-white">{worker.checkIn || '--:--'}</span>
                       </div>
                       <div>
                         <span className="text-[8px] text-white/30 block mb-0.5 font-bold">RADOVI</span>
                         <span className="text-[10px] font-black text-white">{hours > 0 ? hours.toFixed(1) + 'h' : '0h'}</span>
                       </div>
                    </div>
                  </div>
                  {/* Tooltip triangle */}
                  <div className="w-3 h-3 bg-[#141B23] border-b border-r border-white/10 mx-auto transform rotate-45 translate-y-[-6px]"></div>
                </div>
              </div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
