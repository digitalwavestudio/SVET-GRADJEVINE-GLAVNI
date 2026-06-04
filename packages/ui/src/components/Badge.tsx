import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge = ({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
}: BadgeProps) => {
  const baseStyles = 'inline-flex items-center rounded-full font-medium tracking-tight';
  
  const variants = {
    primary: 'bg-indigo-100 text-indigo-700',
    secondary: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    outline: 'border border-gray-200 text-gray-600',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] uppercase',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
