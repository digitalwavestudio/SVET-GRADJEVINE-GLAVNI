import React from 'react';
import { useUserStatus } from '@/src/hooks/usePresence';
import { cn } from '@/src/lib/utils';

interface OnlineStatusProps {
  userId: string;
  className?: string;
  showText?: boolean;
  prefetchedOnline?: boolean;
  prefetchedLastSeen?: any;
}

export const OnlineStatus: React.FC<OnlineStatusProps> = ({ userId, className, showText = false, prefetchedOnline, prefetchedLastSeen }) => {
  // If prefetchedOnline is provided, bypass the useUserStatus hook to save background API calls per row.
  const hookStatus = useUserStatus(prefetchedOnline !== undefined ? null : userId);
  
  const isOnline = prefetchedOnline !== undefined ? prefetchedOnline : hookStatus.isOnline;
  const lastSeen = prefetchedLastSeen !== undefined ? prefetchedLastSeen : hookStatus.lastSeen;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div className={cn(
          "w-3 h-3 rounded-full border-2 border-slate-900 shadow-sm",
          isOnline ? "bg-emerald-500 shadow-emerald-500/50" : "bg-slate-600"
        )} />
        {isOnline && (
          <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-25" />
        )}
      </div>
      {showText && (
        <span className="text-xs font-medium text-white/60">
          {isOnline ? 'Aktivan/na' : lastSeen ? 'Bio/la aktivan/na skoro' : 'Offline'}
        </span>
      )}
    </div>
  );
};
