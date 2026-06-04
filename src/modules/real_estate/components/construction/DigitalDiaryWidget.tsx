import React from 'react';
import { WorkerStatus } from '@/src/modules/real_estate/components/construction/types';

interface DigitalDiaryWidgetProps {
  workers: WorkerStatus[];
  updateWorker: (id: string, field: keyof WorkerStatus, value: unknown) => Promise<void>;
  getHours: (inTime?: string, outTime?: string) => number;
  handleAddWorker: () => void;
}

export function DigitalDiaryWidget({
  workers,
  updateWorker,
  getHours,
  handleAddWorker
}: DigitalDiaryWidgetProps) {
  return (
    <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden shadow-2xl mb-8">
      <div className="p-6 md:p-8 flex justify-between items-center bg-[#070B0F]/50 border-b border-white/5">
         <h2 className="text-lg font-black uppercase tracking-widest">
           DIGITALNI DNEVNIK I OBRAČUN
         </h2>
         <button className="px-5 py-2.5 bg-secondary text-slate-950 hover:bg-yellow-400 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-secondary/10">
           <span className="material-symbols-outlined text-[16px]">download</span>
           <span className="hidden sm:inline">IZVEZI ZA KNJIGOVOĐU</span>
         </button>
      </div>

      <div className="flex flex-col">
          {/* HEADER ROD - SKRIVEN NA MOBILNOM */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="col-span-3 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">RADNIK & ZVANJE</div>
              <div className="col-span-1 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-center">PRISUTNOST</div>
              <div className="col-span-2 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-center">VREME</div>
              <div className="col-span-3 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">DNEVNI OPIS RADOVA</div>
              <div className="col-span-1 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-right">SAT.</div>
              <div className="col-span-1 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-right">SATI</div>
              <div className="col-span-1 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-right">DNEVNICA</div>
          </div>

          {/* LISTA RADNIKA */}
          <div className="flex flex-col divide-y divide-white/5 bg-[#070B0F]/30 lg:bg-transparent p-4 lg:p-0 gap-4 lg:gap-0">
            {workers.map(worker => {
              const hours = worker.isPresent ? getHours(worker.checkIn, worker.checkOut) : 0;
              const earned = worker.hourlyRate * hours;

              return (
                <div key={worker.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-4 lg:px-8 py-5 items-center hover:bg-white/[0.02] transition-colors relative group bg-[#0A0F14] lg:bg-transparent rounded-[10px] lg:rounded-none border border-white/5 lg:border-none p-4 lg:p-0 shadow-lg lg:shadow-none">
                    
                    {/* Status bar indikator levo (samo na desktopu je full height, na mobilnom je bedž) */}
                    <div className={`hidden lg:block absolute left-0 top-0 bottom-0 w-1 ${worker.isPresent ? 'bg-secondary' : 'bg-transparent'}`}></div>

                    {/* RADNIK HEADER (Mobile & Desktop) */}
                    <div className="col-span-1 lg:col-span-3 flex justify-between items-start lg:flex-col lg:gap-1">
                      <div className="flex flex-col gap-1 w-full relative pl-3 lg:pl-0">
                         {/* Mobile status indicator */}
                         <div className={`lg:hidden absolute left-0 top-0.5 bottom-0.5 w-1 rounded-full ${worker.isPresent ? 'bg-secondary' : 'bg-white/10'}`}></div>
                         
                         <input 
                           type="text"
                           value={worker.name}
                           onChange={(e) => updateWorker(worker.id, 'name', e.target.value)}
                           placeholder="Ime i prezime"
                           className={`font-black text-sm lg:text-xs uppercase tracking-wider bg-transparent border-none outline-none placeholder:text-white/20 focus:text-secondary w-full ${worker.isPresent ? 'text-white' : 'text-white/40'}`}
                         />
                         <input 
                           type="text"
                           value={worker.profession}
                           onChange={(e) => updateWorker(worker.id, 'profession', e.target.value)}
                           placeholder="Zanimanje"
                           className="text-[10px] lg:text-[9px] font-bold text-white/40 uppercase tracking-widest bg-transparent border-none outline-none placeholder:text-white/20 focus:text-white/80 w-full"
                         />
                      </div>

                      {/* STATUS TOGGLE na mobilnom ide gore desno */}
                      <div className="lg:hidden flex items-center shrink-0">
                          <button 
                              onClick={() => updateWorker(worker.id, 'isPresent', !worker.isPresent)}
                              className={`w-12 h-6 rounded-full relative transition-colors ${worker.isPresent ? 'bg-secondary shadow-[0_0_10px_rgba(255,204,0,0.3)]' : 'bg-[#131920] border border-white/10'}`}
                          >
                              <div className={`w-4 h-4 rounded-full absolute top-1 transition-all ${worker.isPresent ? 'left-7 bg-slate-900' : 'left-1 bg-white/30'}`}></div>
                          </button>
                      </div>
                    </div>

                    {/* STATUS TOGGLE (Desktop) */}
                    <div className="hidden lg:flex col-span-1 lg:col-span-1 justify-start lg:justify-center">
                        <button 
                            onClick={() => updateWorker(worker.id, 'isPresent', !worker.isPresent)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${worker.isPresent ? 'bg-secondary' : 'bg-white/10'}`}
                        >
                            <div className={`w-4 h-4 bg-slate-900 rounded-full absolute top-1 transition-all ${worker.isPresent ? 'left-7 bg-slate-900' : 'left-1 bg-white/50'}`}></div>
                        </button>
                    </div>

                    {/* VREME I SATI (Mobile Wrapper) */}
                    <div className="col-span-1 lg:col-span-2 flex flex-row justify-between items-center lg:bg-transparent p-3 lg:p-0 rounded-[10px] lg:rounded-none border lg:border-transparent">
                        {/* VREME */}
                        <div className={`flex items-center lg:justify-center ${!worker.isPresent ? 'opacity-30 grayscale' : ''}`}>
                           <input 
                               type="text" 
                               maxLength={5}
                               placeholder="07:00"
                               value={worker.isPresent ? worker.checkIn : ''} 
                               disabled={!worker.isPresent}
                               onChange={(e) => updateWorker(worker.id, 'checkIn', e.target.value)}
                               className="w-10 lg:w-11 bg-transparent text-center text-[13px] font-mono font-black text-white outline-none disabled:cursor-not-allowed placeholder:text-white/20 hover:bg-white/5 focus:bg-white/10 rounded py-1 transition-all"
                           />
                           <span className="text-white/20 font-black mx-1">-</span>
                           <input 
                               type="text" 
                               maxLength={5}
                               placeholder="17:00"
                               value={worker.isPresent ? worker.checkOut : ''} 
                               disabled={!worker.isPresent}
                               onChange={(e) => updateWorker(worker.id, 'checkOut', e.target.value)}
                               className="w-10 lg:w-11 bg-transparent text-center text-[13px] font-mono font-black text-white outline-none disabled:cursor-not-allowed placeholder:text-white/20 hover:bg-white/5 focus:bg-white/10 rounded py-1 transition-all"
                           />
                        </div>
                        
                        {/* SATI MOBILNI - Desktop ga ima dole, pa ga ovde skrivamo na LG */}
                        <div className="lg:hidden flex flex-col items-end">
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">Sati</span>
                            <span className={`font-mono text-sm leading-none ${worker.isPresent && hours > 0 ? 'text-white font-bold' : 'text-white/20'}`}>
                                {hours > 0 ? hours.toFixed(1) + 'h' : '-'}
                            </span>
                        </div>
                    </div>

                    {/* OPIS RADOVA */}
                    <div className="col-span-1 lg:col-span-3 pb-2 lg:pb-0">
                        <span className="lg:hidden text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1 block">Opis radova</span>
                        <div className={`w-full ${!worker.isPresent ? 'opacity-30' : ''}`}>
                           <input 
                               type="text" 
                               value={worker.isPresent ? worker.workDescription : ''}
                               disabled={!worker.isPresent}
                               onChange={(e) => updateWorker(worker.id, 'workDescription', e.target.value)}
                               placeholder={worker.isPresent ? "Unesi detaljan opis radova . . ." : "Odsutan"}
                               className="w-full bg-transparent text-[11px] lg:text-xs font-sans font-medium text-white/80 placeholder:text-white/20 hover:text-white focus:text-white outline-none disabled:cursor-not-allowed transition-all py-1.5 hover:bg-white/5 focus:bg-white/10 rounded px-2"
                           />
                        </div>
                    </div>
                    
                    {/* FINANSIJE (Mobile Footer) */}
                    <div className="col-span-1 lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4 pt-4 lg:pt-0 border-t border-white/5 lg:border-none mt-2 lg:mt-0 items-center">
                        {/* SATNICA input */}
                        <div className="flex flex-col lg:flex-row lg:justify-end lg:items-center w-full lg:col-span-1">
                            <span className="lg:hidden text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5 block">Satnica</span>
                            <div className={`flex items-center lg:justify-end bg-[#131920]/80 border border-white/5 rounded-[10px] px-3 py-2 shadow-inner focus-within:border-secondary focus-within:bg-white/[0.04] transition-all w-full lg:w-auto ${!worker.isPresent ? 'opacity-30' : ''}`}>
                               <input 
                                   type="number"
                                   value={worker.hourlyRate}
                                   onChange={(e) => updateWorker(worker.id, 'hourlyRate', Number(e.target.value))}
                                   disabled={!worker.isPresent}
                                   className="w-full lg:w-12 bg-transparent lg:text-right text-[13px] font-mono font-black text-secondary outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                               />
                               <span className="text-[10px] font-bold text-white/30 ml-2 uppercase shrink-0">€/h</span>
                            </div>
                        </div>

                        {/* SATI (Samo na Desktopu jer je na mobilnom gore pored vremena) */}
                        <div className="hidden lg:flex lg:justify-end lg:items-center lg:col-span-1">
                            <span className={`font-mono text-[14px] text-right ${worker.isPresent && hours > 0 ? 'text-white font-bold' : 'text-white/20'}`}>
                                {hours > 0 ? hours.toFixed(1) + 'h' : '-'}
                            </span>
                        </div>

                        {/* DNEVNICA */}
                        <div className="flex flex-col lg:flex-row lg:justify-end lg:items-center w-full lg:col-span-1 text-right">
                            <span className="lg:hidden text-[8px] font-black text-secondary/30 uppercase tracking-[0.2em] mb-1.5 block">Dnevnica</span>
                            <span className={`font-mono text-lg lg:text-[14px] tracking-wide ${worker.isPresent && earned > 0 ? 'text-secondary font-black drop-shadow-[0_0_8px_rgba(255,204,0,0.3)]' : 'text-white/20 font-bold'}`}>
                                {earned > 0 ? `€${earned.toFixed(2)}` : '-'}
                            </span>
                        </div>
                    </div>

                </div>
              );
            })}

            {/* DODAJ RADNIKA DUGME / RED */}
            <button 
              onClick={handleAddWorker}
              className="w-full py-6 text-center hover:bg-white/[0.02] transition-colors group cursor-pointer bg-[#0A0F14] lg:bg-transparent rounded-[10px] lg:rounded-none border border-white/5 lg:border-none shadow-lg lg:shadow-none mb-4 lg:mb-0"
            >
                <span className="text-[10px] font-black text-secondary/50 group-hover:text-secondary uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  DODAJ NOVOG RADNIKA U DNEVNIK
                </span>
            </button>
          </div>
      </div>
    </div>
  );
}
