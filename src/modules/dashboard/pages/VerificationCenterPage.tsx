import { motion } from 'motion/react';
import { useState, useRef } from 'react';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import axios from 'axios';

export default function VerificationCenterPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const isEmployer = user?.role === 'poslodavac';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('documents', file));

    try {
      const response = await axios.post('/api/verification/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedUrls(prev => [...prev, ...response.data.urls]);
    } catch (err: unknown) {
      setError('Greška pri otpremanju dokumenata. Pokušajte ponovo.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (uploadedUrls.length === 0) {
      setError('Morate otpremiti bar jedan dokument.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await axios.post('/api/verification/submit', { documentUrls: uploadedUrls });
      setSuccess(true);
    } catch (err: unknown) {
      setError(((err as { response?: { data?: { message?: string, error?: string } } })?.response)?.data?.error || 'Greška pri slanju zahteva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-4">ZAHTEV POSLAT!</h2>
          <p className="text-white/40 font-bold text-sm uppercase tracking-widest leading-relaxed">
            VAŠA DOKUMENTACIJA JE USPEŠNO PRIMLJENA. NAŠ TIM ĆE PREGLEDATI ZAHTEV U ROKU OD 24-48h.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">VERIFIKACIONI CENTAR (KYC)</h1>
          <p className="text-white/40 font-bold text-xs tracking-[0.2em] uppercase">ZAVRŠITE VERIFIKACIJU ZA "PROVEREN" BEDŽ I POTPUN PRISTUP</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-[10px] text-red-500 text-xs font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden shadow-2xl">
          <div className="flex border-b border-white/5">
            {[1, 2, 3].map((step) => (
              <div 
                key={step} 
                className={`flex-1 py-6 flex flex-col md:flex-row items-center justify-center gap-3 text-[10px] font-black tracking-widest uppercase transition-all relative ${
                  activeStep >= step ? 'text-secondary' : 'text-white/20'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                  activeStep > step ? 'bg-secondary text-slate-950' : 
                  activeStep === step ? 'border-2 border-secondary' : 'border border-white/10'
                }`}>
                  {activeStep > step ? <span className="material-symbols-outlined text-[16px]">check</span> : step}
                </div>
                <span>
                  {step === 1 ? 'OSNOVNI PODACI' : 
                   step === 2 ? (isEmployer ? 'PRAVNA DOKUMENTA' : 'LIČNI DOKUMENTI') : 
                   'PREGLED I SLANJE'}
                </span>
                {activeStep === step && (
                  <motion.div layoutId="activeStepIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-secondary" />
                )}
              </div>
            ))}
          </div>

          <div className="p-8 md:p-12">
            {activeStep === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h3 className="text-lg font-black uppercase tracking-tight mb-8">OSNOVNI PODACI</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isEmployer ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">PUN NAZIV FIRME (IZ APR)</label>
                        <input aria-label="Unos polja" className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-4 text-white text-sm font-bold outline-none focus:border-secondary transition-colors" defaultValue={user?.company || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">MATIČNI BROJ</label>
                        <input aria-label="Unos polja" className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-4 text-white text-sm font-bold outline-none focus:border-secondary transition-colors" placeholder="Npr. 21345678" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">PIB</label>
                        <input aria-label="Unos polja" className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-4 text-white text-sm font-bold outline-none focus:border-secondary transition-colors" placeholder="Npr. 112233445" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">SEDIŠTE (GRAD I ADRESA)</label>
                        <input aria-label="Unos polja" className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-4 text-white text-sm font-bold outline-none focus:border-secondary transition-colors" placeholder="Npr. Bulevar oslobođenja 12, Novi Sad" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">IME I PREZIME (KAO U LIČNOJ KARTI)</label>
                        <input aria-label="Unos polja" className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-4 text-white text-sm font-bold outline-none focus:border-secondary transition-colors" defaultValue={user?.name || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">JMBG</label>
                        <input aria-label="Unos polja" className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-4 text-white text-sm font-bold outline-none focus:border-secondary transition-colors" placeholder="Upišite vaš JMBG" />
                      </div>
                    </>
                  )}
                </div>
                <div className="pt-8 flex justify-end">
                  <button onClick={() => setActiveStep(2)} className="bg-secondary text-slate-950 font-black px-8 py-4 rounded-[10px] hover:bg-yellow-400 transition-all text-[10px] tracking-widest uppercase flex items-center gap-2">
                    SLEDEĆI KORAK <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {activeStep === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h3 className="text-lg font-black uppercase tracking-tight mb-2">OTPREMANJE DOKUMENTACIJE</h3>
                <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-8 leading-relaxed max-w-2xl">
                  {isEmployer ? 'SISTEM ZAHTEVA KOPIJU APR REŠENJA (.PDF ILI .JPG) RADI POTVRDE IDENTITETA PRAVNOG LICA.' : 'OTPREMITE SLIKU PREDNJE I ZADNJE STRANE LIČNE KARTE. PODACI SE KORISTE ISKLJUČIVO ZA VERIFIKACIJU KAKO BI DOBILI "PROVEREN MAJSTOR" ZNAČKU.'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="file" ref={fileInputRef1} hidden onChange={handleFileUpload} accept="image/*,application/pdf" />
                  <input type="file" ref={fileInputRef2} hidden onChange={handleFileUpload} accept="image/*,application/pdf" />

                  <div 
                    onClick={() => fileInputRef1.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-[10px] p-10 flex flex-col items-center justify-center text-center hover:border-secondary/50 transition-colors cursor-pointer group bg-white/[0.02]"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                      {isUploading ? (
                        <div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary animate-spin rounded-full" />
                      ) : (
                        <span className="material-symbols-outlined text-3xl">upload_file</span>
                      )}
                    </div>
                    <div className="text-sm font-black uppercase tracking-tight mb-2">{isEmployer ? 'APR REŠENJE' : 'LIČNA KARTA (PREDNJA STRANA)'}</div>
                    <div className="text-[10px] font-bold text-white/40 tracking-widest uppercase">
                      {uploadedUrls.length > 0 ? 'DOKUMENT OTPREMLJEN' : 'Klikni za odabir fajla'}
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => fileInputRef2.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-[10px] p-10 flex flex-col items-center justify-center text-center hover:border-secondary/50 transition-colors cursor-pointer group bg-white/[0.02]"
                  >
                     <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                      <span className="material-symbols-outlined text-3xl">flip_camera_ios</span>
                    </div>
                    <div className="text-sm font-black uppercase tracking-tight mb-2">{isEmployer ? 'POTVRDA O BANC. RAČUNU (OPCIONO)' : 'LIČNA KARTA (ZADNJA STRANA)'}</div>
                    <div className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Klikni za odabir fajla</div>
                  </div>
                </div>

                <div className="pt-8 flex justify-between">
                  <button onClick={() => setActiveStep(1)} className="bg-white/5 text-white font-black px-8 py-4 rounded-[10px] hover:bg-white/10 transition-all text-[10px] tracking-widest uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">arrow_back</span> NAZAD
                  </button>
                  <button onClick={() => setActiveStep(3)} className="bg-secondary text-slate-950 font-black px-8 py-4 rounded-[10px] hover:bg-yellow-400 transition-all text-[10px] tracking-widest uppercase flex items-center gap-2">
                    SLEDEĆI KORAK <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {activeStep === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 flex flex-col items-center text-center py-10">
                <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center mb-2 border border-secondary/30">
                  <span className="material-symbols-outlined text-4xl text-secondary">verified_user</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">DOKUMENTACIJA SPREMNA ZA SLANJE</h3>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed max-w-md mx-auto">
                    KADA POŠALJETE DOKUMENTE, NAŠ TIM ĆE IH PREGLEDATI U ROKU OD 24h. ODOBREN BEDŽ ĆE SE AUTOMATSKI POJAVITI NA VAŠEM PROFILU.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 tracking-widest uppercase bg-white/5 px-6 py-3 rounded-[10px]">
                  <span className="material-symbols-outlined text-sm text-green-500">lock</span> END-TO-END ENKRIPCIJA PODATAKA
                </div>

                <div className="pt-8 w-full max-w-sm flex justify-between gap-4">
                  <button onClick={() => setActiveStep(2)} className="w-1/3 bg-white/5 text-white font-black py-4 rounded-[10px] hover:bg-white/10 transition-all text-[10px] tracking-widest uppercase flex items-center justify-center">
                    NAZAD
                  </button>
                  <button 
                    onClick={handleSubmitRequest}
                    disabled={isSubmitting || uploadedUrls.length === 0}
                    className="flex-1 bg-secondary text-slate-950 font-black py-4 rounded-[10px] hover:bg-yellow-400 transition-all text-[10px] tracking-widest uppercase shadow-2xl shadow-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'SLANJE...' : 'POŠALJI ZAHTEV'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
