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
      <section className="relative min-h-[921px] bg-[#0F1923] overflow-hidden flex items-center py-20">
        {/* Background Elements */}
        <div className="absolute inset-0 blueprint-bg opacity-30"></div>
        <div className="absolute -right-20 top-1/4 opacity-10 pointer-events-none transform rotate-12 scale-150">
          <span className="material-symbols-outlined text-[400px] text-white select-none">architecture</span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0F1923] to-transparent"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 min-w-0">
          <div className="grid lg:grid-cols-12 gap-12 items-stretch w-full min-w-0">
            <div className="lg:col-span-7 flex flex-col space-y-8 min-w-0 pt-4 h-full">
              <span className="self-start inline-flex items-center gap-2 py-1.5 px-4 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-blue-500/20 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Pridruži se liderima
              </span>
              <h1 className="font-headline text-4xl min-[360px]:text-5xl md:text-[4rem] lg:text-[4.5rem] font-black uppercase tracking-tighter text-white mb-6 leading-[1.05] relative w-full min-w-0 drop-shadow-sm">
                NAŠA <span className="text-transparent bg-clip-text bg-[linear-gradient(110deg,#0061a5_0%,#3b82f6_50%,#60a5fa_100%)] block sm:inline">MISIJA</span>
              </h1>
              <div className="text-on-surface-variant text-base sm:text-lg md:text-xl max-w-2xl font-medium leading-relaxed mb-2 space-y-4">
                <p>Naša misija je da učinimo pronalaženje poslova i radnika jednostavnijim, bržim i efikasnijim.</p>
                <p>Kroz kvalitetne alate, moderne tehnologije i kontinuirane inovacije, pružamo građevinskoj industriji u Srbiji i regionu pouzdanu platformu koja povezuje poslodavce, radnike i poslovne partnere, olakšava zapošljavanje i doprinosi razvoju celokupnog građevinskog sektora.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-6 w-full mt-auto pb-2">
                <Link 
                  to="/prijava"
                  className="group relative flex items-center justify-center px-6 sm:px-10 h-[56px] sm:h-[68px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-sm sm:text-lg rounded-[12px] hover:-translate-y-1 transition-all duration-300 overflow-hidden w-full sm:w-auto"
                >
                  <span className="relative z-10 tracking-wide text-center">REGISTRUJTE SE BESPLATNO</span>
                </Link>
                <Link 
                  to="/postavi-oglas"
                  className="group relative flex items-center justify-center px-6 sm:px-10 h-[56px] sm:h-[68px] bg-secondary hover:bg-yellow-400 !text-black font-black text-sm sm:text-lg rounded-[12px] hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
                >
                  <span className="tracking-wide relative z-10 text-center">POSTAVI OGLAS</span>
                </Link>
              </div>
            </div>
            {/* Visual Grid (Tactical UI) */}
            <div className="lg:col-span-5 relative w-full min-w-0">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 w-full min-w-0 pt-12 lg:pt-32">
                {/* Testimonial Card Slider */}
                <div 
                  className="p-4 sm:p-8 rounded-[16px] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-slate-900 to-slate-950 relative overflow-hidden cursor-pointer transition-all duration-500 shadow-[0_4px_20px_rgba(99,102,241,0.1)] hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:border-indigo-500/60 hover:-translate-y-1 w-full group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 z-0"></div>
                  <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-6xl sm:text-8xl text-white">format_quote</span>
                  </div>
                  
                  <div key={currentIndex} className="animate-testimonial-in">
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
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-8 justify-center sm:justify-start">
                    {testimonials.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex(idx);
                        }}
                        className={`h-1.5 transition-all duration-500 rounded-full ${
                          idx === currentIndex 
                            ? 'w-6 sm:w-10 bg-blue-500' 
                            : 'w-1.5 sm:w-2 bg-white/10 hover:bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
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
