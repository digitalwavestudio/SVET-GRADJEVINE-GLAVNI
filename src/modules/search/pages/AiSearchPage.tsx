import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '@/src/lib/apiClient';
import { JobCard } from '@/src/modules/jobs/components/JobCard';

interface ListingItem {
  id: string;
  title: string;
  location: string;
  loc: string;
  salary: string;
  comp: string;
  company: string;
  companyName: string;
  companyId: string | null;
  isCompanyVerified: boolean;
  description: string;
  isPremium: boolean;
  isUrgent: boolean;
  createdAt: string;
  logo: string | null;
  logoPlaceholder: string | null;
  plataMin: number | null;
  plataMax: number | null;
  salaryType: string;
  benefits: string[];
  viewsCount: number;
}

interface AiResponse {
  answer: string;
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  listings?: ListingItem[];
}

export default function AiSearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [data, setData] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const fetched = useRef(false);
  const pageSize = 10;

  const fetchData = useCallback(async (p: number) => {
    if (!query) { setLoading(false); return; }
    setLoading(true);
    apiClient.post<AiResponse>('/ai/ask', { query, page: p, pageSize })
      .then(res => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchData(1);
  }, [fetchData]);

  const goToPage = (p: number) => {
    if (p < 1 || (data && p > data.totalPages)) return;
    setPage(p);
    fetchData(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prefetch = useCallback(() => {}, []);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
      {loading && (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-on-surface-variant">Pretražujem oglase...</p>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="bg-surface-container border border-white/5 rounded-[6px] p-6 md:p-8 mb-10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-secondary rounded-[4px] flex items-center justify-center text-black font-bold shrink-0 mt-0.5 shadow-gold-glow-subtle">
                AI
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-secondary font-black uppercase tracking-widest mb-2">AI odgovor za "{query}"</p>
                <div className="text-white/90 leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {data.answer}
                </div>
                {data.count > 0 && data.listings && (
                  <p className="text-xs text-on-surface-variant mt-4 border-t border-white/5 pt-3">
                    Prikazano {data.listings.length} od {data.count} oglasa (strana {data.page} od {data.totalPages})
                  </p>
                )}
              </div>
            </div>
          </div>

          {data.listings && data.listings.length > 0 && (
            <div className="space-y-4">
              {data.listings.map((item) => (
                <JobCard key={item.id} job={item} viewMode="list" prefetch={prefetch} />
              ))}
            </div>
          )}

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-[8px] bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold"
              >
                Prethodna
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === data.totalPages || Math.abs(p - page) <= 2)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center gap-1">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="text-white/30 px-1">...</span>
                    )}
                    <button
                      onClick={() => goToPage(p)}
                      className={`w-10 h-10 rounded-[8px] text-sm font-bold transition-all ${
                        p === page
                          ? 'bg-secondary !text-black shadow-lg shadow-secondary/20'
                          : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= data.totalPages}
                className="px-4 py-2 rounded-[8px] bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold"
              >
                Sledeća
              </button>
            </div>
          )}

          {data.count === 0 && !data.answer && (
            <div className="text-center py-16">
              <p className="text-white text-lg mb-2">Trenutno nema oglasa koji potpuno odgovaraju vašoj pretrazi.</p>
              <p className="text-on-surface-variant">Ispod su najnoviji aktivni oglasi koji bi vas mogli zanimati.</p>
            </div>
          )}
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-16">
          <p className="text-white text-lg mb-2">Trenutno nema oglasa koji potpuno odgovaraju vašoj pretrazi.</p>
          <p className="text-on-surface-variant">Ispod su najnoviji aktivni oglasi koji bi vas mogli zanimati.</p>
        </div>
      )}
    </div>
  );
}