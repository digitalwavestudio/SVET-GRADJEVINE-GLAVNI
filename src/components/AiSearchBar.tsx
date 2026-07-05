import { useState, useCallback } from 'react';
import { Button } from '@/src/components/ui/Button';

export interface AiSearchBarProps {
  vertical?: string;
}

export function AiSearchBar(props: AiSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    setIsSearching(true);
    window.location.href = '/ai-pretraga?q=' + encodeURIComponent(q);
  }, [query]);

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full">
      <div className="w-full md:flex-1 h-[64px] md:h-[84px] bg-[#13212e]/60 backdrop-blur-3xl border border-white/10 rounded-[12px] flex items-center pl-4 md:pl-8 pr-2 shadow-2xl transition-all hover:bg-[#192735]/80 group">
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
        disabled={isSearching || !query.trim()}
        className="w-full md:w-auto px-6 md:px-10 h-[64px] md:h-[84px] rounded-[12px] font-black uppercase tracking-wider text-sm md:text-base shadow-none flex items-center justify-center gap-3 active:scale-95 shrink-0 border-none transition-all hover:bg-[#ffad3a]"
        icon={isSearching ? 'sync' : 'auto_awesome'}
      >
        {isSearching ? 'PRETRAŽUJEM' : 'AI PRETRAGA'}
      </Button>
    </div>
  );
}
