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
  Save,
  Sparkles,
  RefreshCw,
  UploadCloud,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { FormattedOracleText } from './FormattedOracleText';
import { CardImage } from './CardImage';
import { getCardFaceData, hasMultipleFaces } from '../utils/cardFaceUtils';
import { PowerTier, evaluateDeckBracket } from '../utils/bracketEvaluator';

export type BrawlSubMode = 'casual' | 'focused' | 'max_power' | 'brawl_historic' | 'competitive_brawl' | 'standard_brawl';

interface BrawlCommandZoneProps {
  commander?: Card;
  deck: Deck;
  wildcardCost: DeckWildcardCost;
  onOpenCommanderPicker: () => void;
  onClearDeck: () => void;
  onSaveDeck?: () => void;
  onOpenImport?: () => void;
  onToggleDeckDrawer: () => void;
  isDeckDrawerOpen: boolean;
  activePowerTier?: PowerTier;
  onSelectPowerTier?: (tier: PowerTier) => void;
  activeSubMode?: BrawlSubMode;
  onSelectSubMode?: (mode: BrawlSubMode) => void;
  selectedRoleTab?: string;
  onSelectRoleFilter?: (role: FunctionalRole | 'lands') => void;
  onOpenManaOptimizer?: () => void;
  onSelectCardDetail?: (card: Card) => void;
}

export const BrawlCommandZone: React.FC<BrawlCommandZoneProps> = ({
  commander,
  deck,
  wildcardCost,
  onOpenCommanderPicker,
  onClearDeck,
  onSaveDeck,
  onOpenImport,
  onToggleDeckDrawer,
  isDeckDrawerOpen,
  activePowerTier = 'focused',
  onSelectPowerTier,
  activeSubMode,
  onSelectSubMode,
  selectedRoleTab,
  onSelectRoleFilter,
  onOpenManaOptimizer,
  onSelectCardDetail
}) => {
  const mainCount = deck.mainboard.reduce((a, b) => a + b.quantity, 0);
  const totalDeckCount = mainCount + (commander ? 1 : 0);
  const targetDeckSize = 100;

  const bracketReport = React.useMemo(() => evaluateDeckBracket(deck), [deck]);
  const currentTier: PowerTier = activePowerTier || (activeSubMode === 'competitive_brawl' ? 'max_power' : 'focused');

  const handleSelectTier = (tier: PowerTier) => {
    if (onSelectPowerTier) {
      onSelectPowerTier(tier);
    } else if (onSelectSubMode) {
      onSelectSubMode(tier === 'max_power' ? 'competitive_brawl' : 'brawl_historic');
    }
  };

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

  const [isFlipped, setIsFlipped] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsFlipped(false);
  }, [commander?.id]);

  const isMultiFace = hasMultipleFaces(commander);
  const faceData = getCardFaceData(commander, isFlipped);
  const activeName = faceData.name;
  const activeTypeLine = faceData.typeLine;
  const activeManaCost = faceData.manaCost;
  const activeOracleText = faceData.oracleText;
  const activePower = faceData.power;
  const activeToughness = faceData.toughness;
  const activeLoyalty = faceData.loyalty;
  const currentActiveImg = faceData.imageUrl;

  return (
    <div className="relative arena-panel rounded-3xl p-6 md:p-8 transition-colors shadow-2xl">
      {/* Radiant Planeswalker Spark Aura Behind Commander (safely clipped) */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-12 w-96 h-96 spark-aura rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-8">
        {/* Commander Presentation (Large, Celebratory, Hero Card Art) */}
        <div className="flex-shrink-0 flex flex-col items-center relative">
          {/* Subtle Decorative Aura Rings */}
          <div className="absolute -inset-3 rounded-3xl border border-amber-400/20 pointer-events-none" />
          <div className="absolute -inset-1.5 rounded-2xl border border-amber-300/30 pointer-events-none" />

          {commander ? (
            <div className="flex flex-col items-center w-full">
              {/* Hero Card Pedestal */}
              <div
                className="relative group z-20 w-64 sm:w-72 lg:w-80 aspect-[5/7] rounded-2xl overflow-hidden altar-pedestal bg-black p-1 transition-all duration-300 shadow-2xl ring-1 ring-amber-400/40 hover:ring-amber-400/80 hover:shadow-[0_20px_50px_rgba(245,158,11,0.25)] flex items-center justify-center"
              >
                <div className="w-full h-full">
                  <CardImage
                    src={currentActiveImg}
                    cardName={activeName}
                    alt={activeName}
                    className="w-full h-full object-cover rounded-[14px] transition-opacity duration-200"
                  />
                </div>

                {/* Floating Arcane Wax Ribbon Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-400 text-slate-950 font-black text-[10px] tracking-wider px-3.5 py-0.5 rounded-full shadow-lg border border-yellow-200 uppercase flex items-center gap-1.5 whitespace-nowrap pointer-events-none z-30">
                  <Crown className="w-3 h-3 text-slate-950" />
                  <span>Commander</span>
                </div>

                {/* Card Corner Reverse Face Toggle Button */}
                {isMultiFace && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFlipped(prev => !prev);
                    }}
                    className="absolute top-2.5 right-2.5 bg-slate-950/85 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-400/60 p-2 rounded-xl backdrop-blur-md shadow-xl transition flex items-center gap-1.5 text-[11px] font-bold z-30 group-hover:scale-105"
                    title={isFlipped ? 'Show Front Face' : 'Show Reverse Face'}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isFlipped ? 'Front' : 'Reverse'}</span>
                  </button>
                )}
              </div>

              {/* Dedicated Commander Actions Dock */}
              <div className="w-full max-w-[20rem] flex flex-col gap-2 mt-3.5">
                {isMultiFace && (
                  <button
                    type="button"
                    onClick={() => setIsFlipped(prev => !prev)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isFlipped ? 'Show Front Face' : 'Show Reverse Face'}</span>
                  </button>
                )}
                <div className="flex gap-2">
                  {onSelectCardDetail && (
                    <button
                      type="button"
                      onClick={() => onSelectCardDetail(commander)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-[#141926] hover:bg-[#1c2335] text-stone-200 border border-white/10 hover:border-amber-400/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      title="Inspect full card details & artwork in high resolution"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Inspect</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onOpenCommanderPicker}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/50 hover:border-amber-400 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    title="Find and switch to a different commander"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Find New</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty Commander Altar / Pedestal */
            <div
              onClick={onOpenCommanderPicker}
              className="w-64 sm:w-72 lg:w-80 h-80 sm:h-96 rounded-2xl border-2 border-dashed border-[#c5a059]/40 hover:border-amber-400 bg-[#0d1017]/80 hover:bg-[#141926] transition flex flex-col items-center justify-center p-6 text-center cursor-pointer shadow-xl group relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition mb-3 shadow-lg">
                <Crown className="w-8 h-8" />
              </div>
              <h3 className="text-base font-fantasy font-bold text-white group-hover:text-amber-300 transition">
                Assign Your Commander
              </h3>
              <p className="text-xs text-stone-400 mt-1 max-w-xs">
                Pick any legendary creature or planeswalker on MTG Arena to lead your deck
              </p>

              <div className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/25 via-orange-500/25 to-amber-500/25 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-2 group-hover:scale-105 group-hover:border-amber-400 transition shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>⚡ Find a New Commander</span>
              </div>
            </div>
          )}
        </div>

        {/* Commander Details & Mode Selector Column */}
        <div className="flex-1 w-full space-y-5">
          {/* Top Row: Power Tier Selector & Live Matchmaking Bracket Meter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Target Power Tier Selector */}
              <div className="flex items-center gap-1 bg-[#0d1017]/90 p-1 rounded-xl border border-white/5">
                {[
                  { id: 'casual' as PowerTier, label: '🌿 Casual', sub: 'Bracket 1-2' },
                  { id: 'focused' as PowerTier, label: '⚡ Focused', sub: 'Bracket 3' },
                  { id: 'max_power' as PowerTier, label: '🔥 Max Power', sub: 'Hell-Queue' }
                ].map(tier => {
                  const isActive = currentTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => handleSelectTier(tier.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                      }`}
                    >
                      <span>{tier.label}</span>
                      <span className={`text-[9px] font-normal px-1 rounded ${
                        isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'text-stone-500'
                      }`}>
                        {tier.sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Live Evaluated Bracket & MTG Arena Deck Weight Badge */}
              <div 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${
                  bracketReport.currentBracket === 4
                    ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                    : bracketReport.currentBracket === 3
                    ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                    : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                }`}
                title={`Estimated MTG Arena Deck Weight: ~${bracketReport.totalEstimatedWeight} pts (${bracketReport.gameChangersFound.length} Game Changers in 99)`}
              >
                <span>{bracketReport.currentBracket === 4 ? '🔥' : bracketReport.currentBracket === 3 ? '⚡' : '🌿'}</span>
                <span>Deck: {bracketReport.currentBracketLabel}</span>
                <span className="font-mono text-[10px] opacity-75">~{bracketReport.totalEstimatedWeight} pts</span>
              </div>
            </div>

            {/* Deck Drawer Toggle */}
            <button
              onClick={onToggleDeckDrawer}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border shadow-sm ${
                isDeckDrawerOpen
                  ? 'btn-mythic-spark text-slate-950 font-black shadow-amber-500/20'
                  : 'bg-[#141926] hover:bg-[#1c2335] text-stone-200 border-white/10 hover:border-amber-400/30'
              }`}
              title={isDeckDrawerOpen ? 'Hide Decklist' : 'Show Decklist'}
            >
              <Layers className={`w-4 h-4 ${isDeckDrawerOpen ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{isDeckDrawerOpen ? 'Hide Decklist' : 'Show Decklist'} ({totalDeckCount}/{targetDeckSize})</span>
            </button>
          </div>

          {/* Hell-Queue Matchmaking Alert if player added high-weight staples */}
          {bracketReport.hellQueueWarning && (
            <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200 flex items-start gap-2.5 shadow-md animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-300">
                  Arena Matchmaking Alert (Hell-Queue Risk)
                </p>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">
                  {bracketReport.hellQueueWarning}
                </p>
                {bracketReport.gameChangersFound.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {bracketReport.gameChangersFound.map(m => (
                      <span key={m.card.id} className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/60 border border-rose-700/60 text-rose-200">
                        ★ {m.card.name} (+{m.weightInfo.weight} pts)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Commander Meta Box */}
          {commander ? (
            <div className="arena-panel-elevated rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-fantasy font-black text-2xl text-white flex items-center gap-2.5 flex-wrap">
                    <span className="truncate">{activeName}</span>
                    {activeManaCost && <ManaCost manaCost={activeManaCost} size="lg" />}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-stone-400">
                    <span>{activeTypeLine} • CMC: {commander.cmc}</span>
                    {activeLoyalty && (
                      <span className="inline-flex items-center gap-1 bg-amber-950/80 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-600/40 text-[11px] shadow-sm">
                        <Shield className="w-3 h-3 text-amber-400" />
                        Starting Loyalty: {activeLoyalty}
                      </span>
                    )}
                    {activePower !== undefined && activeToughness !== undefined && (
                      <span className="inline-flex items-center gap-1 bg-amber-950/80 text-amber-300 font-mono font-bold px-2 py-0.5 rounded border border-amber-600/40 text-[11px] shadow-sm">
                        {activePower}/{activeToughness}
                      </span>
                    )}
                  </div>
                </div>

                {/* Color Identity Runes */}
                <div className="flex items-center gap-1.5 bg-[#0d1017]/90 px-3 py-1.5 rounded-xl border border-white/5 flex-shrink-0">
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

              {/* Commander Oracle / Rules & Abilities Console */}
              <div className="bg-[#0a0e17]/95 border border-amber-500/25 rounded-xl p-3.5 shadow-inner">
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-fantasy font-black tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Card Text & Abilities</span>
                    </span>
                    {commander.isDigitalOnly && (
                      <span className="flex items-center gap-1 text-[9px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded-full shadow-sm">
                        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                        Digital Only
                      </span>
                    )}
                  </div>

                  {onSelectCardDetail && (
                    <button
                      type="button"
                      onClick={() => onSelectCardDetail(commander)}
                      className="text-[10px] font-bold text-stone-400 hover:text-amber-300 transition flex items-center gap-1 hover:underline"
                      title="View Full Card Details in Modal"
                    >
                      Inspect Full Card ↗
                    </button>
                  )}
                </div>

                {/* Face Toggle Tabs for Transforming / Multi-Face Cards */}
                {isMultiFace && (
                  <div className="flex items-center gap-1.5 mb-2.5 bg-[#0d1017]/90 p-1 rounded-lg border border-white/5 w-fit">
                    <button
                      type="button"
                      onClick={() => setIsFlipped(false)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 ${
                        !isFlipped
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span>✦ {commander.cardFaces?.[0]?.name || commander.name.split(' // ')[0]}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFlipped(true)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 ${
                        isFlipped
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>✦ {commander.cardFaces?.[1]?.name || commander.name.split(' // ')[1]}</span>
                    </button>
                  </div>
                )}

                {/* Formatted Oracle text with mana symbol support & loyalty badges */}
                <div className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans max-h-56 overflow-y-auto pr-1">
                  <FormattedOracleText text={activeOracleText} />
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

                  {onOpenImport && (
                    <button
                      type="button"
                      onClick={onOpenImport}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#141926] hover:bg-[#1e2538] text-amber-300 border border-amber-500/30 hover:border-amber-400/60 transition shadow-sm"
                      title="Import MTG Arena formatted decklist"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                      <span>Import Deck</span>
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
