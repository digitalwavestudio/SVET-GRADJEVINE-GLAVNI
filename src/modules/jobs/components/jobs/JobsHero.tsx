import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { StandardPageHero } from '@/src/components/StandardPageHero';

const AnimatedCounter = ({ end, duration = 2.5 }: { end: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <>{count}</>;
};

export const JobsHero = () => {
  return (
    <StandardPageHero
      badge="Građevinska industrija — Srbija & Region"
      title={<>Pronađi svoj<br /><span className="text-secondary drop-shadow-[0_0_15px_rgba(254,191,13,0.3)]">sledeći projekat.</span></>}
      subtitle="2.847 aktivnih oglasa u realnom vremenu. Najveća baza poslova u građevinarstvu na Balkanu."
      stats={[
        { label: "NA MREŽI", value: <><AnimatedCounter end={143} /> <span className="text-xs font-bold text-white/40 ml-1">KORISNIKA</span></>, icon: "sensors" },
        { label: "OBJAVLJENO", value: <><AnimatedCounter end={28} /> <span className="text-xs font-bold text-white/40 ml-1">DANAS</span></>, icon: "trending_up" },
        { label: "UPITA DANAS", value: <><AnimatedCounter end={312} /> <span className="text-xs font-bold text-white/40 ml-1">POSLATIH</span></>, icon: "check_circle" }
      ]}
    />
  );
};
