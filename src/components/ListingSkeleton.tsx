import React from 'react';
import { Skeleton } from './ui/Skeleton';

interface ListingSkeletonProps {
  viewMode?: 'grid' | 'list';
  count?: number;
}

export function ListingSkeleton({ viewMode = 'grid', count = 6 }: ListingSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-4 relative overflow-hidden bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer">
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className="bg-[#111a22]/60 backdrop-blur-xl border border-white/5 rounded-[10px] p-5 flex flex-col md:flex-row items-center gap-5 h-auto md:h-28"
          >
            <Skeleton className="w-16 h-16 rounded-[10px] shrink-0" />
            <div className="flex-grow space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <div className="flex gap-2">
                 <Skeleton className="h-2 w-16" />
                 <Skeleton className="h-2 w-16" />
              </div>
            </div>
            <Skeleton className="h-10 w-24 rounded-[10px] shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative overflow-hidden bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" : "flex flex-col gap-4 relative overflow-hidden bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-[#111a22]/60 backdrop-blur-xl border border-white/5 rounded-[10px] overflow-hidden flex flex-col h-[450px]"
        >
          {/* Image Area */}
          <Skeleton className="h-52 w-full" />
          
          <div className="p-5 flex-1 flex flex-col">
            {/* Header / Logo line */}
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-6 h-6 rounded-sm" />
              <Skeleton className="h-2 w-24" />
            </div>

            {/* Title line */}
            <div className="space-y-2 mb-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <Skeleton className="h-10 w-full rounded-sm" />
              <Skeleton className="h-10 w-full rounded-sm" />
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-end">
              <div className="space-y-2">
                <Skeleton className="h-2 w-12" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
