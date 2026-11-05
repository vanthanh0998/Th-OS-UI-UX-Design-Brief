import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-14 h-14 rounded-2xl bg-[#0a1e3f]/5 text-[#0a1e3f] flex items-center justify-center mb-3.5">
        <Icon className="w-7 h-7 text-[#0d9488]" />
      </div>
      <h4 className="font-bold text-slate-800 text-base mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-xs mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="teal" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
