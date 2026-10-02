import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardRarity, CardTypeCategory } from '../types/card';
import { UserCollection } from '../types/collection';
import { ARENA_SETS, ArenaSet } from '../data/arenaSets';
import { ARENA_CARDS } from '../data/arenaCards';
import { searchArenaCards } from '../services/scryfallService';
import { CardImage } from './CardImage';
import { ManaCost } from './ManaCost';
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
  ArrowUpDown,
  Flame,
  Check,
  Loader2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Tag
} from 'lucide-react';

interface HomeViewProps {
  onSelectCardDetail: (card: Card) => void;
  onAddCardToDeck: (card: Card) => void;
  userCollection?: UserCollection;
}

type ConsoleTab = 'latest_set' | 'news';
type ChronoSort = 'chrono_asc' | 'chrono_desc'; // asc = oldest to newest (chronological), desc = newest to oldest

const COLOR_PIPS: { id: string; manaSymbol?: string; label: string; activeColor: string }[] = [
  { id: 'W', manaSymbol: '{W}', label: 'White', activeColor: 'ring-amber-300 bg-amber-100/20' },
  { id: 'U', manaSymbol: '{U}', label: 'Blue', activeColor: 'ring-blue-400 bg-blue-900/30' },
  { id: 'B', manaSymbol: '{B}', label: 'Black', activeColor: 'ring-stone-400 bg-stone-900/50' },
  { id: 'R', manaSymbol: '{R}', label: 'Red', activeColor: 'ring-red-400 bg-red-950/40' },
  { id: 'G', manaSymbol: '{G}', label: 'Green', activeColor: 'ring-emerald-400 bg-emerald-950/40' },
  { id: 'C', manaSymbol: '{C}', label: 'Colorless', activeColor: 'ring-slate-400 bg-slate-800/40' },
  { id: 'M', label: 'Multi', activeColor: 'ring-amber-400 bg-gradient-to-r from-amber-500/20 to-rose-500/20' }
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
  // Console Tab State
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('latest_set');

  // Latest Set Showcase State
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

  // Filters for Latest Set
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<CardTypeCategory[]>([]);
  const [selectedCmcs, setSelectedCmcs] = useState<(number | '7+')[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<CardRarity[]>([]);

  // Previous Sets Accordion State
  const [chronoSort, setChronoSort] = useState<ChronoSort>('chrono_asc');
  const [expandedPreviousSet, setExpandedPreviousSet] = useState<string | null>(null);
  const [previousSetCards, setPreviousSetCards] = useState<Record<string, Card[]>>({});
  const [loadingSetCode, setLoadingSetCode] = useState<string | null>(null);

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
            // Fallback to local reality fracture cards if API returned empty
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
    if (expandedPreviousSet === setCode) {
      setExpandedPreviousSet(null);
      return;
    }

    setExpandedPreviousSet(setCode);

    // If already loaded, return
    if (previousSetCards[setCode] && previousSetCards[setCode].length > 0) {
      return;
    }

    setLoadingSetCode(setCode);
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
      // Fallback: filter local arena cards
      const matched = ARENA_CARDS.filter(c => c.set?.toUpperCase() === setCode.toUpperCase());
      setPreviousSetCards(prev => ({
        ...prev,
        [setCode]: matched
      }));
    } finally {
      setLoadingSetCode(null);
    }
  };

  // Color Filter Toggle (single or multi-combination)
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

  // Filtered Cards for Latest Set
  const filteredLatestCards = useMemo(() => {
    return latestCards.filter(card => {
      // 1. Text Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = card.name.toLowerCase().includes(query);
        const matchesText = card.oracleText?.toLowerCase().includes(query);
        const matchesType = card.typeLine.toLowerCase().includes(query);
        if (!matchesName && !matchesText && !matchesType) return false;
      }

      // 2. Color Identity Filter
      if (selectedColors.length > 0) {
        const cardColors = card.colorIdentity || card.colors || [];
        const normalSelected = selectedColors.filter(
          (c): c is 'W' | 'U' | 'B' | 'R' | 'G' => ['W', 'U', 'B', 'R', 'G'].includes(c)
        );
        const hasColorless = selectedColors.includes('C');
        const hasMulti = selectedColors.includes('M');

        let match = false;

        // Colorless match
        if (hasColorless && cardColors.length === 0) {
          match = true;
        }

        // Multicolor match (2+ colors)
        if (hasMulti && cardColors.length >= 2) {
          match = true;
        }

        // Specific color match: card must contain at least one of the selected colors
        if (normalSelected.length > 0) {
          const hasSelectedColor = normalSelected.some(sc => cardColors.includes(sc));
          if (hasSelectedColor) {
            match = true;
          }
        }

        if (!match) return false;
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
  }, [latestCards, searchTerm, selectedColors, selectedTypes, selectedCmcs, selectedRarities]);

  // Previous Sets (all sets except the most recent)
  const previousSets = useMemo(() => {
    const list = ARENA_SETS.slice(1);
    if (chronoSort === 'chrono_asc') {
      // Chronological: oldest release first -> newest release last
      return [...list].sort((a, b) => {
        const dateA = a.releaseDate || `${a.releaseYear}-01-01`;
        const dateB = b.releaseDate || `${b.releaseYear}-01-01`;
        return dateA.localeCompare(dateB);
      });
    } else {
      // Reverse Chronological: newest release first -> oldest release last
      return [...list].sort((a, b) => {
        const dateA = a.releaseDate || `${a.releaseYear}-01-01`;
        const dateB = b.releaseDate || `${b.releaseYear}-01-01`;
        return dateB.localeCompare(dateA);
      });
    }
  }, [chronoSort]);

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================
          TOP CONSOLE NAVIGATION: "Latest Set Release" vs "News"
          ======================================================== */}
      <div className="bg-[#10141e]/90 border border-[#c5a059]/25 rounded-2xl p-2 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Console Tab Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
        </div>

        {/* Right: Format & Arena Info Tag */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400 pr-2">
          <span className="flex items-center gap-1.5 font-medium text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
            MTG Arena Sync Live
          </span>
          <span className="text-stone-600">•</span>
          <span className="text-[11px] font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {latestSet.name}
          </span>
        </div>
      </div>

      {/* ========================================================
          TAB 1: LATEST SET RELEASE (SHOWCASE & COLLAPSIBLE HEADINGS)
          ======================================================== */}
      {consoleTab === 'latest_set' ? (
        <div className="space-y-8">
          {/* ----------------------------------------------------
              FEATURED LATEST SET HERO SHOWCASE SECTION
              ---------------------------------------------------- */}
          <div className="bg-[#0f131d]/90 border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
            {/* Header Accordion Banner (Collapsible) */}
            <div
              onClick={() => setIsLatestExpanded(!isLatestExpanded)}
              className="w-full bg-gradient-to-r from-stone-950 via-[#181d2a] to-stone-950 px-6 py-5 border-b border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition select-none group"
            >
              <div className="flex items-center gap-4">
                {/* Set Code Badge */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-600 to-purple-700 flex flex-col items-center justify-center font-black shadow-lg shadow-amber-500/20 border border-amber-300/50 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <span className="text-white text-lg font-mono font-black tracking-tight leading-none">
                    {latestSet.code}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-amber-200 mt-0.5">
                    SET
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-fantasy font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-rose-400 m-0">
                      {latestSet.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Latest MTG Arena Release
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {latestSet.category}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-stone-300">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      Released: {latestSet.releaseDate || `${latestSet.releaseYear}`}
                    </span>
                    <span>•</span>
                    <span className="text-amber-300 font-semibold">
                      {latestCards.length > 0 ? `${latestCards.length} Total Cards` : 'Loading cards...'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Expand / Collapse Indicator */}
              <div className="flex items-center gap-3 self-end md:self-auto">
                <span className="text-xs font-bold text-amber-400 group-hover:underline">
                  {isLatestExpanded ? 'Collapse Showcase' : 'Expand Showcase'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:border-amber-400 transition">
                  {isLatestExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible Content */}
            {isLatestExpanded && (
              <div className="p-6 space-y-6">
                {/* ----------------------------------------------
                    INTERACTIVE FILTER CONSOLE FOR LATEST SET
                    ---------------------------------------------- */}
                <div className="bg-[#121623] border border-white/5 rounded-2xl p-4 space-y-4">
                  {/* Row 1: Search & Reset */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={`Search within ${latestSet.name} by card name or text...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0b0e15] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {activeFiltersCount > 0 && (
                      <button
                        onClick={handleResetFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-950/40 border border-rose-500/30 transition self-end md:self-auto"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Clear All Filters ({activeFiltersCount})</span>
                      </button>
                    )}
                  </div>

                  {/* Row 2: Colour Identity Icons */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-fantasy font-black uppercase text-amber-400 tracking-wider mr-1">
                        Colour Identity:
                      </span>
                      {COLOR_PIPS.map(pip => {
                        const isSelected = selectedColors.includes(pip.id);
                        return (
                          <button
                            key={pip.id}
                            onClick={() => toggleColor(pip.id)}
                            title={`Filter by ${pip.label}`}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition duration-150 select-none ${
                              isSelected
                                ? `ring-2 ${pip.activeColor} text-amber-200 border-amber-400/80 shadow-md`
                                : 'bg-[#181d2a] text-stone-400 border-white/10 hover:text-stone-200 hover:border-white/25'
                            }`}
                          >
                            {pip.manaSymbol ? (
                              <ManaCost manaCost={pip.manaSymbol} size="sm" />
                            ) : pip.id === 'M' ? (
                              <span className="text-amber-400 font-bold">★</span>
                            ) : null}
                            <span>{pip.label}</span>
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
                  </div>

                  {/* Row 3: Card Type Filters */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/5">
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
                              : 'bg-[#151925] text-stone-400 border-white/5 hover:text-stone-200 hover:border-white/20'
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
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
                                : 'bg-[#151925] text-stone-400 border-white/5 hover:text-stone-200 hover:border-white/20'
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

                    {/* Rarity chips */}
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
                                : `bg-[#151925] ${r.color} border-white/5 hover:border-white/20`
                            }`}
                          >
                            {r.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ----------------------------------------------
                    CARD SHOWCASE GRID
                    ---------------------------------------------- */}
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
                      No cards in {latestSet.name} matched the current filters
                    </p>
                    <p className="text-xs text-stone-500">
                      Try resetting your color, card type, or mana value filters.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-2 px-4 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-xl text-xs font-bold transition border border-amber-500/30"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs text-stone-400">
                      <span>
                        Showing <strong className="text-amber-300">{filteredLatestCards.length}</strong> of{' '}
                        {latestCards.length} cards
                      </span>
                      <span>Click any card for full details</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {filteredLatestCards.map(card => {
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

                            {/* Card Meta info */}
                            <div className="px-1 space-y-0.5">
                              <h4 className="text-xs font-bold text-stone-200 truncate group-hover:text-amber-300 transition-colors">
                                {card.name}
                              </h4>
                              <p className="text-[10px] text-stone-400 truncate">
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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ----------------------------------------------------
              SECTION: PREVIOUS SETS RELEASED (CHRONOLOGICAL ORDER)
              ---------------------------------------------------- */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-fantasy font-black tracking-wide text-stone-200 m-0">
                  Previous Set Releases
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Chronological archive of all MTG Arena sets released before {latestSet.name}. Click any set heading to inspect cards.
                </p>
              </div>

              {/* Chronological Sort Toggle */}
              <div className="flex items-center gap-2 bg-[#121623] p-1 rounded-xl border border-white/10 text-xs">
                <span className="text-stone-400 px-2 flex items-center gap-1 font-medium">
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                  Order:
                </span>
                <button
                  onClick={() => setChronoSort('chrono_asc')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    chronoSort === 'chrono_asc'
                      ? 'bg-amber-400 text-stone-950 font-black shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Chronological (Oldest First)
                </button>
                <button
                  onClick={() => setChronoSort('chrono_desc')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    chronoSort === 'chrono_desc'
                      ? 'bg-amber-400 text-stone-950 font-black shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Newest First
                </button>
              </div>
            </div>

            {/* Previous Sets Collapsible Accordion List */}
            <div className="space-y-2.5">
              {previousSets.map(set => {
                const isExpanded = expandedPreviousSet === set.code;
                const setCards = previousSetCards[set.code] || [];
                const isLoadingSet = loadingSetCode === set.code;

                return (
                  <div
                    key={set.code}
                    className="bg-[#10141e]/80 border border-white/5 hover:border-amber-500/25 rounded-2xl overflow-hidden transition backdrop-blur-md"
                  >
                    {/* Collapsible Heading */}
                    <div
                      onClick={() => handleTogglePreviousSet(set.code)}
                      className="px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition select-none"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Set Code Tag */}
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono font-black text-xs text-amber-300">
                          {set.code}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-stone-200 m-0 truncate">
                              {set.name}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase bg-white/5 text-stone-400 border border-white/5">
                              {set.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500 block mt-0.5">
                            Released: {set.releaseDate || `${set.releaseYear}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-amber-400/80 font-medium hidden sm:inline">
                          {isExpanded ? 'Hide cards' : 'Browse cards'}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-stone-400">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-amber-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content: Cards for this previous set */}
                    {isExpanded && (
                      <div className="p-5 border-t border-white/5 bg-[#0b0e16]/80 space-y-4">
                        {isLoadingSet ? (
                          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                            <p className="text-xs text-stone-400">Loading {set.name} cards...</p>
                          </div>
                        ) : setCards.length === 0 ? (
                          <div className="py-6 text-center text-xs text-stone-500">
                            No cards found for this set.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-stone-400">
                              <span>
                                Showing <strong className="text-amber-300">{setCards.length}</strong> cards from{' '}
                                <strong className="text-stone-200">{set.name}</strong>
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                              {setCards.map(card => (
                                <div
                                  key={`${card.id}-${card.collectorNumber}`}
                                  onClick={() => onSelectCardDetail(card)}
                                  className="group rounded-xl overflow-hidden p-1.5 bg-[#141824] border border-white/5 hover:border-amber-400/40 cursor-pointer transition flex flex-col justify-between"
                                >
                                  <div className="relative rounded-lg overflow-hidden aspect-[5/7] bg-black mb-1.5">
                                    <CardImage
                                      src={card.imageUrl}
                                      cardName={card.name}
                                      alt={card.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition"
                                    />
                                    <span className="absolute top-1 left-1 bg-black/85 text-amber-300 text-[9px] font-mono font-bold px-1 py-0.2 rounded">
                                      {card.cmc} MV
                                    </span>
                                  </div>
                                  <div>
                                    <h5 className="text-[11px] font-bold text-stone-200 truncate group-hover:text-amber-300 transition-colors">
                                      {card.name}
                                    </h5>
                                    <span className="text-[9px] text-stone-500 truncate block">
                                      {card.typeLine}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
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
      ) : (
        /* ========================================================
            TAB 2: NEWS & ANNOUNCEMENTS
            ======================================================== */
        <div className="space-y-6">
          <div className="bg-[#0f131d]/90 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-xl font-fantasy font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-rose-400 m-0">
                  MTG Arena News Hub
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Official announcements, release notes, and competitive event schedules
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Phase 1 Preview
              </span>
            </div>

            {/* News Articles Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* News Item 1: Reality Fracture */}
              <div className="bg-[#121623] border border-amber-500/20 hover:border-amber-400/50 rounded-2xl p-4 space-y-3 transition group">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase">
                    New Release
                  </span>
                  <span className="text-stone-400 font-mono">Today</span>
                </div>
                <h4 className="text-sm font-bold text-stone-100 group-hover:text-amber-300 transition-colors leading-snug">
                  Reality Fracture Arrives on MTG Arena!
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  The latest set Reality Fracture is now live in MTG Arena! Explore brand new mechanics, commanders, and archetype powerhouses in Brawl, Standard, and Timeless formats.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-amber-400 font-semibold">
                  <span className="flex items-center gap-1 group-hover:underline">
                    View Set Breakdown <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
                  </span>
                </div>
              </div>

              {/* News Item 2: Format & Balance Updates */}
              <div className="bg-[#121623] border border-white/5 hover:border-white/20 rounded-2xl p-4 space-y-3 transition group">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold uppercase">
                    Format Update
                  </span>
                  <span className="text-stone-400 font-mono">Oct 2026</span>
                </div>
                <h4 className="text-sm font-bold text-stone-100 group-hover:text-amber-300 transition-colors leading-snug">
                  Brawl & Timeless Matchmaking Tuning
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Commander tier evaluations have been updated across MTG Arena. Discover synergistic card recommendations tailored for high-tier brawl matchmaking.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-stone-400 font-semibold">
                  <span>Matchmaking Tier Notes</span>
                </div>
              </div>

              {/* News Item 3: Upcoming Events */}
              <div className="bg-[#121623] border border-white/5 hover:border-white/20 rounded-2xl p-4 space-y-3 transition group">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                    Competitive
                  </span>
                  <span className="text-stone-400 font-mono">Upcoming</span>
                </div>
                <h4 className="text-sm font-bold text-stone-100 group-hover:text-amber-300 transition-colors leading-snug">
                  Arena Championship & Qualifier Weekend
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Prepare your decklists for the next Arena Open and Qualifier Play-In events. Practice goldfish turns and tune your mana base curve right in DieToRemoval!
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-stone-400 font-semibold">
                  <span>Event Schedule</span>
                </div>
              </div>
            </div>

            {/* Next Steps Note */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Next Step:</strong> Once we have perfected the Latest Set Release showcase and filters, we will connect this News console to live MTG Arena patch feeds and community articles!
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
