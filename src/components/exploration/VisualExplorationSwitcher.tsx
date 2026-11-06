import React from 'react';
import { Sparkles, Layers, Sliders, Smartphone, Check } from 'lucide-react';

export type DesignVariant = 'A' | 'B';

interface VisualExplorationSwitcherProps {
  currentVariant: DesignVariant;
  onChangeVariant: (variant: DesignVariant) => void;
  activeScreenName: string;
}

export const VisualExplorationSwitcher: React.FC<VisualExplorationSwitcherProps> = ({
  currentVariant,
  onChangeVariant,
  activeScreenName,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 mb-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Phase 1 Badge & Screen Context */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/60 text-[#0f766e] flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60 uppercase tracking-wide">
                Phase 1: Visual Exploration v2.2
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Màn hình: <strong className="text-slate-800">{activeScreenName}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn phương án để đối chiếu trực tiếp trên viewport mobile 390px và desktop.
            </p>
          </div>
        </div>

        {/* Right: Variant Toggle Buttons */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChangeVariant('A')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentVariant === 'A'
                ? 'bg-white text-[#0a1e3f] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {currentVariant === 'A' && <Check className="w-3.5 h-3.5 text-[#0d9488]" />}
            <span>Phương án A (Clean SaaS)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeVariant('B')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentVariant === 'B'
                ? 'bg-white text-[#0a1e3f] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {currentVariant === 'B' && <Check className="w-3.5 h-3.5 text-[#0d9488]" />}
            <span>Phương án B (Field Service)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
