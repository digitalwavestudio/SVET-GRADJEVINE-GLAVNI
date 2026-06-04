import React, { useState, useRef, useEffect } from 'react';

const AnimatedCounter = ({ end, duration = 4000, delay = 0, suffix = "" }: { end: number, duration?: number, delay?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = timestamp - startTimestamp;
      
      if (progress < delay) {
        animationFrameId = window.requestAnimationFrame(step);
        return;
      }

      const activeProgress = progress - delay;
      const progressRatio = Math.min(activeProgress / duration, 1);
      
      const easeOut = progressRatio === 1 ? 1 : 1 - Math.pow(2, -10 * progressRatio);
      
      setCount(Math.floor(easeOut * end));

      if (progressRatio < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [end, duration, delay, hasStarted]);

  return (
    <span ref={counterRef} className="text-4xl font-black text-white block mb-2 uppercase">
      {count}{suffix}
    </span>
  );
};

export default AnimatedCounter;