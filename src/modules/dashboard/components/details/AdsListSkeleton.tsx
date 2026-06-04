import { motion } from 'motion/react';

export function AdsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-2">
        <span className="h-4 w-48 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-6">
        {[1, 2].map((idx) => (
          <motion.div
            key={`skeleton-ad-${idx}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-[#13212e]/30 border border-white/5 rounded-[10px] overflow-hidden flex flex-col xl:flex-row p-8 items-center justify-between gap-6"
          >
            <div className="flex flex-col xl:flex-row items-center gap-6 w-full">
              <div className="w-full xl:w-72 h-44 bg-white/[0.03] rounded-lg shrink-0 animate-pulse" />
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-20 bg-white/10 rounded-full animate-pulse" />
                  <div className="h-5 w-16 bg-white/5 rounded-full animate-pulse" />
                </div>
                <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse w-48" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="h-10 bg-white/[0.02] rounded border border-white/5 animate-pulse" />
                  <div className="h-10 bg-white/[0.02] rounded border border-white/5 animate-pulse" />
                  <div className="h-10 bg-white/[0.02] rounded border border-white/5 animate-pulse" />
                  <div className="h-10 bg-white/[0.02] rounded border border-white/5 animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
