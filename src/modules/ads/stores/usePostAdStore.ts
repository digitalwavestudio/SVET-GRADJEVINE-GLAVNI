import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PostAdState {
  formData: any;
  step: number;
  selectedCategory: string | null;
  setFormData: (data: Partial<any>) => void;
  setStep: (step: number) => void;
  setSelectedCategory: (category: string | null) => void;
  resetForm: () => void;
}

export const usePostAdStore = create<PostAdState>()(
  persist(
    (set) => ({
      formData: {},
      step: 1,
      selectedCategory: null,
      setFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),
      setStep: (step) => set({ step }),
      setSelectedCategory: (category) => 
        set((state) => ({ 
          selectedCategory: category,
          // Reset data if switching categories to prevent dirty data leaks
          formData: state.selectedCategory !== category ? {} : state.formData,
          step: state.selectedCategory !== category ? 1 : state.step
        })),
      resetForm: () => set({ formData: {}, step: 1, selectedCategory: null }),
    }),
    {
      name: 'post-ad-storage',
    }
  )
);
