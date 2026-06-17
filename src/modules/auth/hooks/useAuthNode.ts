import { useEffect, useState, useCallback, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  getRedirectResult,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '@/src/firebase-auth';
import { subscribeToOfflineStatus, subscribeToQuotaStatus } from '@/src/lib/errorUtils';
import { partnerService } from '@/src/services/partnerService';
import { User, UserRole } from '@/src/modules/core/types/user';
import { apiClient } from '@/src/lib/apiClient';
import { traceAsync } from '@/src/lib/performance';
import { queryClient } from '@/src/lib/queryClient';
import { favoritesKeys } from '@/src/modules/dashboard/hooks/useFavorites';

const CACHE_KEY = 'svet_gradjevine_user_cache';

const SENSITIVE_FIELDS = ['email', 'phone', 'cvData', 'fcmTokens'];

const stripSensitiveFields = (user: unknown): unknown => {
  if (!user || typeof user !== 'object') return user;
  const clone = { ...(user as Record<string, unknown>) };
  for (const field of SENSITIVE_FIELDS) {
    delete clone[field];
  }
  return clone;
};

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) { console.error("[Auth] localStorage.setItem error:", e); }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) { console.error("[Auth] localStorage.removeItem error:", e); }
  }
};

const syncUserStats = async (role: string) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await apiClient.post('/users/init', { role });
  } catch (e) {
    console.warn('[AUTH] Failed to initialize user stats', e);
  }
};

export function useAuthNode() {
  const [user, setUser] = useState<User | null>(() => {
    const cached = safeStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.isAdmin) {
          const previewRole = safeStorage.getItem('admin_preview_role');
          if (previewRole) {
            parsed.role = previewRole as UserRole;
          }
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  const [isOffline, setIsOffline] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  // Use refs to track mounted state and subscriptions across renders without closure stale properties
  const isMountedFn = useRef(true);
  const currentFbUser = useRef<FirebaseUser | null>(null);
  const unsubUserRef = useRef<(() => void) | null>(null);
  const autoInitAttempted = useRef(false);

  // O-O (Oauth-Obfuscation) Check
  const isBotRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
       if ((window as any).__IS_BOT__ || /bot|googlebot|crawler|spider|robot|crawling|chatgpt|claude|perplexity/i.test(navigator.userAgent)) {
          isBotRef.current = true;
          setLoading(false); setIsInitializing(false);
          return;
       }
    }

    isMountedFn.current = true;
    
    // Subscribe to quota and offline status changes
    const unsubOffline = subscribeToOfflineStatus((offline) => {
       if (isMountedFn.current) setIsOffline(offline);
    });
    const unsubQuota = subscribeToQuotaStatus((quota) => {
       if (isMountedFn.current) setIsQuotaExceeded(quota);
    });
    
    return () => {
      isMountedFn.current = false;
      unsubOffline();
      unsubQuota();
      if (unsubUserRef.current) unsubUserRef.current();
    };
  }, []);

  const subscribeToUser = useCallback((firebaseUser: FirebaseUser) => {
    if (!isMountedFn.current || !firebaseUser || isBotRef.current) return;
    
    if (unsubUserRef.current) {
      unsubUserRef.current();
    }

    try {
      const fetchUserData = async () => {
         if (!isMountedFn.current) return;
         
         // 1. FAST PATH: Check Custom Claims first (Zero DB reads if we have what we need)
         const tokenResult = await firebaseUser.getIdTokenResult();
         const claims = tokenResult.claims;
         
          const isAdminUser = !!claims.admin;
         const previewRole = isAdminUser ? safeStorage.getItem('admin_preview_role') : null;
         
         if (claims.role) {
            // We have enough to show the UI
            setUser(prev => {
               // If we already have a user, don't revert fields that might be missing from claims
               const baseUser = { 
                  ...prev,
                  id: firebaseUser.uid, 
                  email: firebaseUser.email,
                  emailVerified: firebaseUser.emailVerified,
                  role: (previewRole || claims.role) as UserRole,
                  isVerified: !!claims.isVerified,
                  isAdmin: !!claims.admin,
                  status: claims.suspended ? 'suspended' : 'active',
               } as User;
               return baseUser;
            });
         }

         // Track Device info in background
         try {
           const tracked = sessionStorage.getItem('sg_device_tracked');
           if (!tracked) {
              apiClient.post('/auth/devices/track', {}).catch(() => console.warn('[Auth] Device tracking failed'));
             sessionStorage.setItem('sg_device_tracked', 'true');
           }
         } catch(e) { console.error("[Auth] Device tracking error:", e); }

         // 2. SLOW PATH: Sync full profile from server
         const now = Date.now();

         try {
            const meData = await apiClient.get<User>('/users/me');
            if (meData) {
               const isMeAdmin = meData.isAdmin || meData.role === 'admin';
               const currentPreviewRole = isMeAdmin ? safeStorage.getItem('admin_preview_role') : null;
               
               const combinedData = { 
                 ...meData, 
                 id: firebaseUser.uid, 
                 emailVerified: firebaseUser.emailVerified,
                 role: (currentPreviewRole || meData.role) as UserRole
               } as User;
               if (isMountedFn.current) {
                 setUser((prev) => {
                   const newStr = JSON.stringify(combinedData);
                   const prevStr = prev ? JSON.stringify(prev) : null;
                   // Essential: deep check to prevent re-render loop if data hasn't changed
                   return newStr === prevStr ? prev : combinedData;
                 });
                safeStorage.setItem(CACHE_KEY, JSON.stringify(stripSensitiveFields(combinedData)));
                  safeStorage.setItem('svet_gradjevine_last_sync', now.toString());
                 setLoading(false); setIsInitializing(false);
               }
            } else {
               if (isMountedFn.current) { setLoading(false); setIsInitializing(false); }
            }
         } catch(err: any) {
            const error = err as any;
            if (error?.status === 403) {
               console.warn("User profile fetch rejected (Quota Exceeded or Forbidden)");
            } else {
               console.error("Error fetching user profile:", error);
            }
            // Ako user ne postoji (redirect flow nije stigao da pozove /users/init),
            // kreiramo ga odmah da prekinemo redirect loop na mobilnom
            if (!claims?.role && firebaseUser && !autoInitAttempted.current) {
               autoInitAttempted.current = true;
               try {
                   const token = await firebaseUser.getIdToken();
                   const initRes = await fetch('/api/users/init', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                         email: firebaseUser.email,
                         uid: firebaseUser.uid,
                         name: firebaseUser.displayName || '',
                         role: 'standard',
                         status: 'active',
                         isPremiumProfile: false,
                         photoURL: firebaseUser.photoURL || '',
                         viewsCount: 0,
                         freeAdsCount: 3
                      })
                   });
                   if (!initRes.ok) {
                      console.warn("[AUTH] Auto-init failed:", initRes.status, await initRes.text().catch(() => ''));
                   } else {
                      // Ponovo fetch-ujemo profil
                      fetchUserData();
                      return;
                   }
               } catch (initErr) {
                  console.warn("[AUTH] Auto-init after redirect failed:", initErr);
               }
            }
            if (isMountedFn.current) { setLoading(false); setIsInitializing(false); }
         }
      };

      // Initial fetch
      fetchUserData();

      unsubUserRef.current = () => {};
    } catch (err) {
      console.error('[AUTH_NODE] Failed to subscribe to user info', err);
      if (isMountedFn.current) { setLoading(false); setIsInitializing(false); }
    }
  }, []); // State setters are stable; refs prevent stale closures

  useEffect(() => {
    if (isBotRef.current) return;

    let initTimeout: NodeJS.Timeout | null = null;

    // Guard: Pokrećemo bezbednosni timeout od 2000ms da bismo otkočili UI ukoliko Firebase Auth mrežni handshake visi (česta pojava u sandboxed iframe-ovima).
    if (loading) {
      initTimeout = setTimeout(() => {
        if (isMountedFn.current) {
          console.warn('[AUTH_GUARD] Firebase Auth initialization threshold reached (2000ms). Unblocking UI.');
          setLoading(false);
          setIsInitializing(false);
        }
      }, 2000);
    }

    const unsubscribeAuth = onIdTokenChanged(auth, async (firebaseUser) => {
      // CLEAR TIMEOUT IMMEDIATELY when we get any signal from Firebase
      if (initTimeout) {
        clearTimeout(initTimeout);
        initTimeout = null;
      }

      if (firebaseUser) {
        currentFbUser.current = firebaseUser;
        subscribeToUser(firebaseUser);
      } else {
        currentFbUser.current = null;
        if (unsubUserRef.current) unsubUserRef.current();
        
        if (isMountedFn.current) {
           setUser(null);
           safeStorage.removeItem(CACHE_KEY);
           safeStorage.removeItem('svet_gradjevine_last_sync');
           setLoading(false); 
           setIsInitializing(false);
        }
      }
    });

      // Moved redirect handling to top-level effect

      return () => {
        if (initTimeout) clearTimeout(initTimeout);
        if (!isBotRef.current) unsubscribeAuth();
      };
  }, [subscribeToUser]);

// Auth Methods

useEffect(() => {
  getRedirectResult(auth)
    .then((result) => {
      if (import.meta.env.DEV) console.log('[AUTH] getRedirectResult result:', result);
      if (result?.user) {
        currentFbUser.current = result.user;
        subscribeToUser(result.user);
      }
    })
    .catch((err) => {
      console.warn('[AUTH] getRedirectResult failed', err);
    });
}, [subscribeToUser]);
  const loginWithGoogle = useCallback(async (defaultRole?: string) => {
    return traceAsync('auth_login_google', async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
          const token = await result.user.getIdToken();
          await fetch('/api/users/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              email: result.user.email,
              uid: result.user.uid,
              name: result.user.displayName || '',
              role: defaultRole || 'standard',
              status: 'active',
              isPremiumProfile: false,
              photoURL: result.user.photoURL || '',
              viewsCount: 0,
              freeAdsCount: 3
            })
          });
        }
      } catch (err: any) {
        console.warn('[AUTH] Popup login failed, falling back to redirect:', err);
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          console.error('[AUTH] Redirect login also failed:', redirectErr);
          throw redirectErr;
        }
      }
    });
  }, []);


  const loginWithEmail = useCallback(async (email: string, pass: string) => {
    return traceAsync('auth_login_email', async () => {
      try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
          apiClient.post('/telemetry/auth', {
          userId: result.user.uid,
          authMethod: 'email',
          eventType: 'login',
          status: 'success'
        }).catch(() => console.warn('[Auth] Telemetry login success post failed'));
      } catch (err) {
        apiClient.post('/telemetry/auth', {
          authMethod: 'email',
          eventType: 'login',
          status: 'failed'
        }).catch(() => console.warn('[Auth] Telemetry login failure post failed'));
        throw err;
      }
    });
  }, []);

  const registerWithEmail = useCallback(async (email: string, pass: string, firstName: string, lastName: string, role: UserRole) => {
    return traceAsync('auth_register_email', async () => {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = result.user;

      // BigQuery Auth Trace
      apiClient.post('/telemetry/auth', {
        userId: firebaseUser.uid,
        authMethod: 'email',
        eventType: 'register',
        status: 'success'
      }).catch(() => console.warn('[Auth] Telemetry register post failed'));

      await updateProfile(firebaseUser, { displayName: `${firstName} ${lastName}` });

      const newUser = {
        firstName, lastName, name: `${firstName} ${lastName}`, email,
        role, photoURL: '', status: 'active', freeAdsCount: 3,
        isPremiumProfile: false, viewsCount: 0, emailVerified: false,
        uid: firebaseUser.uid
      };
      
      // API is still used for initialization to bootstrap robust backend state
      await apiClient.post('/users/init', newUser);
    });
  }, []);

  const logout = useCallback(async () => {
    let currentUserSnapshot: User | null = null;
    setUser(prev => { currentUserSnapshot = prev; return prev; });
    
    // BigQuery Auth Trace
    if (currentUserSnapshot && (currentUserSnapshot as User).id) {
       apiClient.post('/telemetry/auth', {
         userId: (currentUserSnapshot as User).id,
         eventType: 'logout',
         status: 'success'
       }).catch(() => console.warn('[Auth] Telemetry logout post failed'));
    }

    sessionStorage.removeItem('admin_promoted');
    await signOut(auth);
    setUser(null);
    safeStorage.removeItem(CACHE_KEY);
    safeStorage.removeItem('svet_gradjevine_last_sync');
    safeStorage.removeItem('admin_preview_role');
    
    // Explicit Targeted Garbage Collection for user memory space
    if (currentUserSnapshot && (currentUserSnapshot as User).id) {
       queryClient.removeQueries({ queryKey: ['user-session', (currentUserSnapshot as User).id] });
       queryClient.removeQueries({ queryKey: ['dashboard'] }); // bff
    } else {
       queryClient.removeQueries({ queryKey: ['user-session'] });
    }
  }, []);

  const switchRole = useCallback(async (targetRole?: UserRole) => {
    let userSnapshot: User | null = null;
    setUser(prev => { userSnapshot = prev; return prev; });
    if (!userSnapshot) return;

    try {
      const data = await apiClient.post<{ success: boolean; newRole: UserRole }>(
        `/users/switch-role`,
        targetRole ? { role: targetRole } : {}
      );
      if (data.success && data.newRole) {
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }
        const updatedUser = { ...(userSnapshot as User), role: data.newRole };
        setUser(updatedUser);
        safeStorage.setItem(CACHE_KEY, JSON.stringify(stripSensitiveFields(updatedUser)));
        safeStorage.removeItem('admin_preview_role');
        queryClient.clear();
        
        if (window.location.pathname.includes('/izbor-uloge')) {
          window.location.href = '/moj-profil';
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("[switchRole] Failed to switch user role:", error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    // Upotrebite ref ili updater da dobijete najnovijeg korisnika bez dependency-ja koji pravi petlje
    let userSnapshot: User | null = null;
    setUser(prev => {
      userSnapshot = prev;
      return prev;
    });

    if (!userSnapshot) return;
    
    const currentUser = userSnapshot as User;
    const isAdmin = currentUser.role === 'admin' || currentUser.isAdmin;

    let finalData = { ...data };
    if (isAdmin && data.role) {
      safeStorage.setItem('admin_preview_role', data.role);
    }
    if ((data.role === 'partner' || currentUser.role === 'partner') && (!currentUser.partnerCode && !data.partnerCode)) {
      const nameForInit = data.name || currentUser.name || currentUser.firstName || 'Partner';
      finalData = {
        ...finalData,
        partnerCode: partnerService.generatePartnerCode(nameForInit),
        partnerSlug: partnerService.generatePartnerSlug(nameForInit),
        partnerStatus: 'active',
        partnerClicks: 0, partnerLeads: 0, partnerConversions: 0, partnerBalance: 0
      };
    }
    
    // Optimizovano: odma apdejtuj UI optimistički i keširaj lokalno
    const updatedUser = { ...currentUser, ...finalData };
    setUser(updatedUser);
    safeStorage.setItem(CACHE_KEY, JSON.stringify(stripSensitiveFields(updatedUser)));

    try {
      if (currentFbUser.current) {
         const sanitizedData: any = { ...finalData };
         
         // Adminima dozvoljavamo promenu uloge (za preview), ali je ne šaljemo u /profile update 
         // jer se uloga čuva kao Claim u Firebase-u ili u posebnom polju koje /profile ne menja
          const protectedFields = ['admin', 'credits', 'balance', 'walletBalance', 'package', 'packageExpiresAt', 'stats', 'createdAt', 'id', 'uid', 'email'];
         
         // Ako NIJE admin, štitimo i 'role'
         if (!isAdmin) {
            protectedFields.push('role');
         }

         protectedFields.forEach(f => delete sanitizedData[f]);

         // Ako menjamo SAMO ulogu kao admin (preview mod), ne šaljemo API poziv za profil
         if (isAdmin && Object.keys(finalData).length === 1 && finalData.role) {
            console.log('[AUTH] Admin switching role preview, skipping backend profile sync');
            return;
         }

         // Ako nema polja za ažuriranje nakon sanitizacije, ne šaljemo zahtev (ali smo lokalno već apdejtovali)
         if (Object.keys(sanitizedData).length === 0) {
            return;
         }

         await apiClient.put('/users/profile', sanitizedData);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      // Revert if DB failed
      setUser(currentUser); 
      safeStorage.setItem(CACHE_KEY, JSON.stringify(stripSensitiveFields(currentUser)));
      throw error; 
    }
  }, []); // Stabilizovan dependency

  const toggleSavedJob = useCallback(async (jobId: string) => {
    let currentUserSnapshot: any = null;
    setUser(prev => { currentUserSnapshot = prev; return prev; });
    if (!currentUserSnapshot) return;

    // Optimistic Update
    const queryKey = favoritesKeys.user(currentUserSnapshot.id);
    queryClient.setQueryData(queryKey, (oldData: any[]) => {
      if (!Array.isArray(oldData)) return [];
      const exists = oldData.some(item => item.adId === jobId);
      if (exists) {
        return oldData.filter(item => item.adId !== jobId);
      } else {
        return [...oldData, { adId: jobId, type: 'job', _type: 'job' }];
      }
    });

    try {
      await apiClient.post('/favorites/toggle', { adId: jobId, adType: 'job' });
    } catch (error) {
      console.error('[FAVORITES] Toggle job failed', error);
      queryClient.invalidateQueries({ queryKey });
    }
  }, []);

  const toggleSavedAd = useCallback(async (id: string, type: string) => {
    let currentUserSnapshot: any = null;
    setUser(prev => { currentUserSnapshot = prev; return prev; });
    if (!currentUserSnapshot) return;

    // Optimistic Update
    const queryKey = favoritesKeys.user(currentUserSnapshot.id);
    queryClient.setQueryData(queryKey, (oldData: any[]) => {
      if (!Array.isArray(oldData)) return [];
      const exists = oldData.some(item => item.adId === id || item.id === id);
      if (exists) {
        return oldData.filter(item => item.adId !== id && item.id !== id);
      } else {
        return [...oldData, { adId: id, id, type, _type: type }];
      }
    });

    try {
      await apiClient.post('/favorites/toggle', { adId: id, adType: type });
    } catch (error) {
      console.error('[FAVORITES] Toggle ad failed', error);
      queryClient.invalidateQueries({ queryKey });
    }
  }, []);

  const saveSearch = useCallback(async (name: string, path: string, filterParams: any) => {
    if (!user) return;
    const newSearch = { id: Date.now().toString(), name, path, filterParams, createdAt: Date.now() };
    const currentSearches = user.savedSearches || [];
    await updateUser({ savedSearches: [newSearch, ...currentSearches] });
  }, [user, updateUser]);

  const removeSearch = useCallback(async (id: string) => {
    if (!user) return;
    const currentSearches = user.savedSearches || [];
    await updateUser({ savedSearches: currentSearches.filter(s => s.id !== id) });
  }, [user, updateUser]);

  const getIdToken = useCallback(async () => {
    return await auth.currentUser?.getIdToken();
  }, []);

  return {
    user, loading, isInitializing, isOffline, isQuotaExceeded, loginWithGoogle, loginWithEmail, registerWithEmail,
    logout, switchRole, updateUser, getIdToken, toggleSavedJob, toggleSavedAd,
    saveSearch, removeSearch
  };
}
