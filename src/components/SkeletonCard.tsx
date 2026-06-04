import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[10px] overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-video bg-white/10 w-full" />
      
      <div className="p-5 space-y-4">
        {/* Chips/Badges Skeleton */}
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-white/10 rounded-full" />
          <div className="h-5 w-20 bg-white/10 rounded-full" />
        </div>

        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-6 w-3/4 bg-white/10 rounded-[10px]" />
          <div className="h-6 w-1/2 bg-white/10 rounded-[10px]" />
        </div>

        {/* Info Rows Skeleton */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-white/10 rounded-full" />
            <div className="h-4 w-32 bg-white/10 rounded-[10px]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-white/10 rounded-full" />
            <div className="h-4 w-24 bg-white/10 rounded-[10px]" />
          </div>
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full bg-white/5 rounded-[10px]" />
          <div className="h-3 w-full bg-white/5 rounded-[10px]" />
          <div className="h-3 w-2/3 bg-white/5 rounded-[10px]" />
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="h-6 w-24 bg-secondary/20 rounded-[10px]" />
          <div className="h-10 w-28 bg-white/10 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
