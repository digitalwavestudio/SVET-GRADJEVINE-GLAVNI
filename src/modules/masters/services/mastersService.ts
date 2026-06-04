import { withRetry } from '@/src/lib/retry';
import { handleFirestoreError, OperationType } from '@/src/lib/errorUtils';
import { Master } from '@/src/modules/masters/types/models';
import { apiClient } from '@/src/lib/apiClient';

interface MasterDTO {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profession?: string;
  location?: string;
  experience?: string;
  phone?: string;
  skills?: string[];
  photoURL?: string;
  isVerified?: boolean;
  licences?: string[];
  status?: string;
  availability?: string;
  isPremiumProfile?: boolean;
  profileScore?: number;
  cvData?: {
    title?: string;
    profession?: string;
    location?: string;
    experience?: string;
    skills?: string[];
    portfolioImages?: string[];
    sector?: string;
  }
}

interface MastersSearchResponse {
  docs?: MasterDTO[];
  lastVisibleId?: string | null;
  hasMore?: boolean;
}

export const mastersService = {
  async fetchMasters(
    filters: Record<string, unknown> | null | undefined,
    lastVisibleId: string | null = null
  ): Promise<{ docs: Master[], lastVisibleId: string | null, hasMore: boolean }> {
    return withRetry(async () => {
      try {
        const isEmptyFilter = !filters || Object.keys(filters).length === 0;

        if (isEmptyFilter && !lastVisibleId) {
            try {
                const data = await apiClient.get<MastersSearchResponse>('/masters');
                if (data && Array.isArray(data.docs)) {
                    const docs = data.docs;
                    const mappedDocs = docs.map((row: unknown) => {
                      const d = row as MasterDTO;
                      return {
                        id: d.id || '',
                        name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Korisnik',
                        profession: d.cvData?.title || d.cvData?.profession || d.profession || 'MAJSTOR',
                        location: d.cvData?.location || d.location || 'Nije navedeno',
                        experience: String(d.cvData?.experience || d.experience || '1 GODINA'),
                        phone: "Zaštićeno", // Stripped PII
                        skills: d.cvData?.skills || d.skills || [],
                        photo: d.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name || d.firstName || 'M')}&background=0A0F14&color=FEBF0D&size=200`,
                        verified: d.isVerified || false,
                        licences: d.licences || [],
                        status: d.status === 'slobodan' || d.status === 'zauzet' || d.status === 'uskoro' ? 'active' : (d.status || 'active'),
                        availability: String(d.availability || (['slobodan', 'zauzet', 'uskoro'].includes(d.status || '') ? d.status : 'slobodan')),
                        premium: d.isPremiumProfile || false,
                        isPremiumProfile: d.isPremiumProfile || false,
                        portfolioImages: d.cvData?.portfolioImages || [],
                        profileScore: d.profileScore || 0,
                        sector: d.cvData?.sector || '',
                        professionSlug: d.cvData?.profession || ''
                      } as Master;
                    });

                    const slicedDocs = mappedDocs.slice(0, 24);
                    return {
                        docs: slicedDocs,
                        lastVisibleId: (slicedDocs.length > 0 ? slicedDocs[slicedDocs.length - 1].id : null) || null,
                        hasMore: !!(data.hasMore || mappedDocs.length > 24)
                    };
                }
            } catch(e) {
                console.warn("Error fetching masters", e)
            }
        }

        const result = await apiClient.post<MastersSearchResponse>('/masters/search', { filters, lastVisibleId });
        const docs = Array.isArray(result.docs) ? result.docs : [];
        
        const mappedDocs = docs.map((row: unknown) => {
          const d = row as MasterDTO;
          return {
            id: d.id || '',
            name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Korisnik',
            profession: d.cvData?.title || d.cvData?.profession || d.profession || 'MAJSTOR',
            location: d.cvData?.location || d.location || 'Nije navedeno',
            experience: String(d.cvData?.experience || d.experience || '1 GODINA'),
            phone: "Zaštićeno", // Stripped PII
            skills: d.cvData?.skills || d.skills || [],
            photo: d.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name || d.firstName || 'M')}&background=0A0F14&color=FEBF0D&size=200`,
            verified: d.isVerified || false,
            licences: d.licences || [],
            status: d.status === 'slobodan' || d.status === 'zauzet' || d.status === 'uskoro' ? 'active' : (d.status || 'active'),
            availability: String(d.availability || (['slobodan', 'zauzet', 'uskoro'].includes(d.status || '') ? d.status : 'slobodan')),
            premium: d.isPremiumProfile || false,
            isPremiumProfile: d.isPremiumProfile || false,
            portfolioImages: d.cvData?.portfolioImages || [],
            profileScore: d.profileScore || 0,
            sector: d.cvData?.sector || '',
            professionSlug: d.cvData?.profession || ''
          } as Master;
        });

        return {
          docs: mappedDocs,
          lastVisibleId: result.lastVisibleId || null,
          hasMore: result.hasMore || false
        };
      } catch (e: unknown) {
        handleFirestoreError(e, OperationType.LIST, 'masters');
        return { docs: [], lastVisibleId: null, hasMore: false };
      }
    });
  }
};

// Backward compatibility alias
export const fetchMasters = mastersService.fetchMasters.bind(mastersService);
