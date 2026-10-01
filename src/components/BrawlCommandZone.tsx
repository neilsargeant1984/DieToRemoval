import React, { useState } from 'react';
import { Card } from '../types/card';
import { Deck } from '../types/deck';
import { DeckWildcardCost } from '../types/collection';
import { analyzeBrawlDeckHealth } from '../utils/rampAdvisor';
import { FunctionalRole } from '../utils/roleClassifier';
import { ManaCost } from './ManaCost';
import { 
  Crown, 
  Sparkles, 
  Trash2, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  Shield,
  Zap,
  Target,
  Bomb,
  BookOpen,
  Mountain,
  Flame,
  ChevronRight
} from 'lucide-react';

export type BrawlSubMode = 'brawl_historic' | 'competitive_brawl' | 'standard_brawl';

interface BrawlCommandZoneProps {
  commander?: Card;
  deck: Deck;
  wildcardCost: DeckWildcardCost;
  onOpenCommanderPicker: () => void;
  onClearDeck: () => void;
  onToggleDeckDrawer: () => void;
  isDeckDrawerOpen: boolean;
  activeSubMode: BrawlSubMode;
  onSelectSubMode: (mode: BrawlSubMode) => void;
  selectedRoleTab?: string;
  onSelectRoleFilter?: (role: FunctionalRole | 'lands') => void;
}

export const BrawlCommandZone: React.FC<BrawlCommandZoneProps> = ({
  commander,
  deck,
  wildcardCost,
  onOpenCommanderPicker,
  onClearDeck,
  onToggleDeckDrawer,
  isDeckDrawerOpen,
  activeSubMode,
  onSelectSubMode,
  selectedRoleTab,
  onSelectRoleFilter
}) => {
  const mainCount = deck.mainboard.reduce((a, b) => a + b.quantity, 0);
  const totalDeckCount = mainCount + (commander ? 1 : 0);
  const targetDeckSize = activeSubMode === 'standard_brawl' ? 60 : 100;

  const health = analyzeBrawlDeckHealth(deck.mainboard, commander);

  const roles = [
    {
      id: 'ramp' as FunctionalRole,
      label: 'Ramp',
      icon: Zap,
      current: health.counts.ramp,
      target: health.targets.ramp.optimal,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400',
      tabKey: 'ramp',
      tag: `Target ${health.targets.ramp.targetRampCmc}-CMC`
    },
    {
      id: 'protection' as FunctionalRole,
      label: 'Protection',
      icon: Shield,
      current: health.counts.protection,
      target: health.targets.protection.optimal,
      color: 'text-sky-400',
      bgColor: 'bg-sky-400',
      tabKey: 'protection',
      tag: 'Hexproof/Ward'
    },
    {
      id: 'removal' as FunctionalRole,
      label: 'Removal',
      icon: Target,
      current: health.counts.removal,
      target: health.targets.removal.optimal,
      color: 'text-rose-400',
      bgColor: 'bg-rose-400',
      tabKey: 'removal',
      tag: 'Spot Removal'
    },
    {
      id: 'board_wipe' as FunctionalRole,
      label: 'Board Wipes',
      icon: Bomb,
      current: health.counts.board_wipe,
      target: health.targets.board_wipe.optimal,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400',
      tabKey: 'board_wipe',
      tag: 'Mass Sweepers'
    },
    {
      id: 'card_advantage' as FunctionalRole,
      label: 'Card Advantage',
      icon: BookOpen,
      current: health.counts.card_advantage,
      target: health.targets.card_advantage.optimal,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400',
      tabKey: 'card_draw',
      tag: 'Draw Engines'
    },
    {
      id: 'lands' as const,
      label: 'Lands',
      icon: Mountain,
      current: health.counts.lands,
      target: health.targets.lands.optimal,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400',
      tabKey: 'lands',
      tag: 'Mana Base'
    }
  ];

  return (
    <div className="relative bg-[#10141d]/90 border border-[#232b3d] rounded-2xl p-5 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Background ambient mana glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Commander Presentation (Big, Proud, In-Game Card Art) */}
        <div className="flex-shrink-0 flex flex-col items-center">
          {commander ? (
            <div className="relative group cursor-pointer" onClick={onOpenCommanderPicker}>
              {/* Golden Legendary Crown Frame */}
              <div className="w-48 sm:w-56 rounded-xl overflow-hidden shadow-2xl border-2 border-[#e5b758] group-hover:border-amber-300 transition duration-300 transform group-hover:scale-[1.02]">
                <img
                  src={commander.imageUrl}
                  alt={commander.name}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Floating Commander Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] tracking-wider px-3 py-0.5 rounded-full shadow-lg border border-amber-300 uppercase flex items-center gap-1">
                <Crown className="w-3 h-3 text-slate-950" />
                Commander
              </div>

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition text-xs font-bold text-amber-200">
                Click to Change
              </div>
            </div>
          ) : (
            /* Empty Commander Altar / Pedestal */
            <div
              onClick={onOpenCommanderPicker}
              className="w-48 sm:w-56 h-64 sm:h-76 rounded-xl border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-[#141926]/70 hover:bg-[#1a2133] transition flex flex-col items-center justify-center p-4 text-center cursor-pointer shadow-xl group"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition mb-3">
                <Crown className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 group-hover:text-amber-300 transition">
                Assign Your Commander
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Pick any legendary creature or planeswalker on MTG Arena
              </p>
            </div>
          )}
        </div>

        {/* Commander Details & Mode Selector Column */}
        <div className="flex-1 w-full space-y-4">
          {/* Top Row: Sub-mode Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-[#141824] p-1 rounded-xl border border-[#232b3d]">
              {[
                { id: 'brawl_historic' as BrawlSubMode, label: 'Brawl', sub: '100 Cards' },
                { id: 'competitive_brawl' as BrawlSubMode, label: 'Competitive Brawl', sub: 'Hell-Queue' },
                { id: 'standard_brawl' as BrawlSubMode, label: 'Standard Brawl', sub: '60 Cards' }
              ].map(sub => {
                const isActive = activeSubMode === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => onSelectSubMode(sub.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2130]'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className={`text-[9px] font-normal px-1 rounded ${
                      isActive ? 'bg-slate-950/20 text-slate-950 font-bold' : 'text-slate-500'
                    }`}>
                      {sub.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Deck Drawer Toggle */}
            <button
              onClick={onToggleDeckDrawer}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                isDeckDrawerOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-[#181d2a] text-slate-200 border-[#2a3449] hover:bg-[#222a3d]'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Deck Tray ({totalDeckCount}/{targetDeckSize})</span>
            </button>
          </div>

          {/* Commander Meta Box */}
          {commander ? (
            <div className="bg-[#141926]/90 border border-[#232b3d] rounded-xl p-4 space-y-3 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5">
                    <span>{commander.name}</span>
                    <ManaCost manaCost={commander.manaCost} size="md" />
                  </h2>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {commander.typeLine} • CMC: {commander.cmc}
                  </span>
                </div>

                {/* Color Identity Runes */}
                <div className="flex items-center gap-1.5 bg-[#0f131c] px-3 py-1.5 rounded-lg border border-[#202738]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                    Identity:
                  </span>
                  {commander.colorIdentity.length === 0 ? (
                    <span className="text-xs text-slate-400 font-bold">Colorless</span>
                  ) : (
                    commander.colorIdentity.map(c => {
                      const colors: Record<string, string> = {
                        W: 'bg-amber-100 text-amber-950 border-amber-300',
                        U: 'bg-blue-600 text-white border-blue-400',
                        B: 'bg-neutral-800 text-neutral-200 border-neutral-600',
                        R: 'bg-red-600 text-white border-red-400',
                        G: 'bg-emerald-600 text-white border-emerald-400'
                      };
                      return (
                        <span
                          key={c}
                          className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center border ${colors[c] || 'bg-slate-700 text-white'}`}
                        >
                          {c}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status Bar: Deck Size, Wildcard Deficiencies, Clean Deck */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#1e2536] text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Deck:</span>
                    <strong className={`font-bold ${
                      totalDeckCount === targetDeckSize ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {totalDeckCount} / {targetDeckSize}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Crafting:</span>
                    {wildcardCost.canCraftWithAvailableWildcards ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Craftable
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold">
                        Need {wildcardCost.missing.rare} R / {wildcardCost.missing.mythic} M
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClearDeck}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition"
                    title="Clear current deck and start fresh singleton list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Deck</span>
                  </button>
                </div>
              </div>



              {/* 6 Deck Skeleton Health Progress Meters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                {roles.map(r => {
                  const Icon = r.icon;
                  const pct = Math.min(100, Math.round((r.current / r.target) * 100));
                  const isOptimal = r.current >= r.target;
                  const isSelected = selectedRoleTab === r.tabKey;

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onSelectRoleFilter?.(r.id)}
                      className={`p-2.5 rounded-xl text-left transition flex flex-col justify-between group border relative ${
                        isSelected
                          ? 'bg-[#182030] border-amber-400 shadow-md ring-1 ring-amber-400/50'
                          : 'bg-[#0f131c]/80 hover:bg-[#161c29] border-[#222a3d] hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-amber-300 transition">
                            <Icon className={`w-3.5 h-3.5 ${r.color}`} />
                            <span className="text-xs font-bold">{r.label}</span>
                          </div>
                          <span className="text-[11px] font-mono font-extrabold text-slate-200">
                            {r.current}/{r.target}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-[#1b2230] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full transition-all duration-300 ${
                              isOptimal ? 'bg-emerald-400' : r.bgColor
                            }`}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate">{r.tag}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-amber-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-[#141926]/60 border border-[#232b3d] rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
              Select any commander to activate the **Brawl Causal Synergy Console** below. The console will dynamically identify the best cards on MTG Arena for that commander across all card types.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
