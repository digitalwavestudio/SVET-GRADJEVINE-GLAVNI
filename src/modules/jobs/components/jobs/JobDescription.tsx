import React from 'react';

interface JobDescriptionProps {
  jobData: any;
}

export function JobDescription({ jobData }: JobDescriptionProps) {
  return (
    <article itemScope itemProp="description" aria-label="Detaljan opis posla" className="bg-surface-container-high rounded-[10px] border-l-[3px] border-secondary p-8 shadow-lg">
      <h3 className="text-xl font-black text-white mb-6 font-headline flex items-center gap-3 uppercase">
        <span className="material-symbols-outlined text-secondary" aria-hidden="true">description</span>
        Opis oglasa
      </h3>
      <div className="text-on-surface-variant leading-relaxed space-y-4">
        <p className="whitespace-pre-wrap">{jobData.description}</p>
        {jobData.responsibilities?.length > 0 && (
          <section aria-labelledby="zaduženja-nadlov">
            <h4 id="zaduženja-nadlov" className="text-white font-bold pt-4 uppercase text-sm tracking-widest">Glavna zaduženja:</h4>
            <ul className="space-y-3" itemProp="responsibilities">
              {jobData.responsibilities.map((resp: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-secondary mt-1" aria-hidden="true">•</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {jobData.requirements?.length > 0 && (
          <section aria-labelledby="kvalifikacije-nadlov">
            <h4 id="kvalifikacije-nadlov" className="text-white font-bold pt-4 uppercase text-sm tracking-widest">Potrebne kvalifikacije:</h4>
            <ul className="space-y-3" itemProp="experienceRequirements">
              {jobData.requirements.map((req: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-1" aria-hidden="true">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
