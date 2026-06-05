import React from 'react';

export function DashboardAdStatusBadge({ status }: { status?: string }) {
  if (status === 'pending') {
    return (
      <span className="flex items-center gap-1.5 text-yellow-500 font-black text-[9px] tracking-widest uppercase bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span> Na čekanju
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-green-500 font-black text-[9px] tracking-widest uppercase bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 w-fit">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Aktivan
    </span>
  );
}
