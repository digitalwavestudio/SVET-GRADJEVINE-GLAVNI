import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { dashboardKeys, queryKeys as factoryQueryKeys } from '@/src/lib/queryKeysFactory';
import { apiClient } from '@/src/lib/apiClient';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string | number;
}

export function useDashboardNavigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const unreadMessagesCount = (user as any)?.totalUnreadMessages ?? user?.stats?.unreadMessages 
    ? Math.max(0, (user as any)?.totalUnreadMessages ?? user?.stats?.unreadMessages ?? 0)
    : 0;

  /**
   * Intelligent prefetch mechanism for Zero-Latency navigation experience.
   * Leverages TanStack Query to prime the cache before the actual click occurs.
   */
  const prefetchTab = (path: string) => {
    if (!user?.id) return;
    
    const uid = user.id;
    const role = (user as { role?: string; userType?: string }).role || (user as { role?: string; userType?: string }).userType || 'standard';
    
    // Enterprise architecture: Prefetching strategy based on target route data requirements
    switch (path) {
      case '/kontrolna-tabla':
        queryClient.prefetchQuery({
          queryKey: dashboardKeys.bff(role, uid),
          queryFn: async () => (await apiClient.get<Record<string, unknown>>("/bff/dashboard")) || {},
          staleTime: 5 * 60 * 1000
        });
        break;
      case '/moj-profil/oglasi':
        queryClient.prefetchInfiniteQuery({
          queryKey: [...factoryQueryKeys.user.myAds(uid), ''],
          queryFn: async () => {
             const data = await apiClient.get<Record<string, unknown>>('/ads/my-ads?limitCount=15');
             return data || { docs: [], hasMore: false, lastVisibleId: null };
          },
          initialPageParam: null,
          staleTime: 2 * 60 * 1000
        });
        break;
      case '/moj-profil/prijave': {
        const appRole = role === 'majstor' || role === 'standard' ? 'applicant' : 'employer';
        queryClient.prefetchInfiniteQuery({
          queryKey: [...factoryQueryKeys.jobs.userApplications(uid, appRole), ''],
          queryFn: async () => {
             const data = await apiClient.get<Record<string, unknown>>(`/jobs/applications/user/${appRole}?limit=15`);
             return data || { items: [], hasMore: false, nextCursor: null };
          },
          initialPageParam: null,
          staleTime: 5 * 60 * 1000
        });
        break;
      }
      case '/poruke':
        queryClient.prefetchInfiniteQuery({
          queryKey: dashboardKeys.messages.inbox(uid),
          queryFn: async () => {
            const data = await apiClient.get<{ items: Record<string, unknown>[]; hasMore: boolean; lastVisibleId: string | null }>('/messages/inbox');
            return data;
          },
          initialPageParam: null,
          staleTime: 1 * 60 * 1000
        });
        break;
      case '/moj-profil/omiljeni':
        queryClient.prefetchQuery({
          queryKey: factoryQueryKeys.user.favorites(uid),
          queryFn: async () => (await apiClient.get<Record<string, unknown>[]>('/favorites')) || [],
          staleTime: 10 * 60 * 1000
        });
        break;
      case '/novcanik':
        queryClient.prefetchQuery({
          queryKey: dashboardKeys.financeSummary(),
          queryFn: async () => (await apiClient.get<Record<string, unknown>>('/stats/finance')) || {},
          staleTime: 5 * 60 * 1000
        });
        break;
      case '/moj-profil/gradiliste':
        queryClient.prefetchQuery({
          queryKey: ['construction-site', uid],
          queryFn: async () => (await apiClient.get<Record<string, unknown>>(`/construction/user-site`)) || {},
          staleTime: 5 * 60 * 1000
        });
        break;
      case '/moj-profil/firma':
        // Prefetches business profile data if necessary
        queryClient.prefetchQuery({
          queryKey: factoryQueryKeys.user.businessProfile(uid),
          queryFn: async () => {
             const data = await apiClient.get<{ businessProfile?: Record<string, unknown>; [key: string]: unknown }>('/users/me');
             return data?.businessProfile || {};
          },
          staleTime: 30 * 60 * 1000
        });
        break;
    }
  };

  const getNavItems = (userRole?: string): NavItem[] => {
    if (!userRole) return [];
    
    switch (userRole) {
      case 'poslodavac':
        return [
          { label: 'KONTROLNA TABLA', path: '/kontrolna-tabla', icon: 'dashboard' },
          { label: 'NADZORNI CENTAR', path: '/moj-profil/gradiliste', icon: 'monitoring' },
          { label: 'BIZNIS PROFIL', path: '/moj-profil/firma', icon: 'domain' },
          { label: 'MOJI OGLASI', path: '/moj-profil/oglasi', icon: 'campaign' },
          { label: 'PRIJAVE', path: '/moj-profil/prijave', icon: 'assignment' },
          { label: 'UPITI', path: '/moj-profil/upiti', icon: 'mark_email_unread' },
          { label: 'PORUKE', path: '/poruke', icon: 'chat_bubble', badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
          { label: 'OBAVEŠTENJA', path: '/moj-profil/obavestenja', icon: 'notifications' },
          { label: 'VERIFIKACIJA', path: '/moj-profil/verifikacija', icon: 'verified' },
          { label: 'NOVČANIK', path: '/novcanik', icon: 'account_balance_wallet' },
          { label: 'PODRŠKA', path: '/podrska', icon: 'help' },
        ];
      case 'smestaj':
        return [
          { label: 'KONTROLNA TABLA', path: '/kontrolna-tabla', icon: 'dashboard' },
          { label: 'MOJ PROFIL', path: '/moj-profil', icon: 'account_circle' },
          { label: 'MOJI OBJEKTI', path: '/moj-profil/oglasi', icon: 'hotel' },
          { label: 'KAPACITETI', path: '/moj-profil/kapaciteti', icon: 'check_box' },
          { label: 'PORUKE', path: '/poruke', icon: 'chat_bubble', badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
          { label: 'STRIKTNI UPITI', path: '/moj-profil/upiti', icon: 'mark_email_unread' },
          { label: 'NOVČANIK', path: '/novcanik', icon: 'account_balance_wallet' },
          { label: 'PODRŠKA', path: '/podrska', icon: 'help' },
        ];
      case 'majstor':
        return [
          { label: 'KONTROLNA TABLA', path: '/kontrolna-tabla', icon: 'dashboard' },
          { label: 'MOJ PROFIL', path: '/moj-profil', icon: 'account_circle' },
          { label: 'MOJE PRIJAVE', path: '/moj-profil/prijave', icon: 'send' },
          { label: 'OMILJENI OGLASI', path: '/moj-profil/omiljeni', icon: 'bookmark' },
          { label: 'PORUKE', path: '/poruke', icon: 'chat_bubble', badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
          { label: 'NOVČANIK', path: '/novcanik', icon: 'account_balance_wallet' },
          { label: 'PODRŠKA', path: '/podrska', icon: 'help' },
        ];
      case 'ketering':
        return [
          { label: 'KONTROLNA TABLA', path: '/kontrolna-tabla', icon: 'dashboard' },
          { label: 'MOJ PROFIL', path: '/moj-profil', icon: 'account_circle' },
          { label: 'DANAŠNJI MENI', path: '/moj-profil/oglasi', icon: 'restaurant_menu' },
          { label: 'NARUDŽBINE', path: '/moj-profil/narudzbine', icon: 'receipt_long' },
          { label: 'DOSTAVA', path: '/moj-profil/dostava', icon: 'delivery_dining' },
          { label: 'PORUKE', path: '/poruke', icon: 'chat_bubble', badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
          { label: 'NOVČANIK', path: '/novcanik', icon: 'account_balance_wallet' },
          { label: 'PODRŠKA', path: '/podrska', icon: 'help' },
        ];
      case 'masine':
        return [
          { label: 'KONTROLNA TABLA', path: '/kontrolna-tabla', icon: 'dashboard' },
          { label: 'MOJ PROFIL', path: '/moj-profil', icon: 'account_circle' },
          { label: 'MOJA FLOTA', path: '/moj-profil/oglasi', icon: 'construction' },
          { label: 'REZERVACIJE', path: '/moj-profil/rezervacije', icon: 'event_available' },
          { label: 'PORUKE', path: '/poruke', icon: 'chat_bubble', badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
          { label: 'NOVČANIK', path: '/novcanik', icon: 'account_balance_wallet' },
          { label: 'PODRŠKA', path: '/podrska', icon: 'help' },
        ];
      case 'placevi':
        return [
          { label: 'KONTROLNA TABLA', path: '/kontrolna-tabla', icon: 'dashboard' },
          { label: 'MOJ PROFIL', path: '/moj-profil', icon: 'account_circle' },
          { label: 'MOJI PLACEVI', path: '/moj-profil/oglasi', icon: 'landscape' },
          { label: 'UPITI KUPACA', path: '/moj-profil/upiti', icon: 'contact_support' },
          { label: 'PORUKE', path: '/poruke', icon: 'chat_bubble', badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
          { label: 'NOVČANIK', path: '/novcanik', icon: 'account_balance_wallet' },
          { label: 'PODRŠKA', path: '/podrska', icon: 'help' },
        ];
      case 'partner':
        return [
          { label: 'KONTROLNA TABLA', path: '/kontrolna-tabla', icon: 'dashboard' },
          { label: 'MOJ PROFIL', path: '/moj-profil', icon: 'account_circle' },
          { label: 'AFFILIATE LINKOVI', path: '/moj-profil/affiliate', icon: 'link' },
          { label: 'PORUKE', path: '/poruke', icon: 'chat_bubble', badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
          { label: 'NOVČANIK', path: '/novcanik', icon: 'account_balance_wallet' },
          { label: 'PODRŠKA', path: '/podrska', icon: 'help' },
        ];
      case 'standard':
      default:
        return [
          { label: 'KONTROLNA TABLA', path: '/kontrolna-tabla', icon: 'dashboard' },
          { label: 'MOJ PROFIL', path: '/moj-profil', icon: 'account_circle' },
          { label: 'MOJI UPITI', path: '/moj-profil/upiti', icon: 'mark_email_unread' },
          { label: 'MOJE PRIJAVE', path: '/moj-profil/prijave', icon: 'send' },
          { label: 'OMILJENI OGLASI', path: '/moj-profil/omiljeni', icon: 'bookmark' },
          { label: 'IZBOR ULOGE', path: '/moj-profil/izbor-uloge', icon: 'rocket_launch' },
          { label: 'PODRŠKA', path: '/podrska', icon: 'help' },
        ];
    }
  };

  const logoutAndRedirect = () => {
    logout();
    navigate('/prijava');
  };

  return {
    location,
    navigate,
    getNavItems,
    logoutAndRedirect,
    prefetchTab,
    unreadMessagesCount
  };
}
