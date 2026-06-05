import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { useAdminUsers } from '@/src/modules/admin/hooks/useAdminUsers';
import { useDebounce } from '@/src/hooks/useDebounce';
import { AdminAddFundsModal } from './AdminAddFundsModal';
import { Skeleton } from '@/src/components/ui/Skeleton';

interface UsersTabProps {}

export function UsersTab({}: UsersTabProps) {
  const [localQuery, setLocalQuery] = useState('');
  const [fundingUser, setFundingUser] = useState<{ id: string, name: string } | null>(null);
  
  const debouncedQuery = useDebounce(localQuery, 400);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  const { 
    allUsers, 
    isLoading, 
    hasMore, 
    isFetchingNextPage, 
    fetchUsers,
    toggleUserSuspensionMutation
  } = useAdminUsers(debouncedQuery);

  // Trigger fetch of next page when in view
  useEffect(() => {
    if (inView && hasMore && !isFetchingNextPage && !isLoading) {
      fetchUsers();
    }
  }, [inView, hasMore, isFetchingNextPage, isLoading, fetchUsers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  return (
    <motion.div 
       key="users"
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -20 }}
       className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden"
    >
       <div className="p-10 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">LISTA REGISTROVANIH KORISNIKA</h3>
          <div className="relative w-96">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/20">search</span>
             <input 
               value={localQuery}
               onChange={handleSearch}
               aria-label="Unos polja"
               type="text" 
               placeholder="PRETRAŽI PO EMAILU ILI FIRMI..." 
               className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-secondary/50 transition-all uppercase" 
             />
          </div>
       </div>
       <div className="w-full overflow-x-auto">
          <table className="w-full block md:table border-collapse">
             <thead className="hidden md:table-header-group">
                <tr className="bg-white/[0.02]">
                   <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">KORISNIK / FIRMA</th>
                   <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">ULOGA</th>
                   <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">STATUS</th>
                   <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">AKTIVNOST</th>
                   <th className="px-8 py-6 text-right text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">AKCIJE</th>
                </tr>
             </thead>
             <tbody className="block md:table-row-group divide-y md:divide-y-0 divide-white/5">
                {isLoading ? (
                   Array.from({ length: 5 }).map((_, i) => (
                     <tr key={i} className="block md:table-row border-b border-white/5 hover:bg-white/[0.01]/10 p-4 md:p-0">
                       <td className="block md:table-cell md:px-8 py-4 md:py-6">
                         <div className="flex items-center gap-4">
                           <Skeleton className="w-10 h-10 rounded-[10px]" />
                           <div className="space-y-2">
                             <Skeleton className="w-32 h-3.5" variant="text" />
                             <Skeleton className="w-48 h-2" variant="text" />
                           </div>
                         </div>
                       </td>
                       <td className="hidden md:table-cell px-8 py-6">
                         <Skeleton className="w-20 h-5 rounded-[10px]" />
                       </td>
                       <td className="hidden md:table-cell px-8 py-6">
                         <Skeleton className="w-16 h-3.5" variant="text" />
                       </td>
                       <td className="hidden md:table-cell px-8 py-6">
                         <Skeleton className="w-24 h-3.5" variant="text" />
                       </td>
                       <td className="block md:table-cell md:px-8 py-2 md:py-6 md:text-right mt-4 md:mt-0">
                         <div className="flex md:justify-end gap-2">
                           <Skeleton className="w-full md:w-10 h-10 rounded-[10px]" />
                           <Skeleton className="w-full md:w-10 h-10 rounded-[10px]" />
                         </div>
                       </td>
                     </tr>
                   ))
                ) : allUsers.length > 0 ? allUsers.map((u: any, i) => {
                   const userName = u.company || u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Nepoznat';
                   const userRole = u.role ? u.role.toString().toUpperCase() : 'STANDARD';
                   const userStatus = u.businessProfile?.isPremium ? 'PREMIUM' : (u.businessProfile?.isVerified ? 'VERIFIED' : 'STANDARD');
                   const joinedDate = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('sr-RS') : 'NEPOZNATO';
                   const initial = userName.charAt(0).toUpperCase();

                   return (
                       <tr key={u.id || i} className="block md:table-row border-b border-white/5 p-4 md:p-0 hover:bg-white/[0.01] transition-colors relative">
                          <td className="block md:table-cell md:px-8 py-3 md:py-6">
                             <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-white/5 rounded-[10px] flex items-center justify-center font-black text-secondary shrink-0">{initial}</div>
                                   <div>
                                      <div className="text-sm font-black text-white uppercase tracking-tight">{userName}</div>
                                      <div className="text-[10px] font-bold text-white/20 break-all">{u.email}</div>
                                   </div>
                                </div>
                                {/* Mobile inline badges */}
                                <div className="flex md:hidden items-center gap-2 mt-2">
                                   <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-[6px]">{userRole}</span>
                                   <span className={`text-[8px] font-black uppercase tracking-widest ${
                                      userStatus === 'PREMIUM' ? 'text-secondary font-black' : 
                                      userStatus === 'VERIFIED' ? 'text-green-500' : 'text-white/30'
                                   }`}>{userStatus}</span>
                                   {u.status === 'suspended' && <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[8px] font-black rounded uppercase">suspended</span>}
                                </div>
                             </div>
                          </td>
                          <td className="hidden md:table-cell px-8 py-6">
                             <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-[10px]">{userRole}</span>
                          </td>
                          <td className="hidden md:table-cell px-8 py-6">
                             <span className={`text-[10px] font-black uppercase tracking-widest ${
                                userStatus === 'PREMIUM' ? 'text-secondary font-black' : 
                                userStatus === 'VERIFIED' ? 'text-green-500' : 'text-white/30'
                             }`}>{userStatus}</span>
                             {u.status === 'suspended' && <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-500 text-[8px] font-black rounded uppercase">suspended</span>}
                          </td>
                          <td className="hidden md:table-cell px-8 py-6">
                             <div className="text-[10px] font-black text-white uppercase tracking-tighter">{joinedDate}</div>
                             <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">ID: {u.id?.slice(0, 8)}...</div>
                          </td>
                          <td className="block md:table-cell md:px-8 pt-4 pb-2 md:py-6 text-right md:flex md:items-center md:justify-end gap-2">
                             <div className="flex gap-2">
                             <button
                               onClick={() => setFundingUser({ id: u.id, name: userName })}
                               className="w-10 h-10 bg-secondary/10 text-secondary hover:bg-secondary hover:text-slate-950 rounded-[10px] transition-all flex items-center justify-center p-0"
                               title="Manuelna dopuna novčanika"
                             >
                                <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                             </button>
                             <button 
                               onClick={() => {
                                 const reason = window.prompt("Razlog za promenu statusa/suspenziju:");
                                 if (!reason) return;
                                 toggleUserSuspensionMutation.mutate({ 
                                    userId: u.id, 
                                    newStatus: u.status === 'suspended' ? 'active' : 'suspended', 
                                    reason 
                                 });
                               }}
                               className={`w-10 h-10 rounded-[10px] transition-all flex items-center justify-center p-0 border ${
                                 u.status === 'suspended' ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500 hover:text-white' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'
                               }`}
                               title={u.status === 'suspended' ? "Aktiviraj korisnika" : "Suspenduj korisnika"}
                             >
                                <span className="material-symbols-outlined text-lg">{u.status === 'suspended' ? 'play_arrow' : 'block'}</span>
                                <span className="md:hidden ml-2 text-xs font-black uppercase tracking-widest">{u.status === 'suspended' ? 'Aktiviraj' : 'Suspenduj'}</span>
                             </button>
                             </div>
                          </td>
                       </tr>
                   );
                }) : (
                   <tr>
                     <td colSpan={5} className="px-8 py-10 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">
                       NEMA KORISNIKA
                     </td>
                   </tr>
                )}
             </tbody>
          </table>

          {hasMore && (
             <div ref={ref} className="flex justify-center p-8">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-2 h-2 rounded-full bg-secondary animate-bounce"></div>
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Učitavanje...</span>
               </div>
             </div>
          )}
       </div>

       {fundingUser && (
         <AdminAddFundsModal
           isOpen={!!fundingUser}
           onClose={() => setFundingUser(null)}
           targetUserId={fundingUser.id}
           targetUserName={fundingUser.name}
         />
       )}
    </motion.div>
  );
}
