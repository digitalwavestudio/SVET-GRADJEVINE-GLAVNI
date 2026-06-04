import React from 'react';
import { motion } from 'motion/react';
import { Skeleton } from '@/src/components/ui/Skeleton';

export const ChartSkeleton = ({ type = 'bar', height = 300 }: { type?: 'bar' | 'pie' | 'area', height?: number }) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-3 w-1/2">
          <Skeleton className="h-5 w-3/4 bg-gray-100" />
          <Skeleton className="h-3 w-1/2 bg-gray-50" />
        </div>
        {type !== 'pie' && <Skeleton className="h-10 w-16 bg-gray-100 rounded-xl" />}
      </div>
      
      <div style={{ height: `${height}px` }} className="flex items-end gap-3 w-full">
        {type === 'bar' && (
          <div className="flex items-end justify-between w-full h-full pb-8 border-b border-gray-50">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2 w-full max-w-[20px] items-center">
                <Skeleton 
                  className="w-full bg-gray-100 rounded-t-md" 
                  style={{ height: `${Math.floor(Math.random() * 60) + 20}%` }} 
                />
                <Skeleton className="h-2 w-8 bg-gray-50" />
              </div>
            ))}
          </div>
        )}

        {type === 'area' && (
          <div className="relative w-full h-full pb-8 border-b border-gray-50 overflow-hidden">
             {/* Simulated path */}
             <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
               <path 
                d="M0,100 C20,80 40,90 60,40 C80,20 100,50 120,30 C140,10 160,40 180,60 C200,80 220,70 240,90 L240,100 L0,100 Z" 
                className="fill-gray-50/50"
                transform="scale(4, 2.5)"
               />
             </svg>
             <div className="absolute inset-x-0 bottom-0 flex justify-between px-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-2 w-8 bg-gray-50" />)}
             </div>
          </div>
        )}

        {type === 'pie' && (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="relative w-40 h-40">
              <Skeleton className="absolute inset-0 rounded-full border-[20px] border-gray-100 bg-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="w-16 h-16 rounded-full bg-gray-50" />
              </div>
            </div>
            <div className="mt-8 space-y-3 w-full">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center px-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-full bg-gray-100" />
                    <Skeleton className="h-3 w-20 bg-gray-50" />
                  </div>
                  <Skeleton className="h-3 w-8 bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const SummaryCardSkeleton = ({ bgClass = "bg-white", borderClass = "border-gray-100" }: { bgClass?: string; borderClass?: string }) => (
  <div className={`${bgClass} border ${borderClass} p-6 rounded-2xl shadow-sm space-y-3`}>
    <Skeleton className="h-3 w-24 bg-current/5" />
    <Skeleton className="h-8 w-20 bg-current/10" />
  </div>
);

export default function AnalyticsSkeleton() {
  const cardStyles = [
    { bg: "bg-blue-50", border: "border-blue-100" },
    { bg: "bg-emerald-50", border: "border-emerald-100" },
    { bg: "bg-amber-50", border: "border-amber-100" },
    { bg: "bg-slate-50", border: "border-slate-100" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-2">
        <ChartSkeleton type="bar" height={350} />
      </div>
      <div>
        <ChartSkeleton type="pie" height={250} />
      </div>
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
        {cardStyles.map((style, i) => (
          <SummaryCardSkeleton key={i} bgClass={style.bg} borderClass={style.border} />
        ))}
      </div>
    </motion.div>
  );
}
