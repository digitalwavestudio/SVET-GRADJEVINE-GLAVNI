import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { Button } from '@/src/components/ui/Button';
import TrustSection from '@/src/modules/core/components/home/TrustSection';
import { OptimizedImage } from '@/src/components/OptimizedImage';

const testimonials = [
  {
    name: "Marko Perić",
    role: "Premium Član",
    image: "",
    text: '"Zahvaljujući ovoj platformi, naša građevinska firma je pronašla tri ključna inženjera za projekat \'Beograd na Vodi\' u rekordnom roku."',
  },
  {
    name: "Jelena Stojić",
    role: "Arhitekta",
    image: "",
    text: '"Svet Građevine mi je omogućio da se povežem sa investitorima koje ranije nisam mogla da dosegnem. Odličan alat za profesionalce."',
  },
  {
    name: "Nikola Vasić",
    role: "Šef gradilišta",
    image: "",
    text: '"Najbolji portal za opremu i mašine. Kupio sam bager CAT 320 preko oglasa ovde i sve je prošlo besprekorno."',
  },
  {
    name: "Dragan Lukić",
    role: "Vlasnik firme",
    image: "",
    text: '"Konačno imamo centralno mesto za sve u našoj industriji. Od radne snage do placeva, sve je tu."',
  },
  {
    name: "Milica Jović",
    role: "Inženjer",
    image: "",
    text: '"Interfejs je moderan i lak za korišćenje. Obaveštenja o novim poslovima stižu odmah, što je ključno u našem poslu."',
  },
  {
    name: "Stefan Kostić",
    role: "Investitor",
    image: "",
    text: '"Brzina kojom pronalazim podizvođače na ovoj platformi je neverovatna. Štedi mi nedelje pregovora."',
  },
  {
    name: "Ana Marić",
    role: "Dizajner enterijera",
    image: "",
    text: '"Pronašla sam sjajne zanatlije za specifične radove na luksuznim vilama. Kvalitet baze je na vrhunskom nevou."',
  },
  {
    name: "Goran Simić",
    role: "Građevinski tehničar",
    image: "",
    text: '"Preko portala sam našao posao u inostranstvu za samo dva dana. Sve preporuke za Svet Građevine!"',
  },
  {
    name: "Ivana Petrović",
    role: "HR Menadžer",
    image: "",
    text: '"Filtriranje kandidata po veštinama i lokaciji nam je drastično olakšalo proces zapošljavanja u građevinskom sektoru."',
  },
  {
    name: "Zoran Đorđević",
    role: "Majstor fasader",
    image: "",
    text: '"Kao samostalni majstor, ovde uvek nalazim sigurne poslove. Isplata je uvek bila po dogovoru preko firmi koje ovde oglašavaju."',
  },
  {
    name: "Luka Babić",
    role: "Geometar",
    image: "",
    text: '"Preciznost informacija na sajtu je ono što me je privuklo. Sve je transparentno i profesionalno."',
  },
  {
    name: "Maja Nikolić",
    role: "Agent za nekretnine",
    image: "",
    text: '"Placevi koji se ovde oglašavaju su često ekskluzivni. Odlična saradnja sa timom Svet Građevine."',
  },
  {
    name: "Pavle Ilić",
    role: "Elektroinženjer",
    image: "",
    text: '"Pronašao sam projekat za solarnu elektranu preko preporuke sa ovog portala. Mreža kontakata je neverovatna."',
  },
  {
    name: "Sandra Popović",
    role: "Pravnik u građevini",
    image: "",
    text: '"Pratim oglase za pravne savetnike u građevinskom sektoru. Ovde su najozbiljnije ponude na tržištu."',
  },
  {
    name: "Bojan Krstić",
    role: "Rukovalac kranom",
    image: "",
    text: '"Rad na visini zahteva poverenje, a ovaj sajt mi je omogućio da radim za najsigurnije firme u zemlji."',
  }
];

import { useHomepageData } from '@/src/modules/core/hooks/useHomepageData';

export default function CtaSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: bffData } = useHomepageData();
  const stats = bffData?.stats;

  const dynamicWorkersCount = stats?.dynamicWorkersCount ?? 12450;
  const dynamicFirmsCount = stats?.dynamicFirmsCount ?? 450;
  const totalAdsCount = stats?.totalAdsCount ?? 15000;
  const premiumJobs = stats?.premiumJobs ?? 150;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000); // Rotira na svake 4 sekunde
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Hero Section with Architectural CTA */}
      <section className="relative min-h-[921px] bg-[#0F1923] overflow-hidden flex items-center py-20 px-6 lg:px-20">
        {/* Background Elements */}
        <div className="absolute inset-0 blueprint-bg opacity-30"></div>
        <div className="absolute -right-20 top-1/4 opacity-10 pointer-events-none transform rotate-12 scale-150">
          <span className="material-symbols-outlined text-[400px] text-white select-none">architecture</span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0F1923] to-transparent"></div>
        <div className="relative z-10 w-full max-w-[1920px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
              <span className="inline-flex items-center gap-2 py-1.5 px-4 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-blue-500/20 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Pridruži se liderima
              </span>
              <h1 className="font-headline font-black text-5xl md:text-7xl text-white leading-[1.05] tracking-tighter uppercase relative">
                POSTANITE DEO <br />
                NAJVEĆE <span className="text-transparent bg-clip-text bg-[linear-gradient(110deg,#0061a5_0%,#3b82f6_50%,#60a5fa_100%)] drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">GRAĐEVINSKE MREŽE</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
                Povezujemo vrhunske inženjere, arhitekte i majstore sa najznačajnijim projektima u regionu. Vaša karijera zaslužuje čvrst temelj.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  to="/registracija" 
                  variant="primary" 
                  icon="person_add" 
                  className="px-10 py-5 text-lg shadow-[0_20px_40px_rgba(254,191,13,0.2)]"
                >
                  REGISTRUJTE SE BESPLATNO
                </Button>
                <Button 
                  to="/postavi-oglas" 
                  variant="secondary" 
                  className="px-10 py-5 text-lg"
                >
                  PREDAJ OGLAS
                  <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
                </Button>
              </div>
            </div>
            {/* Visual Grid (Tactical UI) */}
            <div className="lg:col-span-5 relative">
              <div className="grid grid-cols-2 gap-6">
                {/* Stats Card */}
                <div className="glass-card p-8 rounded-[10px] border border-white/10 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-500 shadow-2xl h-fit mt-6">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-6xl text-white">groups</span>
                  </div>
                  <div className="w-10 h-1.5 bg-blue-500 mb-6 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                  <h3 className="text-3xl font-headline font-black text-white mb-1 leading-none tracking-tight">{dynamicWorkersCount.toLocaleString('sr-RS')}+</h3>
                  <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">Aktivnih Majstora</p>
                </div>

                <div className="relative rounded-[10px] overflow-hidden shadow-2xl mt-8 border border-white/10 group h-48 md:h-64 bg-slate-900/50">
                  <OptimizedImage 
                    src="/assets/blueprint-background.jpg" 
                    fallbackType="company" 
                    alt="Pozadina" 
                    className="w-full h-full object-cover opacity-50 grayscale mix-blend-overlay" 
                    containerClassName="w-full h-full"
                  /> 
                    
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      <span className="text-[8px] font-black text-white uppercase tracking-tighter shadow-sm">Verified Professional</span>
                    </div>
                  </div>
                </div>

                {/* Testimonial Card Slider */}
                <motion.div 
                  whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)" }}
                  className="col-span-2 glass-card p-8 rounded-[10px] border border-white/10 relative overflow-hidden cursor-pointer transition-all duration-500"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <span className="material-symbols-outlined text-8xl text-white">format_quote</span>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-[10px] overflow-hidden border-2 border-white/10 p-0.5">
                          <OptimizedImage 
                            src={testimonials[currentIndex].image} 
                            fallbackType="user" 
                            fallbackText={testimonials[currentIndex].name} 
                            alt={testimonials[currentIndex].name} 
                            className="w-full h-full object-cover rounded-[6px]" 
                          />
                        </div>
                        <div>
                          <p className="text-white font-black text-lg tracking-tight">{testimonials[currentIndex].name}</p>
                          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">{testimonials[currentIndex].role}</p>
                        </div>
                      </div>
                      <p className="text-slate-300 italic text-lg leading-relaxed font-medium">
                        {testimonials[currentIndex].text}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex items-center gap-2 mt-8">
                    {testimonials.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex(idx);
                        }}
                        className={`h-1.5 transition-all duration-500 rounded-full ${
                          idx === currentIndex 
                            ? 'w-10 bg-blue-500' 
                            : 'w-2 bg-white/10 hover:bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Secondary Stats */}
                <div className="glass-card p-8 rounded-[10px] border border-white/10 group hover:border-blue-500/50 transition-all duration-500 shadow-xl relative overflow-hidden">
                  <div className="w-8 h-1 bg-blue-500 mb-6 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  <span className="material-symbols-outlined text-blue-500 mb-6 block text-4xl group-hover:scale-110 transition-transform">business_center</span>
                  <h3 className="text-3xl font-headline font-black text-white mb-1">{dynamicFirmsCount.toLocaleString('sr-RS')}+</h3>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Kompanija</p>
                </div>

                <div className="glass-card p-8 rounded-[10px] border border-white/10 group hover:border-secondary/50 transition-all duration-500 shadow-xl relative overflow-hidden translate-y-6">
                  <div className="w-8 h-1 bg-secondary mb-6 rounded-full shadow-[0_0_10px_rgba(254,191,13,0.5)]"></div>
                  <span className="material-symbols-outlined text-secondary mb-6 block text-4xl group-hover:rotate-12 transition-transform">construction</span>
                  <h3 className="text-3xl font-headline font-black text-white mb-1">{totalAdsCount.toLocaleString('sr-RS')}+</h3>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Otvorenih Projekata</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <TrustSection />
    </>
  );
}
