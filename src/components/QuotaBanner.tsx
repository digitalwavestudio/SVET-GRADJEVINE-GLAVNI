import React, { useEffect, useState } from 'react';
import { subscribeToQuotaStatus, getQuotaExceeded } from '@/src/lib/errorUtils';
import { AlertCircle } from 'lucide-react';

const QuotaBanner: React.FC = () => {
  const [show, setShow] = useState(getQuotaExceeded());

  useEffect(() => {
    return subscribeToQuotaStatus((status) => {
      setShow(status);
    });
  }, []);

  if (!show) return null;

  return (
    <div 
      className="bg-amber-900/40 border-b border-amber-500/30 backdrop-blur-sm overflow-hidden transition-all duration-300"
      id="quota-banner"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 text-sm text-amber-100">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-500/20 rounded-[10px]">
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p>
            <span className="font-bold">VELIKO OPTEREĆENJE:</span> Sistem je pod neverovatnim opterećenjem, ograničen mod je aktivan.
          </p>
        </div>
        <button 
          onClick={() => setShow(false)}
          className="text-xs uppercase tracking-wider font-bold opacity-60 hover:opacity-100 transition-opacity"
        >
          U redu
        </button>
      </div>
    </div>
  );
};

export default QuotaBanner;
