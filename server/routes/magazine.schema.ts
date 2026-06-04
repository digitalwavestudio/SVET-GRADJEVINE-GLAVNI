import { z } from "zod";
import { ArticleStatus } from "../../src/types/magazine.ts";

export const createArticleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Naslov mora imati najmanje 3 karaktera"),
  slug: z.string().min(3, "Slug mora imati najmanje 3 karaktera"),
  content: z.string().min(20, "Sadržaj mora imati najmanje 20 karaktera"),
  excerpt: z.string().min(10, "Kratak izvod mora imati najmanje 10 karaktera"),
  featuredImage: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  videoUrl: z.string().optional(),
  authorId: z.string().min(1, "ID autora je obavezan"),
  authorName: z.string().min(1, "Ime autora je obavezno"),
  category: z.string().min(1, "Kategorija je obavezna"),
  tags: z.array(z.string()).optional(),
  status: z.enum([ArticleStatus.DRAFT, ArticleStatus.PUBLISHED, ArticleStatus.SCHEDULED, ArticleStatus.ARCHIVED]).default(ArticleStatus.DRAFT),
  scheduledAt: z.any().optional(),
  readTimeEstimate: z.number().int().nonnegative().optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

export const updateArticleSchema = createArticleSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2, "Naziv kategorije mora imati najmanje 2 karaktera"),
  slug: z.string().min(2, "Slug kategorije mora imati najmanje 2 karaktera"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();
