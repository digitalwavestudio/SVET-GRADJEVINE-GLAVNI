import { MagazineCategory } from "../types/magazine";

export const magazineCategoryService = {
  async getCategories(): Promise<MagazineCategory[]> {
    const res = await fetch('/api/magazine/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    return data.categories;
  }
};
