import React, { useState } from 'react';
import { motion } from 'motion/react';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { apiClient } from '@/src/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from "@/src/lib/queryKeysFactory";
import { toast } from 'react-hot-toast';

interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  documentUrls: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string | { _seconds: number; _nanoseconds: number } | null;
}

export function VerifyTab() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery<VerificationRequest[]>({
    queryKey: queryKeys.admin.verificationRequests,
    queryFn: async () => {
      return apiClient.get('/verification/requests?status=pending');
    },
    staleTime: 1000 * 60 * 5, // 5 minuta
  });

  const { mutate: processVerification } = useMutation({
    mutationFn: async ({ requestId, action, comment }: { requestId: string; action: 'approve' | 'reject'; comment: string }) => {
      setProcessingId(requestId);
      return apiClient.post(`/verification/requests/${requestId}/process`, { action, comment });
    },
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.verificationRequests });
      const previousRequests = queryClient.getQueryData<VerificationRequest[]>(queryKeys.admin.verificationRequests);

      queryClient.setQueryData<VerificationRequest[]>(queryKeys.admin.verificationRequests, (old) =>
        old ? old.filter(r => r.id !== requestId) : []
      );

      return { previousRequests };
    },
    onError: (err: unknown, variables, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(queryKeys.admin.verificationRequests, context.previousRequests);
      }
      const appErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(appErr?.response?.data?.error || appErr.message || 'Greška pri obradi');
    },
    onSuccess: (data, variables) => {
      toast.success(variables.action === 'approve' ? 'Korisnik je verifikovan!' : 'Zahtev je odbijen.');
    },
    onSettled: () => {
      setProcessingId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.verificationRequests });
    }
  });

  const handleAction = (requestId: string, action: 'approve' | 'reject') => {
    const comment = action === 'reject' ? prompt('Razlog odbijanja:') : 'Odobreno';
    if (action === 'reject' && !comment) return;

    processVerification({ requestId, action, comment: comment || 'Odobreno' });
  };

  if (isLoading) {
    return <div className="p-20 text-center uppercase font-black text-white/20 tracking-widest">Učitavanje zahteva...</div>;
  }

  return (
    <motion.div 
       key="verify"
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="space-y-8"
    >
       <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden">
          <div className="p-10 border-b border-white/5 flex justify-between items-center">
             <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">CENTAR ZA VERIFIKACIJU</h3>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Upravljajte zahtevima za "Plavu Kvačicu"</p>
             </div>
             <div className="bg-secondary/10 border border-secondary/20 px-6 py-3 rounded-[10px] flex items-center gap-3">
                <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">{requests.length} NOVIH ZAHTEVA</span>
             </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full">
                <thead>
                   <tr className="bg-white/[0.02]">
                      <th className="px-10 py-6 text-left text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">KORISNIK / DOKUMENTA</th>
                      <th className="px-10 py-6 text-left text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">ULOGA</th>
                      <th className="px-10 py-6 text-center text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">STATUS</th>
                      <th className="px-10 py-6 text-right text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">AKCIJA</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {requests.length === 0 ? (
                     <tr>
                       <td colSpan={4} className="px-10 py-20 text-center text-[10px] font-black text-white/20 uppercase tracking-widest">
                         NEMA ZAHTEVA NA ČEKANJU
                       </td>
                     </tr>
                   ) : requests.map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.01] transition-colors">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                               <div className="flex -space-x-4">
                                 {r.documentUrls.map((url, i) => (
                                   <a key={i} href={url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-[10px] border-2 border-slate-950 overflow-hidden bg-white/5 block hover:scale-110 transition-transform relative z-[1]">
                                      <OptimizedImage src={url} alt="Doc" className="w-full h-full object-cover" />
                                   </a>
                                 ))}
                               </div>
                               <div>
                                  <div className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">{r.userName}</div>
                                  <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">{r.userEmail}</div>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-[10px] border border-blue-500/20">
                               {r.userRole}
                            </span>
                         </td>
                         <td className="px-10 py-8 text-center">
                            <div className="flex items-center justify-center gap-2 text-yellow-500 bg-yellow-500/10 py-2 px-4 rounded-[10px] border border-yellow-500/20 mx-auto w-fit">
                               <span className="material-symbols-outlined text-sm animate-pulse">pending</span>
                               <span className="text-[10px] font-black uppercase tracking-widest">NA ČEKANJU</span>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-right min-w-[300px]">
                            <div className="flex justify-end gap-3">
                              <button 
                                 onClick={() => handleAction(r.id, 'reject')}
                                 disabled={processingId === r.id}
                                 className="px-6 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white disabled:opacity-50"
                              >
                                {processingId === r.id ? '...' : 'ODBIJ'}
                              </button>
                              <button 
                                 onClick={() => handleAction(r.id, 'approve')}
                                 disabled={processingId === r.id}
                                 className="px-6 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all bg-green-500 text-slate-950 hover:bg-green-400 disabled:opacity-50"
                              >
                                {processingId === r.id ? '...' : 'ODOBRI'}
                              </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </motion.div>
  );
}
