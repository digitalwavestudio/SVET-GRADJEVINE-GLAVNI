import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    let cachedScrollHeight = document.documentElement.scrollHeight;
    let cachedInnerHeight = window.innerHeight;

    const updateLayoutCache = () => {
      cachedScrollHeight = document.documentElement.scrollHeight;
      cachedInnerHeight = window.innerHeight;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const totalScroll = cachedScrollHeight - cachedInnerHeight;
          const scrollY = window.scrollY;
          const progress = totalScroll > 0 ? (scrollY / totalScroll) * 100 : 0;
          setScrollProgress(progress);
          setIsVisible(scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateLayoutCache, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateLayoutCache);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <button
      className={`hidden md:flex fixed bottom-28 right-4 md:bottom-8 md:right-8 z-50 w-14 h-14 items-center justify-center rounded-full bg-slate-950 text-secondary shadow-lg transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } hover:translate-y-[-5px] hover:shadow-xl`}
      onClick={scrollToTop}
      title="Povratak na vrh"
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle
          className="text-slate-800"
          strokeWidth="3"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="28"
          cy="28"
        />
        <circle
          className="text-secondary"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="28"
          cy="28"
        />
      </svg>
      <ArrowUp size={20} />
    </button>
  );
}
