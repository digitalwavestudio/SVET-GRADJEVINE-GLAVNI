import { motion } from 'motion/react';
import React, { useState } from 'react';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';

import { LOCATIONS, PROFESSIONS } from '@/src/constants/taxonomy';

interface CVData {
  fullName: string;
  title: string;
  profession: string;
  professionSlug: string;
  sector: string;
  email: string;
  phone: string;
  location: string;
  locationSlug: string;
  experience: string;
  skills: string[];
  education: string;
  about: string;
}

export default function CVGeneratorPage() {
  const { user } = useAuth();
  const [data, setData] = useState<CVData>({
    fullName: user?.name || '',
    title: 'KVALIFIKOVANI MAJSTOR',
    profession: user?.profession || '',
    professionSlug: user?.professionSlug || '',
    sector: user?.sector || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || 'Beograd',
    locationSlug: user?.locationSlug || 'beograd',
    experience: (user?.cvData?.experience as string) || '',
    skills: user?.cvData?.skills || [],
    education: (user?.cvData?.education as string) || '',
    about: user?.cvData?.about || ''
  });

  const [activeTab, setActiveTab] = useState<'info' | 'skills' | 'exp'>('info');
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const { updateUser } = useAuth();

  const handleSaveCV = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Izračunaj novi skor (trenutni + 15% za CV ako ga nije bilo)
      const currentScore = user.profileScore || 0;
      const newScore = user.hasCV ? currentScore : Math.min(currentScore + 25, 100);

      await updateUser({
        hasCV: true,
        profileScore: newScore,
        location: data.location,
        locationSlug: data.locationSlug,
        profession: data.profession || data.title,
        professionSlug: data.professionSlug,
        sector: data.sector,
        cvData: data
      });
      alert('VAŠ CV JE SAČUVAN NA PROFILU! SADA JE VAŠ PROFIL JAČI.');
    } catch (error) {
      console.error(error);
      alert('GREŠKA PRI ČUVANJU CV-A.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">GENERATOR BIOGRAFIJE</h1>
            <p className="text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">KREIRAJTE PROFESIONALNI CV ZA PAR MINUTA</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleSaveCV}
              disabled={isSaving}
              className="bg-white/10 text-white font-black px-8 py-4 rounded-[10px] hover:bg-white/20 transition-all text-[10px] tracking-[0.2em] uppercase flex items-center gap-3"
            >
              <span className="material-symbols-outlined">save</span>
              {isSaving ? 'ČUVANJE...' : 'SAČUVAJ NA PROFILU'}
            </button>
            <button className="bg-secondary text-slate-950 font-black px-8 py-4 rounded-[10px] hover:bg-yellow-400 transition-all text-[10px] tracking-[0.2em] uppercase flex items-center gap-3 shadow-2xl shadow-secondary/20">
              <span className="material-symbols-outlined">download</span>
              PREUZMI PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Editor Side */}
          <div className="space-y-6">
            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden">
              <div className="flex border-b border-white/5">
                {[
                  { id: 'info', label: 'OSNOVNO', icon: 'person' },
                  { id: 'skills', label: 'VEŠTINE', icon: 'bolt' },
                  { id: 'exp', label: 'ISKUSTVO', icon: 'work' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-6 flex items-center justify-center gap-3 text-[10px] font-black tracking-widest uppercase transition-all relative ${
                      activeTab === tab.id ? 'text-secondary' : 'text-white/20 hover:text-white/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-secondary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-10 space-y-8">
                {activeTab === 'info' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">IME I PREZIME</label>
                        <input 
                          name="fullName"
                          value={data.fullName}
                          onChange={handleInputChange}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">POZICIJA / PROFESIJA</label>
                        <select 
                          name="profession"
                          value={data.professionSlug}
                          onChange={(e) => {
                            const slug = e.target.value;
                            let name = '';
                            let sector = '';
                            for (const s in PROFESSIONS) {
                              const found = PROFESSIONS[s].find(p => p.slug === slug);
                              if (found) {
                                name = found.name;
                                sector = s;
                                break;
                              }
                            }
                            setData(prev => ({ 
                              ...prev, 
                              profession: name, 
                              professionSlug: slug,
                              sector: sector,
                              title: name.toUpperCase()
                            }));
                          }}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Izaberi profesiju</option>
                          {Object.keys(PROFESSIONS).map(sector => (
                            <optgroup key={sector} label={sector.toUpperCase()}>
                              {PROFESSIONS[sector].map(p => (
                                <option key={p.slug} value={p.slug}>{p.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">LOKACIJA / GRAD</label>
                        <select 
                          name="location"
                          value={data.locationSlug}
                          onChange={(e) => {
                            const slug = e.target.value;
                            const found = LOCATIONS.find(l => l.slug === slug);
                            setData(prev => ({ 
                              ...prev, 
                              location: found?.name || 'Srbija', 
                              locationSlug: slug 
                            }));
                          }}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none appearance-none cursor-pointer"
                        >
                          {LOCATIONS.map(l => (
                            <option key={l.slug} value={l.slug}>{l.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">EMAIL</label>
                        <input 
                          name="email"
                          value={data.email}
                          onChange={handleInputChange}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">TELEFON</label>
                        <input 
                          name="phone"
                          value={data.phone}
                          onChange={handleInputChange}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">O MENI</label>
                      <textarea 
                        name="about"
                        rows={4}
                        value={data.about}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none resize-none"
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'skills' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">BRZI IZBOR VEŠTINA (KLIKNI ZA DODAVANJE)</label>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {['ARMIRANJE', 'ZIDANJE', 'KROVOVI', 'FASADE', 'KERAMIKA', 'GIPSKARTON', 'ČITANJE PROJEKATA', 'VOZAČKA B', 'VILJUŠKAR'].map((skill) => (
                          <button
                            key={skill}
                            onClick={() => {
                              if (!data.skills.includes(skill)) {
                                setData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
                              }
                            }}
                            className="bg-white/5 hover:bg-secondary/20 text-white/60 hover:text-secondary border border-white/10 hover:border-secondary/30 px-4 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">IZABRANE VEŠTINE (ODVOJENE ZAREZOM)</label>
                      <textarea 
                        rows={4}
                        value={data.skills.join(', ')}
                        onChange={(e) => setData(prev => ({ ...prev, skills: e.target.value.split(',').map(s => s.trim().toUpperCase()) }))}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none resize-none"
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'exp' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">BRZI UNOS ISKUSTVA</label>
                      <div className="grid grid-cols-2 gap-2 mb-6">
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
                            className="bg-white/5 hover:bg-secondary/20 text-white/60 hover:text-secondary text-left border border-white/10 hover:border-secondary/30 px-4 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            + {exp}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">RADNO ISKUSTVO</label>
                      <textarea 
                        name="experience"
                        rows={6}
                        value={data.experience}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="bg-secondary/10 border border-secondary/20 rounded-[10px] p-8">
              <div className="flex items-center gap-4 mb-4">
                <span className="material-symbols-outlined text-secondary">info</span>
                <h4 className="text-xs font-black text-secondary uppercase tracking-widest">SAVET ZA BIOGRAFIJU</h4>
              </div>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider leading-relaxed">
                POSLODAVCI NAJVIŠE OBRAĆAJU PAŽNJU NA KONKRETNE PROJEKTE NA KOJIMA STE RADILI. NAVEDITE NAZIVE FIRMI I VRSTU OBJEKATA.
              </p>
            </div>
          </div>

          {/* Preview Side */}
          <div className="sticky top-8">
            <div className="bg-white rounded-[10px] p-12 text-slate-950 shadow-2xl min-h-[800px] flex flex-col">
              {/* CV Header */}
              <div className="flex justify-between items-start border-b-4 border-slate-950 pb-10 mb-10">
                <div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase leading-none mb-2">{data.fullName || 'VAŠE IME'}</h2>
                  <h3 className="text-xl font-black text-secondary bg-slate-950 px-4 py-1 inline-block uppercase tracking-widest">{data.title}</h3>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest">{data.email}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest">{data.phone}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest">{data.location}</div>
                </div>
              </div>

              {/* CV Content */}
              <div className="grid grid-cols-3 gap-12 flex-1">
                <div className="col-span-2 space-y-10">
                  <section>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] border-b border-slate-200 pb-2 mb-4">O MENI</h4>
                    <p className="text-sm font-medium leading-relaxed text-slate-600">{data.about}</p>
                  </section>

                  <section>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] border-b border-slate-200 pb-2 mb-4">RADNO ISKUSTVO</h4>
                    <p className="text-sm font-medium leading-relaxed text-slate-600 whitespace-pre-line">{data.experience}</p>
                  </section>

                  <section>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] border-b border-slate-200 pb-2 mb-4">OBRAZOVANJE</h4>
                    <p className="text-sm font-medium leading-relaxed text-slate-600">{data.education}</p>
                  </section>
                </div>

                <div className="space-y-10">
                  <section>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] border-b border-slate-200 pb-2 mb-4">VEŠTINE</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map((skill, i) => (
                        <span key={i} className="bg-slate-100 text-[9px] font-black px-3 py-1.5 rounded-[10px] uppercase tracking-widest">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] border-b border-slate-200 pb-2 mb-4">JEZICI</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase">SRPSKI</span>
                        <span className="text-[9px] font-bold text-slate-400">MATERNJI</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase">NEMAČKI</span>
                        <span className="text-[9px] font-bold text-slate-400">B1</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* CV Footer */}
              <div className="mt-auto pt-10 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-950 rounded flex items-center justify-center">
                    <span className="text-[10px] font-black text-secondary">SG</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30">GENERISANO NA SVETGRAĐEVINE.RS</span>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest opacity-30">2024 © SVET GRAĐEVINE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
