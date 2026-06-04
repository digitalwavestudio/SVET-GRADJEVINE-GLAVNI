import { create } from 'zustand';

interface DashboardUIState {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  toggleMobileMenu: () => void;
  
  isUpgradeOpen: boolean;
  setIsUpgradeOpen: (isOpen: boolean) => void;
  
  isShareOpen: boolean;
  setIsShareOpen: (isOpen: boolean) => void;
  
  isCreditOpen: boolean;
  setIsCreditOpen: (isOpen: boolean) => void;

  isSlowConnection: boolean;
  setIsSlowConnection: (isSlow: boolean) => void;
}

export const useDashboardUIStore = create<DashboardUIState>((set) => ({
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  
  isUpgradeOpen: false,
  setIsUpgradeOpen: (isOpen) => set({ isUpgradeOpen: isOpen }),
  
  isShareOpen: false,
  setIsShareOpen: (isOpen) => set({ isShareOpen: isOpen }),
  
  isCreditOpen: false,
  setIsCreditOpen: (isOpen) => set({ isCreditOpen: isOpen }),

  isSlowConnection: false,
  setIsSlowConnection: (isSlow) => set({ isSlowConnection: isSlow }),
}));
