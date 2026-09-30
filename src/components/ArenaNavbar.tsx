import React from 'react';
import { FormatType } from '../types/card';
import { WildcardInventory } from '../types/collection';
import { 
  Sparkles, 
  BookOpen, 
  Layers, 
  UploadCloud, 
  Download, 
  Crown,
  Flame
} from 'lucide-react';

export type MainNavTab = 'deck_builder' | 'card_library';

interface ArenaNavbarProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  currentFormat: FormatType;
  onSelectFormat: (format: FormatType) => void;
  inventory: WildcardInventory;
  onOpenSync: () => void;
  onOpenExport: () => void;
  hasCommander?: boolean;
}

export const ArenaNavbar: React.FC<ArenaNavbarProps> = ({
  currentTab,
  onSelectTab,
  currentFormat,
  onSelectFormat,
  inventory,
  onOpenSync,
  onOpenExport,
  hasCommander
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c1017]/95 border-b border-[#232a3b] backdrop-blur-md px-4 py-2.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Top-level Navigation Pills */}
        <div className="flex items-center gap-6">
          {/* ArenaForge Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/40">
              <Crown className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-slate-100 uppercase">
                ARENA<span className="text-amber-400">FORGE</span>
              </span>
              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                HUB
              </span>
            </div>
          </div>

          {/* Primary View Pills: Deck Builder vs Card Library */}
          <div className="flex items-center bg-[#151a24] p-1 rounded-xl border border-[#262f42] shadow-inner">
            <button
              onClick={() => onSelectTab('deck_builder')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                currentTab === 'deck_builder'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2533]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Deck Builder</span>
            </button>
            <button
              onClick={() => onSelectTab('card_library')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                currentTab === 'card_library'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2533]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Card Library</span>
            </button>
          </div>
        </div>

        {/* Right Section: Wildcard Quick Stash & Actions */}
        <div className="flex items-center gap-3">
          {/* Wildcard Gems Pill */}
          <div className="hidden sm:flex items-center gap-3 bg-[#131722] px-3 py-1 rounded-xl border border-[#232a3b] text-xs">
            <div className="flex items-center gap-1 text-[11px]" title="Common Wildcards">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="font-bold text-slate-300">{inventory.common}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]" title="Uncommon Wildcards">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span className="font-bold text-slate-300">{inventory.uncommon}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]" title="Rare Wildcards">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-bold text-amber-300">{inventory.rare}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]" title="Mythic Wildcards">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="font-bold text-orange-400">{inventory.mythic}</span>
            </div>
          </div>

          {/* Sync Collection */}
          <button
            onClick={onOpenSync}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181d2a] hover:bg-[#232a3b] text-slate-200 text-xs font-semibold rounded-lg border border-[#2b354a] transition"
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Sync Collection</span>
          </button>

          {/* Export to Arena */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-bold rounded-lg transition shadow-md shadow-amber-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Arena</span>
          </button>
        </div>
      </div>

      {/* Sub-Pill Menu for Deck Builder Formats */}
      {currentTab === 'deck_builder' && (
        <div className="max-w-7xl mx-auto pt-2 mt-2 border-t border-[#1c2230] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Format:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'brawl' as FormatType, label: 'Brawl', badge: '100 Cards' },
                { id: 'standard' as FormatType, label: 'Standard', badge: '60 Cards' },
                { id: 'explorer' as FormatType, label: 'Pioneer', badge: '60 Cards' }
              ].map(fmt => {
                const isActive = currentFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => onSelectFormat(fmt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/10'
                        : 'bg-[#151a24] text-slate-400 hover:text-slate-200 border border-[#262f42] hover:bg-[#1e2533]'
                    }`}
                  >
                    <span>{fmt.label}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-normal ${
                      isActive ? 'bg-amber-400/20 text-amber-200' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {fmt.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {currentFormat === 'brawl' && (
            <span className="hidden md:inline text-[11px] text-amber-400/80 font-medium">
              ⚔️ 100-Card Singleton • Commander Color Identity Locked
            </span>
          )}
        </div>
      )}
    </header>
  );
};
