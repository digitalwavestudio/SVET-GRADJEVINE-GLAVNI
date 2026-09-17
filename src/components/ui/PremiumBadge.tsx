import type { ReactNode } from 'react';

type StatusBadgeVariant = 'urgent' | 'premium' | 'new' | 'info';

const STATUS_BADGE_STYLES: Record<StatusBadgeVariant, string> = {
  urgent: 'backdrop-blur-sm bg-red-500/10 text-red-300 border border-red-500/20',
  premium: 'backdrop-blur-sm bg-gradient-to-r from-secondary/20 to-secondary/5 text-secondary border border-secondary/30 shadow-[0_0_14px_rgba(254,191,13,0.3)]',
  new: 'bg-green-500 text-white',
  info: 'bg-white/5 border border-white/10 text-slate-300 shadow-sm',
};

const STATUS_BADGE_ICONS: Partial<Record<StatusBadgeVariant, string>> = {
  urgent: 'local_fire_department',
  premium: 'workspace_premium',
};

interface StatusBadgeProps {
  variant?: StatusBadgeVariant;
  icon?: string;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({ variant = 'info', icon, children, className = '' }: StatusBadgeProps) {
  const resolvedIcon = icon ?? STATUS_BADGE_ICONS[variant];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-widest w-max ${STATUS_BADGE_STYLES[variant]} ${className}`}>
      {resolvedIcon && (
        <span className="material-symbols-outlined text-xs" style={variant === 'premium' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
          {resolvedIcon}
        </span>
      )}
      {children}
    </span>
  );
}

export function PremiumBadge() {
  return <StatusBadge variant="premium">Premium</StatusBadge>;
}
