import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'navy' | 'teal' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none tracking-tight';

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    navy: 'bg-[#0a1e3f]/10 text-[#0a1e3f] border border-[#0a1e3f]/20 font-semibold',
    teal: 'bg-[#0d9488]/10 text-[#0f766e] border border-[#0d9488]/25 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold',
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200/60',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
};
