import { motion } from 'motion/react';
import { DashboardLayout } from '@/src/modules/core';

export default function SupportPage() {
  const faqs = [
    { q: 'KAKO DA POSTAVIM OGLAS?', a: 'IDITE NA STRANICU "NOVI OGLAS", POPUNITE PODATKE I POTVRDITE. VAŠ OGLAS ĆE BITI AKTIVAN NAKON VERIFIKACIJE.' },
    { q: 'DA LI JE CV GENERATOR BESPLATAN?', a: 'DA, SVI REGISTROVANI RADNICI MOGU BESPLATNO KORISTITI GENERATOR I PREUZETI SVOJ CV.' },
    { q: 'KAKO FUNKCIONIŠE SMART MATCH?', a: 'NAŠ AI ANALIZIRA VAŠE VEŠTINE I POREDI IH SA ZAHTEVIMA POSLODAVACA KAKO BI VAM PRUŽIO NAJBOLJE PREPORUKE.' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">CENTAR ZA PODRŠKU</h1>
          <p className="text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">TU SMO DA VAM POMOGNEMO U SVAKOM TRENUTKU</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: 'chat', label: 'LIVE CHAT', desc: 'RAZGOVARAJTE SA AGENTOM' },
            { icon: 'mail', label: 'EMAIL PODRŠKA', desc: 'ODGOVOR U ROKU OD 24H' },
            { icon: 'call', label: 'TELEFON', desc: 'DOSTUPNI 08-16H' },
          ].map((item, i) => (
            <div key={i} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 text-center hover:border-secondary/30 transition-all group cursor-pointer">
              <div className="w-14 h-14 bg-white/5 rounded-[10px] flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary/10 transition-all">
                <span className="material-symbols-outlined text-white/20 group-hover:text-secondary text-2xl transition-all">{item.icon}</span>
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">{item.label}</h3>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-10">ČESTO POSTAVLJANA PITANJA</h3>
          <div className="space-y-8">
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-3">
                <h4 className="text-xs font-black text-secondary uppercase tracking-tight">{faq.q}</h4>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary rounded-[10px] p-12 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.1] blur-[100px] -mr-32 -mt-32"></div>
          <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase mb-4">NISTE PRONAŠLI ODGOVOR?</h3>
          <p className="text-slate-950/60 text-xs font-bold uppercase tracking-widest mb-8">POŠALJITE NAM DIREKTAN UPIT I NAŠ TIM ĆE VAS KONTAKTIRATI.</p>
          <a href="/kontakt" className="inline-block bg-slate-950 text-secondary font-black px-12 py-5 rounded-[10px] hover:bg-slate-900 transition-all text-[10px] tracking-[0.2em] uppercase shadow-2xl">
            KONTAKTIRAJTE NAS
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
