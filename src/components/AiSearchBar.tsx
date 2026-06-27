import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseSearchQuery } from '@/src/services/aiService';
import { LOCATIONS } from '@/src/constants/taxonomy';
import { Button } from '@/src/components/ui/Button';

interface AiSearchBarProps {
  vertical: 'jobs' | 'machines' | 'accommodations' | 'catering' | 'real-estate' | 'masters' | 'companies';
  onResult?: (parsed: { searchQuery: string; location?: string }) => void;
  onError?: (error: unknown) => void;
}

const VERTICAL_ROUTES: Record<string, string> = {
  jobs: '/poslovi',
  machines: '/masine',
  accommodations: '/smestaj',
  catering: '/ketering',
  'real-estate': '/nekretnine',
  masters: '/majstori',
  companies: '/firme',
};

export function AiSearchBar({ vertical, onResult, onError }: AiSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const parsed = await parseSearchQuery(query);
      if (!parsed) return;
      const locMatch = parsed.location
        ? LOCATIONS.find(l =>
            l.name.toLowerCase().includes(parsed.location!.toLowerCase()) ||
            l.slug === parsed.location!.toLowerCase()
          )?.slug
        : undefined;

      const targetVertical = VERTICAL_ROUTES[vertical];

      if (onResult) {
        onResult({ searchQuery: parsed.searchQuery, location: locMatch || parsed.location });
      } else if (locMatch) {
        navigate(`${targetVertical}?q=${encodeURIComponent(parsed.searchQuery)}&loc=${locMatch}`);
      } else {
        navigate(`${targetVertical}?q=${encodeURIComponent(parsed.searchQuery)}`);
      }
    } catch (err) {
      onError?.(err);
    } finally {
      setIsSearching(false);
    }
  }, [query, vertical, onResult, onError, navigate]);

  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1 bg-[#13212e]/40 backdrop-blur-3xl border border-white/5 rounded-[10px] flex items-center pl-4 md:pl-8 p-1 shadow-3xl transition-all focus-within:border-secondary/50 focus-within:bg-[#192735]/60 hover:bg-[#192735]/40 group">
        <span className="material-symbols-outlined text-secondary text-2xl font-black group-focus-within:rotate-12 transition-transform">auto_awesome</span>
        <input
          type="text"
          placeholder="AI PRETRAGA: opiši šta tražiš..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full !bg-transparent !border-none !backdrop-blur-none outline-none text-white placeholder:text-white/20 text-[10px] font-black uppercase tracking-[0.2em] py-4 md:py-5 px-3 md:px-6"
        />
      </div>
      <Button
        onClick={handleSearch}
        variant="primary"
        disabled={isSearching || !query.trim()}
        className="px-8 h-16 rounded-[10px] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_20px_40px_rgba(254,191,13,0.2)] flex items-center justify-center gap-3 active:scale-95 shrink-0 border-none"
        icon={isSearching ? 'sync' : 'auto_awesome'}
      >
        {isSearching ? '' : 'AI'}
      </Button>
    </div>
  );
}
