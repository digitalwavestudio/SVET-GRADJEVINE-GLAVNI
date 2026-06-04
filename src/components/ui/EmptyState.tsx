import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionLink }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-[10px] border border-white/5 text-center">
      <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-secondary" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-on-surface-variant mb-6 max-w-sm">{description}</p>
      {actionLabel && actionLink && (
        <Link 
          to={actionLink} 
          className="bg-secondary text-slate-950 px-6 py-2 rounded-[10px] font-bold hover:bg-secondary/90 transition-all"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
