import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardRarity, CardTypeCategory } from '../types/card';
import { UserCollection } from '../types/collection';
import { ARENA_SETS, ArenaSet } from '../data/arenaSets';
import { ARENA_CARDS } from '../data/arenaCards';
import { getSetBannerArt, getSetIconSvgUri } from '../data/arenaSetArt';
import { searchArenaCards } from '../services/scryfallService';
import { matchesColorFilter } from '../utils/colorFilter';
import { CardImage } from './CardImage';
import { ManaCost } from './ManaCost';
import { NewsConsole } from './NewsConsole';
import {
  Sparkles,
  Newspaper,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
  Plus,
  Eye,
  Calendar,
  Layers,
  Check,
  Loader2,
  Clock
} from 'lucide-react';

interface HomeViewProps {
  onSelectCardDetail: (card: Card) => void;
  onAddCardToDeck: (card: Card) => void;
  userCollection?: UserCollection;
}

type ConsoleTab = 'news' | 'latest_set';

const COLOR_PIPS: { id: string; manaSymbol?: string; label?: string; activeColor: string }[] = [
  { id: 'W', manaSymbol: '{W}', label: 'White', activeColor: 'ring-amber-300 bg-amber-100/20' },
  { id: 'U', manaSymbol: '{U}', label: 'Blue', activeColor: 'ring-blue-400 bg-blue-900/30' },
  { id: 'B', manaSymbol: '{B}', label: 'Black', activeColor: 'ring-stone-400 bg-stone-900/50' },
  { id: 'R', manaSymbol: '{R}', label: 'Red', activeColor: 'ring-red-400 bg-red-950/40' },
  { id: 'G', manaSymbol: '{G}', label: 'Green', activeColor: 'ring-emerald-400 bg-emerald-950/40' },
  { id: 'C', manaSymbol: '{C}', label: 'Colorless', activeColor: 'ring-slate-400 bg-slate-800/40' },
  { id: 'M', activeColor: 'ring-amber-400 bg-gradient-to-r from-amber-500/20 to-rose-500/20' }
];

const CARD_TYPES: CardTypeCategory[] = [
  'Creature',
  'Planeswalker',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Battle',
  'Land'
];

const CMC_VALUES: (number | '7+')[] = [0, 1, 2, 3, 4, 5, 6, '7+'];

const CARD_RARITIES: { id: CardRarity; label: string; color: string }[] = [
  { id: 'common', label: 'Common', color: 'text-stone-300' },
  { id: 'uncommon', label: 'Uncommon', color: 'text-cyan-300' },
  { id: 'rare', label: 'Rare', color: 'text-amber-300' },
  { id: 'mythic', label: 'Mythic', color: 'text-orange-400' }
];

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectCardDetail,
  onAddCardToDeck,
  userCollection = {}
}) => {
  // Console Tab State (Default to News & Updates Hub)
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('news');

  // Latest Set (Reality Fracture)
  const latestSet: ArenaSet = ARENA_SETS[0] || {
    code: 'FRA',
    name: 'Reality Fracture',
    category: 'standard',
    releaseYear: 2026,
    releaseDate: '2026-10-02'
  };

  const [isLatestExpanded, setIsLatestExpanded] = useState<boolean>(true);
  const [latestCards, setLatestCards] = useState<Card[]>([]);
  const [isLatestLoading, setIsLatestLoading] = useState<boolean>(true);

  // Global Filter State (Applies to ALL sets being browsed)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<CardTypeCategory[]>([]);
  const [selectedCmcs, setSelectedCmcs] = useState<(number | '7+')[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<CardRarity[]>([]);

  // Previous Sets (Ordered strictly in reverse chronological order: newest -> oldest)
  const previousSets: ArenaSet[] = useMemo(() => {
    return ARENA_SETS.slice(1);
  }, []);

  const [expandedPreviousSets, setExpandedPreviousSets] = useState<Record<string, boolean>>({});
  const [previousSetCards, setPreviousSetCards] = useState<Record<string, Card[]>>({});
  const [loadingSetCodes, setLoadingSetCodes] = useState<Record<string, boolean>>({});

  // Fetch cards for latest set (Reality Fracture)
  useEffect(() => {
    let isCancelled = false;
    setIsLatestLoading(true);

    const loadLatestCards = async () => {
      try {
        const res = await searchArenaCards({
          set: latestSet.code.toLowerCase(),
          order: 'name'
        });

        if (!isCancelled) {
          if (res.cards && res.cards.length > 0) {
            setLatestCards(res.cards);
          } else {
            const localFraCards = ARENA_CARDS.filter(
              c => c.set?.toUpperCase() === 'FRA' || c.setName?.toLowerCase().includes('reality fracture')
            );
            setLatestCards(localFraCards.length > 0 ? localFraCards : ARENA_CARDS.slice(0, 36));
          }
          setIsLatestLoading(false);
        }
      } catch (err) {
        console.warn('Scryfall fetch for latest set fallback to local:', err);
        if (!isCancelled) {
          const localFraCards = ARENA_CARDS.filter(
            c => c.set?.toUpperCase() === 'FRA' || c.setName?.toLowerCase().includes('reality fracture')
          );
          setLatestCards(localFraCards.length > 0 ? localFraCards : ARENA_CARDS.slice(0, 36));
          setIsLatestLoading(false);
        }
      }
    };

    loadLatestCards();
    return () => {
      isCancelled = true;
    };
  }, [latestSet.code]);

  // Load previous set cards on demand when expanded
  const handleTogglePreviousSet = async (setCode: string) => {
    const nextState = !expandedPreviousSets[setCode];
    setExpandedPreviousSets(prev => ({
      ...prev,
      [setCode]: nextState
    }));

    if (!nextState) return;

    // If already loaded, return
    if (previousSetCards[setCode] && previousSetCards[setCode].length > 0) {
      return;
    }

    setLoadingSetCodes(prev => ({ ...prev, [setCode]: true }));
    try {
      const res = await searchArenaCards({
        set: setCode.toLowerCase(),
        order: 'cmc'
      });
      setPreviousSetCards(prev => ({
        ...prev,
        [setCode]: res.cards || []
      }));
    } catch (err) {
      console.warn(`Failed to fetch cards for set ${setCode}:`, err);
      const matched = ARENA_CARDS.filter(c => c.set?.toUpperCase() === setCode.toUpperCase());
      setPreviousSetCards(prev => ({
        ...prev,
        [setCode]: matched
      }));
    } finally {
      setLoadingSetCodes(prev => ({ ...prev, [setCode]: false }));
    }
  };

  // Color Filter Toggle
  const toggleColor = (colorId: string) => {
    setSelectedColors(prev =>
      prev.includes(colorId) ? prev.filter(c => c !== colorId) : [...prev, colorId]
    );
  };

  // Type Filter Toggle
  const toggleType = (type: CardTypeCategory) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // CMC Filter Toggle
  const toggleCmc = (cmc: number | '7+') => {
    setSelectedCmcs(prev =>
      prev.includes(cmc) ? prev.filter(v => v !== cmc) : [...prev, cmc]
    );
  };

  // Rarity Filter Toggle
  const toggleRarity = (rarity: CardRarity) => {
    setSelectedRarities(prev =>
      prev.includes(rarity) ? prev.filter(r => r !== rarity) : [...prev, rarity]
    );
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedColors([]);
    setSelectedTypes([]);
    setSelectedCmcs([]);
    setSelectedRarities([]);
  };

  const activeFiltersCount =
    (selectedColors.length > 0 ? 1 : 0) +
    selectedTypes.length +
    selectedCmcs.length +
    selectedRarities.length +
    (searchTerm.trim() ? 1 : 0);

  // Global Filter Function: applies active criteria to ANY card list
  const applyFilters = (cardList: Card[]): Card[] => {
    return cardList.filter(card => {
      // 1. Text Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = card.name.toLowerCase().includes(query);
        const matchesText = card.oracleText?.toLowerCase().includes(query);
        const matchesType = card.typeLine.toLowerCase().includes(query);
        if (!matchesName && !matchesText && !matchesType) return false;
      }

      // 2. Color Filter (MTG Arena rules)
      if (selectedColors.length > 0 && !matchesColorFilter(card, selectedColors)) {
        return false;
      }

      // 3. Card Type Filter
      if (selectedTypes.length > 0) {
        const cardTypes = card.types || [];
        const matchesType = selectedTypes.some(t => cardTypes.includes(t));
        if (!matchesType) return false;
      }

      // 4. CMC Filter
      if (selectedCmcs.length > 0) {
        const matchesCmc = selectedCmcs.some(val => {
          if (val === '7+') return card.cmc >= 7;
          return card.cmc === val;
        });
        if (!matchesCmc) return false;
      }

      // 5. Rarity Filter
      if (selectedRarities.length > 0) {
        if (!selectedRarities.includes(card.rarity)) return false;
      }

      return true;
    });
  };

  // Filtered Cards for Latest Set
  const filteredLatestCards = useMemo(() => {
    return applyFilters(latestCards);
  }, [latestCards, searchTerm, selectedColors, selectedTypes, selectedCmcs, selectedRarities]);

  // Card Grid Tile Renderer
  const renderCardGrid = (cards: Card[]) => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {cards.map(card => {
          const ownedCount = userCollection[card.arenaId] || 0;
          return (
            <div
              key={`${card.id}-${card.collectorNumber}`}
              className="card-tile group rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer p-2 transition duration-200 bg-[#121623]/80 border border-white/5 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/10"
              onClick={() => onSelectCardDetail(card)}
            >
              <div className="relative overflow-hidden rounded-xl shadow border border-black/40 mb-2 bg-black aspect-[5/7]">
                <CardImage
                  src={card.imageUrl}
                  cardName={card.name}
                  alt={card.name}
                  className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-105 transition duration-200"
                />

                {/* CMC Badge */}
                <span className="absolute top-1.5 left-1.5 bg-black/85 backdrop-blur-md text-amber-300 text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md border border-white/20 shadow">
                  {card.cmc} MV
                </span>

                {/* Digital / Alchemy Badge */}
                {card.isDigitalOnly && (
                  <span className="absolute top-1.5 right-1.5 bg-purple-950/90 text-purple-200 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-700 shadow">
                    Digital
                  </span>
                )}

                {/* Hover Quick Action Buttons */}
                <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onSelectCardDetail(card);
                    }}
                    className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/40 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onAddCardToDeck(card);
                    }}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Deck</span>
                  </button>
                </div>
              </div>

              {/* Card Meta Info */}
              <div className="px-1 space-y-0.5">
                <h4 className="text-xs font-bold text-stone-200 truncate group-hover:text-amber-300 transition-colors">
                  {card.name}
                </h4>
                <p className="text-[10px] text-stone-400 truncate font-sans">
                  {card.typeLine}
                </p>
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="capitalize font-mono font-medium text-stone-500">
                    {card.rarity}
                  </span>
                  {ownedCount > 0 ? (
                    <span className="font-bold text-emerald-400 font-mono">
                      {ownedCount}x owned
                    </span>
                  ) : (
                    <span className="text-stone-600">0x</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================
          TOP CONSOLE NAVIGATION: "Latest Set Release" vs "News"
          ======================================================== */}
      <div className="bg-[#10141e]/90 border border-[#c5a059]/25 rounded-2xl p-2 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Console Tab Switcher */}
        {/* Left: Console Tab Switcher (News Hub First, Latest Set Second) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setConsoleTab('news')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition shadow-md ${
              consoleTab === 'news'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-stone-950 font-black shadow-amber-500/25 ring-1 ring-amber-300'
                : 'bg-[#141824] text-stone-400 hover:text-stone-200 hover:bg-white/5 border border-white/5'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>News & Updates</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
          </button>

          <button
            onClick={() => setConsoleTab('latest_set')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition shadow-md ${
              consoleTab === 'latest_set'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-stone-950 font-black shadow-amber-500/25 ring-1 ring-amber-300'
                : 'bg-[#141824] text-stone-400 hover:text-stone-200 hover:bg-white/5 border border-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Latest Set Release</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-md bg-black/40 text-white font-mono uppercase">
              {latestSet.code}
            </span>
          </button>
        </div>

        {/* Right: Format & Arena Info Tag */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400 pr-2">
          <span className="flex items-center gap-1.5 font-medium text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
            MTG Arena Sync Live
          </span>
          <span className="text-stone-600">•</span>
          <span className="text-[11px] font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {ARENA_SETS.length} Sets Available
          </span>
        </div>
      </div>

      {/* ========================================================
          TAB 1: NEWS & ANNOUNCEMENTS HUB (DEFAULT HOME)
          ======================================================== */}
      {consoleTab === 'news' ? (
        <NewsConsole />
      ) : (
        /* ========================================================
            TAB 2: LATEST SET RELEASE & HISTORICAL ARCHIVE
            ======================================================== */
        <div className="space-y-6">
          {/* ====================================================
              GLOBAL FILTER SECTION (OUTSIDE OF ANY SPECIFIC SET)
              Applies across the latest set AND any expanded previous set!
              ==================================================== */}
          <div className="bg-[#0f131d]/95 border border-amber-500/25 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-fantasy font-black uppercase text-amber-300 tracking-wider">
                  Universal Set Filters
                </span>
                <span className="text-[11px] text-stone-500 hidden sm:inline">
                  (Applies to Reality Fracture and any set you expand below)
                </span>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-950/40 border border-rose-500/30 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Filters ({activeFiltersCount})</span>
                </button>
              )}
            </div>

            {/* Row 1: Search Across Sets */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cards by name or rules text across all sets..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#141824] border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Row 2: Colour Identity Icons */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] font-fantasy font-black uppercase text-amber-400 tracking-wider mr-1">
                Colour Identity:
              </span>
              {COLOR_PIPS.map(pip => {
                const isSelected = selectedColors.includes(pip.id);
                return (
                  <button
                    key={pip.id}
                    onClick={() => toggleColor(pip.id)}
                    title={pip.id === 'M' ? 'Filter by Multicolor' : `Filter by ${pip.label}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition select-none ${
                      isSelected
                        ? `ring-2 ${pip.activeColor} text-amber-200 border-amber-400/80 shadow-md`
                        : 'bg-[#141824] text-stone-400 border-white/10 hover:text-stone-200 hover:border-white/25'
                    }`}
                  >
                    {pip.manaSymbol ? (
                      <ManaCost manaCost={pip.manaSymbol} size="sm" />
                    ) : pip.id === 'M' ? (
                      <span className="text-amber-400 font-black text-sm">★</span>
                    ) : null}
                    {pip.label && <span>{pip.label}</span>}
                    {isSelected && <Check className="w-3 h-3 text-amber-300 ml-0.5" />}
                  </button>
                );
              })}
              {selectedColors.length > 0 && (
                <button
                  onClick={() => setSelectedColors([])}
                  className="text-[11px] text-stone-400 hover:text-stone-200 underline ml-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Row 3: Card Type Filters */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
              <span className="text-[11px] font-fantasy font-black uppercase text-amber-400 tracking-wider mr-2">
                Card Type:
              </span>
              {CARD_TYPES.map(type => {
                const isSelected = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition select-none ${
                      isSelected
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 font-bold shadow-sm'
                        : 'bg-[#141824] text-stone-400 border-white/5 hover:text-stone-200 hover:border-white/20'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
              {selectedTypes.length > 0 && (
                <button
                  onClick={() => setSelectedTypes([])}
                  className="text-[11px] text-stone-400 hover:text-stone-200 underline ml-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Row 4: Mana Value (CMC) Filters & Rarity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-fantasy font-black uppercase text-amber-400 tracking-wider mr-2">
                  Mana Value (CMC):
                </span>
                {CMC_VALUES.map(cmc => {
                  const isSelected = selectedCmcs.includes(cmc);
                  return (
                    <button
                      key={cmc}
                      onClick={() => toggleCmc(cmc)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-black border flex items-center justify-center transition select-none ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 border-amber-300 ring-2 ring-amber-400/50 shadow-sm'
                          : 'bg-[#141824] text-stone-400 border-white/5 hover:text-stone-200 hover:border-white/20'
                      }`}
                    >
                      {cmc}
                    </button>
                  );
                })}
                {selectedCmcs.length > 0 && (
                  <button
                    onClick={() => setSelectedCmcs([])}
                    className="text-[11px] text-stone-400 hover:text-stone-200 underline ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Rarity */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-fantasy font-black uppercase text-stone-400 tracking-wider mr-1">
                  Rarity:
                </span>
                {CARD_RARITIES.map(r => {
                  const isSelected = selectedRarities.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggleRarity(r.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                        isSelected
                          ? 'bg-white/10 text-white border-amber-400 ring-1 ring-amber-400'
                          : `bg-[#141824] ${r.color} border-white/5 hover:border-white/20`
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ====================================================
              FEATURED LATEST SET HERO BANNER: REALITY FRACTURE
              Massive panoramic key artwork banner with official set symbol
              ==================================================== */}
          <div className="bg-[#0f131d]/95 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl group/hero">
            {/* Massive Hero Panoramic Header (Collapsible) */}
            <div
              onClick={() => setIsLatestExpanded(!isLatestExpanded)}
              className="relative w-full min-h-[170px] md:min-h-[210px] px-6 py-6 border-b border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer select-none overflow-hidden transition-all duration-300"
            >
              {/* Background Panoramic MTG Official Art Crop with Subtle Zoom */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img
                  src={getSetBannerArt(latestSet.code)}
                  alt={latestSet.name}
                  className="w-full h-full object-cover object-center brightness-60 contrast-110 group-hover/hero:scale-105 group-hover/hero:brightness-75 transition-all duration-700 ease-out"
                />
                {/* Deep Dramatic Vignette & Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14]/95 via-[#0a0d14]/80 to-[#0a0d14]/30 backdrop-blur-[0.5px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 ring-1 ring-inset ring-amber-500/20" />
              </div>

              {/* Content on top of artwork */}
              <div className="relative z-10 flex items-center gap-5">
                {/* Official Vector Set Symbol Card */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-black/70 backdrop-blur-md border border-amber-400/50 flex flex-col items-center justify-center shadow-2xl shadow-amber-500/20 flex-shrink-0 group-hover/hero:scale-105 group-hover/hero:border-amber-300 transition-all duration-300">
                  <img
                    src={getSetIconSvgUri(latestSet.code)}
                    alt={latestSet.code}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 object-contain invert drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]"
                  />
                  <span className="text-[10px] font-mono font-black tracking-widest text-amber-300 uppercase mt-0.5">
                    {latestSet.code}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-rose-500 to-amber-500 text-stone-950 shadow-md">
                      Latest Set Release
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
                      {latestSet.category}
                    </span>
                    <span className="text-xs text-stone-300 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {latestSet.releaseDate || `${latestSet.releaseYear}`}
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-fantasy font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-400 drop-shadow-md m-0">
                    {latestSet.name}
                  </h2>

                  <p className="text-xs md:text-sm text-stone-300 font-medium drop-shadow flex items-center gap-2">
                    <span className="text-amber-300 font-bold">
                      {activeFiltersCount > 0
                        ? `Showing ${filteredLatestCards.length} matching cards (${latestCards.length} total)`
                        : `${latestCards.length} Total Cards in Set`}
                    </span>
                    <span className="text-stone-500">•</span>
                    <span className="text-stone-400">Click to {isLatestExpanded ? 'collapse' : 'explore'} set cardlist</span>
                  </p>
                </div>
              </div>

              {/* Action Toggle Button */}
              <div className="relative z-10 flex items-center gap-3 self-end md:self-auto">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-amber-400/40 text-amber-300 group-hover/hero:border-amber-300 font-bold text-xs flex items-center gap-2 shadow-lg transition"
                >
                  <span>{isLatestExpanded ? 'Collapse Showcase' : 'Expand Showcase'}</span>
                  {isLatestExpanded ? (
                    <ChevronUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Content */}
            {isLatestExpanded && (
              <div className="p-6">
                {isLatestLoading ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <p className="font-semibold text-stone-300">
                      Loading {latestSet.name} cards from Scryfall...
                    </p>
                    <p className="text-xs text-stone-500">
                      Fetching high-res Arena card images and legalities
                    </p>
                  </div>
                ) : filteredLatestCards.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-6 space-y-2 bg-[#121623]/50 rounded-2xl border border-white/5">
                    <p className="font-semibold text-stone-300 text-base">
                      No cards in {latestSet.name} match the active filters
                    </p>
                    <p className="text-xs text-stone-500">
                      Try adjusting the universal filter controls above.
                    </p>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-4 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-xl text-xs font-bold transition border border-amber-500/30"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs text-stone-400">
                      <span>
                        Showing <strong className="text-amber-300">{filteredLatestCards.length}</strong> of{' '}
                        {latestCards.length} cards in {latestSet.name}
                      </span>
                      <span>Click any card for full details</span>
                    </div>

                    {renderCardGrid(filteredLatestCards)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ====================================================
              PREVIOUS SETS: OFFICIAL MTG ART PANORAMIC BANNERS
              Strictly arranged in reverse chronological order (going back in time)
              ==================================================== */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-lg font-fantasy font-black tracking-wide text-stone-200 m-0">
                    Previous Set Releases (Timeline Archive)
                  </h3>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Chronological archive of MTG Arena releases going back in time. Click any banner to inspect cards.
                </p>
              </div>

              <span className="text-xs text-stone-500 font-mono">
                {previousSets.length} releases cataloged
              </span>
            </div>

            {/* Previous Sets Panoramic Banners List */}
            <div className="space-y-3">
              {previousSets.map(set => {
                const isExpanded = !!expandedPreviousSets[set.code];
                const setRawCards = previousSetCards[set.code] || [];
                const matchingCards = applyFilters(setRawCards);
                const isLoadingSet = !!loadingSetCodes[set.code];
                const bannerArt = getSetBannerArt(set.code);

                return (
                  <div
                    key={set.code}
                    className="group/set relative rounded-3xl overflow-hidden border border-white/10 hover:border-amber-400/60 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-amber-500/15 backdrop-blur-xl bg-[#0d1018]"
                  >
                    {/* Big Panoramic Banner Header (Collapsible) */}
                    <div
                      onClick={() => handleTogglePreviousSet(set.code)}
                      className="relative min-h-[140px] md:min-h-[160px] px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 cursor-pointer select-none overflow-hidden transition-all duration-300"
                    >
                      {/* Background Official MTG Art Crop with Smooth Zoom & Vibrant Exposure */}
                      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <img
                          src={bannerArt}
                          alt={set.name}
                          className="w-full h-full object-cover object-right md:object-center brightness-75 contrast-110 group-hover/set:scale-105 group-hover/set:brightness-90 transition-all duration-700 ease-out"
                        />
                        {/* Directional Vignette: Deep fade on the left for text contrast, transparent on the right to showcase art */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#090c13] via-[#090c13]/85 to-[#090c13]/25 md:to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#090c13] via-transparent to-transparent opacity-80" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 group-hover/set:ring-amber-400/30 transition" />
                      </div>

                      {/* Left: Set Symbol & Details on top of artwork */}
                      <div className="relative z-10 flex items-center gap-5 min-w-0">
                        {/* Large Vector Set Symbol Badge */}
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-black/75 backdrop-blur-md border border-amber-400/40 shadow-2xl flex flex-col items-center justify-center flex-shrink-0 group-hover/set:scale-105 group-hover/set:border-amber-300 transition-all duration-300">
                          <img
                            src={getSetIconSvgUri(set.code)}
                            alt={set.code}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                            className="w-9 h-9 md:w-11 md:h-11 object-contain invert drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] group-hover/set:scale-110 transition-transform"
                          />
                          <span className="text-[10px] font-mono font-black text-amber-300 uppercase tracking-widest mt-0.5">
                            {set.code}
                          </span>
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-black/60 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                              {set.category}
                            </span>
                            <span className="text-xs text-stone-300 font-medium flex items-center gap-1 drop-shadow">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              Released: {set.releaseDate || `${set.releaseYear}`}
                            </span>
                          </div>

                          <h3 className="text-xl md:text-2xl lg:text-3xl font-fantasy font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300 drop-shadow-md group-hover/set:from-amber-200 group-hover/set:to-yellow-300 transition-all m-0 truncate">
                            {set.name}
                          </h3>

                          <p className="text-xs md:text-sm text-stone-300 font-medium drop-shadow flex items-center gap-2">
                            {setRawCards.length > 0 ? (
                              <span className="text-amber-300 font-bold">
                                {activeFiltersCount > 0
                                  ? `Showing ${matchingCards.length} matching cards (${setRawCards.length} total)`
                                  : `${setRawCards.length} Total Cards in Set`}
                              </span>
                            ) : (
                              <span className="text-stone-400">Click to expand & browse official Arena cards</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right Action Button */}
                      <div className="relative z-10 flex items-center gap-3 flex-shrink-0 self-end md:self-auto">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-black/70 backdrop-blur-md border border-amber-400/40 text-amber-300 group-hover/set:border-amber-300 group-hover/set:bg-black/90 font-bold text-xs flex items-center gap-2 shadow-lg transition"
                        >
                          <span>{isExpanded ? 'Collapse Set' : 'Browse Set'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-amber-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content: Cards for this previous set with filters applied */}
                    {isExpanded && (
                      <div className="p-5 border-t border-white/10 bg-[#0b0e16]/90 space-y-4">
                        {isLoadingSet ? (
                          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                            <p className="text-xs text-stone-400">
                              Loading {set.name} cards from Scryfall...
                            </p>
                          </div>
                        ) : setRawCards.length === 0 ? (
                          <div className="py-6 text-center text-xs text-stone-500">
                            No cards found for this set.
                          </div>
                        ) : matchingCards.length === 0 ? (
                          <div className="py-6 text-center text-xs text-stone-400">
                            <p>No cards in {set.name} match the active universal filters.</p>
                            <button
                              onClick={handleResetFilters}
                              className="mt-2 text-amber-400 hover:underline font-bold text-xs"
                            >
                              Reset Filters
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-stone-400">
                              <span>
                                Showing <strong className="text-amber-300">{matchingCards.length}</strong> of{' '}
                                {setRawCards.length} cards from <strong className="text-stone-200">{set.name}</strong>
                              </span>
                              <span>Click any card for full details</span>
                            </div>

                            {renderCardGrid(matchingCards)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
