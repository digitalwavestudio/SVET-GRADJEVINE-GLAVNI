import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/apiClient';
import { dashboardKeys, queryKeys } from '@/src/lib/queryKeysFactory';

interface UseAdSubmitParams {
  editId?: string | null;
  adId: string;
  userId?: string;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  reset: () => void;
  resetFormStore: () => void;
  updateUser: ((data: Partial<any>) => void) | undefined;
  setIsSubmitting: (v: boolean) => void;
}

export function useAdSubmit({ editId, adId, userId, showSuccess, showError, reset, resetFormStore, updateUser, setIsSubmitting }: UseAdSubmitParams) {
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedPackage, setSubmittedPackage] = useState<string | null>(null);
  const [createdAdId, setCreatedAdId] = useState<string | null>(null);
  const [showDepositPrompt, setShowDepositPrompt] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async ({ categoryToApi, payload, sData }: { categoryToApi: string; payload: any; sData: any }) => {
      if (!categoryToApi) throw new Error("Kategorija nije definisana.");
      if (!navigator.onLine) {
        throw new Error("Niste povezani na mrežu. Sve akcije objavljivanja i izmene oglasnog prostora su privremeno obustavljene.");
      }
      if (editId) {
        await apiClient.patch(`/ads/${editId}`, { category: categoryToApi, data: payload });
        return { isEdit: true, id: editId, sData };
      } else {
        const result = await apiClient.post<any>('/ads/create', { category: categoryToApi, data: { ...payload, id: adId } });
        if (!result?.id) {
          throw new Error("Sistem nije vratio ID oglasa. Oglas možda nije sačuvan. Pokušajte ponovo.");
        }
        return { isEdit: false, id: result.id as string, sData };
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['ads'] });
    },
    onSuccess: (result: any) => {
      if (result && result.id && !result.isEdit) {
        setCreatedAdId(result.id);
      }
      if (!result.isEdit) {
        localStorage.setItem('svet_gradjevine_last_post_time', Date.now().toString());
        localStorage.removeItem('postAdDraft');
      }

      setSubmittedPackage(result.sData?.paket || null);
      setIsSubmitted(true);
      showSuccess(editId ? 'Oglas uspešno izmenjen!' : 'Oglas uspešno postavljen! Pojaviće se za 5 minuta na sajtu.');
      reset();
      resetFormStore();

      apiClient.get('/users/me').then((freshUser: any) => {
        if (freshUser && typeof freshUser.walletBalance === 'number' && updateUser) {
          updateUser({ walletBalance: freshUser.walletBalance });
        }
      }).catch(() => console.warn("[useAdSubmit] Failed to refresh wallet balance after ad creation"));
    },
    onError: (error: Error) => {
      if (error.message && error.message.includes("Nemate dovoljno sredstava u Wallet-u")) {
        showError("Nemate dovoljno sredstava na Wallet-u. Molimo uplatite depozit.");
        setShowDepositPrompt(true);
      } else {
        showError(error.message);
      }
    },
    onSettled: () => {
      setIsSubmitting(false);
      if (userId) {
        queryClient.invalidateQueries({ queryKey: dashboardKeys.myAds.user(userId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.ads.all });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.masters.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.realEstate.all });
    }
  });

  return {
    isSubmitted,
    setIsSubmitted,
    submittedPackage,
    createdAdId,
    showDepositPrompt,
    setShowDepositPrompt,
    submitMutation,
  };
}
