import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  selected?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  selected = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 ${
        selected
          ? 'border-[#0d9488] ring-2 ring-[#0d9488]/20 shadow-md'
          : 'border-slate-200/80 shadow-xs'
      } ${
        hoverable ? 'hover:border-slate-300 hover:shadow-sm cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
