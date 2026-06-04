import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { ShoppingCart, Phone, MapPin, X, Loader2, CheckCircle, Package, Send } from 'lucide-react';
import { apiClient } from '@/src/lib/apiClient';
import { LOCATIONS } from '@/src/constants/taxonomy';
import Footer from '@/src/components/Footer';
import Navbar from '@/src/components/Navbar';
import SeoHead from '@/src/components/SeoHead';
import { FasadaCalculator } from '../components/calculators/FasadaCalculator';
import { ZidanjeCalculator } from '../components/calculators/ZidanjeCalculator';
import { KeramikaCalculator } from '../components/calculators/KeramikaCalculator';
import { BetonCalculator } from '../components/calculators/BetonCalculator';
import { GipsCalculator } from '../components/calculators/GipsCalculator';
import { MolerajCalculator } from '../components/calculators/MolerajCalculator';
import { PodoviCalculator } from '../components/calculators/PodoviCalculator';
import { KrovCalculator } from '../components/calculators/KrovCalculator';
import { BehatonCalculator } from '../components/calculators/BehatonCalculator';
import { HidroCalculator } from '../components/calculators/HidroCalculator';

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState('FASADA');

  // RFQ (Tender za nabavku) State
  const [isRfqOpen, setIsRfqOpen] = useState(false);
  const [rfqRegionId, setRfqRegionId] = useState('beograd');
  const [rfqPhone, setRfqPhone] = useState('');
  const [rfqSpec, setRfqSpec] = useState<any[]>([]);
  const [rfqCategoryName, setRfqCategoryName] = useState('');
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqSuccess, setRfqSuccess] = useState(false);
  const [rfqError, setRfqError] = useState<string | null>(null);

  const handleOpenRfq = (specList: any[], catName: string) => {
    const formattedSpec = specList.map(item => ({
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      desc: item.desc || ''
    }));
    
    setRfqSpec(formattedSpec);
    setRfqCategoryName(catName);
    setRfqRegionId('beograd');
    setRfqPhone('');
    setRfqError(null);
    setRfqSuccess(false);
    setIsRfqOpen(true);
  };

  const handleSendRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqPhone || rfqPhone.trim().length < 6) {
      setRfqError('Kontakt telefon mora imati najmanje 6 cifara.');
      return;
    }
    setRfqSubmitting(true);
    setRfqError(null);

    try {
      await apiClient.post('/rfq', {
        regionId: rfqRegionId,
        phone: rfqPhone,
        category: rfqCategoryName,
        specification: rfqSpec
      });
      setRfqSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      let errMsg = 'Došlo je do greške prilikom slanja tendera. Pokušajte ponovo.';
      if (err instanceof Error) {
         errMsg = err.message;
      }
      if (err && typeof err === 'object') {
        const errObj = err as Record<string, unknown>;
        if (errObj.response && typeof errObj.response === 'object') {
           const res = errObj.response as Record<string, unknown>;
           if (res.data && typeof res.data === 'object') {
              const resData = res.data as Record<string, unknown>;
              if (typeof resData.error === 'string') {
                 errMsg = resData.error;
              }
           }
        }
      }
      setRfqError(errMsg);
    } finally {
      setRfqSubmitting(false);
    }
  };
  
  // Demit Fasada State
  const [fasadaKvadratura, setFasadaKvadratura] = useState<number | ''>(100);
  const [fasadaDebljina, setFasadaDebljina] = useState<number | ''>(10);
  
  // Zidanje State
  const [zidanjeKvadratura, setZidanjeKvadratura] = useState<number | ''>(50);
  const [zidanjeTipBloka, setZidanjeTipBloka] = useState('GITER 25x19x19');
  
  // Keramika State
  const [keramikaKvadratura, setKeramikaKvadratura] = useState<number | ''>(30);
  const [keramikaDimenzija, setKeramikaDimenzija] = useState('60x60');
  
  // Gips State
  const [gipsKvadratura, setGipsKvadratura] = useState<number | ''>(20);
  const [gipsTipSistema, setGipsTipSistema] = useState('W111');
  
  // Moleraj State
  const [molerajKvadratura, setMolerajKvadratura] = useState<number | ''>(120);
  const [molerajOdbijci, setMolerajOdbijci] = useState<number | ''>(15);
  const [molerajTipBoje, setMolerajTipBoje] = useState('POLUDISPERZIJA');
  const [molerajBrojRuku, setMolerajBrojRuku] = useState<number>(2);

  // Podovi State
  const [podoviKvadratura, setPodoviKvadratura] = useState<number | ''>(40);
  const [podoviTipSlaganja, setPodoviTipSlaganja] = useState('STANDARD');
  const [podoviPakovanjeM2, setPodoviPakovanjeM2] = useState<number | ''>(2.22);

  // Krov State
  const [krovOsnova, setKrovOsnova] = useState<number | ''>(100);
  const [krovNagib, setKrovNagib] = useState<number | ''>(30);
  const [krovPotrosnjaCrepa, setKrovPotrosnjaCrepa] = useState<number | ''>(12.5);

  // Behaton State
  const [behatonKvadratura, setBehatonKvadratura] = useState<number | ''>(50);
  const [behatonDebljinaRizle, setBehatonDebljinaRizle] = useState<number | ''>(5);
  const [behatonIvicnjaci, setBehatonIvicnjaci] = useState<number | ''>(20);

  // Hidroizolacija State
  const [hidroKvadratura, setHidroKvadratura] = useState<number | ''>(5);
  const [hidroTrakaDužina, setHidroTrakaDužina] = useState<number | ''>(10);

    // Beton State
  const [betonDuzina, setBetonDuzina] = useState<number | ''>(5);
  const [betonSirina, setBetonSirina] = useState<number | ''>(4);
  const [betonDubina, setBetonDubina] = useState<number | ''>(0.1); 

const renderCalculator = () => {
  if (activeTab === 'FASADA') return <FasadaCalculator fasadaKvadratura={fasadaKvadratura} setFasadaKvadratura={setFasadaKvadratura} fasadaDebljina={fasadaDebljina} setFasadaDebljina={setFasadaDebljina} onOpenRfq={handleOpenRfq} />;
  if (activeTab === 'ZIDANJE') return <ZidanjeCalculator zidanjeKvadratura={zidanjeKvadratura} setZidanjeKvadratura={setZidanjeKvadratura} zidanjeTipBloka={zidanjeTipBloka} setZidanjeTipBloka={setZidanjeTipBloka} onOpenRfq={handleOpenRfq} />;
  if (activeTab === 'KERAMIKA') return <KeramikaCalculator keramikaKvadratura={keramikaKvadratura} setKeramikaKvadratura={setKeramikaKvadratura} keramikaDimenzija={keramikaDimenzija} setKeramikaDimenzija={setKeramikaDimenzija} onOpenRfq={handleOpenRfq} />;
  if (activeTab === 'BETON') return <BetonCalculator betonDuzina={betonDuzina} setBetonDuzina={setBetonDuzina} betonSirina={betonSirina} setBetonSirina={setBetonSirina} betonDubina={betonDubina} setBetonDubina={setBetonDubina} onOpenRfq={handleOpenRfq} />;
  if (activeTab === 'GIPS') return <GipsCalculator gipsKvadratura={gipsKvadratura} setGipsKvadratura={setGipsKvadratura} gipsTipSistema={gipsTipSistema} setGipsTipSistema={setGipsTipSistema} onOpenRfq={handleOpenRfq} />;
  if (activeTab === 'MOLERAJ') return <MolerajCalculator molerajKvadratura={molerajKvadratura} setMolerajKvadratura={setMolerajKvadratura} molerajOdbijci={molerajOdbijci} setMolerajOdbijci={setMolerajOdbijci} molerajTipBoje={molerajTipBoje} setMolerajTipBoje={setMolerajTipBoje} molerajBrojRuku={molerajBrojRuku} setMolerajBrojRuku={setMolerajBrojRuku} onOpenRfq={handleOpenRfq} />;
  if (activeTab === 'PODOVI') return <PodoviCalculator podoviKvadratura={podoviKvadratura} setPodoviKvadratura={setPodoviKvadratura} podoviTipSlaganja={podoviTipSlaganja} setPodoviTipSlaganja={setPodoviTipSlaganja} podoviPakovanjeM2={podoviPakovanjeM2} setPodoviPakovanjeM2={setPodoviPakovanjeM2} onOpenRfq={handleOpenRfq} />;
  if (activeTab === 'KROV') return <KrovCalculator krovOsnova={krovOsnova} setKrovOsnova={setKrovOsnova} krovNagib={krovNagib} setKrovNagib={setKrovNagib} krovPotrosnjaCrepa={krovPotrosnjaCrepa} setKrovPotrosnjaCrepa={setKrovPotrosnjaCrepa} onOpenRfq={handleOpenRfq} />;
  if (activeTab === 'BEHATON') return <BehatonCalculator behatonKvadratura={behatonKvadratura} setBehatonKvadratura={setBehatonKvadratura} behatonDebljinaRizle={behatonDebljinaRizle} setBehatonDebljinaRizle={setBehatonDebljinaRizle} behatonIvicnjaci={behatonIvicnjaci} setBehatonIvicnjaci={setBehatonIvicnjaci} onOpenRfq={handleOpenRfq} />;
  if (activeTab === 'HIDRO') return <HidroCalculator hidroKvadratura={hidroKvadratura} setHidroKvadratura={setHidroKvadratura} hidroTrakaDužina={hidroTrakaDužina} setHidroTrakaDužina={setHidroTrakaDužina} onOpenRfq={handleOpenRfq} />;
  return null;
};

  return (
    <div className="bg-[#070B0F] min-h-screen text-white font-sans selection:bg-secondary selection:text-slate-950">
      <SeoHead 
        title="Građevinski Kalkulatori | Svet Građevine"
        description="Besplatni kalkulatori za građevinu: izračunajte resurse za fasadu, zidanje, keramiku, beton, gips, moleraj, podove, krov, behaton i hidroizolaciju."
        type="website"
      />
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none -mt-64 -mr-64"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <span className="inline-block py-1 px-3 rounded-[10px] bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-black tracking-[0.2em] uppercase mb-6">
                BESPLATNI ALATI
              </span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6 text-white leading-[0.9]">
                AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-500">GRAĐEVINSKI</span> KALKULATORI
              </h1>
              <p className="text-white/60 font-bold uppercase tracking-wider text-sm leading-relaxed max-w-xl">
                ZABORAVI NA SVEŠČICU I "ODOKATIVNU" METODU. UKUCAJ KVADRATURU I DOBIJAŠ TAČNU PRECIZNU SPECIFIKACIJU RESURSA ZA GRADILIŠTE U SEKUNDI.
              </p>
            </div>
          </div>
          
          {/* Main Interface */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[10px] p-6 lg:p-12 shadow-2xl backdrop-blur-xl">
            {/* Tabs */}
            <div className="flex flex-wrap gap-4 border-b border-white/5 pb-8 mb-10">
              {['FASADA', 'ZIDANJE', 'KERAMIKA', 'BETON', 'GIPS', 'MOLERAJ', 'PODOVI', 'KROV', 'BEHATON', 'HIDRO'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-4 rounded-[10px] text-xs font-black tracking-[0.2em] uppercase transition-all ${
                    activeTab === tab 
                      ? 'bg-secondary text-slate-950 shadow-lg shadow-secondary/20 scale-105' 
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab === 'GIPS' ? 'Gips (Suva gradnja)' : tab === 'MOLERAJ' ? 'Moleraj & Farbanje' : tab === 'PODOVI' ? 'Laminat & Parket' : tab === 'BEHATON' ? 'Behaton & Dvorište' : tab === 'HIDRO' ? 'Hidroizolacija' : tab}
                </button>
              ))}
            </div>
            
            {/* Calculator Render */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderCalculator()}
              </motion.div>
            </AnimatePresence>

          </div>
        </div>
      </section>
      
      <AnimatePresence>
        {isRfqOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRfqOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0A0F14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[80px] pointer-events-none"></div>
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-10 shrink-0">
                <div>
                  <div className="flex items-center gap-3 text-secondary mb-1">
                    <ShoppingCart className="w-5 h-5" />
                    <h2 className="text-sm font-black tracking-widest uppercase">Request For Quotation</h2>
                  </div>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">
                    Kategorija: <span className="text-white">{rfqCategoryName}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsRfqOpen(false)}
                  className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Body */}
              <div className="p-6 relative z-10 overflow-y-auto flex-1 custom-scrollbar">
                {rfqSuccess ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Tender Uspešno Poslat</h3>
                    <p className="text-sm text-white/60 mb-8 max-w-md">
                      Vaša specifikacija je prosleđena svim aktivnim dobavljačima u zadatom regionu. Dobićete ponude na navedeni broj telefona.
                    </p>
                    <button
                      onClick={() => setIsRfqOpen(false)}
                      className="bg-white/10 hover:bg-white/15 text-white font-bold py-3 px-8 rounded-lg uppercase tracking-wider text-xs transition-colors cursor-pointer"
                    >
                      Zatvori
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendRfq} className="space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Package className="w-3 h-3" />
                        Specifikacija Materijala (Tender)
                      </h4>
                      <div className="bg-[#070B0F] rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                              <th className="p-3 text-[9px] font-black text-white/40 uppercase tracking-widest">Naziv Artikla</th>
                              <th className="p-3 text-[9px] font-black text-white/40 uppercase tracking-widest text-right">Količina</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rfqSpec.map((item, idx) => (
                              <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                                <td className="p-3">
                                  <div className="text-xs font-bold text-white/90">{item.name}</div>
                                  {item.desc && <div className="text-[9px] text-white/40 uppercase tracking-wider mt-1">{item.desc}</div>}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="text-sm font-mono font-bold text-secondary">{item.amount} <span className="text-[10px] text-white/50">{item.unit}</span></div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        Lokacija i Kontakt
                      </h4>
                      <div>
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Region za nabavku</label>
                        <select
                          value={rfqRegionId}
                          onChange={e => setRfqRegionId(e.target.value)}
                          className="w-full bg-[#070B0F] border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm font-bold outline-none focus:border-secondary transition-colors cursor-pointer appearance-none"
                        >
                          {LOCATIONS.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Kontakt Telefon (Za Ponude)</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            required
                            type="tel"
                            placeholder="064 123 4567"
                            value={rfqPhone}
                            onChange={e => setRfqPhone(e.target.value)}
                            className="w-full bg-[#070B0F] border border-white/10 rounded-lg pl-11 pr-4 py-3.5 text-white text-sm font-mono outline-none focus:border-secondary transition-colors"
                          />
                        </div>
                        <p className="text-[9px] text-white/30 uppercase tracking-wider mt-2">
                          Prodavci građevinskog materijala će Vas kontaktirati na ovaj broj sa ponudom.
                        </p>
                      </div>
                    </div>

                    {rfqError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-4 rounded-lg">
                        {rfqError}
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={rfqSubmitting}
                      className="w-full bg-secondary hover:bg-yellow-500 text-slate-950 font-black text-xs tracking-widest uppercase py-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {rfqSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Objavi Tender Na Platformi
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
