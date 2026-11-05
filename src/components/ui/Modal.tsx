import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    full: 'sm:max-w-2xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidths[maxWidth]} bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200/80`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle bar */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              {title && <h3 className="font-bold text-slate-900 text-lg leading-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng cửa sổ"
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto overscroll-contain flex-1">{children}</div>
      </div>
    </div>
  );
};
