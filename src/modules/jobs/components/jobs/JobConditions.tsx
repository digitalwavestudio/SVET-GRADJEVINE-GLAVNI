import React from 'react';

export function JobConditions({ jobData }: { jobData: any }) {
  return (
    <div className="bg-surface-container-high rounded-[10px] p-8 shadow-lg">
      <h3 className="text-xl font-black text-white mb-6 font-headline flex items-center gap-3 uppercase">
        <span className="material-symbols-outlined text-secondary">fact_check</span>
        Uslovi rada
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12">
        <div className="flex items-center justify-between py-3 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${jobData.rawBenefits?.includes('smestaj') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-error/10 text-error'}`}>
              <span className="material-symbols-outlined text-[18px]">{jobData.rawBenefits?.includes('smestaj') ? 'check' : 'close'}</span>
            </div>
            <span className="text-on-surface-variant font-bold">Smeštaj</span>
          </div>
          <span className={`text-sm font-bold ${jobData.rawBenefits?.includes('smestaj') ? 'text-emerald-400' : 'text-error'}`}>
            {jobData.rawBenefits?.includes('smestaj') ? 'Obezbeđen' : 'Nije obezbeđen'}
          </span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${jobData.rawBenefits?.includes('topli-obrok') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-error/10 text-error'}`}>
              <span className="material-symbols-outlined text-[18px]">{jobData.rawBenefits?.includes('topli-obrok') ? 'check' : 'close'}</span>
            </div>
            <span className="text-on-surface-variant font-bold">Topli obrok</span>
          </div>
          <span className={`text-sm font-bold ${jobData.rawBenefits?.includes('topli-obrok') ? 'text-emerald-400' : 'text-error'}`}>
            {jobData.rawBenefits?.includes('topli-obrok') ? 'Obezbeđen' : 'Nije obezbeđen'}
          </span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${jobData.rawBenefits?.includes('prevoz') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-error/10 text-error'}`}>
              <span className="material-symbols-outlined text-[18px]">{jobData.rawBenefits?.includes('prevoz') ? 'check' : 'close'}</span>
            </div>
            <span className="text-on-surface-variant font-bold">Prevoz</span>
          </div>
          <span className={`text-sm font-bold ${jobData.rawBenefits?.includes('prevoz') ? 'text-emerald-400' : 'text-error'}`}>
            {jobData.rawBenefits?.includes('prevoz') ? 'Plaćen' : 'Nije plaćen'}
          </span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${jobData.rawBenefits?.includes('htz-oprema') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-error/10 text-error'}`}>
              <span className="material-symbols-outlined text-[18px]">{jobData.rawBenefits?.includes('htz-oprema') ? 'check' : 'close'}</span>
            </div>
            <span className="text-on-surface-variant font-bold">Oprema</span>
          </div>
          <span className={`text-sm font-bold ${jobData.rawBenefits?.includes('htz-oprema') ? 'text-emerald-400' : 'text-error'}`}>
            {jobData.rawBenefits?.includes('htz-oprema') ? 'Obezbeđena' : 'Nije obezbeđena'}
          </span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${jobData.rawBenefits?.includes('prijava-ugovor') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-error/10 text-error'}`}>
              <span className="material-symbols-outlined text-[18px]">{jobData.rawBenefits?.includes('prijava-ugovor') ? 'check' : 'close'}</span>
            </div>
            <span className="text-on-surface-variant font-bold">Prijava/Ugovor</span>
          </div>
          <span className={`text-sm font-bold ${jobData.rawBenefits?.includes('prijava-ugovor') ? 'text-emerald-400' : 'text-error'}`}>
            {jobData.rawBenefits?.includes('prijava-ugovor') ? 'Obavezna' : 'Po dogovoru'}
          </span>
        </div>
      </div>
    </div>
  );
}
