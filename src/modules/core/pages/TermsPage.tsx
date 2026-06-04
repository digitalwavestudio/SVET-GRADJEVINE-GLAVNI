import { motion } from 'motion/react';
import { AlertCircle, Scale } from 'lucide-react';

export default function TermsPage() {
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
              <Scale className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">Uslovi Korišćenja</h1>
              <p className="text-slate-400 mt-2">Poslednji put ažurirano: Maj 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300">
            <p className="text-lg leading-relaxed mb-8">
              Pristupanjem i korišćenjem platforme <strong>Svet Građevine</strong>, prihvatate sledeće uslove korišćenja. Molimo Vas da ih pažljivo pročitate pre nego što nastavite sa upotrebom naših usluga.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">1. Opšte odredbe</h2>
            <p className="mb-4">
              Svet Građevine je digitalni portal za povezivanje poslodavaca, radnika i pravnih lica unutar građevinske industrije regiona. Zadržavamo pravo da u bilo kom trenutku izmenimo ove uslove.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">2. Korisnički nalozi i odgovornost</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Korisnici su u obavezi da pruže tačne i aktuelne informacije prilikom registracije.</li>
              <li>Zabranjeno je postavljanje lažnih ili manipulativnih oglasa za posao.</li>
              <li>Platforma ne snosi pravnu odgovornost za konflikte nastale između poslodavca i zaposlenog sačuvanog putem oglasa.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">3. Premium oglasi i plaćanja</h2>
            <p className="mb-4">
              Uplate za istaknute ("Premium") oglase podležu našoj politici refundacije samo ukoliko usluga nije isporučena usled tehničke greške portala.
            </p>

            <div className="mt-12 p-6 bg-red-500/10 border border-red-500/20 rounded-[10px] flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-red-500 font-bold mb-2">Važna bezbednosna napomena</h3>
                <p className="text-red-200/80 text-sm">
                  Nikada ne delite svoje finansijske podatke preko sistema za poruke sa drugim korisnicima platforme. Sistem plaćanja usluga se obavlja isključivo putem zvaničnog portala.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
