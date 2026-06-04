import { motion } from 'motion/react';
import { Lock, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="bg-surface text-on-surface min-h-screen pt-24 pb-16">
      <div className="container-custom max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-light rounded-[10px] p-8 md:p-12 border border-white/5 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-[10px] bg-secondary/10 flex items-center justify-center shrink-0">
              <Lock className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">Politika Privatnosti</h1>
              <p className="text-slate-400 mt-2">Poslednji put ažurirano: Maj 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300">
            <p className="text-lg leading-relaxed mb-8">
              Vaša privatnost nam je apsolutni prioritet. <strong>Svet Građevine</strong> primenjuje najviše standarde u zaštiti vaših podataka o ličnosti (GDPR usklađenost).
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">1. Podaci koje prikupljamo</h2>
            <p className="mb-4">
              Kako bismo Vam pružili kvalitetnu uslugu sajta, logično je da prikupljamo osnovne podatke poput: 
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Vaše Ime, Prezime, i Email adresa.</li>
              <li>Poslovne podatke o kompaniji (ukoliko ste pravno lice).</li>
              <li>Informacije o lokaciji aplikanta radi geografskog uparivanja oglasa.</li>
              <li>Cookies (kolačiće) radi analize poseta sajta i praćenja affiliate koda.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">2. Kako koristimo podatke</h2>
            <p className="mb-4">
              Podatke isključivo koristimo u svrhu kreiranja naloga, naplate usluga, rešavanja vaših ticketa na podršci i poboljšanja korisničkog iskustva. Vaši podaci se NE prodaju trećim licima pod bilo kojim okolnostima.
            </p>

            <div className="mt-12 p-6 bg-secondary/5 border border-secondary/20 rounded-[10px] flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-secondary shrink-0 mt-1" />
              <div>
                <h3 className="text-secondary font-bold mb-2">Potpuna kontrola nad podacima</h3>
                <p className="text-slate-300 text-sm">
                  U svakom trenutku možete zatražiti brisanje kompletnog naloga i svih povezanih podataka slanjem zahteva na naš zvanični kontakt email portal ili direktno iz podešavanja Vašeg naloga.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
