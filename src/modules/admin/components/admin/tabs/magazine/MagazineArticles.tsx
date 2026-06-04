import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { magazineService } from '@/src/services/magazineService';
import { Article, ArticleStatus, MagazineCategory } from '@/src/types/magazine';
import { useAuth } from '@/src/context/AuthContext';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { useMagazineAdmin } from './useMagazineAdmin';

export function MagazineArticles({ state }: { state: ReturnType<typeof useMagazineAdmin> }) {
  const { user, queryClient, activeSubTab, setActiveSubTab, searchQuery, setSearchQuery, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, editorPreviewMode, setEditorPreviewMode, editingArticle, setEditingArticle, isUploading, setIsUploading, isAiGenerating, setIsAiGenerating, suggestedVariants, setSuggestedVariants, showAiGenerator, setShowAiGenerator, aiTopic, setAiTopic, aiSelectedCategory, setAiSelectedCategory, aiTone, setAiTone, aiLength, setAiLength, isAiWriting, setIsAiWriting, aiError, setAiError, isAutopilotTriggering, setIsAutopilotTriggering, autopilotMessage, setAutopilotMessage, generatedArticle, setGeneratedArticle, handleTriggerAutopilotNow, handleAiArticleGenerate, handleImportAiArticle, editingCategory, setEditingCategory, showCategoryModal, setShowCategoryModal, calculateSeoScore, articles, articlesLoading, categories, categoriesLoading, stats, statsLoading, ctrReportResponse, refetchCtr, isCtrLoading, isFlushingCtr, setIsFlushingCtr, ctrActionMessage, setCtrActionMessage, handleManualCtrFlush, recalculateMutation, saveArticleMutation, deleteArticleMutation, quickStatusMutation, saveCategoryMutation, deleteCategoryMutation, handleImageUpload, removeGalleryImage, fetchAiSuggestions, applyVariant, filteredArticles, handleOpenCreateArticle, handleOpenEditArticle, handleOpenCreateCategory, handleOpenEditCategory } = state;
  return (
      <>
{activeSubTab === 'articles' && (
        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden">
          {/* Filters Bar */}
          <div className="p-8 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center flex-1">
              <div className="relative w-80">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/20">search</span>
                <input
                  aria-label="Pretraži"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="text"
                  placeholder="Pretraži članke po naslovu..."
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-secondary/50 transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                aria-label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-xs font-bold text-white outline-none"
              >
                <option value="all">SVI STATUSI</option>
                <option value={ArticleStatus.PUBLISHED}>OBJAVLJENI</option>
                <option value={ArticleStatus.DRAFT}>SKICE (DRAFTS)</option>
                <option value={ArticleStatus.SCHEDULED}>ZAKAZANI</option>
                <option value={ArticleStatus.ARCHIVED}>ARHIVIRANI</option>
              </select>

              {/* Category Filter */}
              <select
                aria-label="Kategorija"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-xs font-bold text-white outline-none"
              >
                <option value="all">SVE KATEGORIJE</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAiGenerator(true)}
                className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-[10px] font-black uppercase text-xs tracking-wider flex items-center gap-2 border border-indigo-500/30 transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                type="button"
              >
                <span className="material-symbols-outlined text-sm font-bold text-[#A5B4FC]">psychology</span>
                AI REDAKCIJA
              </button>

              <button
                onClick={handleOpenCreateArticle}
                className="px-6 py-3 bg-secondary text-slate-950 rounded-[10px] font-black uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-secondary/90 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-bold">add</span>
                KREIRAJ NOVI ČLANAK
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">NAZIV ČLANKA / RUTA (SLUG)</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">KATEGORIJA</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">STATUS</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">PREGLEDI</th>
                  <th className="px-8 py-6 text-right text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">AKCIJE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {articlesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-8 py-6" colSpan={5}>
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-10 h-10 rounded-[10px]" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="w-48 h-3.5" variant="text" />
                            <Skeleton className="w-96 h-2" variant="text" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-xs font-bold text-white/30 uppercase tracking-wider">
                      Nije pronađen nijedan članak koji odgovara filterima.
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((art) => (
                    <tr key={art.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          {art.featuredImage ? (
                            <img 
                              src={art.featuredImage} 
                              alt="" 
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-[8px] object-cover border border-white/5" 
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-[8px] bg-white/5 border border-white/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-white/20">newspaper</span>
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-white mb-0.5">{art.title}</div>
                            <div className="text-[10px] font-mono text-white/40">/{art.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-white/5 border border-white/10 text-white/70 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                          {art.category}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          art.status === ArticleStatus.PUBLISHED ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          art.status === ArticleStatus.DRAFT ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          art.status === ArticleStatus.SCHEDULED ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' :
                          'bg-white/10 text-white/50 border border-white/20'
                        }`}>
                          {art.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-mono text-xs text-white/60">
                        {art.viewCount || 0} pregleda
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditArticle(art)}
                            className="p-2 hover:bg-white/10 text-white hover:text-secondary rounded-[6px] transition-all"
                            title="Uredi članak"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          
                          {art.status !== ArticleStatus.PUBLISHED && (
                            <button
                              onClick={() => quickStatusMutation.mutate({ id: art.id, status: ArticleStatus.PUBLISHED })}
                              className="p-2 hover:bg-green-500/10 text-green-400 rounded-[6px] transition-all"
                              title="Objavi odmah"
                            >
                              <span className="material-symbols-outlined text-lg">done</span>
                            </button>
                          )}

                          {art.status === ArticleStatus.PUBLISHED && (
                            <button
                              onClick={() => quickStatusMutation.mutate({ id: art.id, status: ArticleStatus.DRAFT })}
                              className="p-2 hover:bg-amber-500/10 text-amber-400 rounded-[6px] transition-all"
                              title="Prebaci u skicu"
                            >
                              <span className="material-symbols-outlined text-lg">draft</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm('Da li ste sigurni da želite da obrišete ovaj članak? Ova akcija je nepovratna.')) {
                                deleteArticleMutation.mutate(art.id);
                              }
                            }}
                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-[6px] transition-all"
                            title="Obriši"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
    );
}
