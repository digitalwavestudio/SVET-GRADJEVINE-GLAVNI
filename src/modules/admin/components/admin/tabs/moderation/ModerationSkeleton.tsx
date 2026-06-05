import React from 'react';
import { Skeleton } from '@/src/components/ui/Skeleton';

export function ModerationSkeleton() {
  return (
    <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1 flex gap-8 items-center">
          <Skeleton className="w-24 h-24 rounded-[10px]" />
          <div className="space-y-3">
            <div className="flex gap-3">
              <Skeleton className="w-16 h-5 rounded-[10px]" />
              <Skeleton className="w-24 h-5 rounded-[10px]" />
            </div>
            <Skeleton className="w-64 h-6" variant="text" />
            <div className="flex gap-4">
              <Skeleton className="w-32 h-3" variant="text" />
              <Skeleton className="w-32 h-3" variant="text" />
            </div>
          </div>
        </div>
        <div className="flex gap-8 border-l border-white/5 pl-12 lg:min-w-[300px]">
          <div className="space-y-2">
            <Skeleton className="w-20 h-2" variant="text" />
            <Skeleton className="w-28 h-5" variant="text" />
          </div>
        </div>
        <div className="flex gap-4 lg:min-w-[400px]">
          <Skeleton className="w-12 h-14 rounded-[10px]" />
          <Skeleton className="w-32 h-14 rounded-[10px]" />
          <Skeleton className="w-32 h-14 rounded-[10px]" />
          <Skeleton className="w-48 h-14 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}
