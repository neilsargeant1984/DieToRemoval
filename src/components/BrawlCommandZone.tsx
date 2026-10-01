import React from 'react';
import { Card } from '../types/card';
import { Deck } from '../types/deck';
import { DeckWildcardCost } from '../types/collection';
import { analyzeBrawlDeckHealth } from '../utils/rampAdvisor';
import { FunctionalRole } from '../utils/roleClassifier';
import { ManaCost } from './ManaCost';
import { 
  Crown, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  Shield, 
  Zap, 
  Target, 
  Bomb, 
  BookOpen, 
  Mountain, 
  ChevronRight, 
  Save 
} from 'lucide-react';

export type BrawlSubMode = 'brawl_historic' | 'competitive_brawl' | 'standard_brawl';

interface BrawlCommandZoneProps {
  commander?: Card;
  deck: Deck;
  wildcardCost: DeckWildcardCost;
  onOpenCommanderPicker: () => void;
  onClearDeck: () => void;
  onSaveDeck?: () => void;
  onToggleDeckDrawer: () => void;
  isDeckDrawerOpen: boolean;
  activeSubMode: BrawlSubMode;
  onSelectSubMode: (mode: BrawlSubMode) => void;
  selectedRoleTab?: string;
  onSelectRoleFilter?: (role: FunctionalRole | 'lands') => void;
  onOpenManaOptimizer?: () => void;
}

export const BrawlCommandZone: React.FC<BrawlCommandZoneProps> = ({
  commander,
  deck,
  wildcardCost,
  onOpenCommanderPicker,
  onClearDeck,
  onSaveDeck,
  onToggleDeckDrawer,
  isDeckDrawerOpen,
  activeSubMode,
  onSelectSubMode,
  selectedRoleTab,
  onSelectRoleFilter,
  onOpenManaOptimizer
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
      color: 'text-amber-700',
      vialClass: 'mana-vial-amber',
      tabKey: 'ramp',
      tag: `Target ${health.targets.ramp.targetRampCmc}-CMC`
    },
    {
      id: 'protection' as FunctionalRole,
      label: 'Protection',
      icon: Shield,
      current: health.counts.protection,
      target: health.targets.protection.optimal,
      color: 'text-sky-700',
      vialClass: 'mana-vial-sky',
      tabKey: 'protection',
      tag: 'Hexproof/Ward'
    },
    {
      id: 'removal' as FunctionalRole,
      label: 'Removal',
      icon: Target,
      current: health.counts.removal,
      target: health.targets.removal.optimal,
      color: 'text-rose-700',
      vialClass: 'mana-vial-rose',
      tabKey: 'removal',
      tag: 'Spot Answers'
    },
    {
      id: 'board_wipe' as FunctionalRole,
      label: 'Board Wipes',
      icon: Bomb,
      current: health.counts.board_wipe,
      target: health.targets.board_wipe.optimal,
      color: 'text-orange-700',
      vialClass: 'mana-vial-orange',
      tabKey: 'board_wipe',
      tag: 'Mass Sweepers'
    },
    {
      id: 'card_advantage' as FunctionalRole,
      label: 'Card Advantage',
      icon: BookOpen,
      current: health.counts.card_advantage,
      target: health.targets.card_advantage.optimal,
      color: 'text-indigo-700',
      vialClass: 'mana-vial-indigo',
      tabKey: 'card_draw',
      tag: 'Draw Engines'
    },
    {
      id: 'lands' as const,
      label: 'Lands',
      icon: Mountain,
      current: health.counts.lands,
      target: health.targets.lands.optimal,
      color: 'text-emerald-700',
      vialClass: 'mana-vial-emerald',
      tabKey: 'lands',
      tag: 'Mana Base'
    }
  ];

  const [imgSrc, setImgSrc] = React.useState<string | undefined>(commander?.imageUrl);
  const [hasFailed, setHasFailed] = React.useState<boolean>(false);

  React.useEffect(() => {
    setImgSrc(commander?.imageUrl);
    setHasFailed(false);
  }, [commander?.id, commander?.imageUrl]);

  const handleImageError = () => {
    if (commander) {
      const fallbackUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(commander.name.replace(/^A-/, ''))}&format=image`;
      if (imgSrc !== fallbackUrl) {
        setImgSrc(fallbackUrl);
        return;
      }
    }
    setHasFailed(true);
  };

  return (
    <div className="relative arena-panel rounded-3xl p-6 md:p-8 overflow-hidden transition-colors shadow-2xl">
      {/* Radiant Planeswalker Spark Aura Behind Commander */}
      <div className="absolute -top-20 -left-12 w-96 h-96 spark-aura rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Commander Presentation (Big, Proud, In-Game Card Art) */}
        <div className="flex-shrink-0 flex flex-col items-center relative">
          {/* Subtle Decorative Aura Rings */}
          <div className="absolute -inset-3 rounded-3xl border border-amber-400/20 pointer-events-none" />
          <div className="absolute -inset-1.5 rounded-2xl border border-amber-300/30 pointer-events-none" />

          {commander ? (
            <div className="relative group cursor-pointer" onClick={onOpenCommanderPicker}>
              {/* Golden Legendary Crown Frame */}
              <div className="w-48 sm:w-56 aspect-[5/7] rounded-2xl overflow-hidden altar-pedestal bg-black p-0.5 transition duration-300 transform group-hover:scale-[1.03] flex items-center justify-center relative">
                {!hasFailed && (imgSrc || commander.imageUrl) ? (
                  <img
                    src={imgSrc || commander.imageUrl}
                    alt={commander.name}
                    onError={handleImageError}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  <div className="w-full h-full rounded-[14px] bg-[#121620] border border-amber-500/30 p-4 flex flex-col justify-between text-center select-none">
                    <div className="space-y-1 mt-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div className="font-fantasy font-bold text-amber-200 text-sm leading-tight pt-1">
                        {commander.name}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {commander.typeLine}
                      </div>
                    </div>
                    {commander.oracleText && (
                      <div className="text-[10px] text-stone-300 bg-black/40 p-2.5 rounded-lg border border-white/5 line-clamp-5 text-left leading-relaxed">
                        {commander.oracleText}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-stone-400 font-mono">{commander.manaCost}</span>
                      {commander.power !== undefined && commander.toughness !== undefined && (
                        <span className="bg-amber-950/80 border border-amber-600/40 text-amber-300 font-mono font-bold px-2 py-0.5 rounded">
                          {commander.power}/{commander.toughness}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Arcane Wax Ribbon Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-400 text-slate-950 font-black text-[10px] tracking-wider px-3.5 py-0.5 rounded-full shadow-lg border border-yellow-200 uppercase flex items-center gap-1.5 whitespace-nowrap">
                <Crown className="w-3 h-3 text-slate-950" />
                <span>Commander</span>
              </div>

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition text-xs font-bold text-amber-300">
                Click to Change
              </div>
            </div>
          ) : (
            /* Empty Commander Altar / Pedestal */
            <div
              onClick={onOpenCommanderPicker}
              className="w-48 sm:w-56 h-64 sm:h-76 rounded-2xl border-2 border-dashed border-[#c5a059]/40 hover:border-amber-400 bg-[#0d1017]/80 hover:bg-[#141926] transition flex flex-col items-center justify-center p-4 text-center cursor-pointer shadow-xl group"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition mb-3 shadow-lg">
                <Crown className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-fantasy font-bold text-white group-hover:text-amber-300 transition">
                Assign Your Commander
              </h3>
              <p className="text-[11px] text-stone-400 mt-1">
                Pick any legendary creature or planeswalker on MTG Arena
              </p>
            </div>
          )}
        </div>

        {/* Commander Details & Mode Selector Column */}
        <div className="flex-1 w-full space-y-5">
          {/* Top Row: Sub-mode Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-[#0d1017]/90 p-1 rounded-xl border border-white/5">
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
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className={`text-[9px] font-normal px-1 rounded ${
                      isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'text-stone-500'
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border shadow-sm ${
                isDeckDrawerOpen
                  ? 'btn-mythic-spark text-slate-950 font-black shadow-amber-500/20'
                  : 'bg-[#141926] hover:bg-[#1c2335] text-stone-200 border-white/10 hover:border-amber-400/30'
              }`}
              title={isDeckDrawerOpen ? 'Hide Deck Tray' : 'Show Deck Tray'}
            >
              <Layers className={`w-4 h-4 ${isDeckDrawerOpen ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{isDeckDrawerOpen ? 'Hide Deck Tray' : 'Show Deck Tray'} ({totalDeckCount}/{targetDeckSize})</span>
            </button>
          </div>

          {/* Commander Meta Box */}
          {commander ? (
            <div className="arena-panel-elevated rounded-2xl p-4 space-y-3.5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-fantasy font-black text-2xl text-white flex items-center gap-2.5">
                    <span>{commander.name}</span>
                    <ManaCost manaCost={commander.manaCost} size="lg" />
                  </h2>
                  <span className="text-xs text-stone-400 block mt-0.5">
                    {commander.typeLine} • CMC: {commander.cmc}
                  </span>
                </div>

                {/* Color Identity Runes */}
                <div className="flex items-center gap-1.5 bg-[#0d1017]/90 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[10px] font-fantasy font-bold uppercase tracking-wider text-stone-400 mr-1">
                    Identity:
                  </span>
                  {commander.colorIdentity.length === 0 ? (
                    <span className="text-xs text-stone-400 font-bold">Colorless</span>
                  ) : (
                    commander.colorIdentity.map(c => {
                      const colors: Record<string, string> = {
                        W: 'bg-amber-100 text-amber-950 border-amber-300',
                        U: 'bg-blue-600 text-white border-blue-400',
                        B: 'bg-stone-800 text-stone-200 border-stone-600',
                        R: 'bg-red-600 text-white border-red-400',
                        G: 'bg-emerald-600 text-white border-emerald-400'
                      };
                      return (
                        <span
                          key={c}
                          className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center border shadow-sm ${colors[c] || 'bg-slate-700 text-white'}`}
                        >
                          {c}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status Bar: Deck Size, Wildcard Deficiencies, Clean Deck */}
              <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-white/10 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-400">Deck:</span>
                    <strong className={`font-bold ${
                      totalDeckCount === targetDeckSize ? 'text-emerald-400' : 'text-amber-300'
                    }`}>
                      {totalDeckCount} / {targetDeckSize}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-400">Crafting:</span>
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

                <div className="flex items-center gap-2.5">
                  {onOpenManaOptimizer && (
                    <button
                      type="button"
                      onClick={onOpenManaOptimizer}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white transition shadow-sm hover:scale-105"
                      title="Optimize mana base with 100% MTG Arena verified lands"
                    >
                      <Mountain className="w-3.5 h-3.5" />
                      <span>⚡ Auto-Build Mana Base</span>
                    </button>
                  )}

                  {onSaveDeck && (
                    <button
                      onClick={onSaveDeck}
                      className="btn-mythic-spark flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition shadow-md"
                      title="Save this deck to My Decks"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save to My Decks</span>
                    </button>
                  )}

                  <button
                    onClick={onClearDeck}
                    className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-rose-400 transition"
                    title="Clear current deck and start fresh singleton list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Deck</span>
                  </button>
                </div>
              </div>

              {/* 6 Deck Skeleton Health Progress Meters (Mana Crystal Vials) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                {roles.map(r => {
                  const Icon = r.icon;
                  const pct = Math.min(100, Math.round((r.current / r.target) * 100));
                  const isSelected = selectedRoleTab === r.tabKey;

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onSelectRoleFilter?.(r.id)}
                      className={`p-2.5 rounded-2xl text-left transition flex flex-col justify-between group border relative shadow-sm ${
                        isSelected
                          ? 'bg-[#1e2538] border-amber-500 ring-2 ring-amber-400/50 shadow-md'
                          : 'bg-[#121622]/90 hover:bg-[#171c28] border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-stone-200 group-hover:text-amber-300 transition">
                            <Icon className={`w-3.5 h-3.5 ${r.color}`} />
                            <span className="text-xs font-bold">{r.label}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-stone-300">
                            {r.current}/{r.target}
                          </span>
                        </div>

                        {/* Mana Crystal Tube Progress Bar */}
                        <div className="w-full h-2 mana-vial-track rounded-full overflow-hidden p-0.5">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${r.vialClass}`}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400 font-medium">
                        <span className="truncate">{r.tag}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-amber-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="arena-panel rounded-2xl p-4 text-xs text-stone-400 leading-relaxed shadow-sm">
              Select any commander to activate the **Brawl Causal Synergy Console** below. The console will dynamically identify the best cards on MTG Arena for that commander across all card types.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrawlCommandZone;
