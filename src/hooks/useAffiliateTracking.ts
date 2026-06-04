import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { partnerService } from '@/src/services/partnerService';
import { safeSessionStorage } from '@/src/lib/safeStorage';

export const useAffiliateTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    const partner = searchParams.get('partner');
    const promo = searchParams.get('promo');

    if (!ref && !partner && !promo) return;

    const existingTrackingId = safeSessionStorage.getItem('affiliate_id');
    if (existingTrackingId) return;

    const handleTracking = async () => {
      let partnerData = null;

      if (ref) {
        partnerData = await partnerService.getPartnerBySlug(ref);
      } else if (partner || promo) {
        partnerData = await partnerService.getPartnerByCode(partner || promo || '');
      }

      if (partnerData && partnerData.id) {
        const timestamp = new Date().toISOString();
        const source = ref ? 'url_ref' : (partner ? 'url_partner' : 'url_promo');

        safeSessionStorage.setItem('affiliate_id', partnerData.id);
        safeSessionStorage.setItem('affiliate_code', partnerData.partnerCode || '');
        safeSessionStorage.setItem('affiliate_timestamp', timestamp);
        safeSessionStorage.setItem('affiliate_source', source);
        
        if (!safeSessionStorage.getItem(`tracked_${partnerData.id}`)) {
          await partnerService.trackClick(partnerData.id);
          safeSessionStorage.setItem(`tracked_${partnerData.id}`, timestamp);
        }
      }
    };

    handleTracking();
  }, [location.search]);
};
