import { motion } from 'motion/react';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LOCATIONS, PROFESSIONS } from '@/src/constants/taxonomy';
import { useDocumentHead } from '@/src/hooks/useDocumentHead';
import { createFAQSchema } from '@/src/lib/seo/schemas';
import { useStatsCounts, usePseoInsights } from '@/src/modules/dashboard/hooks/useStats';

export default function StatsPage() {
  const { zanimanje, grad } = useParams();
  
  const zanimanjeName = zanimanje ? Object.values(PROFESSIONS).flat().find(p => p.slug === zanimanje)?.name : '';
  const gradName = grad ? LOCATIONS.find(l => l.slug === grad)?.name : '';

  const { data: counts = { jobs: 0, accommodations: 0, machines: 0, masters: 0 } } = useStatsCounts();
  
  const { data: jobsInsight } = usePseoInsights({ collection: 'jobs', grad, zanimanje });
  const { data: machinesInsight } = usePseoInsights({ collection: 'machines', grad, zanimanje });

  const pseoData = useMemo(() => ({
    jobsAvg: jobsInsight?.averagePrice || 0,
    machinesAvg: machinesInsight?.averagePrice || 0,
    jobsEstimated: jobsInsight?.estimatedTotal || 0,
    rangeMin: jobsInsight?.rangeMin || 0,
    rangeMax: jobsInsight?.rangeMax || 0,
  }), [jobsInsight, machinesInsight]);

  const headingEntity = zanimanjeName ? zanimanjeName : 'Građevini';
  const headingLocation = gradName ? `u mestu ${gradName}` : 'u Srbiji';

  const faqData = [
    {
      question: `Kolika je prosečna plata za ${zanimanjeName || 'građevinarstvo'} ${headingLocation} u trenutnoj sezoni?`,
      answer: `Prema našim aktuelnim tržisnim podacima baziranim na uzorku nedavno objavljenih oglasa, prosečna plata ${zanimanjeName ? 'za poziciju ' + zanimanjeName : 'građevinskih radnika'} ${headingLocation} varira od ${(pseoData.rangeMin || 85000).toLocaleString()} RSD za početnike, do preko ${(pseoData.rangeMax || 180000).toLocaleString()} RSD za iskusne majstore. Ukupno beležimo ${pseoData.jobsEstimated || 0} aktivnih prilika za angažman.`,
      link: `/poslovi${zanimanje ? '/' + zanimanje : ''}${grad ? '/' + grad : ''}`,
      linkText: `Pretraži poslove za ${zanimanjeName || 'sve oblasti'}`
    },
    {
      question: `Da li je isplativije iznajmljivanje građevinskih mašina ${headingLocation}?`,
      answer: `Aktuelni prosek cene najma mašina (poput bagera i kranova) je oko ${pseoData.machinesAvg ? pseoData.machinesAvg + '€' : '80€ - 200€'} dnevno. Lokalni podizvođači značajno štede optimizacijom zakupa opreme. Trenutno dokumentujemo ${counts.machines || 'širok izbor'} aktivnih mašina u katalogu.`,
      link: `/gradjevinske-masine${grad ? `?grad=${grad}` : ''}`,
      linkText: "Pretraži dostupne mašine"
    },
    {
      question: `Koliko košta smeštaj za radnike po osobi ${headingLocation}?`,
      answer: `Cene smeštaja za radnike kreću se od 150€ do 500€ mesečno po osobi, zavisno od kvaliteta opremljenosti. Najveća ponuda je trenutno dokumentovana sa ${counts.accommodations} aktivnih objekata.`,
      link: `/smestaj${grad ? '/' + grad : ''}`,
      linkText: "Pogledaj ponudu smeštaja"
    },
    {
      question: `Koja je cena ugovaranja izvođača - ${zanimanjeName || 'sve oblasti'} ${headingLocation}?`,
      answer: `Cena zavisi od projekta, ali satnice i ugovorene cene su dostupne na profilima od preko ${counts.masters} majstora i inženjera širom regiona.`,
      link: `/majstori${zanimanje ? '/' + zanimanje : ''}${grad ? '/' + grad : ''}`,
      linkText: "Katalog izvođača i majstora"
    }
  ];

  const jsonLd = createFAQSchema(faqData.map(item => ({
    question: item.question,
    answer: item.answer
  })));

  const titleStr = zanimanjeName 
    ? `Cena usluga i Plate - ${zanimanjeName} ${headingLocation} | Svet Građevine`
    : `Cene Rada i Statistika u Građevini ${headingLocation} | Svet Građevine`;

  const descStr = `Trenutne plate, cene rada, smeštaja i usluga za ${zanimanjeName || 'građevinsku industriju'} ${headingLocation}. Realna statistika za 2025. godinu koja pokriva poslodavce, firme i majstore.`;

  useDocumentHead({
    title: titleStr,
    description: descStr,
    jsonLd: jsonLd
  });

  return (
    <div className="bg-surface min-h-screen pt-32 pb-24">

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-20 text-center">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-secondary font-black tracking-[0.3em] uppercase text-xs mb-4 block"
          >
            Regionalni Podaci u Realnom Vremenu
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black font-headline tracking-tighter uppercase mb-6"
          >
            Cene i <span className="text-secondary italic">Statistika</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-on-surface-variant max-w-2xl mx-auto font-medium"
          >
            Transparentni podaci o tržištu za <strong>{headingEntity} {headingLocation}</strong>. Analiziramo aktuelne oglase kako bismo vam pružili informacije o cenama usluga, satnicama i platama.
          </motion.p>
        </div>

        {/* Real-time Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
          {[
            { label: 'Poslovi', count: counts.jobs, icon: 'work' },
            { label: 'Smeštaj', count: counts.accommodations, icon: 'bed' },
            { label: 'Mašine', count: counts.machines, icon: 'construction' },
            { label: 'Majstori', count: counts.masters, icon: 'engineering' }
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-container-low p-6 rounded-[10px] border border-white/5 flex flex-col items-center justify-center text-center group hover:border-secondary/30 transition-all"
            >
              <span className="material-symbols-outlined text-secondary mb-3 group-hover:scale-110 transition-transform">{stat.icon}</span>
              <div className="text-3xl font-black text-white mb-1">{stat.count || '0'}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Answer Hub */}
        <div className="max-w-4xl mx-auto space-y-12">
          {faqData.map((item, index) => (
            <motion.section 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-surface-container-high p-8 md:p-12 rounded-[10px] border border-white/5 relative overflow-hidden group"
            >
              {/* Question */}
              <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tight uppercase mb-6 text-white leading-tight">
                {item.question}
              </h2>
              
              {/* Answer */}
              <div className="text-on-surface-variant text-lg leading-relaxed mb-10 font-medium">
                {item.answer}
              </div>

              {/* CTA */}
              <Link 
                to={item.link}
                className="inline-flex items-center gap-3 bg-secondary !text-black px-8 py-4 rounded-[10px] font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-secondary/10"
              >
                {item.linkText}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>

              {/* Decorative Number */}
              <div className="absolute -bottom-8 -right-8 text-white/5 text-[120px] font-black pointer-events-none group-hover:text-secondary/5 transition-colors">
                0{index + 1}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Pro Tip */}
        <div className="mt-24 p-12 rounded-[10px] bg-gradient-to-br from-[#13212e] to-[#0a1016] border border-white/5 relative overflow-hidden text-center">
            <div className="relative z-10">
              <span className="material-symbols-outlined text-secondary text-5xl mb-6">info</span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Potrebni su vam specifični podaci?</h3>
              <p className="text-on-surface-variant max-w-xl mx-auto mb-10">
                Ukoliko planirate veliki projekat i potrebna vam je detaljna analiza tržišta za specifičan region, kontaktirajte naš Premium tim.
              </p>
              <Link 
                to="/kontakt" 
                className="text-white hover:text-secondary font-black tracking-widest text-xs uppercase underline transition-colors"
              >
                Kontaktiraj Premium Tim
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-[100px] rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
