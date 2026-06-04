import React from 'react';

interface DashboardEmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function DashboardEmptyState({ icon = 'cloud_off', title, description, action }: DashboardEmptyStateProps) {
  return (
    <div className="bg-white/[0.01] border border-dashed border-white/5 rounded-[10px] p-12 mt-6 flex-1 text-center flex flex-col items-center justify-center gap-4">
      {icon && (
        <div className="w-16 h-16 rounded-[10px] bg-secondary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary text-2xl">{icon}</span>
        </div>
      )}
      <div>
        <h4 className="text-white font-black uppercase tracking-widest text-sm mb-1">{title}</h4>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
