import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { magazineService } from '@/src/services/magazineService';
import { Article, ArticleStatus, MagazineCategory } from '@/src/types/magazine';
import { useAuth } from '@/src/context/AuthContext';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { useMagazineAdmin } from './useMagazineAdmin';

export function MagazineModals({ state }: { state: ReturnType<typeof useMagazineAdmin> }) {
  const { user, queryClient, activeSubTab, setActiveSubTab, searchQuery, setSearchQuery, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, editorPreviewMode, setEditorPreviewMode, editingArticle, setEditingArticle, isUploading, setIsUploading, isAiGenerating, setIsAiGenerating, suggestedVariants, setSuggestedVariants, showAiGenerator, setShowAiGenerator, aiTopic, setAiTopic, aiSelectedCategory, setAiSelectedCategory, aiTone, setAiTone, aiLength, setAiLength, isAiWriting, setIsAiWriting, aiError, setAiError, isAutopilotTriggering, setIsAutopilotTriggering, autopilotMessage, setAutopilotMessage, generatedArticle, setGeneratedArticle, handleTriggerAutopilotNow, handleAiArticleGenerate, handleImportAiArticle, editingCategory, setEditingCategory, showCategoryModal, setShowCategoryModal, calculateSeoScore, articles, articlesLoading, categories, categoriesLoading, stats, statsLoading, ctrReportResponse, refetchCtr, isCtrLoading, isFlushingCtr, setIsFlushingCtr, ctrActionMessage, setCtrActionMessage, handleManualCtrFlush, recalculateMutation, saveArticleMutation, deleteArticleMutation, quickStatusMutation, saveCategoryMutation, deleteCategoryMutation, handleImageUpload, removeGalleryImage, fetchAiSuggestions, applyVariant, filteredArticles, handleOpenCreateArticle, handleOpenEditArticle, handleOpenCreateCategory, handleOpenEditCategory } = state;
  return (
    <>
      <AnimatePresence>
        {showCategoryModal && editingCategory && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0F14] border border-white/10 w-full max-w-lg rounded-[16px] p-8 shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>

              <div className="border-b border-white/5 pb-4 mb-2">
                <h3 className="text-base font-black text-white uppercase tracking-[0.1em]">
                  {editingCategory.id ? 'UREDI KATEGORIJU' : 'DODAJ KATEGORIJU'}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Naziv Kategorije *</label>
                  <input
                    required
                    type="text"
                    value={editingCategory.name || ''}
                    onChange={(e) => setEditingCategory(prev => {
                      if (!prev) return null;
                      const name = e.target.value;
                      const slug = prev.id ? prev.slug : name.toLowerCase().trim()
                        .replace(/[^a-z0-9\s-]/g, '')
                        .replace(/\s+/g, '-');
                      return { ...prev, name, slug };
                    })}
                    placeholder="npr. Renoviranje i Izolacija"
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs font-bold text-white outline-none focus:border-secondary/50"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Ruta (Slug) *</label>
                  <input
                    required
                    type="text"
                    value={editingCategory.slug || ''}
                    disabled={!!editingCategory.id}
                    onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, slug: e.target.value }) : null)}
                    placeholder="npr. renoviranje"
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs font-mono text-white outline-none focus:border-secondary/50 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Opis</label>
                  <textarea
                    rows={3}
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                    placeholder="Opis kategorije za posetioce..."
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs font-medium text-white outline-none focus:border-secondary/50 resize-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Ikonica (Lucide/Material)</label>
                    <input
                      type="text"
                      value={editingCategory.icon || 'star'}
                      onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, icon: e.target.value }) : null)}
                      placeholder="npr. construction, home"
                      className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs text-white outline-none focus:border-secondary/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Boja (Hex)</label>
                    <input
                      type="text"
                      value={editingCategory.color || '#FEBF0D'}
                      onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, color: e.target.value }) : null)}
                      placeholder="#FEBF0D"
                      className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs text-white outline-none focus:border-secondary/50 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Redosled sortiranja</label>
                    <input
                      type="number"
                      value={editingCategory.order || 0}
                      onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, order: parseInt(e.target.value) }) : null)}
                      className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs text-white outline-none focus:border-secondary/50"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editingCategory.isActive ?? true}
                      onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, isActive: e.target.checked }) : null)}
                      className="w-4 h-4 bg-white/5 border border-white/10 rounded"
                    />
                    <label htmlFor="isActive" className="text-xs font-black uppercase tracking-widest cursor-pointer">Aktivna</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[10px] text-xs font-black uppercase tracking-widest text-white transition-all"
                >
                  ODUSTANI
                </button>
                <button
                  onClick={() => saveCategoryMutation.mutate(editingCategory)}
                  disabled={saveCategoryMutation.isPending}
                  className="px-8 py-3 bg-secondary text-slate-950 rounded-[10px] text-xs font-black uppercase tracking-widest hover:bg-secondary/90 transition-all"
                >
                  {saveCategoryMutation.isPending ? 'ČUVANJE...' : 'SAČUVAJ'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
         AI REDAKCIJA GENERATOR MODAL
         ========================================================================= */}
      <AnimatePresence>
        {showAiGenerator && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0A0F14] border border-[#4F46E5]/30 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[20px] shadow-2xl shadow-indigo-500/10 flex flex-col relative"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-indigo-950/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#4F46E5]/20 border border-[#4F46E5]/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#A5B4FC]">psychology</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                      AI Redakcija & Autopilot
                    </h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Automatsko generisanje celih članaka sa Gemini modelom</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowAiGenerator(false); setGeneratedArticle(null); setAiTopic(''); }}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Modal Core Area */}
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left controls column */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="space-y-4 bg-white/[0.01] border border-white/5 p-5 rounded-[12px]">
                    <div className="text-[10px] font-black text-[#A5B4FC] tracking-[0.15em] uppercase">Podešavanja generatora</div>

                    {/* Topic input */}
                    <div>
                      <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Unesite temu ili ideje *</label>
                      <textarea
                        required
                        rows={3}
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="npr. Primena novih tehnologija u betoniranju u hladnim zimskim uslovima, ili Energetska efikasnost i toplotne pumpe..."
                        className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs text-white outline-none focus:border-indigo-500/50 resize-none font-sans"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[8px] text-white/30 uppercase tracking-wider">Ideje:</span>
                        <button
                          type="button"
                          onClick={() => setAiTopic('Prednosti i ugradnja krovnih solarnih panela na porodične kuće')}
                          className="text-[8px] bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          #SolarniPaneli
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiTopic('Sve o izboru i stabilnosti armaturnih mreža za plitke temelje')}
                          className="text-[8px] bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          #Temelji
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiTopic('Najbolji trendovi u modernoj unutrašnjoj rasveti i dizajnu enterijera')}
                          className="text-[8px] bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          #Enterijer
                        </button>
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Kategorija</label>
                      <select
                        value={aiSelectedCategory}
                        onChange={(e) => setAiSelectedCategory(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs font-bold text-white outline-none focus:border-indigo-500/50"
                      >
                        <option value="">Izaberite Kategoriju...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.slug} className="bg-slate-900">{cat.name.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tone / Style */}
                    <div>
                      <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Stil i novinarski ton</label>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs font-bold text-white outline-none focus:border-indigo-500/50"
                      >
                        <option value="strucan" className="bg-slate-900">Inženjerski / Stručan</option>
                        <option value="edukativan" className="bg-slate-900">Edukativan / Detaljan</option>
                        <option value="novinarski" className="bg-slate-900">Informativni / Vest</option>
                        <option value="promotivni" className="bg-slate-900">PR / Promo / Marketinški</option>
                      </select>
                    </div>

                    {/* Output words length slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Približna dužina teksta</label>
                        <span className="text-[10px] font-mono font-black text-indigo-400">{aiLength} reči</span>
                      </div>
                      <input
                        type="range"
                        min={300}
                        max={1600}
                        step={100}
                        value={aiLength}
                        onChange={(e) => setAiLength(parseInt(e.target.value))}
                        className="w-full accent-[#4F46E5] bg-white/5 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {aiError && (
                    <div className="p-4 bg-red-400/5 border border-red-500/20 text-red-400 text-xs rounded-[10px] leading-relaxed font-sans">
                      {aiError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAiArticleGenerate}
                    disabled={isAiWriting}
                    className="w-full py-4 bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-white/5 text-white disabled:text-white/30 rounded-[12px] text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
                  >
                    {isAiWriting ? (
                      <>
                        <span className="material-symbols-outlined text-sm font-bold animate-spin">sync</span>
                        GEMINI PIŠE STRUČAN ČLANAK...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm font-bold">bolt</span>
                        GENERISI TEKST ODMAH
                      </>
                    )}
                  </button>

                  {/* Autopilot Scheduler Control Unit */}
                  <div className="bg-[#4F46E5]/5 border border-dashed border-[#4F46E5]/20 p-5 rounded-[12px] space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#A5B4FC] text-md">rocket_launch</span>
                        <div className="text-[10px] font-black text-white tracking-widest uppercase">AUTOPILOT SCHEDULER</div>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-mono select-none">AKTIVAN</span>
                    </div>
                    
                    <p className="text-[10px] text-white/50 leading-relaxed font-sans">
                      Svakog utorka u 03:00 h, asinhroni Autopilot analizira trendove i potražnju na platformi, piše novi visokokvalitetni stručni članak te ga postavlja u <strong>DRAFT</strong> status za administrativno odobrenje bez preopterećenja baze.
                    </p>

                    {autopilotMessage && (
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-[#A5B4FC] text-[10px] rounded-[8px] leading-relaxed font-sans">
                        {autopilotMessage}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleTriggerAutopilotNow}
                      disabled={isAutopilotTriggering}
                      className="w-full py-2.5 bg-[#4F46E5]/10 hover:bg-[#4F46E5]/20 text-[#A5B4FC] disabled:text-[#A5B4FC]/40 border border-[#A5B4FC]/20 rounded-[8px] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isAutopilotTriggering ? (
                        <>
                          <span className="material-symbols-outlined text-sm font-bold animate-spin">sync</span>
                          POKRETANJE...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm font-bold">play_arrow</span>
                          POKRENI ASINHRONI AUTOPILOT ODMAH
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right preview column */}
                <div className="lg:col-span-7 flex flex-col min-h-[350px]">
                  {isAiWriting ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/[0.01] border border-white/5 rounded-[12px]">
                      <span className="material-symbols-outlined text-5xl text-[#A5B4FC]/40 mb-3 animate-bounce">psychology</span>
                      <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">Pisanje i optimizacija u toku</h4>
                      <p className="text-[10px] text-white/40 font-sans max-w-sm leading-relaxed">
                        Gemini analizira unete parametre, konstruiše visoko stručnu inženjersku terminologiju i generiše formatirani tekst sa Markdown strukturom i SEO metapodacima.
                      </p>
                    </div>
                  ) : generatedArticle ? (
                    <div className="flex-1 flex flex-col space-y-4 overflow-hidden rounded-[12px] border border-[#4F46E5]/20 bg-indigo-950/5 p-6 overflow-y-auto max-h-[60vh]">
                      <div className="border-b border-white/5 pb-3 flex items-center justify-between">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">GENERISANI PREDLOG ČLANKA</span>
                        <div className="flex gap-1">
                          {generatedArticle.tags.map((tag, idx) => (
                            <span key={idx} className="bg-[#4F46E5]/20 text-[#A5B4FC] border border-[#4F46E5]/20 px-1.5 py-0.5 rounded text-[8px] font-mono">#{tag}</span>
                          ))}
                        </div>
                      </div>

                      {/* Article Title */}
                      <div className="space-y-1">
                        <div className="text-[8px] font-black tracking-widest text-[#A5B4FC] uppercase">Naslov članka</div>
                        <h2 className="text-sm font-black text-white uppercase tracking-tight">{generatedArticle.title}</h2>
                      </div>

                      {/* SEO Audit Report Card */}
                      {generatedArticle.audit && (
                        <div className="p-4 rounded-xl border border-dashed border-indigo-500/30 bg-[#4F46E5]/5 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-[#A5B4FC] tracking-wider uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px] font-bold">verified_user</span>
                              Programski SEO Audit Report
                            </span>
                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-black select-none ${
                              generatedArticle.audit.score >= 90
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                : generatedArticle.audit.score >= 70
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/20 text-red-400 border border-red-500/20"
                            }`}>
                              SCORE: {generatedArticle.audit.score}/100
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {generatedArticle.audit.feedbacks && generatedArticle.audit.feedbacks.map((feedback, idx) => {
                              const isSuccess = feedback.toLowerCase().includes("sjajna") || feedback.toLowerCase().includes("ugrađeno");
                              return (
                                <div key={idx} className="flex items-start gap-1.5 text-[10px] text-white/70 font-sans leading-relaxed">
                                  <span className={`material-symbols-outlined text-[13px] shrink-0 mt-0.5 font-bold ${
                                    isSuccess ? "text-emerald-400" : "text-amber-400"
                                  }`}>
                                    {isSuccess ? "check_circle" : "info"}
                                  </span>
                                  <span>{feedback}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Excerpt */}
                      <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-[8px] space-y-1">
                        <div className="text-[8px] font-black tracking-widest text-[#A5B4FC] uppercase">Kratak izvod (Excerpt)</div>
                        <p className="text-[11px] font-sans text-white/70 italic leading-relaxed">{generatedArticle.excerpt}</p>
                      </div>

                      {/* Main Full Code Content */}
                      <div className="space-y-2">
                        <div className="text-[8px] font-black tracking-widest text-[#A5B4FC] uppercase">Sadržaj (Markdown format)</div>
                        <div className="p-4 bg-[#05080c] border border-white/5 rounded-[8px] font-mono text-[10px] text-white/80 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[220px]">
                          {generatedArticle.content}
                        </div>
                      </div>

                      {/* SEO Tags info */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-[6px] space-y-1">
                          <div className="text-[8px] font-black tracking-widest text-[#A5B4FC] uppercase">Sugestija za SEO Title</div>
                          <div className="text-[10px] text-white font-bold leading-tight">{generatedArticle.seoTitle}</div>
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-[6px] space-y-1">
                          <div className="text-[8px] font-black tracking-widest text-[#A5B4FC] uppercase">Sugestija za Meta Description</div>
                          <div className="text-[10px] text-white/70 font-sans leading-relaxed">{generatedArticle.metaDescription}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/[0.01] border border-white/5 rounded-[12px]">
                      <span className="material-symbols-outlined text-4xl text-white/20 mb-2">auto_awesome</span>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Redakcija je slobodna</h4>
                      <p className="text-[10px] text-white/30 font-sans max-w-xs leading-relaxed">
                        Definišite temu sa leve strane, podesite željeni stil i pritisnite dugme iznad za automatsko pisanje.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 flex justify-end gap-3 shrink-0 bg-slate-900/40">
                <button
                  type="button"
                  onClick={() => { setShowAiGenerator(false); setGeneratedArticle(null); setAiTopic(''); }}
                  className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[10px] text-xs font-black uppercase tracking-widest text-white transition-all cursor-pointer"
                >
                  ODUSTANI
                </button>
                <button
                  type="button"
                  onClick={handleImportAiArticle}
                  disabled={!generatedArticle}
                  className="px-8 py-3.5 bg-[#4F46E5] disabled:bg-white/5 text-white disabled:text-white/30 border border-[#4F46E5]/40 rounded-[10px] text-xs font-black uppercase tracking-widest hover:bg-[#4338CA] transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/15 animate-shimmer"
                >
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                  UVEZI ČLANAK DIREKTNO U CMS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  );
}
