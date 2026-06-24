import { useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, UserRole } from '@/src/context/AuthContext';
import { useDashboardNavigation, NavItem } from '@/src/modules/dashboard/hooks/useDashboardNavigation';
import { useDashboardUIStore } from '@/src/modules/dashboard/store/dashboardUIStore';
import { useQueryClient } from '@tanstack/react-query';
import { dashboardKeys, queryKeys as factoryQueryKeys } from '@/src/lib/queryKeysFactory';
import { apiClient } from '@/src/lib/apiClient';
import logoImage from '@/src/assets/images/logo.webp';

interface SidebarProps {
  pulseRoleSelection?: boolean;
}

export const Sidebar = memo(({ 
  pulseRoleSelection 
}: SidebarProps) => {
  const { user, updateUser } = useAuth();
  const { location, getNavItems, logoutAndRedirect, prefetchTab } = useDashboardNavigation();
  const isMobileMenuOpen = useDashboardUIStore(state => state.isMobileMenuOpen);
  const setIsMobileMenuOpen = useDashboardUIStore(state => state.setIsMobileMenuOpen);
  const queryClient = useQueryClient();
  const prefetchTimerRef = useRef<any>(null);

  if (!user) return null;

  const isAdmin = user.isAdmin || user.role === 'admin';
  const role = user.role;
  const isEmployer = role === 'poslodavac';
  const isMaster = role === 'majstor';
  
  const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Korisnik';
  const navItems = getNavItems(role);

  const handleAdminRoleSwitch = async (targetRole: UserRole) => {
    if (!isAdmin) return;

    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      
      // Update locally in context & backend
      await updateUser({ role: targetRole });
      
      // Force direct clean reload to primary profile path so it completely resets the layout and removes any route conflicts
      window.location.href = '/kontrolna-tabla';
    } catch (err) {
      console.error('[Sidebar] Error resetting TanStack Query cache on role switch:', err);
    }
  };

  const handlePrefetch = (path: string) => {
    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    
    // Add a tiny delay to ensure intentional hover (zero-latency feel, but avoids spamming network)
    prefetchTimerRef.current = setTimeout(() => {
      prefetchTab(path);
    }, 40); // Optimized 40ms intention delay
  };

  return (
    <aside className={`w-64 bg-[#0A0F14] border-r border-white/5 flex flex-col fixed inset-y-0 left-0 transform overflow-hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:sticky md:top-0 h-[100dvh] z-[100] transition-transform duration-300 ease-in-out`}>
      {/* Platform Logo Section */}
      <div className="h-[64px] px-0 py-[40px] mb-[20px] hidden md:flex items-center justify-center border-b border-white/5">
        <Link to="/" className="inline-block group">
          <img
            src={logoImage}
            alt="Svet Građevine Logo"
            className="w-full max-w-[190px] h-auto object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
          />
        </Link>
      </div>
      
      <div className="p-4 md:hidden flex justify-end">
         <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/40 hover:text-white">
            <span className="material-symbols-outlined">close</span>
         </button>
      </div>

      {/* Admin Role Switcher — only in dev mode */}
      {import.meta.env.DEV && isAdmin && (
        <div className="px-6 mb-6 space-y-2">
          <div className="text-[9px] font-black text-secondary uppercase tracking-widest px-2 mb-1">ADMIN: PREGLED ULOGA</div>
          <select 
            value={role}
            onChange={(e) => handleAdminRoleSwitch(e.target.value as UserRole)}
            className="w-full bg-white/5 border border-white/10 rounded-[10px] p-3 text-[11px] font-black text-white uppercase outline-none focus:border-secondary transition-all"
          >
            <option value="standard" className="bg-slate-900 text-white">Standardni (Onboarding)</option>
            <option value="majstor" className="bg-slate-900 text-white">Majstor</option>
            <option value="poslodavac" className="bg-slate-900 text-white">Građevinska Firma</option>
            <option value="smestaj" className="bg-slate-900 text-white">Smeštaj za radnike</option>
            <option value="ketering" className="bg-slate-900 text-white">Ketering</option>
            <option value="placevi" className="bg-slate-900 text-white">Placevi</option>
            <option value="masine" className="bg-slate-900 text-white">Mašine</option>
            <option value="partner" className="bg-slate-900 text-white">Partner</option>
          </select>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
        <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-4 mb-4">GLAVNI MENI</div>
        {navItems.map((item: NavItem) => {
          const isActive = location.pathname === item.path;
          const isNadzorniCentar = item.label === 'NADZORNI CENTAR';
          
          const linkClassName = isNadzorniCentar
            ? 'flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all group relative bg-gradient-to-r from-[#0061a5] to-[#60a5fa] text-white hover:from-[#00518c] hover:to-[#5095ea] shadow-lg shadow-[#0061a5]/20 font-black'
            : `flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all group relative ${
                isActive 
                  ? 'bg-secondary !text-black shadow-lg shadow-secondary/10' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              } ${item.label === 'IZBOR ULOGE' && pulseRoleSelection ? 'animate-[pulse_1s_ease-in-out_3] ring-2 ring-secondary/50' : ''}`;

          return (
            <Link
              key={item.path}
              to={item.path}
              onMouseEnter={() => handlePrefetch(item.path)}
              onClick={() => setIsMobileMenuOpen(false)}
              className={linkClassName}
            >
              <span className={`material-symbols-outlined text-xl ${isNadzorniCentar ? 'text-white' : isActive ? '!text-black' : 'opacity-60 group-hover:opacity-100'}`}>
                {item.icon}
              </span>
              <span className={`text-[11px] font-black tracking-[0.1em] uppercase ${isNadzorniCentar ? 'text-white' : ''}`}>{item.label}</span>
              {item.badge && (
                <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center ${isNadzorniCentar ? 'bg-white text-[#0061a5]' : isActive ? 'bg-slate-950 text-secondary' : 'bg-secondary !text-black'}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-6 border-t border-white/5 space-y-2">
        <Link
          to="/podesavanja"
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-[10px] text-white/50 hover:text-white hover:bg-white/5 transition-all group"
        >
          <span className="material-symbols-outlined text-xl opacity-60 group-hover:opacity-100">settings</span>
          <span className="text-[11px] font-black tracking-[0.1em] uppercase">PODEŠAVANJA</span>
        </Link>
        <button
          onClick={() => { setIsMobileMenuOpen(false); logoutAndRedirect(); }}
          className="flex items-center gap-3 px-4 py-3 rounded-[10px] text-white/50 hover:text-error hover:bg-error/5 transition-all group w-full text-left"
        >
          <span className="material-symbols-outlined text-xl opacity-60 group-hover:opacity-100">logout</span>
          <span className="text-[11px] font-black tracking-[0.1em] uppercase">ODJAVA</span>
        </button>
      </div>
    </aside>
  );
});
