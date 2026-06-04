import { motion } from 'motion/react';
import { Activity, Building, Home, Users } from 'lucide-react';
import SeoHead from '@/src/components/SeoHead';

export default function AboutPage() {
  const stats = [
    { icon: Building, label: 'Registrovanih firmi', value: '1.2M+' },
    { icon: Users, label: 'Radnika', value: '500k+' },
    { icon: Activity, label: 'Aktivnih projekata', value: '3,000+' }
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen pt-24 pb-16">
      <SeoHead 
        title="O nama | Svet Građevine"
        description="Svet Građevine je vodeća platforma za građevinsku industriju u Srbiji. Povezujemo firme, majstore i poslodavce na jednom mestu."
        type="website"
      />
      <div className="container-custom max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full font-bold text-sm mb-6 uppercase tracking-widest border border-secondary/20">
            <Home className="w-4 h-4" /> Regionalni Lider
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-6">
            Gradimo Bolju <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-600">Budućnost.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            Svet Građevine je vrhunski ekosistem kreiran za potrebe profesionalaca. Od pronalaska posla, do iznajmljivanja opreme, upravljanja projektima i pametne kupovine placeva.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-surface-light rounded-[10px] p-8 border border-white/5 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-[10px] bg-[#0F1923] flex items-center justify-center mb-6 border border-white/5">
                <stat.icon className="w-10 h-10 text-secondary" />
              </div>
              <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
              <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface-light rounded-[10px] p-8 md:p-12 border border-white/5 shadow-2xl prose prose-invert max-w-none text-slate-300"
        >
          <h2 className="text-3xl font-black text-white mb-6 uppercase">Naša Misija</h2>
          <p className="text-lg leading-relaxed mb-6">
            Decenijama je građevinski sektor funkcionisao preko zastarelih oglasnika i preporuka. Odlučili smo da podignemo lestvicu. Svet Građevine nije samo sajt sa oglasima – to je digitalna infrastruktura i "all-in-one" platforma. 
          </p>
          <p className="text-lg leading-relaxed">
            Povezujemo investitore sa šefovima gradilišta. Zanatlije sa velikim projektima. Tešku mehanizaciju sa gradilištima kojima upravljaju. Verujemo u brzinu, visoku transparentnost i premium pristup bez kompromisa. 
            Dobrodošli na prvu ozbiljnu platformu u ovom delu Evrope.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
