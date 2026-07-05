import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '@/src/lib/apiClient';

interface ListingItem {
  id: string;
  title: string;
  location: string;
  salary: string;
  company: string;
  description: string;
  isPremium: boolean;
  isUrgent: boolean;
  createdAt: string;
}

interface AiResponse {
  answer: string;
  count: number;
  listings?: ListingItem[];
}

export default function AiSearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [data, setData] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    if (!query) { setLoading(false); return; }
    fetched.current = true;
    setLoading(true);
    apiClient.post<AiResponse>('/ai/ask', { query })
      .then(res => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [query]);

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
                    Prikazano {data.listings.length} od {data.count} oglasa
                  </p>
                )}
              </div>
            </div>
          </div>

          {data.listings && data.listings.length > 0 && (
            <div className="grid gap-4 md:gap-5">
              {data.listings.map((item) => (
                <Link
                  key={item.id}
                  to={`/poslovi/${item.id}`}
                  className="block bg-surface-container border border-white/5 rounded-[6px] hover:border-secondary/30 hover:shadow-enterprise transition-all p-5 md:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.isPremium && (
                          <span className="text-[10px] bg-secondary !text-black px-2 py-0.5 rounded-[2px] font-black uppercase tracking-wider">
                            Premium
                          </span>
                        )}
                        {item.isUrgent && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-[2px] font-black uppercase tracking-wider">
                            Hitno
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white truncate">{item.title}</h3>
                      <p className="text-sm text-on-surface-variant mt-1">{item.location}</p>
                      {item.description && (
                        <p className="text-sm text-on-surface-variant/70 mt-2 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {item.salary && (
                        <p className="text-lg font-black text-secondary">{item.salary}</p>
                      )}
                      {item.company && (
                        <p className="text-sm text-on-surface-variant mt-1">{item.company}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
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
