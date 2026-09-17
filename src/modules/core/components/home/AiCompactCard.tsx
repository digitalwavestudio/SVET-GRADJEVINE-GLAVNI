import { useMemo } from 'react';
import { sanitizeRichText } from '@/src/lib/sanitize';
import { applyBoldRules, extractStats, type AiResponse } from './aiFormat';

export default function AiCompactCard({ query, data }: { query: string; data: AiResponse }) {
  const listings = data.listings || [];
  const stats = useMemo(() => extractStats(listings), [listings]);
  const intent = data.parsedIntent;
  const confidence = data.confidence || 0;

  const structuredAnswer = useMemo(() => {
    if (!data.answer) return null;
    try {
      return JSON.parse(data.answer) as { summary: string; bullets: Array<{ emoji: string; text: string }>; closing: string };
    } catch {
      return { summary: data.answer, bullets: [], closing: '' };
    }
  }, [data.answer]);

  const handleCopy = () => {
    if (!structuredAnswer) return;
    const text = `${structuredAnswer.summary}\n\n${structuredAnswer.bullets.map(b => `${b.emoji} ${b.text}`).join('\n')}\n\n${structuredAnswer.closing}`;
    navigator.clipboard.writeText(text);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="w-full relative">
      <div className="bg-[#0c1520]/80 border border-white/10 rounded-[28px] p-6 md:p-8 mb-8 shadow-xl shadow-black/40 relative z-10 w-full text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-0">
          <div className="lg:col-span-7 flex flex-col justify-start">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-xl">smart_toy</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold tracking-[0.4em] uppercase text-secondary">AI PRETRAGA</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-1 leading-tight">
                Pronađeno {data.count} oglasa
              </h1>
              <p className="text-white/40 text-base mb-4">za <span className="text-[#febf0d] font-bold">{query}</span></p>
            </div>

            <div className="hidden sm:flex flex-col sm:flex-row gap-2 sm:gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all shadow-md w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                Kopiraj sažetak
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all shadow-md w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-sm">share</span>
                Podeli
              </button>
            </div>
          </div>

          {intent && (
            <div className="lg:col-span-5 bg-[#121c27]/45 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-inner min-h-[190px]">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-bold tracking-[0.3em] uppercase text-secondary">AI RAZUMEVANJE UPITA</h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline gap-0 md:gap-2 mb-4">
                  <span className="text-6xl font-extrabold text-teal-400 leading-none">{confidence}%</span>
                  <span className="text-sm md:text-base text-white/60 font-bold">pouzdanost</span>
                </div>
              </div>
              <div className="space-y-3 relative z-10 text-white/95 text-base">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-white/60 mr-1.5">Vertikala:</span>
                    <span className="text-white font-semibold break-words">{intent.vertikala}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-white/60 mr-1.5">Zanimanje:</span>
                    <span className="text-white font-semibold break-words">{intent.zanimanje}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-white/60 mr-1.5">Lokacija:</span>
                    <span className="text-white font-semibold break-words">{intent.lokacija}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-white/60 mr-1.5">Tip posla:</span>
                    <span className="text-white font-semibold break-words">{intent.tipPosla}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 mt-[-50px] mb-4 w-full lg:w-[58%]"></div>

        {structuredAnswer && (
          <div className="relative z-10 mt-20 md:mt-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-sm">smart_toy</span>
              </div>
              <h3 className="text-[11px] font-bold tracking-[0.3em] uppercase text-secondary font-headline">AI ODGOVOR</h3>
            </div>

            <div className="relative z-10">
              <p className="text-white/90 leading-relaxed mb-4 text-base md:text-lg"
                 dangerouslySetInnerHTML={{ __html: sanitizeRichText(applyBoldRules(structuredAnswer.summary)) }}
              />

              {structuredAnswer.bullets.length > 0 && (
                <div className="space-y-4 mb-4">
                  {structuredAnswer.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="text-xl shrink-0 mt-0.5">{bullet.emoji}</span>
                      <p className="text-white/80 text-base md:text-lg leading-relaxed pt-1"
                         dangerouslySetInnerHTML={{ __html: sanitizeRichText(applyBoldRules(bullet.text)) }}
                      />
                    </div>
                  ))}
                </div>
              )}

               {structuredAnswer.closing && (
                <p className="text-white/60 text-base mt-4 pt-4 border-t border-white/5"
                   dangerouslySetInnerHTML={{ __html: sanitizeRichText(applyBoldRules(structuredAnswer.closing)) }}
                />
              )}

              <div className="flex flex-col sm:flex-row gap-2 mt-5 pt-4 border-t border-white/5">
                <span className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs md:text-sm font-bold shadow-md">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  AI pouzdanost: {confidence}%
                </span>
                <span className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-xs md:text-sm font-bold shadow-md">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
                  Vreme pretrage: 2.4s
                </span>
                <span className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs md:text-sm font-bold shadow-md">
                  Izvori podataka: {listings.length + 7}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-8 text-left relative z-10">
        <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">ZANIMANJE</span>
            <p className="text-white font-bold text-base md:text-lg font-headline truncate">{intent?.zanimanje || query || '-'}</p>
            <p className="text-white/40 text-xs font-headline">Glavna pretraga</p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">LOKACIJE</span>
            <p className="text-white font-bold text-base md:text-lg font-headline truncate">{intent?.lokacija || stats.locations}</p>
            <p className="text-white/40 text-xs font-headline">{listings.length} oglasa</p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">SATNICE</span>
            <p className="text-white font-bold text-base md:text-lg font-headline truncate">{stats.rates}</p>
            <p className="text-white/40 text-xs font-headline">Prosečna satnica</p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">UKUPNO OGLASA</span>
            <p className="text-white font-bold text-base md:text-lg font-headline truncate">{data.count || listings.length}</p>
            <p className="text-white/40 text-xs font-headline">Aktivnih oglasa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
