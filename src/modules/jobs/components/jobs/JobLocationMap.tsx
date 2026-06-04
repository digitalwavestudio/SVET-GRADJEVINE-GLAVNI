import React from 'react';

export function JobLocationMap({ jobData }: { jobData: any }) {
  return (
    <div className="bg-surface-container-high rounded-[10px] overflow-hidden border border-white/5 group shadow-lg">
      <div className="h-80 w-full bg-surface relative">
        <iframe 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no" 
          marginHeight={0} 
          marginWidth={0} 
          src={`https://maps.google.com/maps?q=${encodeURIComponent(jobData.tacnaLokacija || jobData.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
          className="absolute inset-0 grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700"
          title="Mesto rada"
        ></iframe>
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"></div>
      </div>
      <div className="p-6">
        <div className="bg-surface-container-highest p-6 rounded-[10px] flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-white font-black text-lg mb-1 uppercase tracking-tight">Lokacija gradilišta</h4>
            <p className="text-on-surface-variant text-sm uppercase font-bold">{jobData.tacnaLokacija || jobData.location}</p>
          </div>
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(jobData.tacnaLokacija || jobData.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto bg-secondary text-on-secondary font-black px-8 py-3 rounded-[10px] flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all shadow-lg"
          >
            <span className="material-symbols-outlined">directions</span>
            ZAPOČNI NAVIGACIJU
          </a>
        </div>
      </div>
    </div>
  );
}
