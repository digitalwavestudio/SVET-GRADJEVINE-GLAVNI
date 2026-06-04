import React, { useEffect, useState } from 'react';
import { subscribeToQuotaStatus, getQuotaExceeded } from '@/src/lib/errorUtils';
import { Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const QuotaBanner: React.FC = () => {
  const [show, setShow] = useState(getQuotaExceeded());

  useEffect(() => {
    return subscribeToQuotaStatus((status) => {
      setShow(status);
    });
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-900/40 border-b border-amber-500/30 backdrop-blur-sm overflow-hidden"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuotaBanner;
