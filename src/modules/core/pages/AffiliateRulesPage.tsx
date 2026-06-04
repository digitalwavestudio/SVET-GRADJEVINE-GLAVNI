import { motion } from 'motion/react';
import { DollarSign, Percent, TrendingUp, Zap } from 'lucide-react';

import { APP_CONFIG } from '@/src/constants/config';

export default function AffiliateRulesPage() {
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
              <TrendingUp className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">Affiliate Pravilnik</h1>
              <p className="text-slate-400 mt-2">Pravila za oglašivače, influensere i medijske partnere</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Percent, label: 'Unikatni kodovi', value: 'Lični URL' },
              { icon: Zap, label: 'Trajanje trackinga', value: '30 Dana' },
              { icon: DollarSign, label: 'Isplate', value: 'Redovne' }
            ].map((stat, i) => (
              <div key={i} className="bg-[#0F1923] p-6 rounded-[10px] border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-[10px] bg-secondary/10 flex flex-col justify-center items-center">
                  <stat.icon className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold">{stat.label}</div>
                  <div className="text-xl font-black text-white">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="prose prose-invert max-w-none text-slate-300">
            <h2 className="text-2xl font-bold text-white mb-4">Kako funkcioniše sistem zarade?</h2>
            <p className="mb-4">
              Naš Affiliate model je kreiran po uzoru na sisteme kao što je carVertical – jednostavan je, čist i visoko optimizovan. 
              Svaki partner dobija svoj <strong>unikatan link</strong> (npr: <code>{APP_CONFIG.DOMAIN}/?a=tvojIme</code>) i <strong>promo kod</strong> (npr: <code>TVOJIME30</code>).
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">Tracking i "Kolačići" (Cookies)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Kada korisnik klikne na Vaš link, sistem u njegov pretraživač upisuje "cookie" koji traje <strong>30 dana</strong>.</li>
              <li>Ukoliko taj korisnik u tih 30 dana kupi <strong>PREMIUM Oglasni Paket</strong>, vama se automatski pripisuje provizija!</li>
              <li>A šta ako koristi Promo Kod direkto pri plaćanju? Ukoliko korisnik ukuca Vaš kod, on dobija popust (npr. 30%), a vi takođe dobijate proviziju (npr. 5 EUR od svake kupovine). Promo kod premošćuje (ubrzava) konfuzije oko cookies-a.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">Isplata provizije</h2>
            <p className="mb-4">
              Isplate se vrše po dostizanju minimuma definisanog u Vašem ugovoru (najčešće 50 EUR ili 100 EUR stanja), a obavljaju se isključivo preko sigurnih kanala – na fakturu Vašoj agenciji ili dogovorenom PayPal nalogu.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
