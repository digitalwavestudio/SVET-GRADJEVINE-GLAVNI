import { useState } from 'react';
import { DashboardLayout } from '@/src/modules/core';

export default function DocumentVaultPage() {
  const categories = [
    { id: 'ugovori', name: 'GENERISANI UGOVORI', icon: 'contract' },
    { id: 'bzr', name: 'BZR SERTIFIKATI', icon: 'security' },
    { id: 'licence', name: 'LICENCE', icon: 'workspace_premium' },
    { id: 'dnevnici', name: 'GRAĐEVINSKI DNEVNICI', icon: 'book' },
  ];

  const [active, setActive] = useState('ugovori');

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">DOKUMENTACIJA & TREZOR</h1>
          <p className="text-white/40 font-bold text-xs tracking-[0.2em] uppercase">CENTRALIZOVAN PRISTUP SVIM PRAVNIM AKTIMA</p>
        </div>

        {/* Highlight Alert for Auto-generation */}
        <div className="bg-secondary/10 border border-secondary/20 rounded-[10px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[10px] bg-secondary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary text-2xl">auto_awesome</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-1">AUTOMATSKO GENERISANJE AKTIVNO</h3>
              <p className="text-[10px] font-bold text-white/60 tracking-wider">Kada kandidat u Chat-u klikne "PRIHVATAM", sistem automatski generiše Ugovor o radu/delu i smešta ga u ovu fasciklu.</p>
            </div>
          </div>
          <button className="shrink-0 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black text-white px-6 py-3 rounded-[10px] uppercase tracking-widest transition-colors">
            PODEŠAVANJA TEMPLEJTA
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Folders */}
          <div className="space-y-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[10px] transition-all border ${
                  active === cat.id 
                    ? 'bg-secondary/10 border-secondary/20 text-secondary' 
                    : 'bg-[#0A0F14] border-white/5 text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined">{cat.icon}</span>
                <span className="text-[10px] font-black tracking-widest uppercase text-left">{cat.name}</span>
              </button>
            ))}
            
            <button className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 rounded-[10px] bg-[#0A0F14] border border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/40 transition-all">
              <span className="material-symbols-outlined text-lg">create_new_folder</span>
              <span className="text-[10px] font-black tracking-widest uppercase">NOVI FOLDER</span>
            </button>
          </div>

          {/* Files */}
          <div className="lg:col-span-3 bg-[#0A0F14] rounded-[10px] border border-white/5 p-8 min-h-[500px]">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <h3 className="text-xs font-black text-white/40 tracking-widest uppercase">
                {categories.find(c => c.id === active)?.name} (3 fajla)
              </h3>
              <div className="flex gap-2">
                <button className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-[10px] hover:bg-white/10 transition-colors text-white/40">
                  <span className="material-symbols-outlined text-lg">filter_list</span>
                </button>
                <button className="bg-secondary !text-black text-[10px] font-black tracking-widest uppercase px-6 rounded-[10px] hover:bg-yellow-400 flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-lg">upload</span>
                  OTPREMI
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { name: 'UGOVOR_O_RADU_PETAR_PETROVIC.PDF', date: '16. APR 2024', size: '245 KB', tag: 'AUTO' },
                { name: 'ANEKS_UGOVORA_G_NIKOLIC.PDF', date: '12. APR 2024', size: '1.2 MB' },
                { name: 'UGOVOR_O_DELU_MARKO.PDF', date: '04. APR 2024', size: '420 KB', tag: 'AUTO' },
              ].map((file, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-[10px] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-[10px] flex items-center justify-center">
                      <span className="material-symbols-outlined">picture_as_pdf</span>
                    </div>
                    <div>
                      <div className="text-xs font-black text-white tracking-widest uppercase mb-1 flex items-center gap-2">
                        {file.name}
                        {file.tag && <span className="bg-secondary !text-black px-2 py-0.5 rounded text-[8px]">{file.tag}</span>}
                      </div>
                      <div className="flex text-[9px] font-bold text-white/40 tracking-widest uppercase gap-4">
                        <span>{file.date}</span>
                        <span>{file.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-[10px] hover:bg-white/10 transition-colors text-white">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-[10px] hover:bg-white/10 transition-colors text-secondary">
                      <span className="material-symbols-outlined text-sm">download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
