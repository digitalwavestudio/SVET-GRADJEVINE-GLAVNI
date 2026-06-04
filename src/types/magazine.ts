export enum ArticleStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  SCHEDULED = "scheduled",
  ARCHIVED = "archived",
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML or Markdown support
  excerpt: string;
  featuredImage?: string;
  gallery?: string[]; // Multiple images support
  videoUrl?: string; 
  authorId: string;
  authorName: string;
  category: string;
  tags: string[];
  publishedAt: string | number | Date | null | { _seconds: number; _nanoseconds: number };
  scheduledAt?: string | number | Date | null | { _seconds: number; _nanoseconds: number }; // For "scheduled" status
  updatedAt?: string | number | Date | null | { _seconds: number; _nanoseconds: number };
  status: ArticleStatus;
  viewCount: number;
  readTimeEstimate?: number; // in minutes
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  relatedAdsCategories?: string[]; // To link articles with business listings
}

export interface MagazineCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

export interface MagazineMetadata {
  totalArticles: number;
  totalViews: number;
  categories: {
    name: string;
    count: number;
    slug: string;
  }[];
  popularTags: string[];
  lastUpdated: string | number | Date | null | { _seconds: number; _nanoseconds: number };
}
