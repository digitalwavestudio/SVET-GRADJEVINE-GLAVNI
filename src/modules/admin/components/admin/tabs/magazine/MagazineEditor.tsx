import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { magazineService } from '@/src/services/magazineService';
import { Article, ArticleStatus, MagazineCategory } from '@/src/types/magazine';
import { useAuth } from '@/src/context/AuthContext';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { useMagazineAdmin } from './useMagazineAdmin';

export function MagazineEditor({ state }: { state: ReturnType<typeof useMagazineAdmin> }) {
  const { user, queryClient, activeSubTab, setActiveSubTab, searchQuery, setSearchQuery, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, editorPreviewMode, setEditorPreviewMode, editingArticle, setEditingArticle, isUploading, setIsUploading, isAiGenerating, setIsAiGenerating, suggestedVariants, setSuggestedVariants, showAiGenerator, setShowAiGenerator, aiTopic, setAiTopic, aiSelectedCategory, setAiSelectedCategory, aiTone, setAiTone, aiLength, setAiLength, isAiWriting, setIsAiWriting, aiError, setAiError, isAutopilotTriggering, setIsAutopilotTriggering, autopilotMessage, setAutopilotMessage, generatedArticle, setGeneratedArticle, handleTriggerAutopilotNow, handleAiArticleGenerate, handleImportAiArticle, editingCategory, setEditingCategory, showCategoryModal, setShowCategoryModal, calculateSeoScore, articles, articlesLoading, categories, categoriesLoading, stats, statsLoading, ctrReportResponse, refetchCtr, isCtrLoading, isFlushingCtr, setIsFlushingCtr, ctrActionMessage, setCtrActionMessage, handleManualCtrFlush, recalculateMutation, saveArticleMutation, deleteArticleMutation, quickStatusMutation, saveCategoryMutation, deleteCategoryMutation, handleImageUpload, removeGalleryImage, fetchAiSuggestions, applyVariant, filteredArticles, handleOpenCreateArticle, handleOpenEditArticle, handleOpenCreateCategory, handleOpenEditCategory } = state;
  if (!editingArticle) return null;
  
  return (
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.99 }}
        className="space-y-6"
      >
        {/* Editor Sticky Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4 gap-4">
          <div>
            <button
              onClick={() => { setEditingArticle(null); setSuggestedVariants(null); }}
              className="text-white/40 hover:text-white flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
              NAZAD NA SPISAK ČLANAKA
            </button>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              {editingArticle.id ? 'Uredi magazine članak' : 'Novi naučni i novinarski članak'}
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setEditingArticle(null); setSuggestedVariants(null); }}
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[10px] text-xs font-black uppercase tracking-widest text-white transition-all"
            >
              ODUSTANI
            </button>
            <button
              onClick={() => saveArticleMutation.mutate(editingArticle)}
              disabled={saveArticleMutation.isPending}
              className="px-8 py-3.5 bg-secondary text-slate-950 rounded-[10px] text-xs font-black uppercase tracking-widest hover:bg-secondary/90 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm font-bold">save</span>
              {saveArticleMutation.isPending ? 'ČUVANJE...' : 'SAČUVAJ ČLANAK'}
            </button>
          </div>
        </div>

        {/* 3-Part Architecture Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEVI PANEL: MESTO ZA TEKST */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-6 space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-xs font-black text-whit uppercase tracking-[0.2em] text-white">1. MESTO ZA TEKST & STRUKTURA</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Naslov članka *</label>
                  <input
                    required
                    type="text"
                    value={editingArticle.title || ''}
                    onChange={(e) => setEditingArticle(prev => {
                      if (!prev) return null;
                      const title = e.target.value;
                      const slug = prev.id ? prev.slug : title.toLowerCase().trim()
                        .replace(/[^a-z0-9\s-]/g, '')
                        .replace(/\s+/g, '-');
                      return { ...prev, title, slug };
                    })}
                    placeholder="Unesite naslov članka..."
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3.5 px-4 text-xs font-bold text-white outline-none focus:border-secondary/50"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Ruta (Slug) *</label>
                  <input
                    required
                    type="text"
                    value={editingArticle.slug || ''}
                    onChange={(e) => setEditingArticle(prev => prev ? ({ ...prev, slug: e.target.value }) : null)}
                    placeholder="npr. moderan-dizajn-kuca"
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3.5 px-4 text-xs font-mono text-white outline-none focus:border-secondary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Kategorija *</label>
                  <select
                    value={editingArticle.category || ''}
                    onChange={(e) => setEditingArticle(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs font-bold text-white outline-none focus:border-secondary/50"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug} className="bg-slate-900">{cat.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Status *</label>
                  <select
                    value={editingArticle.status || ''}
                    onChange={(e) => setEditingArticle(prev => prev ? ({ ...prev, status: e.target.value as ArticleStatus }) : null)}
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs font-bold text-white outline-none focus:border-secondary/50"
                  >
                    <option value={ArticleStatus.DRAFT} className="bg-slate-900">SKICA (DRAFT)</option>
                    <option value={ArticleStatus.PUBLISHED} className="bg-slate-900">OBJAVLJEN (PUBLISHED)</option>
                    <option value={ArticleStatus.SCHEDULED} className="bg-slate-900">ZAKAZAN (SCHEDULED)</option>
                    <option value={ArticleStatus.ARCHIVED} className="bg-slate-900">ARHIVIRAN (ARCHIVED)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Procenjeno vreme čitanja (Min)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingArticle.readTimeEstimate || 5}
                    onChange={(e) => setEditingArticle(prev => prev ? ({ ...prev, readTimeEstimate: parseInt(e.target.value) }) : null)}
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs text-white outline-none focus:border-secondary/50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Kratak Izvod (Excerpt / Sinopsis) *</label>
                <textarea
                  required
                  rows={2}
                  value={editingArticle.excerpt || ''}
                  onChange={(e) => setEditingArticle(prev => prev ? ({ ...prev, excerpt: e.target.value }) : null)}
                  placeholder="Kratki sinopsis do 160 karaktera koji će se prikazivati u karticama i pretragama..."
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3.5 px-4 text-xs text-white outline-none focus:border-secondary/50 font-sans resize-none"
                />
              </div>

              {/* Rich Body Content Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest">Sadržaj Članka (Markdown / HTML) *</label>
                  
                  {/* Editor View Tab Toggle */}
                  <div className="flex bg-white/5 p-1 rounded-[6px] border border-white/5">
                    <button
                      type="button"
                      onClick={() => setEditorPreviewMode('edit')}
                      className={`px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all ${
                        editorPreviewMode === 'edit' ? 'bg-secondary text-slate-950' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Pisanje
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorPreviewMode('preview')}
                      className={`px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all ${
                        editorPreviewMode === 'preview' ? 'bg-secondary text-slate-950' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Pregled
                    </button>
                  </div>
                </div>

                {editorPreviewMode === 'edit' ? (
                  <textarea
                    required
                    rows={12}
                    value={editingArticle.content || ''}
                    onChange={(e) => setEditingArticle(prev => prev ? ({ ...prev, content: e.target.value }) : null)}
                    placeholder="Pišite vaš stručni građevinski članak ovde. Podržano je formatiranje..."
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-4 px-4 text-xs font-mono text-white outline-none focus:border-secondary/50"
                  />
                ) : (
                  <div className="min-h-[240px] max-h-[400px] overflow-y-auto bg-white/[0.02] border border-white/10 rounded-[10px] p-6 text-white text-xs font-sans prose prose-invert overflow-x-hidden">
                    <div className="whitespace-pre-line">
                      {editingArticle.content || <span className="opacity-30">Nema teksta za prikaz...</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DESNI PANEL: SEO / META / AI PODEŠAVANJA */}
          <div className="space-y-6">
            {/* REALTIME SEO SCORE AUDIT */}
            {(() => {
              const audit = calculateSeoScore(editingArticle);
              const scoreColor = audit.totalScore >= 80 ? 'text-green-400' : audit.totalScore >= 50 ? 'text-amber-400' : 'text-rose-500';
              const progressBarColor = audit.totalScore >= 80 ? 'bg-green-400' : audit.totalScore >= 50 ? 'bg-amber-400' : 'bg-rose-500';
              
              return (
                <div className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-6 space-y-4">
                  <div className="border-b border-white/5 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">SEO AUDIT SCORE</h3>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Automatska ON-PAGE SEO analiza</p>
                    </div>
                    <span className={`text-xl font-black ${scoreColor}`}>{audit.totalScore}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full overflow-hidden bg-white/5">
                      <div 
                        className={`h-full transition-all duration-300 ${progressBarColor}`}
                        style={{ width: `${audit.totalScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-black tracking-widest text-white/40 uppercase">
                      <span>CRITICAL</span>
                      <span>80% PASS</span>
                      <span>PERFECT</span>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2 pt-2">
                    {audit.items.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        <span className={`material-symbols-outlined text-sm shrink-0 ${item.passed ? 'text-green-400' : 'text-white/20'}`}>
                          {item.passed ? 'check_circle' : 'cancel'}
                        </span>
                        <div className="space-y-0.5">
                          <div className={`font-bold transition-colors ${item.passed ? 'text-white/80' : 'text-white/40'}`}>
                            {item.label}
                          </div>
                          {item.tip && (
                            <div className="text-[10px] text-amber-400/80 leading-relaxed font-sans font-medium">
                              {item.tip}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warning if Score is less than 80% */}
                  {audit.totalScore < 80 && (
                    <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-[8px] space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-black tracking-wider text-amber-400 uppercase">
                        <span className="material-symbols-outlined text-xs">warning</span>
                        Slabiji SEO skor (&lt; 80%)
                      </div>
                      <p className="text-[10px] text-white/60 font-medium font-sans leading-relaxed">
                        Sistem preporučuje ispravku stavki pre nego što članak postavite ka statusu OBJAVLJEN (PUBLISHED) kako biste obezbedili visok pretraživački indeks.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-6 space-y-4">
              <div className="border-b border-white/5 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">2. SEO & META PODACI</h3>
                <span className="bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">AI ASISTENT</span>
              </div>

              {/* AI Button Triggers Suggestions */}
              <button
                type="button"
                onClick={fetchAiSuggestions}
                disabled={isAiGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-secondary/30 rounded-[10px] text-[11px] font-black uppercase tracking-widest text-secondary transition-all"
              >
                <span className="material-symbols-outlined text-sm text-secondary">psychology</span>
                {isAiGenerating ? 'AI PRERAČUNAVA REČI...' : 'ZATRAŽI OD AI PREDLOGE NASLOVA'}
              </button>

              {/* AI Suggestions Variants Box list */}
              <AnimatePresence>
                {suggestedVariants && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 p-4 bg-secondary/[0.03] border border-secondary/10 rounded-[10px] text-left"
                  >
                    <div className="text-[9px] font-black text-secondary uppercase tracking-widest mb-1">AI PREDLOZI (KLIKNI ZA PRIMENU):</div>
                    {suggestedVariants.map((v, i) => (
                      <div
                        key={i}
                        onClick={() => applyVariant(v)}
                        className="p-3 bg-white/[0.02] hover:bg-secondary/10 border border-white/5 hover:border-secondary/20 rounded-[8px] cursor-pointer transition-all space-y-1 group"
                      >
                        <div className="text-[11px] font-black text-white group-hover:text-slate-950 transition-colors">{v.seoTitle}</div>
                        <div className="text-[9px] text-white/50 group-hover:text-slate-900 transition-colors line-clamp-2 leading-relaxed">{v.metaDescription}</div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">SEO Naslov (SEO Title) *</label>
                  <input
                    type="text"
                    value={editingArticle.seo?.title || ''}
                    onChange={(e) => setEditingArticle(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        seo: {
                          title: e.target.value,
                          description: prev.seo?.description || prev.excerpt || '',
                          keywords: prev.seo?.keywords || prev.tags || []
                        }
                      };
                    })}
                    placeholder="Naslov za rezultate pretrage..."
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs font-bold text-white outline-none focus:border-secondary/50"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">SEO Meta Opis *</label>
                  <textarea
                    rows={4}
                    value={editingArticle.seo?.description || ''}
                    onChange={(e) => setEditingArticle(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        seo: {
                          title: prev.seo?.title || prev.title || '',
                          description: e.target.value,
                          keywords: prev.seo?.keywords || prev.tags || []
                        }
                      };
                    })}
                    placeholder="Opis do 160 karaktera..."
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs text-white outline-none focus:border-secondary/50 font-sans resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Oznake (Tags / Ključne reči)</label>
                  <input
                    type="text"
                    value={editingArticle.tags?.join(', ') || ''}
                    onChange={(e) => setEditingArticle(prev => {
                      if (!prev) return null;
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      return { ...prev, tags };
                    })}
                    placeholder="npr. beton, armature, izgradnja"
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 px-4 text-xs text-white outline-none focus:border-secondary/50 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DONJI PANEL: SLIKE (Featured Cover & Galerija) */}
        <div className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-6 space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">3. MEDIJI, SLIKE I OPREMA</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Sve slike se prilikom uploada automatski kompresuju u optimizovani WebP za brže učitavanje.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FEATURED COVER COMPRESSOR */}
            <div className="space-y-4">
              <label className="block text-[11px] font-black text-white uppercase tracking-wider">Naslovna fotka (Featured image)</label>
              
              <div className="flex flex-wrap items-center gap-6">
                {editingArticle.featuredImage ? (
                  <div className="relative group rounded-[10px] overflow-hidden border border-white/10 w-32 h-32 bg-slate-900 flex items-center justify-center">
                    <img
                      src={editingArticle.featuredImage}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingArticle(prev => prev ? ({ ...prev, featuredImage: '' }) : null)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-red-400 uppercase tracking-wider transition-opacity"
                    >
                      Ukloni
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-[10px] bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-4">
                    <span className="material-symbols-outlined text-4xl text-white/20 mb-2">add_photo_alternate</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">SLIKA NEDOSTAJE</span>
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="featured-upload-dedicated"
                    className="hidden"
                  />
                  <label
                    htmlFor="featured-upload-dedicated"
                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-secondary text-slate-950 rounded-[10px] text-xs font-black uppercase tracking-widest hover:bg-secondary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">cloud_upload</span>
                    {isUploading ? 'OTPREMANJE ' : 'DODAJ WEB NASLOVNU SLIKU'}
                  </label>
                  <p className="text-[9px] text-white/40 uppercase leading-relaxed max-w-sm">Maksimalna veličina fajla pre obrade je 10MB. Optimizovana širina je 1400px.</p>
                </div>
              </div>
            </div>

            {/* CHRONICLES GALLERY CONTAINER */}
            <div className="space-y-4">
              <label className="block text-[11px] font-black text-white uppercase tracking-wider">Galerija uz članak</label>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 p-4 bg-white/[0.01] border border-dashed border-white/10 rounded-[10px] min-h-[140px]">
                  {editingArticle.gallery && editingArticle.gallery.length > 0 ? (
                    editingArticle.gallery.map((url, idx) => (
                      <div key={idx} className="relative group w-24 h-24 rounded-[8px] overflow-hidden border border-white/5 bg-slate-900">
                        <img
                          src={url}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-5 h-5 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <span className="text-xs font-bold leading-none">×</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center text-center py-6">
                      <span className="material-symbols-outlined text-3xl text-white/25 mb-1.5">collections</span>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Prazna foto galerija</span>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    id="gallery-upload-dedicated"
                    className="hidden"
                  />
                  <label
                    htmlFor="gallery-upload-dedicated"
                    className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[8px] text-[10px] font-black uppercase tracking-widest text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    DODAJ JOŠ SLIKA
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
}
