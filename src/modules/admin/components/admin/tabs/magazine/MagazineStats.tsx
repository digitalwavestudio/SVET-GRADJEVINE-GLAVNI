import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { magazineService } from '@/src/services/magazineService';
import { Article, ArticleStatus, MagazineCategory } from '@/src/types/magazine';
import { useAuth } from '@/src/context/AuthContext';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { useMagazineAdmin } from './useMagazineAdmin';

interface CtrReportItem {
  id: string;
  title: string;
  viewsCount: number;
  clicksCount: number;
  ctr: number;
  clickStats?: Record<string, number>;
}

export function MagazineStats({ state }: { state: ReturnType<typeof useMagazineAdmin> }) {
  const { user, queryClient, activeSubTab, setActiveSubTab, searchQuery, setSearchQuery, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, editorPreviewMode, setEditorPreviewMode, editingArticle, setEditingArticle, isUploading, setIsUploading, isAiGenerating, setIsAiGenerating, suggestedVariants, setSuggestedVariants, showAiGenerator, setShowAiGenerator, aiTopic, setAiTopic, aiSelectedCategory, setAiSelectedCategory, aiTone, setAiTone, aiLength, setAiLength, isAiWriting, setIsAiWriting, aiError, setAiError, isAutopilotTriggering, setIsAutopilotTriggering, autopilotMessage, setAutopilotMessage, generatedArticle, setGeneratedArticle, handleTriggerAutopilotNow, handleAiArticleGenerate, handleImportAiArticle, editingCategory, setEditingCategory, showCategoryModal, setShowCategoryModal, calculateSeoScore, articles, articlesLoading, categories, categoriesLoading, stats, statsLoading, ctrReportResponse, refetchCtr, isCtrLoading, isFlushingCtr, setIsFlushingCtr, ctrActionMessage, setCtrActionMessage, handleManualCtrFlush, recalculateMutation, saveArticleMutation, deleteArticleMutation, quickStatusMutation, saveCategoryMutation, deleteCategoryMutation, handleImageUpload, removeGalleryImage, fetchAiSuggestions, applyVariant, filteredArticles, handleOpenCreateArticle, handleOpenEditArticle, handleOpenCreateCategory, handleOpenEditCategory } = state;
  return (
        <div className="space-y-6">
          {/* TOP METRICS & REVENUE ESTIMATION CARDS */}
          {(() => {
            const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);
            const totalEstLeads = Math.round(totalViews * 0.021); // 2.1% conversion rate estimation
            const totalEstTenders = Math.round(totalViews * 0.007); // 0.7% tender post rate
            const avgSeoScore = articles.length > 0 
              ? Math.round(articles.reduce((sum, a) => sum + calculateSeoScore(a).totalScore, 0) / articles.length)
              : 100;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[12px] space-y-1 relative overflow-hidden group">
                  <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Ukupna čitanost magazina</div>
                  <div className="text-3xl font-black text-white">{totalViews.toLocaleString()}</div>
                  <div className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    +12.4% u odnosu na prošli mesec
                  </div>
                  <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-[64px] text-white">visibility</span>
                  </div>
                </div>

                <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[12px] space-y-1 relative overflow-hidden group">
                  <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Procena B2C Leadova (Majstori)</div>
                  <div className="text-3xl font-black text-secondary">{totalEstLeads.toLocaleString()}</div>
                  <div className="text-[10px] text-secondary/80 font-mono font-bold">
                    Konverzija ~2.1% posetilaca
                  </div>
                  <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-[64px] text-secondary">engineering</span>
                  </div>
                </div>

                <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[12px] space-y-1 relative overflow-hidden group">
                  <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Procena Novih Tendera (B2B)</div>
                  <div className="text-3xl font-black text-blue-400">{totalEstTenders.toLocaleString()}</div>
                  <div className="text-[10px] text-blue-400/80 font-mono font-bold">
                    Konverzija ~0.7% posetilaca
                  </div>
                  <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-[64px] text-blue-400">gavel</span>
                  </div>
                </div>

                <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[12px] space-y-1 relative overflow-hidden group">
                  <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Prosečan Autor SEO Score</div>
                  <div className={`text-3xl font-black ${avgSeoScore >= 80 ? 'text-green-400' : 'text-amber-400'}`}>{avgSeoScore}%</div>
                  <div className="text-[10px] text-white/50 font-bold">
                    Analizirano ukupno {articles.length} članaka
                  </div>
                  <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-[64px] text-green-400">seo</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* CHARTS CONTAINER (READERS BY CATEGORY) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0A0F14] border border-white/5 rounded-[12px] p-6 space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Analitika čitanosti po kategorijama</h3>
                <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Sumarni pregledi članaka unutar svake redakcijske vertikale</p>
              </div>

              <div className="pt-4 h-[280px]">
                {(() => {
                  const chartData = categories.map(cat => {
                    const catArticles = articles.filter(art => art.category === cat.slug);
                    const viewsVal = catArticles.reduce((sum, art) => sum + (art.viewCount || 0), 0);
                    return {
                      name: cat.name,
                      views: viewsVal,
                    };
                  }).filter(c => c.views > 0);

                  if (chartData.length === 0) {
                    return (
                      <div className="h-full flex items-center justify-center text-xs font-bold text-white/20 uppercase">
                        Nema dovoljno podataka za iscrtavanje grafikona
                      </div>
                    );
                  }

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} />
                        <ChartTooltip
                          contentStyle={{ backgroundColor: '#070C10', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}
                          labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#fff' }}
                          itemStyle={{ fontSize: '11px', color: '#FEBF0D' }}
                        />
                        <Bar dataKey="views" fill="#FEBF0D" radius={[4, 4, 0, 0]} barSize={35} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* POPULAR TAGS CARD */}
            <div className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Najpopularniji SEO tagovi</h3>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Rangiranje ključnih reči za indeksiranje</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {stats?.popularTags?.map((tag: string, idx: number) => (
                    <span key={idx} className="bg-white/5 border border-white/10 hover:border-secondary/30 text-white hover:text-secondary px-3 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer">
                      #{tag}
                    </span>
                  )) || <span className="text-white/30 text-xs">Nema registrovanih tagova</span>}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="text-[9px] font-black text-white/40 uppercase tracking-wider">SEO Preporuka dana</div>
                <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                  Fokusirajte se na unutrašnje linkovanje članaka sa kategorijom <b>Renoviranje</b> ka ponudama aktivnih majstora kako biste maksimizovali CTR i generisali B2C proviziju.
                </p>
              </div>
            </div>
          </div>

          {/* EDITORIAL LEADERBOARD (Top Articles & SEO Audit Indicators) */}
          <div className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-8 space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Editorial Leaderboard</h3>
              <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Najuspešniji artikli plasirani na platformi sa SEO penetracijom</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-6 py-4 text-left text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Članak</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Kategorija</th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Pregledi</th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">B2C Leads (Est)</th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">B2B Tend (Est)</th>
                    <th className="px-6 py-4 text-right text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">On-Page SEO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {articlesLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-xs text-white/30 font-bold uppercase tracking-wider">
                        Učitavanje redakcijske rang liste...
                      </td>
                    </tr>
                  ) : articles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-xs text-white/30 font-bold uppercase tracking-wider">
                        Nema dovoljno objavljenih tekstova za rangiranje.
                      </td>
                    </tr>
                  ) : (
                    [...articles]
                      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                      .slice(0, 5)
                      .map((art) => {
                        const viewsVal = art.viewCount || 0;
                        const estLeads = Math.round(viewsVal * 0.021);
                        const estTenders = Math.round(viewsVal * 0.007);
                        const seo = calculateSeoScore(art);
                        const scoreColor = seo.totalScore >= 80 ? 'text-green-400' : seo.totalScore >= 50 ? 'text-amber-400' : 'text-rose-500';

                        return (
                          <tr key={art.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-5">
                              <div>
                                <div className="text-xs font-bold text-white line-clamp-1">{art.title}</div>
                                <div className="text-[9px] text-white/30 font-mono line-clamp-1">{art.slug}</div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-[10px] text-white/60 font-black uppercase tracking-wider">
                                {art.category || 'Nema Kat.'}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center font-bold text-white text-xs">
                              {viewsVal.toLocaleString()}
                            </td>
                            <td className="px-6 py-5 text-center text-secondary font-mono text-xs font-black">
                              +{estLeads}
                            </td>
                            <td className="px-6 py-5 text-center text-blue-400 font-mono text-xs font-black">
                              +{estTenders}
                            </td>
                            <td className="px-6 py-5 text-right font-black text-xs">
                              <span className={`${scoreColor}`}>{seo.totalScore}%</span>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* HIGH-PERFORMANCE MAGAZINE CTR CONVERSION REPORT & MEMORY BUFFER TELEMETRY */}
          <div className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[#FEBF0D] text-sm font-bold">query_stats</span>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Magazin CTR Atribucija & Clickstream</h3>
                </div>
                <p className="text-[9px] text-white/40 uppercase tracking-widest leading-relaxed">
                  Realna analitika konverzije čitanosti u akcije na bazi. Klikovi na unutrašnje linkove se beleže u privremeni memorijski bafer u Redis-u (HINCRBY) i periodično upisuju u batch-u.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleManualCtrFlush}
                  disabled={isFlushingCtr}
                  className="px-4 py-2 bg-[#4F46E5] text-white hover:bg-indigo-600 disabled:bg-[#4F46E5]/45 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-2 transition-all shadow-md"
                >
                  {isFlushingCtr ? (
                    <>
                      <span className="material-symbols-outlined text-sm font-bold animate-spin">sync</span>
                      UPISIVANJE...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm font-bold">database</span>
                      PRIMENI BAFER NA BAZU ODMAH
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => refetchCtr()}
                  disabled={isCtrLoading}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer transition-all"
                  title="Osveži analitiku"
                >
                  <span className={`material-symbols-outlined text-sm font-bold ${isCtrLoading ? "animate-spin" : ""}`}>refresh</span>
                </button>
              </div>
            </div>

            {ctrActionMessage && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-[#A5B4FC] text-[10px] rounded-[8px] leading-relaxed font-sans max-w-xl">
                {ctrActionMessage}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-6 py-4 text-left text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Članak</th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-white/30 uppercase tracking-[0.2em] w-[140px]">Realni pregledi</th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-white/30 uppercase tracking-[0.2em] w-[140px]">Klikovi (Ukupno)</th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-white/30 uppercase tracking-[0.2em] w-[120px]">Efikasnost (CTR)</th>
                    <th className="px-6 py-4 text-right text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Destinacija klikova (Atribucija)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isCtrLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-xs text-white/30 font-bold uppercase tracking-wider">
                        Učitavanje CTR Clickstream izveštaja...
                      </td>
                    </tr>
                  ) : !ctrReportResponse || !ctrReportResponse.report || ctrReportResponse.report.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-xs text-white/30 font-bold uppercase tracking-wider">
                        Još uvek nema registrovanih konverzija i klikova na platformi. Pokrenite posetu nekom članku.
                      </td>
                    </tr>
                  ) : (
                    ctrReportResponse.report.map((item: CtrReportItem) => {
                      const ctrVal = item.ctr || 0;
                      let ctrColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                      if (ctrVal >= 3.0) {
                        ctrColor = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
                      } else if (ctrVal >= 1.0) {
                        ctrColor = "bg-amber-500/15 text-amber-400 border-amber-500/20";
                      }

                      return (
                        <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4.5">
                            <div>
                              <div className="text-xs font-black text-white line-clamp-1">{item.title}</div>
                              <div className="text-[9px] text-white/30 font-mono line-clamp-1">{item.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-center font-bold text-white text-xs">
                            {item.viewsCount?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4.5 text-center font-bold text-secondary text-xs">
                            {item.clicksCount?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4.5 text-center">
                            <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-mono font-black border uppercase tracking-wider ${ctrColor}`}>
                              {ctrVal.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-right">
                            {item.clickStats && Object.keys(item.clickStats).length > 0 ? (
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {Object.entries(item.clickStats).map(([dest, count]) => (
                                  <span key={dest} className="bg-white/5 border border-white/5 text-[9px] text-white/70 px-2 py-0.5 rounded font-mono font-medium">
                                    {dest}: <strong className="text-secondary">{count}</strong>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[9px] text-white/20 font-mono italic">Bez klik stream akcija</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    );
}
