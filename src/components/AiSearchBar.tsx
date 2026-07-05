// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';

export interface AiSearchBarProps {
  vertical?: string;
  isLoading?: boolean;
}

export function AiSearchBar({ isLoading }: AiSearchBarProps) {
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
    navigate('/ai-pretraga?q=' + encodeURIComponent(q));
  }, [query, navigate]);

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full">
      <div className="w-full md:flex-1 h-[60px] md:h-[76px] bg-[#13212e]/60 backdrop-blur-3xl border border-white/10 rounded-[14px] flex items-center pl-4 md:pl-8 pr-2 shadow-2xl transition-all duration-300 hover:border-secondary focus-within:border-secondary hover:bg-[#192735]/80 group">
        <span className="material-symbols-outlined text-secondary text-2xl md:text-3xl font-black group-focus-within:rotate-12 transition-transform">auto_awesome</span>
        {/* Mobile Input */}
        <input
          type="text"
          placeholder="OPIŠI ŠTA TRAŽIŠ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ outline: 'none', boxShadow: 'none' }}
          className="w-full h-full md:hidden !bg-transparent !border-none !backdrop-blur-none !outline-none !ring-0 !shadow-none focus:!outline-none focus:!ring-0 focus:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 text-white placeholder:text-white/40 text-sm font-bold tracking-wide px-3"
        />
        {/* Desktop Input */}
        <input
          type="text"
          placeholder="AI PRETRAGA: OPIŠI ŠTA TRAŽIŠ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ outline: 'none', boxShadow: 'none' }}
          className="w-full h-full hidden md:block !bg-transparent !border-none !backdrop-blur-none !outline-none !ring-0 !shadow-none focus:!outline-none focus:!ring-0 focus:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 text-white placeholder:text-white/40 md:text-lg font-bold tracking-wide md:px-6"
        />
      </div>
      <Button
        onClick={handleSearch}
        variant="primary"
        disabled={isLoading || !query.trim()}
        className="w-full md:w-auto px-6 md:px-10 h-[60px] md:h-[76px] rounded-[14px] font-black uppercase tracking-wider text-sm md:text-base shadow-none flex items-center justify-center gap-3 active:scale-95 shrink-0 border-none transition-all hover:bg-[#ffad3a]"
        icon={isLoading ? 'sync' : 'auto_awesome'}
      >
        {isLoading ? 'PRETRAŽUJEM' : 'AI PRETRAGA'}
      </Button>
    </div>
  );
}

