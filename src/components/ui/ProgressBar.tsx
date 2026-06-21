import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(30);
    const t1 = setTimeout(() => setProgress(90), 200);
    const t2 = setTimeout(() => setProgress(100), 500);
    const t3 = setTimeout(() => setProgress(0), 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-secondary z-[100] transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  );
}
