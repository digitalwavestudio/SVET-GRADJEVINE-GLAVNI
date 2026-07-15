// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';

export interface AiSearchBarProps {
  vertical?: string;
  isLoading?: boolean;
  minimal?: boolean;
}

export function AiSearchBar({ isLoading, minimal }: AiSearchBarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(urlQuery);

  // Sync with URL query when it changes externally
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const handleSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    navigate('/?q=' + encodeURIComponent(q));
  }, [query, navigate]);

  return (
    <div className={`flex flex-col md:flex-row w-full ${minimal ? 'gap-2' : 'gap-3 md:gap-4'}`}>
      <div className={`w-full md:flex-1 bg-[#13212e]/60 backdrop-blur-3xl border border-white/10 flex items-center px-3 shadow-2xl transition-all duration-300 hover:border-secondary focus-within:border-secondary hover:bg-[#192735]/80 group ${minimal ? 'h-[44px] md:h-[48px] rounded-[10px] md:px-3' : 'h-[60px] md:h-[76px] rounded-[14px] md:px-4'}`}>
        {/* Mobile Input */}
        <input
          type="text"
          placeholder="Opiši šta tražiš (npr. 'Zidar iz Beograda')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ outline: 'none', boxShadow: 'none' }}
          className={`w-full h-full md:hidden !bg-transparent !border-none !backdrop-blur-none !outline-none !ring-0 !shadow-none focus:!outline-none focus:!ring-0 focus:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 text-white placeholder:text-white/40 font-bold tracking-wide text-center px-3 ${minimal ? 'text-xs' : 'text-sm'}`}
        />
        {/* Desktop Input */}
        <input
          type="text"
          placeholder={minimal ? "Npr. Zidari Beograd..." : "Šta tražiš? (Npr. Potrebni armirači Novi Sad...)"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ outline: 'none', boxShadow: 'none' }}
          className={`w-full h-full hidden md:block !bg-transparent !border-none !backdrop-blur-none !outline-none !ring-0 !shadow-none focus:!outline-none focus:!ring-0 focus:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 text-white placeholder:text-white/40 font-bold tracking-wide md:px-3 ${minimal ? 'text-sm' : 'md:text-lg md:px-6'}`}
        />
      </div>
      <Button
        onClick={handleSearch}
        variant="primary"
        disabled={isLoading || !query.trim()}
        className={`w-full md:w-auto flex items-center justify-center gap-3 active:scale-95 shrink-0 border-none transition-all hover:bg-[#ffad3a] shadow-none ${minimal ? 'h-[44px] md:h-[48px] rounded-[10px] px-4 text-xs font-black' : 'h-[60px] md:h-[76px] rounded-[14px] px-6 md:px-10 text-sm md:text-base font-black uppercase tracking-wider'}`}
        icon={isLoading ? 'sync' : 'auto_awesome'}
      >
        {isLoading ? (minimal ? 'Tražim' : 'PRETRAŽUJEM') : (minimal ? 'Traži' : 'AI PRETRAGA')}
      </Button>
    </div>
  );
}

