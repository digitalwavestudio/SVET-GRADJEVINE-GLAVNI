import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardLayout } from '@/src/modules/core';
import { APP_CONFIG } from '@/src/constants/config';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const contactCards = [
    { 
      icon: 'mail', 
      label: 'EMAIL PODRŠKA', 
      value: APP_CONFIG.SUPPORT_EMAIL, 
      desc: 'Odgovaramo u roku od 24h na sva Vaša pitanja i zahteve za tehničku pomoć.',
      action: `mailto:${APP_CONFIG.SUPPORT_EMAIL}`,
      actionLabel: 'POŠALJITE EMAIL'
    },
    { 
      icon: 'call', 
      label: 'TELEFONSKA PODRŠKA', 
      value: '+381 66 275 532', 
      desc: 'Pozovite nas svakog radnog dana za brzu pomoć pri registraciji i oglašavanju.',
      action: 'tel:+38166275532',
      actionLabel: 'POZOVITE NAS'
    },
    { 
      icon: 'schedule', 
      label: 'RADNO VREME KANCELARIJE', 
      value: 'Pon - Pet: 08:00h - 16:00h', 
      desc: 'Naš tim je dostupan za pozive. Vikendom i praznicima koristite isključivo email.',
      action: '/kontakt', // Link to contact form
      actionLabel: 'POGLEDAJTE DETALJE'
    },
  ];

  const faqs = [
    { 
      q: 'Kako funkcioniše verifikacija oglasa i profila?', 
      a: 'Svi oglasi i profili građevinskih firmi i samostalnih majstora prolaze kroz detaljnu manuelnu proveru naših administratora radi sprečavanja prevarnih radnji i osiguranja visokog kvaliteta podataka. Provera se obično završava u roku od nekoliko sati (najkasnije 24 sata). Nakon uspešne verifikacije, Vaš oglas postaje javan, a Vaš profil dobija oznaku poverenja.' 
    },
    { 
      q: 'Koji su uslovi za oglašavanje građevinskih firmi i samostalnih majstora?', 
      a: 'Građevinske firme mogu kreirati detaljne profile sa portfoliom radova, ocenama i aktivnim oglasima za posao. Samostalni majstori mogu kreirati profil gde navode svoje specifične veštine, licencu i dostupnost. Svaki profil dobija besplatne osnovne oglase pri registraciji, dok se napredne funkcije (isticanje oglasa na vrhu, sponzorisani oglasi i direktna promocija) naplaćuju kroz kredite.' 
    },
    { 
      q: 'Kako funkcioniše sistem upita i poruka (Nadzorni centar)?', 
      a: 'Nadzorni centar je Vaše glavno čvorište za komunikaciju. Kada klijent ili poslodavac pošalje upit preko nekog od Vaših oglasa (bilo za posao, smeštaj, mašine ili usluge), poruka stiže direktno u Vaše sanduče. Notifikacije Vas obaveštavaju u realnom vremenu, a kompletna istorija dopisivanja i poslatih ponuda ostaje bezbedno sačuvana na platformi.' 
    },
    { 
      q: 'Da li je profesionalni CV generator potpuno besplatan za radnike?', 
      a: 'Da! Naš cilj je da pomognemo građevinskim radnicima da se predstave na najbolji mogući način. Svi registrovani radnici imaju neograničen i besplatan pristup alatu za kreiranje profesionalnog CV-ja. Možete uneti svoje veštine, obrazovanje, radno iskustvo i sertifikate, a platforma će Vam izgenerisati moderno dizajniran i struktuiran PDF dokument koji možete preuzeti i poslati bilo kom poslodavcu.' 
    },
    { 
      q: 'Kako mogu da reklamiram smeštaj za radnike ili građevinsku mašinu?', 
      a: 'Na stranici "Novi Oglas" odaberite namensku kategoriju (Smeštaj za radnike ili Mašine). Unesite sve relevantne podatke (kapacitet kreveta, opremljenost kuhinje, parking mesta za smeštaj, ili tehničke specifikacije, radne sate i cenu za mašine). Oglasi su optimizovani za pretragu kako bi ih građevinske firme i investitori lako pronašli.' 
    },
    { 
      q: 'Šta sve dobijam aktivacijom Premium paketa za firme?', 
      a: 'Premium paket za firme otključava pun potencijal platforme: dobijate neograničen broj oglasa za posao, prioritetno isticanje na vrhu pretrage (featured status), naprednu analitiku poseta i klikova na Vaš profil u realnom vremenu, direktan pristup našoj bazi kandidata sa njihovim CV-jevima, kao i namensku podršku za sve administrativne zahteve.' 
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-12 pb-16">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-tr from-secondary/20 to-orange-500/20 rounded-[8px] flex items-center justify-center mx-auto mb-4 border border-secondary/20">
            <span className="material-symbols-outlined text-secondary text-3xl">support_agent</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-3 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
            CENTAR ZA PODRŠKU
          </h1>
          <p className="text-white/50 font-bold text-xs tracking-[0.25em] uppercase">
            Tu smo da Vam pomognemo da rešite svaki problem u radu sa platformom
          </p>
        </motion.div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactCards.map((item, i) => {
            const CardComponent = item.action.startsWith('mailto:') || item.action.startsWith('tel:') ? 'a' : 'div';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <div className="flex flex-col h-full bg-[#0E1318] border border-white/5 rounded-[6px] p-6 text-center hover:border-secondary/30 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-white/5 rounded-[6px] flex items-center justify-center mx-auto mb-5 group-hover:bg-secondary/10 group-hover:scale-105 transition-all duration-300">
                    <span className="material-symbols-outlined text-white/40 group-hover:text-secondary text-2xl transition-all duration-300">
                      {item.icon}
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-2 group-hover:text-white/70 transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-base font-black text-white uppercase tracking-tight mb-3 select-all break-words">
                    {item.value}
                  </p>
                  <p className="text-xs text-white/50 tracking-wide leading-relaxed mb-6 flex-grow">
                    {item.desc}
                  </p>
                  
                  {CardComponent === 'a' ? (
                    <a
                      href={item.action}
                      className="inline-flex items-center justify-center gap-1.5 w-full bg-white/5 group-hover:bg-secondary group-hover:text-slate-950 text-white font-black py-3 rounded-[4px] text-xs tracking-[0.15em] uppercase transition-all duration-300 shadow-md"
                    >
                      <span>{item.actionLabel}</span>
                      <span className="material-symbols-outlined text-xs transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </a>
                  ) : (
                    <div className="w-full bg-white/5 text-white/40 font-black py-3 rounded-[4px] text-xs tracking-[0.15em] uppercase border border-white/5">
                      {item.actionLabel}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQs accordion */}
        <div className="bg-[#0E1318] border border-white/5 rounded-[6px] p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-secondary/50 via-orange-500/50 to-transparent"></div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-2xl">quiz</span>
            ČESTO POSTAVLJANA PITANJA
          </h3>
          <div className="space-y-4">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div 
                  key={i} 
                  className={`border border-white/5 rounded-[6px] transition-all duration-300 overflow-hidden ${isOpen ? 'bg-white/[0.02] border-white/10' : 'hover:border-white/10'}`}
                >
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 transition-colors"
                  >
                    <span className={`text-sm font-black uppercase tracking-wide transition-colors duration-300 ${isOpen ? 'text-secondary' : 'text-white/80 hover:text-white'}`}>
                      {faq.q}
                    </span>
                    <span className={`material-symbols-outlined text-base transition-transform duration-300 ${isOpen ? 'rotate-180 text-secondary' : 'text-white/30'}`}>
                      expand_more
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-6 pt-2 border-t border-white/5">
                          <p className="text-xs text-white/70 font-medium tracking-wide leading-relaxed">
                            {faq.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to action card */}
        <div className="bg-[#0A0F14] border border-white/5 rounded-[6px] p-12 text-center relative overflow-hidden group shadow-2xl">
          {/* Glowing amber-orange background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-orange-600/5 to-transparent opacity-60"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 opacity-20 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
          
          <div className="relative z-10">
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              NISTE PRONAŠLI ODGOVOR?
            </h3>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-8 max-w-xl mx-auto leading-relaxed">
              Pošaljite nam direktan upit ili nas pozovite, a naš tehnički tim će Vam pomoći u najkraćem mogućem roku.
            </p>
            <a 
              href="/kontakt" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary to-orange-500 text-slate-950 font-black px-12 py-5 rounded-[4px] hover:from-secondary/90 hover:to-orange-500/90 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs tracking-[0.2em] uppercase shadow-lg shadow-secondary/20"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              KONTAKTIRAJTE NAS
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
