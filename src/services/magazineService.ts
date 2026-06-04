import axios from 'axios';
import { Article, MagazineCategory } from '../types/magazine';

export const magazineService = {
  getArticles: async (category?: string, limit: number = 12, startAfter?: string) => {
    const params: Record<string, unknown> = { limit };
    if (category) params.category = category;
    if (startAfter) params.startAfter = startAfter;
    
    const response = await axios.get('/api/magazine/articles', { params });
    return response.data;
  },

  getArticleBySlug: async (slug: string) => {
    const response = await axios.get(`/api/magazine/articles/${slug}`);
    return response.data;
  },

  recordView: async (articleId: string) => {
    try {
      await axios.post(`/api/magazine/articles/${articleId}/view`);
    } catch (err) {
      // Fail silently
    }
  },

  getRelatedArticles: async (slug: string): Promise<Article[]> => {
    const response = await axios.get(`/api/magazine/articles/${slug}/related`);
    return response.data || [];
  },

  // =========================================================================
  // ADMIN CMS ENDPOINTS (Require admin authorization)
  // =========================================================================

  getAllArticlesAdmin: async (limit: number = 100): Promise<Article[]> => {
    const response = await axios.get('/api/admin/magazine/articles', { params: { limit } });
    return response.data.articles || [];
  },

  createArticle: async (articleData: Partial<Article>): Promise<{ success: boolean; id: string }> => {
    const response = await axios.post('/api/admin/magazine/articles', articleData);
    return response.data;
  },

  updateArticle: async (id: string, articleData: Partial<Article>): Promise<{ success: boolean }> => {
    const response = await axios.patch(`/api/admin/magazine/articles/${id}`, articleData);
    return response.data;
  },

  deleteArticle: async (id: string): Promise<{ success: boolean }> => {
    const response = await axios.delete(`/api/admin/magazine/articles/${id}`);
    return response.data;
  },

  getAllCategoriesAdmin: async (): Promise<MagazineCategory[]> => {
    const response = await axios.get('/api/admin/magazine/categories');
    return response.data.categories || [];
  },

  createCategory: async (categoryData: Partial<MagazineCategory>): Promise<{ success: boolean; id: string }> => {
    const response = await axios.post('/api/admin/magazine/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id: string, categoryData: Partial<MagazineCategory>): Promise<{ success: boolean }> => {
    const response = await axios.patch(`/api/admin/magazine/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<{ success: boolean }> => {
    const response = await axios.delete(`/api/admin/magazine/categories/${id}`);
    return response.data;
  },

  uploadMedia: async (file: File, type: 'featured' | 'gallery' = 'featured'): Promise<{ success: boolean; url: string; fileName: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    const response = await axios.post('/api/admin/magazine/upload-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getStats: async (): Promise<{
    totalArticles: number;
    totalViews: number;
    categories: { name: string; slug: string; count: number }[];
    popularTags: string[];
    [key: string]: unknown;
  }> => {
    const response = await axios.get('/api/admin/magazine/stats');
    return response.data.stats;
  },

  recalculateStats: async (): Promise<unknown> => {
    const response = await axios.post('/api/admin/magazine/stats/recalculate');
    return response.data.stats;
  },

  getAiSuggestions: async (articleData: Partial<Article>): Promise<{ seoTitle: string; metaDescription: string }[]> => {
    const response = await axios.post('/api/admin/magazine/ai-suggest', articleData);
    return response.data.variants || [];
  },

  generateFullArticle: async (params: { topic: string; category: string; tone: string; approximateLength: number }): Promise<{
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
    seoTitle: string;
    metaDescription: string;
  }> => {
    const response = await axios.post('/api/admin/magazine/ai-generate', params);
    return response.data.article;
  },

  triggerAutopilotNow: async (): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post('/api/admin/magazine/autopilot-trigger');
    return response.data;
  },

  recordClick: async (articleId: string, targetType: string): Promise<void> => {
    try {
      await axios.post('/api/magazine/clicks', { articleId, targetType });
    } catch (err) {
      // Fail silently for user clicks
    }
  },

  getCtrReport: async (): Promise<{ success: boolean; report: { id: string; title: string; viewsCount: number; clicksCount: number; ctr: number; clickStats?: Record<string, number> }[] }> => {
    const response = await axios.get('/api/admin/magazine/ctr-report');
    return response.data;
  },

  triggerClicksFlush: async (): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post('/api/admin/magazine/ctr-flush-trigger');
    return response.data;
  }
};

