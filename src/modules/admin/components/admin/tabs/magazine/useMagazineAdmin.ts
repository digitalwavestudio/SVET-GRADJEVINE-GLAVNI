import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { magazineService } from '@/src/services/magazineService';
import { uploadImage } from '@/src/lib/imageUtils';
import { Article, ArticleStatus, MagazineCategory } from '@/src/types/magazine';
import { useAuth } from '@/src/context/AuthContext';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function useMagazineAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'categories' | 'stats'>('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Markdown pretraga i preview mod
  const [editorPreviewMode, setEditorPreviewMode] = useState<'edit' | 'preview'>('edit');

  // Form states
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [suggestedVariants, setSuggestedVariants] = useState<{ seoTitle: string; metaDescription: string }[] | null>(null);

  // AI Redakcija states
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiSelectedCategory, setAiSelectedCategory] = useState('');
  const [aiTone, setAiTone] = useState('strucan');
  const [aiLength, setAiLength] = useState(1000);
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isAutopilotTriggering, setIsAutopilotTriggering] = useState(false);
  const [autopilotMessage, setAutopilotMessage] = useState('');

  const [generatedArticle, setGeneratedArticle] = useState<{
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
    seoTitle: string;
    metaDescription: string;
    audit?: {
      score: number;
      feedbacks: string[];
    };
  } | null>(null);

  const handleTriggerAutopilotNow = async () => {
    try {
      setIsAutopilotTriggering(true);
      setAutopilotMessage('');
      const res = await magazineService.triggerAutopilotNow();
      setAutopilotMessage(res.message);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin_magazine_articles'] });
      }, 4000);
    } catch (err: any) {
      setAutopilotMessage(err.response?.data?.error || err.message || 'Greška pri pokretanju Autopilota.');
    } finally {
      setIsAutopilotTriggering(false);
    }
  };

  const handleAiArticleGenerate = async () => {
    if (!aiTopic) {
      setAiError('Molimo Vas unesite temu ili ključne reči za pisanje članka.');
      return;
    }
    const catToUse = aiSelectedCategory || (categories[0]?.slug ?? 'gradnja');
    try {
      setIsAiWriting(true);
      setAiError('');
      setGeneratedArticle(null);
      const article = await magazineService.generateFullArticle({
        topic: aiTopic,
        category: catToUse,
        tone: aiTone,
        approximateLength: aiLength
      });
      setGeneratedArticle(article);
    } catch (err: any) {
      setAiError(err.response?.data?.error || err.message || 'Greška tokom AI generisanja teksta.');
    } finally {
      setIsAiWriting(false);
    }
  };

  const handleImportAiArticle = () => {
    if (!generatedArticle) return;
    const catToUse = aiSelectedCategory || (categories[0]?.slug ?? 'gradnja');
    setEditingArticle({
      title: generatedArticle.title,
      slug: generatedArticle.title.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-'),
      content: generatedArticle.content,
      excerpt: generatedArticle.excerpt,
      category: catToUse,
      tags: generatedArticle.tags,
      status: ArticleStatus.DRAFT,
      featuredImage: '',
      gallery: [],
      readTimeEstimate: Math.max(3, Math.ceil(aiLength / 180)),
      seo: {
        title: generatedArticle.seoTitle,
        description: generatedArticle.metaDescription,
        keywords: generatedArticle.tags
      }
    });
    // Reset states and close panel
    setShowAiGenerator(false);
    // Keep generatedArticle cached or clear it or let the user see a success alert
    setGeneratedArticle(null);
    setAiTopic('');
  };

  // Category form states
  const [editingCategory, setEditingCategory] = useState<Partial<MagazineCategory> | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Realtime on-page SEO Audit Score calculator
  const calculateSeoScore = (article: Partial<Article>) => {
    const title = article.seo?.title || article.title || '';
    const desc = article.seo?.description || article.excerpt || '';
    const tags = article.tags || [];
    const content = article.content || '';

    let score = 0;
    const items: { label: string; score: number; max: number; passed: boolean; tip: string }[] = [];

    // 1. Title length
    const titleLen = title.length;
    let titleScore = 0;
    let titleTip = '';
    if (titleLen === 0) {
      titleScore = 0;
      titleTip = 'Unesite SEO naslov (preporučeno 40-70 karaktera).';
    } else if (titleLen >= 40 && titleLen <= 70) {
      titleScore = 25;
    } else if (titleLen >= 10 && titleLen <= 90) {
      titleScore = 15;
      titleTip = `SEO naslov ima ${titleLen} kar. (idealno 40-70 za puni SEO doseg).`;
    } else {
      titleScore = 5;
      titleTip = `SEO naslov je previše kratak/dug (${titleLen} kar.) - preporučeno 40-70.`;
    }
    score += titleScore;
    items.push({
      label: 'Dužina i kvalitet naslova',
      score: titleScore,
      max: 25,
      passed: titleScore === 25,
      tip: titleTip
    });

    // 2. Meta description length
    const descLen = desc.length;
    let descScore = 0;
    let descTip = '';
    if (descLen === 0) {
      descScore = 0;
      descTip = 'Unesite SEO meta opis (preporučeno 120-160 karaktera).';
    } else if (descLen >= 120 && descLen <= 160) {
      descScore = 25;
    } else if (descLen >= 50 && descLen <= 200) {
      descScore = 15;
      descTip = `Meta opis ima ${descLen} kar. (idealno je 120-160 za pravilan snippet prikaz).`;
    } else {
      descScore = 5;
      descTip = `Meta opis je previše kratak/dug (${descLen} kar.) - preporučeno 120-160.`;
    }
    score += descScore;
    items.push({
      label: 'SEO Meta opis',
      score: descScore,
      max: 25,
      passed: descScore === 25,
      descLen, // store for comparison
      tip: descTip
    } as any);

    // 3. Tags presence
    const tagsCount = tags.length;
    let tagsScore = 0;
    let tagsTip = '';
    if (tagsCount === 0) {
      tagsScore = 0;
      tagsTip = 'Dodajte barem 1 oznaku (preporučeno 3+ tagova).';
    } else if (tagsCount >= 3) {
      tagsScore = 25;
    } else {
      tagsScore = 15;
      tagsTip = `Imate samo ${tagsCount} tag(a) - dodajte još oznaka (idealno 3+).`;
    }
    score += tagsScore;
    items.push({
      label: 'Prisustvo tagova i markera',
      score: tagsScore,
      max: 25,
      passed: tagsScore === 25,
      tip: tagsTip
    });

    // 4. Internal linking presence
    const hasInternalLinks = /\[.*?\]\(\s*\/[a-zA-Z0-9_-].*?\)|href=\s*["']\/[a-zA-Z0-9_-].*?["']/.test(content);
    const internalScore = hasInternalLinks ? 25 : 0;
    const internalTip = hasInternalLinks ? '' : 'Dodajte barem jedan interni link u članak (npr. [naše usluge](/majstori) ili /oglasi).';
    score += internalScore;
    items.push({
      label: 'Unutrašnje povezivanje (Internal Linking)',
      score: internalScore,
      max: 25,
      passed: hasInternalLinks,
      tip: internalTip
    });

    return { totalScore: score, items };
  };

  // Fetch Articles
  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ['admin_articles'],
    queryFn: () => magazineService.getAllArticlesAdmin(150),
  });

  // Fetch Categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MagazineCategory[]>({
    queryKey: ['admin_categories'],
    queryFn: () => magazineService.getAllCategoriesAdmin(),
  });

  // Fetch Metadata/Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin_magazine_stats'],
    queryFn: () => magazineService.getStats(),
  });

  // CTR Clickstream Report Query
  const { data: ctrReportResponse, refetch: refetchCtr, isLoading: isCtrLoading } = useQuery({
    queryKey: ['admin_magazine_ctr_report'],
    queryFn: () => magazineService.getCtrReport(),
    enabled: activeSubTab === 'stats',
  });

  const [isFlushingCtr, setIsFlushingCtr] = useState(false);
  const [ctrActionMessage, setCtrActionMessage] = useState('');

  const handleManualCtrFlush = async () => {
    setIsFlushingCtr(true);
    setCtrActionMessage('');
    try {
      const res = await magazineService.triggerClicksFlush();
      setCtrActionMessage(res.message || 'Baferi klikova uspešno upisani u Firestore!');
      await refetchCtr();
      setTimeout(() => setCtrActionMessage(''), 5000);
    } catch (err: any) {
      setCtrActionMessage('Greška pri flasovanju: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsFlushingCtr(false);
    }
  };

  // Mutations
  const recalculateMutation = useMutation({
    mutationFn: () => magazineService.recalculateStats(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_magazine_stats'] });
      alert('Statistika uspešno preračunata!');
    },
    onError: (err: any) => {
      alert('Greška pri preračunavanju statistike: ' + err.message);
    }
  });

  const saveArticleMutation = useMutation({
    mutationFn: (data: Partial<Article>) => {
      const payload = {
        ...data,
        seo: {
          title: data.seo?.title || data.title || '',
          description: data.seo?.description || data.excerpt || '',
          keywords: data.seo?.keywords || data.tags || []
        }
      };

      if (data.id) {
        return magazineService.updateArticle(data.id, payload);
      } else {
        return magazineService.createArticle({
          ...payload,
          authorId: user?.uid || user?.id || 'admin',
          authorName: user?.name || 'Administrator',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin_magazine_stats'] });
      setEditingArticle(null);
      setSuggestedVariants(null);
    },
    onError: (err: any) => {
      alert('Greška pri čuvanju članka: ' + (err.response?.data?.error || err.message));
    }
  });

  const deleteArticleMutation = useMutation({
    mutationFn: (id: string) => magazineService.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin_magazine_stats'] });
    },
    onError: (err: any) => {
      alert('Greška pri brisanju: ' + err.message);
    }
  });

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: ArticleStatus }) => 
      magazineService.updateArticle(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin_magazine_stats'] });
    },
    onError: (err: any) => {
      alert('Greška pri promeni statusa: ' + err.message);
    }
  });

  const saveCategoryMutation = useMutation({
    mutationFn: (data: Partial<MagazineCategory>) => {
      if (data.id) {
        return magazineService.updateCategory(data.id, data);
      } else {
        return magazineService.createCategory(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin_magazine_stats'] });
      setShowCategoryModal(false);
      setEditingCategory(null);
    },
    onError: (err: any) => {
      alert('Greška pri čuvanju kategorije: ' + err.message);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => magazineService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_categories'] });
    },
    onError: (err: any) => {
      alert('Greška pri brisanju kategorije: ' + err.message);
    }
  });

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImage(file, 'magazine', isGallery ? 'magazine_gallery' : 'magazine_featured');
      
      if (isGallery) {
        const currentGallery = editingArticle?.gallery || [];
        setEditingArticle(prev => prev ? ({
          ...prev,
          gallery: [...currentGallery, url]
        }) : null);
      } else {
        setEditingArticle(prev => prev ? ({
          ...prev,
          featuredImage: url
        }) : null);
      }
    } catch (err: any) {
      alert('Greška pri uploadu slike: ' + (err.message || 'Nepoznata greška.'));
    } finally {
      setIsUploading(false);
    }
  };

  const removeGalleryImage = (idxToRemove: number) => {
    setEditingArticle(prev => {
      if (!prev) return null;
      const gallery = (prev.gallery || []).filter((_, idx) => idx !== idxToRemove);
      return { ...prev, gallery };
    });
  };

  // Get AI Suggestions for Title / Meta Description
  const fetchAiSuggestions = async () => {
    if (!editingArticle) return;
    try {
      setIsAiGenerating(true);
      setSuggestedVariants(null);
      
      const payload = {
        title: editingArticle.title || 'Gradjevinarstvo i Dizajn',
        excerpt: editingArticle.excerpt || '',
        content: editingArticle.content || ''
      };

      const variants = await magazineService.getAiSuggestions(payload);
      setSuggestedVariants(variants);
    } catch (err: any) {
      alert('Greška tokom AI predlaganja: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsAiGenerating(false);
    }
  };

  const applyVariant = (v: { seoTitle: string; metaDescription: string }) => {
    setEditingArticle(prev => {
      if (!prev) return null;
      return {
        ...prev,
        seo: {
          title: v.seoTitle,
          description: v.metaDescription,
          keywords: prev.seo?.keywords || prev.tags || []
        }
      };
    });
    // Visual cue
    alert('AI naslov i meta opis su uspešno ubačeni u SEO panel.');
  };

  // Filter Articles
  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || art.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || art.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleOpenCreateArticle = () => {
    setEditingArticle({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      category: categories[0]?.slug || '',
      tags: [],
      status: ArticleStatus.DRAFT,
      featuredImage: '',
      gallery: [],
      readTimeEstimate: 5,
      seo: { title: '', description: '', keywords: [] }
    });
    setSuggestedVariants(null);
  };

  const handleOpenEditArticle = (art: Article) => {
    setEditingArticle({ ...art });
    setSuggestedVariants(null);
  };

  const handleOpenCreateCategory = () => {
    setEditingCategory({
      name: '',
      slug: '',
      description: '',
      color: '#FEBF0D',
      icon: 'star',
      order: 0,
      isActive: true,
    });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: MagazineCategory) => {
    setEditingCategory({ ...cat });
    setShowCategoryModal(true);
  };

  return {
    user, queryClient, activeSubTab, setActiveSubTab, searchQuery, setSearchQuery, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, editorPreviewMode, setEditorPreviewMode, editingArticle, setEditingArticle, isUploading, setIsUploading, isAiGenerating, setIsAiGenerating, suggestedVariants, setSuggestedVariants, showAiGenerator, setShowAiGenerator, aiTopic, setAiTopic, aiSelectedCategory, setAiSelectedCategory, aiTone, setAiTone, aiLength, setAiLength, isAiWriting, setIsAiWriting, aiError, setAiError, isAutopilotTriggering, setIsAutopilotTriggering, autopilotMessage, setAutopilotMessage, generatedArticle, setGeneratedArticle, handleTriggerAutopilotNow, handleAiArticleGenerate, handleImportAiArticle, editingCategory, setEditingCategory, showCategoryModal, setShowCategoryModal, calculateSeoScore, articles, articlesLoading, categories, categoriesLoading, stats, statsLoading, ctrReportResponse, refetchCtr, isCtrLoading, isFlushingCtr, setIsFlushingCtr, ctrActionMessage, setCtrActionMessage, handleManualCtrFlush, recalculateMutation, saveArticleMutation, deleteArticleMutation, quickStatusMutation, saveCategoryMutation, deleteCategoryMutation, handleImageUpload, removeGalleryImage, fetchAiSuggestions, applyVariant, filteredArticles, handleOpenCreateArticle, handleOpenEditArticle, handleOpenCreateCategory, handleOpenEditCategory
  };
}
