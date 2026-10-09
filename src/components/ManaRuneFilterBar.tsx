import React from 'react';
import { ManaCost } from './ManaCost';
import { RotateCcw } from 'lucide-react';

export type ColorFilterMode = 'exact' | 'include' | 'at_most';

interface ManaRuneFilterBarProps {
  selectedColors: string[];
  onToggleColor: (color: string) => void;
  onClearColors?: () => void;
  colorMode?: ColorFilterMode;
  onChangeColorMode?: (mode: ColorFilterMode) => void;
  showColorless?: boolean;
  showMulticolor?: boolean;
  className?: string;
  label?: string;
}

interface RuneConfig {
  id: string;
  manaSymbol: string;
  name: string;
  activeGlow: string;
  activeBorder: string;
  idleBorder: string;
  badgeBg: string;
}

const RUNES: RuneConfig[] = [
  {
    id: 'W',
    manaSymbol: '{W}',
    name: 'White',
    activeGlow: 'shadow-[0_0_18px_rgba(254,240,138,0.85)] ring-2 ring-yellow-200/90 scale-110',
    activeBorder: 'border-yellow-200 bg-amber-100/30',
    idleBorder: 'border-white/10 hover:border-yellow-200/60 bg-[#141824]/80',
    badgeBg: 'bg-amber-100 text-stone-900'
  },
  {
    id: 'U',
    manaSymbol: '{U}',
    name: 'Blue',
    activeGlow: 'shadow-[0_0_18px_rgba(56,189,248,0.9)] ring-2 ring-sky-300/90 scale-110',
    activeBorder: 'border-sky-300 bg-sky-950/40',
    idleBorder: 'border-white/10 hover:border-sky-400/60 bg-[#141824]/80',
    badgeBg: 'bg-sky-500 text-white'
  },
  {
    id: 'B',
    manaSymbol: '{B}',
    name: 'Black',
    activeGlow: 'shadow-[0_0_18px_rgba(168,85,247,0.75)] ring-2 ring-purple-400/90 scale-110',
    activeBorder: 'border-purple-400 bg-purple-950/40',
    idleBorder: 'border-white/10 hover:border-purple-400/60 bg-[#141824]/80',
    badgeBg: 'bg-stone-900 text-stone-200'
  },
  {
    id: 'R',
    manaSymbol: '{R}',
    name: 'Red',
    activeGlow: 'shadow-[0_0_18px_rgba(248,113,113,0.9)] ring-2 ring-rose-400/90 scale-110',
    activeBorder: 'border-rose-400 bg-rose-950/40',
    idleBorder: 'border-white/10 hover:border-rose-400/60 bg-[#141824]/80',
    badgeBg: 'bg-rose-600 text-white'
  },
  {
    id: 'G',
    manaSymbol: '{G}',
    name: 'Green',
    activeGlow: 'shadow-[0_0_18px_rgba(52,211,153,0.9)] ring-2 ring-emerald-300/90 scale-110',
    activeBorder: 'border-emerald-300 bg-emerald-950/40',
    idleBorder: 'border-white/10 hover:border-emerald-400/60 bg-[#141824]/80',
    badgeBg: 'bg-emerald-600 text-white'
  }
];

export const ManaRuneFilterBar: React.FC<ManaRuneFilterBarProps> = ({
  selectedColors,
  onToggleColor,
  onClearColors,
  colorMode,
  onChangeColorMode,
  showColorless = true,
  showMulticolor = true,
  className = '',
  label = 'Mana Runes'
}) => {
  const isColorlessActive = selectedColors.includes('C');
  const isMultiActive = selectedColors.includes('M');

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#0c1017]/90 border border-[#c5a059]/30 shadow-2xl backdrop-blur-md ${className}`}>
      {/* Left: Mana Runes Medallion Row */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
        {label && (
          <span className="text-[11px] font-fantasy font-black uppercase text-amber-300 tracking-wider mr-1 select-none flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>{label}:</span>
          </span>
        )}

        {/* The 5 Core WUBRG Runes */}
        {RUNES.map(rune => {
          const isSelected = selectedColors.includes(rune.id);
          return (
            <button
              key={rune.id}
              type="button"
              onClick={() => onToggleColor(rune.id)}
              title={`Filter ${rune.name} Mana (${rune.id})`}
              className={`relative group w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center p-1 transition-all duration-300 border cursor-pointer select-none ${
                isSelected
                  ? `${rune.activeGlow} ${rune.activeBorder}`
                  : `${rune.idleBorder} opacity-75 hover:opacity-100 hover:scale-105`
              }`}
            >
              <ManaCost manaCost={rune.manaSymbol} size="md" className="pointer-events-none" />
              {isSelected && (
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950 shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}

        {/* Colorless Rune */}
        {showColorless && (
          <button
            type="button"
            onClick={() => onToggleColor('C')}
            title="Filter Colorless Mana (C)"
            className={`relative group w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center p-1 transition-all duration-300 border cursor-pointer select-none ${
              isColorlessActive
                ? 'shadow-[0_0_16px_rgba(214,211,209,0.7)] ring-2 ring-stone-300/90 border-stone-300 bg-stone-800/80 scale-110'
                : 'border-white/10 hover:border-stone-400/60 bg-[#141824]/80 opacity-75 hover:opacity-100 hover:scale-105'
            }`}
          >
            <ManaCost manaCost="{C}" size="md" className="pointer-events-none" />
            {isColorlessActive && (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950 shadow">
                ✓
              </span>
            )}
          </button>
        )}

        {/* Multicolor Star Rune */}
        {showMulticolor && (
          <button
            type="button"
            onClick={() => onToggleColor('M')}
            title="Filter Multicolor Cards"
            className={`relative group w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center p-1 transition-all duration-300 border cursor-pointer select-none ${
              isMultiActive
                ? 'shadow-[0_0_18px_rgba(251,191,36,0.85)] ring-2 ring-amber-300/90 border-amber-300 bg-gradient-to-tr from-amber-500/30 via-rose-500/30 to-sky-500/30 scale-110'
                : 'border-white/10 hover:border-amber-400/60 bg-[#141824]/80 opacity-75 hover:opacity-100 hover:scale-105'
            }`}
          >
            <span className="text-amber-300 font-black text-sm drop-shadow">★</span>
            {isMultiActive && (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950 shadow">
                ✓
              </span>
            )}
          </button>
        )}

        {/* Clear Button */}
        {selectedColors.length > 0 && onClearColors && (
          <button
            type="button"
            onClick={onClearColors}
            className="flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-amber-300 transition px-2 py-1 rounded-lg hover:bg-white/5 ml-1"
            title="Clear active mana filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right: Color Filter Mode Switcher (Exact vs Includes vs At Most) */}
      {colorMode && onChangeColorMode && (
        <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded-xl border border-white/5 shadow-inner">
          <span className="text-[10px] font-bold text-stone-500 uppercase px-2 hidden sm:inline">
            Mode:
          </span>
          {(['include', 'exact', 'at_most'] as ColorFilterMode[]).map(mode => {
            const isActive = colorMode === mode;
            const labels: Record<ColorFilterMode, string> = {
              include: 'Includes',
              exact: 'Exact',
              at_most: '≤ At Most'
            };
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onChangeColorMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManaRuneFilterBar;
