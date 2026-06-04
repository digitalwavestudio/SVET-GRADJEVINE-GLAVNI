import { OptimizedImage } from '@/src/components/OptimizedImage';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { APP_CONFIG } from '@/src/constants/config';
import { PROFESSIONS, SECTORS } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { uploadImage } from '@/src/lib/imageUtils';
import { toast } from 'react-hot-toast';

interface LocalCVData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  skills: string[];
  education: string;
  about: string;
  portfolioImages?: string[];
  portfolioTitle?: string;
  portfolioDescription?: string;
  sector?: string;
  profession?: string;
}

export default function CVEditor() {
  const { user, updateUser } = useAuth();
  
  const [data, setData] = useState<LocalCVData>({
    fullName: user?.cvData?.fullName || user?.name || '',
    title: user?.cvData?.title || user?.profession || 'KVALIFIKOVANI MAJSTOR',
    email: user?.cvData?.email || user?.email || '',
    phone: user?.cvData?.phone || (user as any)?.phone || '',
    location: user?.cvData?.location || 'Beograd, Srbija',
    experience: (user?.cvData?.experience as string) || '5 godina iskustva na poziciji armirača i tesara...',
    skills: user?.cvData?.skills || ['ARMIRANJE', 'TESARSKI RADOVI', 'ČITANJE PROJEKATA'],
    education: (user?.cvData?.education as string) || 'Građevinska tehnička škola',
    about: user?.cvData?.about || user?.description || 'Vredan i odgovoran radnik sa velikim iskustvom na međunarodnim projektima.',
    portfolioImages: user?.cvData?.portfolioImages || [],
    portfolioTitle: user?.cvData?.portfolioTitle || '',
    portfolioDescription: user?.cvData?.portfolioDescription || '',
    sector: user?.cvData?.sector || '',
    profession: user?.cvData?.profession || ''
  });

  const availableProfessions = data.sector ? PROFESSIONS[data.sector] || [] : [];

  const [activeTab, setActiveTab] = useState<'info' | 'skills' | 'exp' | 'portfolio'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'sector') {
      setData(prev => ({ ...prev, [name]: value, profession: '' }));
    } else {
      setData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    try {
      const uploadPromises = (Array.from(files) as File[]).map(file => 
        uploadImage(file, `users/${user.id}/portfolio`, 'gallery')
      );
      const urls = await Promise.all(uploadPromises);
      setData(prev => ({
        ...prev,
        portfolioImages: [...(prev.portfolioImages || []), ...urls]
      }));
    } catch (error) {
      console.error(error);
      toast.error('Greška pri otpremanju slika.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setData(prev => ({
      ...prev,
      portfolioImages: prev.portfolioImages?.filter((_, i) => i !== index)
    }));
  };

  const handleSaveCV = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const currentScore = user.profileScore || 0;
      const newScore = user.hasCV ? currentScore : Math.min(currentScore + 15, 100);

      await updateUser({
        hasCV: true,
        cvData: data,
        profession: data.profession || data.title,
        profileScore: newScore
      });
      toast.success('Vaš CV je sačuvan na profilu! Sada je vaš profil jači.');
    } catch (error) {
      console.error(error);
      toast.error('Greška pri čuvanju CV-a.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#0A0F14] border border-white/5 rounded-[10px] p-6">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">GENERATOR BIOGRAFIJE</h3>
          <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">KREIRAJTE PROFESIONALNI CV ZA PAR MINUTA</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSaveCV}
            disabled={isSaving}
            className="bg-white/10 text-white font-black px-6 py-3 rounded-[10px] hover:bg-white/20 transition-all text-[9px] tracking-[0.2em] uppercase flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {isSaving ? '...' : 'SAČUVAJ'}
          </button>
          <button className="bg-secondary text-slate-950 font-black px-6 py-3 rounded-[10px] hover:bg-yellow-400 transition-all text-[9px] tracking-[0.2em] uppercase flex items-center gap-2 shadow-2xl shadow-secondary/20">
            <span className="material-symbols-outlined text-sm">download</span>
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Editor Side */}
        <div className="space-y-6">
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden">
            <div className="flex border-b border-white/5">
              {[
                { id: 'info', label: 'OSNOVNO', icon: 'person' },
                { id: 'skills', label: 'VEŠTINE', icon: 'bolt' },
                { id: 'exp', label: 'ISKUSTVO', icon: 'work' },
                { id: 'portfolio', label: 'PORTFOLIO', icon: 'collections' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-4 flex items-center justify-center gap-3 text-[9px] font-black tracking-widest uppercase transition-all relative ${
                    activeTab === tab.id ? 'text-secondary' : 'text-white/20 hover:text-white/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="cvActiveTab" className="absolute bottom-0 left-0 right-0 h-1 bg-secondary" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {activeTab === 'info' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">IME I PREZIME</label>
                      <input 
                        name="fullName"
                        value={data.fullName}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3 px-4 text-[10px] font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">POZICIJA</label>
                      <input 
                        name="title"
                        value={data.title}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3 px-4 text-[10px] font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">EMAIL</label>
                      <input 
                        name="email"
                        value={data.email}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3 px-4 text-[10px] font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">TELEFON</label>
                      <input 
                        name="phone"
                        value={data.phone}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3 px-4 text-[10px] font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">SEKTOR DELATNOSTI</label>
                      <div className="relative">
                        <select 
                          name="sector"
                          value={data.sector}
                          onChange={handleInputChange}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3 px-4 text-[10px] font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none appearance-none"
                        >
                          <option value="" disabled className="bg-[#0B1219]">Izaberite sektor</option>
                          {SECTORS.map(sector => (
                            <option key={sector.slug} value={sector.slug} className="bg-[#0B1219]">{sector.name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-sm">expand_more</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">ZANIMANJE / PROFESIJA</label>
                      <div className="relative">
                        <select 
                          name="profession"
                          value={data.profession}
                          onChange={handleInputChange}
                          disabled={!data.sector}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3 px-4 text-[10px] font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <option value="" disabled className="bg-[#0B1219]">
                            {!data.sector ? 'Prvo izaberite sektor' : 'Izaberite zanimanje'}
                          </option>
                          {availableProfessions.map(prof => (
                            <option key={prof.slug} value={prof.slug} className="bg-[#0B1219]">{prof.name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-sm">engineering</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">O MENI</label>
                    <textarea 
                      name="about"
                      rows={3}
                      value={data.about}
                      onChange={handleInputChange}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3 px-4 text-[10px] font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'skills' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">BRZI IZBOR VEŠTINA (KLIKNI ZA DODAVANJE)</label>
                    <div className="flex flex-wrap gap-2">
                      {['ARMIRANJE', 'ZIDANJE', 'KROVOVI', 'FASADE', 'KERAMIKA', 'GIPSKARTON', 'ČITANJE PROJEKATA', 'VOZAČKA B', 'VILJUŠKAR'].map((skill) => (
                        <button
                          key={skill}
                          onClick={() => {
                            if (!data.skills.includes(skill)) {
                              setData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
                            }
                          }}
                          className="bg-white/5 hover:bg-secondary/20 text-white/60 hover:text-secondary border border-white/10 hover:border-secondary/30 px-3 py-1.5 rounded-[10px] text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">IZABRANE VEŠTINE (ZAREZ)</label>
                    <textarea 
                      rows={3}
                      value={data.skills.join(', ')}
                      onChange={(e) => setData(prev => ({ ...prev, skills: e.target.value.split(',').map(s => s.trim().toUpperCase()) }))}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3 px-4 text-[10px] font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'exp' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">BRZI UNOS ISKUSTVA</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        '5+ godina u inostranstvu',
                        'Kompletno samostalan majstor',
                        'Iskustvo u vođenju tima',
                        'Posedujem sopstveni alat'
                      ].map((exp) => (
                        <button
                          key={exp}
                          onClick={() => {
                            setData(prev => ({ 
                              ...prev, 
                              experience: prev.experience ? `${prev.experience}\n- ${exp}` : `- ${exp}` 
                            }));
                          }}
                          className="bg-white/5 hover:bg-secondary/20 text-white/60 hover:text-secondary text-left border border-white/10 hover:border-secondary/30 px-3 py-2 rounded-[10px] text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          + {exp}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">RADNO ISKUSTVO</label>
                    <textarea 
                      name="experience"
                      rows={6}
                      value={data.experience}
                      onChange={handleInputChange}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3 px-4 text-[10px] font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'portfolio' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">NASLOV PORTFOLIJA / PROJEKATA</label>
                    <input 
                      name="portfolioTitle"
                      value={data.portfolioTitle}
                      onChange={handleInputChange}
                      placeholder="NPR. NAJZNAČAJNIJI RADOVI U 2023."
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3 px-4 text-[10px] font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">OPIS RADOVA</label>
                    <textarea 
                      name="portfolioDescription"
                      rows={3}
                      value={data.portfolioDescription}
                      onChange={handleInputChange}
                      placeholder="KRATAK OPIS VAŠIH NAJBOLJIH PROJEKATA..."
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3 px-4 text-[10px] font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">SLIKE RADOVA (PORTFOLIO)</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      <AnimatePresence>
                        {data.portfolioImages?.map((url, i) => (
                          <motion.div 
                            key={url}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="aspect-square rounded-[10px] border border-white/5 overflow-hidden relative group"
                          >
                            <OptimizedImage 
  src={url} 
  fallbackType="default" 
  alt="Portfolio slika" 
  className="w-full h-full object-cover" 
  containerClassName="w-full h-full"
/>
                            <button 
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="material-symbols-outlined text-white text-[14px]">close</span>
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <button 
                        onClick={() => document.getElementById('portfolio-image-upload')?.click()}
                        disabled={isUploading}
                        className="aspect-square rounded-[10px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-secondary/40 hover:bg-secondary/5 transition-all group"
                      >
                        <span className="material-symbols-outlined text-white/20 group-hover:text-secondary transition-colors italic">add_a_photo</span>
                        <span className="text-[8px] font-black text-white/20 group-hover:text-secondary uppercase tracking-widest">{isUploading ? '...' : 'DODAJ'}</span>
                      </button>
                      <input 
                        id="portfolio-image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="bg-secondary/10 border border-secondary/20 rounded-[10px] p-6">
            <div className="flex items-center gap-4 mb-3">
              <span className="material-symbols-outlined text-secondary text-xl">info</span>
              <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">SAVET ZA BIOGRAFIJU</h4>
            </div>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider leading-relaxed">
              POSLODAVCI NAJVIŠE OBRAĆAJU PAŽNJU NA KONKRETNE PROJEKTE NA KOJIMA STE RADILI. NAVEDITE NAZIVE FIRMI I VRSTU OBJEKATA.
            </p>
          </div>
        </div>

        {/* Preview Side */}
        <div className="bg-white rounded-[10px] p-8 text-slate-950 shadow-2xl aspect-[1/1.414] flex flex-col scale-[0.95] origin-top border border-slate-100 overflow-hidden">
          {/* CV Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-950 pb-4 mb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none mb-1">{data.fullName || 'VAŠE IME'}</h2>
              <h3 className="text-[10px] font-black text-secondary bg-slate-950 px-2 py-0.5 inline-block uppercase tracking-widest">{data.title}</h3>
            </div>
            <div className="text-right space-y-0.5">
              <div className="text-[8px] font-black uppercase tracking-widest">{data.email}</div>
              <div className="text-[8px] font-black uppercase tracking-widest">{data.phone}</div>
              <div className="text-[8px] font-black uppercase tracking-widest">{data.location}</div>
            </div>
          </div>

          {/* CV Content */}
          <div className="grid grid-cols-3 gap-6 flex-1 text-[10px]">
            <div className="col-span-2 space-y-6">
              <section>
                <h4 className="text-[8px] font-black uppercase tracking-[0.3em] border-b border-slate-100 pb-1 mb-2 text-slate-400">O MENI</h4>
                <p className="font-medium leading-relaxed text-slate-600 line-clamp-4">{data.about}</p>
              </section>

              <section>
                <h4 className="text-[8px] font-black uppercase tracking-[0.3em] border-b border-slate-100 pb-1 mb-2 text-slate-400">ISKUSTVO</h4>
                <p className="font-medium leading-relaxed text-slate-600 whitespace-pre-line line-clamp-6">{data.experience}</p>
              </section>

              <section>
                <h4 className="text-[8px] font-black uppercase tracking-[0.3em] border-b border-slate-100 pb-1 mb-2 text-slate-400">OBRAZOVANJE</h4>
                <p className="font-medium leading-relaxed text-slate-600 line-clamp-2">{data.education}</p>
              </section>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-[8px] font-black uppercase tracking-[0.3em] border-b border-slate-100 pb-1 mb-2 text-slate-400">VEŠTINE</h4>
                <div className="flex flex-wrap gap-1">
                  {data.skills.map((skill, i) => (
                    <span key={i} className="bg-slate-50 text-[7px] font-black px-2 py-1 rounded text-slate-800 uppercase">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-[8px] font-black uppercase tracking-[0.3em] border-b border-slate-100 pb-1 mb-2 text-slate-400">JEZICI</h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[7px] font-black uppercase">
                    <span>SRPSKI</span>
                    <span className="text-slate-400">MATERNJI</span>
                  </div>
                  <div className="flex justify-between items-center text-[7px] font-black uppercase">
                    <span>NEMAČKI</span>
                    <span className="text-slate-400">B1</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* CV Footer */}
          <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center opacity-20">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-slate-950 rounded flex items-center justify-center">
                <span className="text-[5px] font-black text-secondary">SG</span>
              </div>
              <span className="text-[6px] font-black uppercase tracking-widest">{APP_CONFIG.DOMAIN}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
