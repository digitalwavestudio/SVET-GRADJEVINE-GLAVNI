import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { magazineService } from '@/src/services/magazineService';
import { Article, ArticleStatus, MagazineCategory } from '@/src/types/magazine';
import { useAuth } from '@/src/context/AuthContext';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { useMagazineAdmin } from './magazine/useMagazineAdmin';
import { MagazineEditor } from './magazine/MagazineEditor';
import { MagazineArticles } from './magazine/MagazineArticles';
import { MagazineCategories } from './magazine/MagazineCategories';
import { MagazineStats } from './magazine/MagazineStats';
import { MagazineModals } from './magazine/MagazineModals';

export function MagazineTab() {
  const state = useMagazineAdmin();
  const { activeSubTab, editingArticle, statsLoading, stats, categoriesLoading, categories, recalculateMutation } = state;

  if (editingArticle) {
    return <MagazineEditor state={state} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0D151D] border border-white/5 p-6 rounded-[10px]">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">UKUPNO ČLANAKA</div>
          <div className="text-2xl font-black text-white">{statsLoading ? '...' : (stats?.totalArticles ?? 0)}</div>
        </div>
        <div className="bg-[#0D151D] border border-white/5 p-6 rounded-[10px]">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">PREGLEDI (PROBABILISTIČKI)</div>
          <div className="text-2xl font-black text-secondary">{statsLoading ? '...' : (stats?.totalViews ?? 0)}</div>
        </div>
        <div className="bg-[#0D151D] border border-white/5 p-6 rounded-[10px]">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">KATEGORIJE</div>
          <div className="text-2xl font-black text-white">{categoriesLoading ? '...' : categories.length}</div>
        </div>
        <div className="bg-[#0D151D] border border-white/5 p-6 rounded-[10px] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">SISTEMSKA SINHRONIZACIJA</div>
            <div className="text-[10px] font-bold text-green-400 font-sans">AKTIVNA (OUTBOX)</div>
          </div>
          <button 
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
            className="bg-secondary text-slate-950 p-2.5 rounded-[8px] hover:bg-secondary/80 transition-all flex items-center justify-center"
            title="Preračunaj statistiku i sinhronizuj metapodatke"
          >
            <span className="material-symbols-outlined text-sm font-bold">sync</span>
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/5 gap-2">
        <button
          onClick={() => state.setActiveSubTab('articles')}
          className={"px-6 py-4 text-xs font-black tracking-widest uppercase border-b-2 transition-all " + (activeSubTab === 'articles' ? 'border-secondary text-secondary' : 'border-transparent text-white/40 hover:text-white')}
        >
          Članci ({state.filteredArticles.length})
        </button>
        <button
          onClick={() => state.setActiveSubTab('categories')}
          className={"px-6 py-4 text-xs font-black tracking-widest uppercase border-b-2 transition-all " + (activeSubTab === 'categories' ? 'border-secondary text-secondary' : 'border-transparent text-white/40 hover:text-white')}
        >
          Kategorije
        </button>
        <button
          onClick={() => state.setActiveSubTab('stats')}
          className={"px-6 py-4 text-xs font-black tracking-widest uppercase border-b-2 transition-all " + (activeSubTab === 'stats' ? 'border-secondary text-secondary' : 'border-transparent text-white/40 hover:text-white')}
        >
          Uvid u analitiku
        </button>
      </div>

      {activeSubTab === 'articles' && <MagazineArticles state={state} />}
      {activeSubTab === 'categories' && <MagazineCategories state={state} />}
      {activeSubTab === 'stats' && <MagazineStats state={state} />}

      <MagazineModals state={state} />
    </motion.div>
  );
}
