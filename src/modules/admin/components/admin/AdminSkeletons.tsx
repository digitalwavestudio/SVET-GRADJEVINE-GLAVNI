import React from 'react';
import { Skeleton } from '@/src/components/ui/Skeleton';

export function AdminStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 h-[220px]">
          <Skeleton className="w-12 h-12 rounded-[10px] mb-6" />
          <Skeleton className="w-32 h-3 mb-4" variant="text" />
          <Skeleton className="w-20 h-10 mb-6" variant="text" />
          <div className="pt-6 border-t border-white/5 flex justify-between">
            <Skeleton className="w-24 h-3" variant="text" />
            <Skeleton className="w-4 h-4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 h-[450px]">
        <Skeleton className="w-48 h-4 mb-10" variant="text" />
        <Skeleton className="w-full h-[300px]" />
      </div>
      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 h-[450px]">
        <Skeleton className="w-32 h-4 mb-10" variant="text" />
        <div className="flex justify-center items-center h-[240px]">
           <Skeleton className="w-48 h-48 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="w-full h-3" variant="text" />)}
        </div>
      </div>
    </div>
  );
}

export function AdminSidebarSkeleton() {
  return (
    <div className="fixed left-0 top-0 bottom-0 w-80 bg-[#0A0F14] border-r border-white/5 z-50 flex flex-col p-8">
      <div className="flex items-center gap-4 mb-16">
        <Skeleton className="w-12 h-12 rounded-[10px]" />
        <div className="space-y-2">
          <Skeleton className="w-24 h-4" variant="text" />
          <Skeleton className="w-16 h-2" variant="text" />
        </div>
      </div>
      <div className="space-y-4 flex-1">
        {[1,2,3,4,5,6,7,8].map(i => (
          <Skeleton key={i} className="w-full h-14 rounded-[10px]" />
        ))}
      </div>
      <div className="mt-auto border-t border-white/5 pt-8 space-y-4">
        <Skeleton className="w-full h-20 rounded-[10px]" />
        <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-[10px] border border-white/5">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-20 h-3" variant="text" />
            <Skeleton className="w-12 h-2" variant="text" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminTransactionsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-[10px]">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-[10px]" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-3" variant="text" />
              <Skeleton className="w-48 h-2" variant="text" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="space-y-2">
              <Skeleton className="w-20 h-3" variant="text" />
              <Skeleton className="w-12 h-2" variant="text" />
            </div>
            <Skeleton className="w-16 h-8 rounded-[5px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

