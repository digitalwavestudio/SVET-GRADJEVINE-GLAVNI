import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A compact, sticky search bar that appears when the user scrolls up
 * and hides when scrolling down. It works on mobile viewports and
 * provides a quick way to change the search query without needing to
 * scroll back to the top of the page.
 */
export const StickySearchHeader: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);
  const location = useLocation();

  // Reset visibility when route changes (e.g., new listing page)
  useEffect(() => {
    setVisible(true);
    setLastY(0);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastY + 20) {
        // Scrolling down – hide
        setVisible(false);
      } else if (currentY < lastY - 20) {
        // Scrolling up – show
        setVisible(true);
      }
      setLastY(currentY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastY]);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-2 transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Simple search input – you can replace this with your existing Search component */}
      <input
        type="text"
        placeholder="Pretraži…"
        className="w-full rounded-[10px] bg-[#111a22]/60 backdrop-blur-xl border border-white/5 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:border-secondary"
      />
    </div>
  );
};
