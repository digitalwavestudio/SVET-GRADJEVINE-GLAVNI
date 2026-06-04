import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { magazineService } from '@/src/services/magazineService';
import { Article, ArticleStatus, MagazineCategory } from '@/src/types/magazine';
import { useAuth } from '@/src/context/AuthContext';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { useMagazineAdmin } from './useMagazineAdmin';

export function MagazineCategories({ state }: { state: ReturnType<typeof useMagazineAdmin> }) {
  const { user, queryClient, activeSubTab, setActiveSubTab, searchQuery, setSearchQuery, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, editorPreviewMode, setEditorPreviewMode, editingArticle, setEditingArticle, isUploading, setIsUploading, isAiGenerating, setIsAiGenerating, suggestedVariants, setSuggestedVariants, showAiGenerator, setShowAiGenerator, aiTopic, setAiTopic, aiSelectedCategory, setAiSelectedCategory, aiTone, setAiTone, aiLength, setAiLength, isAiWriting, setIsAiWriting, aiError, setAiError, isAutopilotTriggering, setIsAutopilotTriggering, autopilotMessage, setAutopilotMessage, generatedArticle, setGeneratedArticle, handleTriggerAutopilotNow, handleAiArticleGenerate, handleImportAiArticle, editingCategory, setEditingCategory, showCategoryModal, setShowCategoryModal, calculateSeoScore, articles, articlesLoading, categories, categoriesLoading, stats, statsLoading, ctrReportResponse, refetchCtr, isCtrLoading, isFlushingCtr, setIsFlushingCtr, ctrActionMessage, setCtrActionMessage, handleManualCtrFlush, recalculateMutation, saveArticleMutation, deleteArticleMutation, quickStatusMutation, saveCategoryMutation, deleteCategoryMutation, handleImageUpload, removeGalleryImage, fetchAiSuggestions, applyVariant, filteredArticles, handleOpenCreateArticle, handleOpenEditArticle, handleOpenCreateCategory, handleOpenEditCategory } = state;
  return (
      <>
{activeSubTab === 'categories' && (
        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden">
          <div className="p-8 border-b border-white/5 flex gap-4 items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Upravljanje kategorijama</h3>
            <button
              onClick={handleOpenCreateCategory}
              className="px-6 py-3 bg-secondary text-slate-950 rounded-[10px] font-black uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-secondary/90 transition-all"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
              DODAJ NOVU KATEGORIJU
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">NAZIV I SINOPSIS</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">SLUG</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">IKONICA / BOJA</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">REDOVNI REDOSLED</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">STATUS</th>
                  <th className="px-8 py-6 text-right text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">AKCIJE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categoriesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-8 py-6">
                        <Skeleton className="w-full h-8" />
                      </td>
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-xs font-bold text-white/30 uppercase tracking-wider">
                      Nije definisana nijedna kategorija.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-8 py-6">
                        <div>
                          <div className="text-xs font-bold text-white">{cat.name}</div>
                          <div className="text-[10px] text-white/40">{cat.description || 'Nema opisa...'}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-mono text-xs text-white/50">
                        {cat.slug}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-xl" style={{ color: cat.color || '#FEBF0D' }}>
                            {cat.icon || 'star'}
                          </span>
                          <span className="text-[10px] font-mono" style={{ color: cat.color || '#FEBF0D' }}>
                            {cat.color}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-mono text-xs text-white/50">
                        {cat.order}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          cat.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {cat.isActive ? 'AKTIVNA' : 'NEAKTIVNA'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-2 hover:bg-white/10 text-white rounded-[6px] transition-all"
                            title="Uredi"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Da li ste sigurni da želite da obrišete ovu kategoriju?')) {
                                deleteCategoryMutation.mutate(cat.id);
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
