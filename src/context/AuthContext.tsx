import React, { createContext, useContext } from 'react';
import { BusinessNiche, User, UserRole } from '@/src/modules/core/types/user';
import { useAuthNode } from '@/src/modules/auth/hooks/useAuthNode';
import { safeLocalStorage } from '@/src/lib/safeStorage';

export type { BusinessNiche, UserRole };

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitializing: boolean;
  isOffline: boolean;
  isQuotaExceeded: boolean;
  loginWithGoogle: (defaultRole?: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, firstName: string, lastName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (targetRole?: UserRole) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  getIdToken: () => Promise<string | undefined>;
  toggleSavedJob: (jobId: string) => Promise<void>;
  toggleSavedAd: (id: string, type: string) => Promise<void>;
  saveSearch: (name: string, path: string, filterParams: Record<string, unknown>) => Promise<void>;
  removeSearch: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authNode = useAuthNode();

  const customLogout = React.useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < safeLocalStorage.length; i++) {
          const key = safeLocalStorage.key(i);
          if (key && (
            key.startsWith('messages_inbox_') || 
            key.startsWith('messages_list_') || 
            key.includes('dashboard') || 
            key.includes('analytic') ||
            key.includes('inbox') ||
            key.includes('chat_')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => safeLocalStorage.removeItem(k));
      }
    } catch (e) {
      console.warn('[AUTH_LOGOUT] Failed to clear dashboard keys from protected storage:', e);
    }
    await authNode.logout();
  }, [authNode.logout]);

  const value = React.useMemo(() => ({
    ...authNode,
    logout: customLogout
  }), [
    authNode,
    customLogout
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


