import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardRarity, CardTypeCategory, FormatType } from '../types/card';
import { UserCollection } from '../types/collection';
import { searchArenaCards, buildSmartSearchQuery } from '../services/scryfallService';
import { matchesColorFilter, ColorMatchMode } from '../utils/colorFilter';
import { ARENA_SETS, ArenaSet } from '../data/arenaSets';
import { CardImage } from './CardImage';
import { ManaCost } from './ManaCost';
import { ManaRuneFilterBar } from './ManaRuneFilterBar';
import { OwnershipPips } from './OwnershipPips';
import { getCardOwnedCount } from '../services/ownershipService';
import { 
  Search, 
  Loader2, 
  Globe, 
  X, 
  Plus, 
  SlidersHorizontal, 
  ArrowUpDown, 
  RotateCcw, 
  Check, 
  ChevronDown, 
  Sparkles, 
  ShieldCheck, 
  Crown,
  Layers,
  ChevronRight,
  LayoutGrid,
  Filter
} from 'lucide-react';

interface CardLibraryViewProps {
  onSelectCardDetail: (card: Card) => void;
  onAddCardToDeck: (card: Card) => void;
  userCollection?: UserCollection;
  onUpdateCollection?: (col: UserCollection) => void;
  initialFormat?: FormatType;
}

type SortOrder = 'edhrec' | 'color' | 'cmc_asc' | 'cmc_desc' | 'name' | 'rarity';
type OwnershipStatus = 'all' | 'owned' | 'playsets' | 'incomplete' | 'unowned';

const MANA_COLORS = [
  {
    id: 'W',
    name: 'White',
    manaSymbol: '{W}',
    activeRing: 'ring-2 ring-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.5)] border-amber-300/80 bg-amber-100/20',
    hoverRing: 'hover:border-amber-300/50 hover:bg-amber-100/10'
  },
  {
    id: 'U',
    name: 'Blue',
    manaSymbol: '{U}',
    activeRing: 'ring-2 ring-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.6)] border-blue-400/80 bg-blue-900/30',
    hoverRing: 'hover:border-blue-400/50 hover:bg-blue-900/20'
  },
  {
    id: 'B',
    name: 'Black',
    manaSymbol: '{B}',
    activeRing: 'ring-2 ring-stone-300 shadow-[0_0_10px_rgba(214,211,209,0.5)] border-stone-400/80 bg-stone-900/60',
    hoverRing: 'hover:border-stone-400/50 hover:bg-stone-900/40'
  },
  {
    id: 'R',
    name: 'Red',
    manaSymbol: '{R}',
    activeRing: 'ring-2 ring-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)] border-red-400/80 bg-red-950/40',
    hoverRing: 'hover:border-red-400/50 hover:bg-red-950/20'
  },
  {
    id: 'G',
    name: 'Green',
    manaSymbol: '{G}',
    activeRing: 'ring-2 ring-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.6)] border-emerald-400/80 bg-emerald-950/40',
    hoverRing: 'hover:border-emerald-400/50 hover:bg-emerald-950/20'
  },
  {
    id: 'C',
    name: 'Colorless',
    manaSymbol: '{C}',
    activeRing: 'ring-2 ring-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.5)] border-slate-400 bg-slate-800 text-slate-100',
    hoverRing: 'hover:border-slate-400/50 bg-[#121622] text-slate-300'
  },
  {
    id: 'M',
    name: 'Multicolor',
    activeRing: 'ring-2 ring-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 text-white font-black border-transparent',
    hoverRing: 'hover:border-amber-400/50 bg-[#121622] text-amber-300'
  }
];

const CMC_PIPS: (number | '7+')[] = [0, 1, 2, 3, 4, 5, 6, '7+'];

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

const CARD_RARITIES: { id: CardRarity; label: string; color: string; activeBg: string }[] = [
  { id: 'common', label: 'Common', color: 'text-stone-300', activeBg: 'bg-stone-700 text-white border-stone-400' },
  { id: 'uncommon', label: 'Uncommon', color: 'text-cyan-300', activeBg: 'bg-cyan-900/80 text-cyan-200 border-cyan-400' },
  { id: 'rare', label: 'Rare', color: 'text-amber-300', activeBg: 'bg-amber-600 text-white border-amber-300' },
  { id: 'mythic', label: 'Mythic', color: 'text-orange-400', activeBg: 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-orange-300' }
];

export const CardLibraryView: React.FC<CardLibraryViewProps> = ({
  onSelectCardDetail,
  onAddCardToDeck,
  userCollection = {},
  onUpdateCollection,
  initialFormat = 'brawl'
}) => {
  // --- Filter State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<FormatType>(initialFormat);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorMatchMode, setColorMatchMode] = useState<ColorMatchMode>('selected');
  const [selectedCmcs, setSelectedCmcs] = useState<(number | '7+')[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<CardTypeCategory[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<CardRarity[]>([]);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [digitalOnly, setDigitalOnly] = useState(false);
  const [isLegendary, setIsLegendary] = useState(false);
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipStatus>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('edhrec');

  // --- UI Controls ---
  const [isGroupedByColor, setIsGroupedByColor] = useState<boolean>(true);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [setSearchQuery, setSetSearchQuery] = useState('');
  const [setSelectedCategory, setSetSelectedCategory] = useState<'all' | 'standard' | 'eternal' | 'remastered' | 'anthology' | 'alchemy'>('all');

  // --- Data State ---
  const [cards, setCards] = useState<Card[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse MTG Arena quantity / craftable syntax typed into the search bar (e.g. q=0, q>0, q=4, ?craftable)
  const effectiveOwnershipFilter = useMemo<OwnershipStatus>(() => {
    const lower = searchTerm.toLowerCase();
    if (lower.includes('q=0') || lower.includes('q:0') || lower.includes('?craftable')) {
      return 'unowned';
    }
    if (lower.includes('q>0') || lower.includes('q>=1') || lower.includes('q:1')) {
      return 'owned';
    }
    if (lower.includes('q=4') || lower.includes('q:4')) {
      return 'playsets';
    }
    return ownershipFilter;
  }, [searchTerm, ownershipFilter]);

  // Clean Scryfall query string by stripping client-only Arena operators
  const cleanedSearchQuery = useMemo(() => {
    return searchTerm
      .replace(/\b(q=[0-4]|q:[0-4]|q>[0-3]|q>=[1-4]|\?craftable)\b/gi, '')
      .trim();
  }, [searchTerm]);

  // Compute active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedColors.length > 0) count++;
    if (colorMatchMode !== 'selected') count++;
    if (selectedCmcs.length > 0) count++;
    if (selectedTypes.length > 0) count += selectedTypes.length;
    if (selectedRarities.length > 0) count += selectedRarities.length;
    if (selectedSets.length > 0) count += selectedSets.length;
    if (digitalOnly) count++;
    if (isLegendary) count++;
    if (effectiveOwnershipFilter !== 'all') count++;
    return count;
  }, [selectedColors, colorMatchMode, selectedCmcs, selectedTypes, selectedRarities, selectedSets, digitalOnly, isLegendary, effectiveOwnershipFilter]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedColors([]);
    setColorMatchMode('selected');
    setSelectedCmcs([]);
    setSelectedTypes([]);
    setSelectedRarities([]);
    setSelectedSets([]);
    setDigitalOnly(false);
    setIsLegendary(false);
    setOwnershipFilter('all');
    setSortOrder('edhrec');
  };

  // Toggle helpers
  const toggleColor = (colorId: string) => {
    setSelectedColors(prev => 
      prev.includes(colorId) ? prev.filter(c => c !== colorId) : [...prev, colorId]
    );
  };

  const toggleCmc = (cmc: number | '7+') => {
    setSelectedCmcs(prev => 
      prev.includes(cmc) ? prev.filter(c => c !== cmc) : [...prev, cmc]
    );
  };

  const toggleType = (t: CardTypeCategory) => {
    setSelectedTypes(prev => 
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const toggleRarity = (r: CardRarity) => {
    setSelectedRarities(prev => 
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const toggleSet = (code: string) => {
    setSelectedSets(prev => 
      prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code]
    );
  };

  // Filter Sets catalog for picker (sorted chronologically with most recent set first)
  const filteredSets = useMemo(() => {
    return ARENA_SETS.filter(s => {
      if (setSelectedCategory !== 'all') {
        if (setSelectedCategory === 'eternal') {
          if (s.category !== 'eternal' && s.category !== 'anthology') return false;
        } else if (s.category !== setSelectedCategory) {
          return false;
        }
      }
      if (setSearchQuery.trim()) {
        const query = setSearchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(query) || 
          s.code.toLowerCase().includes(query) ||
          s.releaseYear.toString().includes(query)
        );
      }
      return true;
    }).sort((a, b) => {
      if (a.releaseDate && b.releaseDate) {
        return b.releaseDate.localeCompare(a.releaseDate);
      }
      return b.releaseYear - a.releaseYear;
    });
  }, [setSelectedCategory, setSearchQuery]);

  // Map sortOrder to Scryfall order and dir
  const { scryfallOrder, scryfallDir } = useMemo(() => {
    switch (sortOrder) {
      case 'cmc_asc':
        return { scryfallOrder: 'cmc' as const, scryfallDir: 'asc' as const };
      case 'cmc_desc':
        return { scryfallOrder: 'cmc' as const, scryfallDir: 'desc' as const };
      case 'color':
        return { scryfallOrder: 'color' as const, scryfallDir: 'asc' as const };
      case 'edhrec':
        return { scryfallOrder: 'edhrec' as const, scryfallDir: 'asc' as const };
      case 'name':
        return { scryfallOrder: 'name' as const, scryfallDir: 'asc' as const };
      case 'rarity':
        return { scryfallOrder: 'rarity' as const, scryfallDir: 'desc' as const };
      default:
        return { scryfallOrder: 'edhrec' as const, scryfallDir: 'asc' as const };
    }
  }, [sortOrder]);

  // Multi-group color section definitions for browsing mode
  const COLOR_SECTION_CONFIGS = useMemo(() => [
    { id: 'white', name: 'White Spells', shortLabel: 'White', pip: 'W', query: 'c=w -t:land' },
    { id: 'blue', name: 'Blue Spells', shortLabel: 'Blue', pip: 'U', query: 'c=u -t:land' },
    { id: 'black', name: 'Black Spells', shortLabel: 'Black', pip: 'B', query: 'c=b -t:land' },
    { id: 'red', name: 'Red Spells', shortLabel: 'Red', pip: 'R', query: 'c=r -t:land' },
    { id: 'green', name: 'Green Spells', shortLabel: 'Green', pip: 'G', query: 'c=g -t:land' },
    { id: 'multicolor', name: 'Multicolor Spells', shortLabel: 'Multi', pip: '★', query: 'c:m -t:land' },
    { id: 'colorless', name: 'Colorless Artifacts & Spells', shortLabel: 'Colorless', pip: '◇', query: 'c:c -t:land' },
    { id: 'lands', name: 'Lands & Utility Mana', shortLabel: 'Lands', pip: '🏔️', query: 't:land' }
  ], []);

  interface ColorSectionData {
    cards: Card[];
    totalAvailable: number;
    page: number;
    hasMore: boolean;
    isLoadingMore?: boolean;
  }

  const [sectionDataMap, setSectionDataMap] = useState<Record<string, ColorSectionData>>({});
  const [isMultiGroupMode, setIsMultiGroupMode] = useState<boolean>(true);

  // Main search query execution (resets page to 1)
  useEffect(() => {
    setIsLoading(true);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const delay = cleanedSearchQuery ? 320 : 60;

    searchTimeoutRef.current = setTimeout(async () => {
      const isBrowsingAllColors = !cleanedSearchQuery && selectedColors.length === 0;
      setIsMultiGroupMode(isBrowsingAllColors);

      if (isBrowsingAllColors) {
        // High-density library browsing: Fetch 175 cards for each of the 8 color sections in parallel
        try {
          const results = await Promise.all(
            COLOR_SECTION_CONFIGS.map(sec =>
              searchArenaCards({
                query: sec.query,
                format: selectedFormat,
                cmcValues: selectedCmcs.length > 0 ? selectedCmcs : undefined,
                types: selectedTypes.length > 0 ? selectedTypes : undefined,
                rarities: selectedRarities.length > 0 ? selectedRarities : undefined,
                sets: selectedSets.length > 0 ? selectedSets : undefined,
                digitalOnly,
                isLegendary,
                order: scryfallOrder,
                dir: scryfallDir,
                page: 1
              })
            )
          );

          const newMap: Record<string, ColorSectionData> = {};
          const combinedCards: Card[] = [];
          let grandTotal = 0;

          COLOR_SECTION_CONFIGS.forEach((sec, idx) => {
            const res = results[idx];
            newMap[sec.id] = {
              cards: res.cards,
              totalAvailable: res.totalCards,
              page: 1,
              hasMore: res.hasMore,
              isLoadingMore: false
            };
            combinedCards.push(...res.cards);
            grandTotal += res.totalCards;
          });

          setSectionDataMap(newMap);
          setCards(combinedCards);
          setTotalCount(grandTotal);
          setHasMore(false);
        } catch (err) {
          console.error('Error fetching cards in multi-group mode:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Targeted filter / search mode: Fetch matching cards and group them
        try {
          const result = await searchArenaCards({
            query: buildSmartSearchQuery(cleanedSearchQuery),
            format: selectedFormat,
            colors: selectedColors.length > 0 ? selectedColors : undefined,
            colorMode: colorMatchMode === 'selected' ? undefined : colorMatchMode,
            cmcValues: selectedCmcs.length > 0 ? selectedCmcs : undefined,
            types: selectedTypes.length > 0 ? selectedTypes : undefined,
            rarities: selectedRarities.length > 0 ? selectedRarities : undefined,
            sets: selectedSets.length > 0 ? selectedSets : undefined,
            digitalOnly,
            isLegendary,
            order: scryfallOrder,
            dir: scryfallDir,
            page: 1
          });

          setCards(result.cards);
          setTotalCount(result.totalCards);
          setHasMore(result.hasMore);
        } catch (err) {
          console.error('Error fetching cards in library:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }, delay);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [
    cleanedSearchQuery, 
    selectedFormat, 
    selectedColors, 
    colorMatchMode,
    selectedCmcs, 
    selectedTypes, 
    selectedRarities, 
    selectedSets, 
    digitalOnly, 
    isLegendary, 
    scryfallOrder, 
    scryfallDir,
    COLOR_SECTION_CONFIGS
  ]);

  // Load more cards for a specific color section
  const handleLoadMoreSection = async (sectionId: string) => {
    const secConfig = COLOR_SECTION_CONFIGS.find(s => s.id === sectionId);
    const current = sectionDataMap[sectionId];
    if (!secConfig || !current || !current.hasMore || current.isLoadingMore) return;

    setSectionDataMap(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], isLoadingMore: true }
    }));

    const nextPage = current.page + 1;
    try {
      const result = await searchArenaCards({
        query: secConfig.query,
        format: selectedFormat,
        cmcValues: selectedCmcs.length > 0 ? selectedCmcs : undefined,
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        rarities: selectedRarities.length > 0 ? selectedRarities : undefined,
        sets: selectedSets.length > 0 ? selectedSets : undefined,
        digitalOnly,
        isLegendary,
        order: scryfallOrder,
        dir: scryfallDir,
        page: nextPage
      });

      setSectionDataMap(prev => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          cards: [...prev[sectionId].cards, ...result.cards],
          page: nextPage,
          hasMore: result.hasMore,
          isLoadingMore: false
        }
      }));

      setCards(prev => [...prev, ...result.cards]);
    } catch (err) {
      console.error(`Error loading more ${sectionId} cards:`, err);
      setSectionDataMap(prev => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], isLoadingMore: false }
      }));
    }
  };

  // Load more cards globally (used in search mode or flat mode)
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const result = await searchArenaCards({
        query: buildSmartSearchQuery(cleanedSearchQuery),
        format: selectedFormat,
        colors: selectedColors.length > 0 ? selectedColors : undefined,
        colorMode: colorMatchMode === 'selected' ? undefined : colorMatchMode,
        cmcValues: selectedCmcs.length > 0 ? selectedCmcs : undefined,
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        rarities: selectedRarities.length > 0 ? selectedRarities : undefined,
        sets: selectedSets.length > 0 ? selectedSets : undefined,
        digitalOnly,
        isLegendary,
        order: scryfallOrder,
        dir: scryfallDir,
        page: nextPage
      });

      setCards(prev => [...prev, ...result.cards]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error loading more cards:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Client-side ownership and color match filtering
  const displayedCards = useMemo(() => {
    let list = cards;

    // Apply color matching filter when in targeted search or custom color mode
    if (selectedColors.length > 0 && !isMultiGroupMode) {
      list = list.filter(card => matchesColorFilter(card, selectedColors, colorMatchMode));
    }

    if (effectiveOwnershipFilter === 'all') return list;

    return list.filter(card => {
      const count = getCardOwnedCount(card, userCollection);
      if (effectiveOwnershipFilter === 'owned') return count > 0;
      if (effectiveOwnershipFilter === 'playsets') return count >= 4;
      if (effectiveOwnershipFilter === 'incomplete') return count > 0 && count < 4;
      if (effectiveOwnershipFilter === 'unowned') return count === 0;
      return true;
    });
  }, [cards, selectedColors, colorMatchMode, isMultiGroupMode, effectiveOwnershipFilter, userCollection]);

  // Group displayed cards by Color & Lands in WUBRG order
  const colorGroups = useMemo(() => {
    const sortWithinGroup = (groupCards: Card[]) => {
      const list = [...groupCards];
      switch (sortOrder) {
        case 'cmc_asc':
          return list.sort((a, b) => (a.cmc !== b.cmc ? a.cmc - b.cmc : a.name.localeCompare(b.name)));
        case 'cmc_desc':
          return list.sort((a, b) => (a.cmc !== b.cmc ? b.cmc - a.cmc : a.name.localeCompare(b.name)));
        case 'name':
          return list.sort((a, b) => a.name.localeCompare(b.name));
        case 'rarity': {
          const rarityWeight: Record<CardRarity, number> = { mythic: 4, rare: 3, uncommon: 2, common: 1 };
          return list.sort((a, b) => {
            const diff = (rarityWeight[b.rarity] || 0) - (rarityWeight[a.rarity] || 0);
            return diff !== 0 ? diff : a.name.localeCompare(b.name);
          });
        }
        case 'color':
          return list.sort((a, b) => (a.cmc !== b.cmc ? a.cmc - b.cmc : a.name.localeCompare(b.name)));
        case 'edhrec':
        default:
          return list;
      }
    };

    return [
      {
        id: 'white',
        name: 'White Spells',
        shortLabel: 'White',
        pip: 'W',
        manaSymbol: '{W}',
        pipBg: 'bg-amber-100/15 text-amber-200 border-amber-300/40 hover:bg-amber-100/25',
        activePill: 'bg-amber-200 text-stone-950 font-black border-amber-300',
        headerBorder: 'border-amber-400/30',
        headerBg: 'from-amber-950/40 via-[#14120e] to-transparent',
        accentText: 'text-amber-200',
        totalAvailable: isMultiGroupMode && sectionDataMap['white'] ? sectionDataMap['white'].totalAvailable : undefined,
        hasMore: isMultiGroupMode && sectionDataMap['white'] ? sectionDataMap['white'].hasMore : false,
        isLoadingMore: isMultiGroupMode && sectionDataMap['white'] ? sectionDataMap['white'].isLoadingMore : false,
        cards: sortWithinGroup(displayedCards.filter(c => !c.types.includes('Land') && c.colors.length === 1 && c.colors[0] === 'W'))
      },
      {
        id: 'blue',
        name: 'Blue Spells',
        shortLabel: 'Blue',
        pip: 'U',
        manaSymbol: '{U}',
        pipBg: 'bg-blue-900/30 text-blue-200 border-blue-400/40 hover:bg-blue-900/45',
        activePill: 'bg-blue-600 text-white font-black border-blue-300',
        headerBorder: 'border-blue-500/30',
        headerBg: 'from-blue-950/40 via-[#0e141a] to-transparent',
        accentText: 'text-blue-300',
        totalAvailable: isMultiGroupMode && sectionDataMap['blue'] ? sectionDataMap['blue'].totalAvailable : undefined,
        hasMore: isMultiGroupMode && sectionDataMap['blue'] ? sectionDataMap['blue'].hasMore : false,
        isLoadingMore: isMultiGroupMode && sectionDataMap['blue'] ? sectionDataMap['blue'].isLoadingMore : false,
        cards: sortWithinGroup(displayedCards.filter(c => !c.types.includes('Land') && c.colors.length === 1 && c.colors[0] === 'U'))
      },
      {
        id: 'black',
        name: 'Black Spells',
        shortLabel: 'Black',
        pip: 'B',
        manaSymbol: '{B}',
        pipBg: 'bg-stone-900/70 text-purple-200 border-purple-500/30 hover:bg-stone-900',
        activePill: 'bg-purple-900 text-stone-100 font-black border-purple-400',
        headerBorder: 'border-purple-500/30',
        headerBg: 'from-purple-950/40 via-[#130f18] to-transparent',
        accentText: 'text-purple-300',
        totalAvailable: isMultiGroupMode && sectionDataMap['black'] ? sectionDataMap['black'].totalAvailable : undefined,
        hasMore: isMultiGroupMode && sectionDataMap['black'] ? sectionDataMap['black'].hasMore : false,
        isLoadingMore: isMultiGroupMode && sectionDataMap['black'] ? sectionDataMap['black'].isLoadingMore : false,
        cards: sortWithinGroup(displayedCards.filter(c => !c.types.includes('Land') && c.colors.length === 1 && c.colors[0] === 'B'))
      },
      {
        id: 'red',
        name: 'Red Spells',
        shortLabel: 'Red',
        pip: 'R',
        manaSymbol: '{R}',
        pipBg: 'bg-red-950/40 text-red-200 border-red-500/40 hover:bg-red-950/60',
        activePill: 'bg-red-600 text-white font-black border-red-300',
        headerBorder: 'border-red-500/30',
        headerBg: 'from-red-950/40 via-[#190f0f] to-transparent',
        accentText: 'text-red-300',
        totalAvailable: isMultiGroupMode && sectionDataMap['red'] ? sectionDataMap['red'].totalAvailable : undefined,
        hasMore: isMultiGroupMode && sectionDataMap['red'] ? sectionDataMap['red'].hasMore : false,
        isLoadingMore: isMultiGroupMode && sectionDataMap['red'] ? sectionDataMap['red'].isLoadingMore : false,
        cards: sortWithinGroup(displayedCards.filter(c => !c.types.includes('Land') && c.colors.length === 1 && c.colors[0] === 'R'))
      },
      {
        id: 'green',
        name: 'Green Spells',
        shortLabel: 'Green',
        pip: 'G',
        manaSymbol: '{G}',
        pipBg: 'bg-emerald-950/40 text-emerald-200 border-emerald-500/40 hover:bg-emerald-950/60',
        activePill: 'bg-emerald-600 text-white font-black border-emerald-300',
        headerBorder: 'border-emerald-500/30',
        headerBg: 'from-emerald-950/40 via-[#0c1611] to-transparent',
        accentText: 'text-emerald-300',
        totalAvailable: isMultiGroupMode && sectionDataMap['green'] ? sectionDataMap['green'].totalAvailable : undefined,
        hasMore: isMultiGroupMode && sectionDataMap['green'] ? sectionDataMap['green'].hasMore : false,
        isLoadingMore: isMultiGroupMode && sectionDataMap['green'] ? sectionDataMap['green'].isLoadingMore : false,
        cards: sortWithinGroup(displayedCards.filter(c => !c.types.includes('Land') && c.colors.length === 1 && c.colors[0] === 'G'))
      },
      {
        id: 'multicolor',
        name: 'Multicolor Spells',
        shortLabel: 'Multi',
        pip: '★',
        pipBg: 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 text-amber-200 border-amber-400/30 hover:opacity-90',
        activePill: 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 text-white font-black border-amber-300',
        headerBorder: 'border-amber-500/30',
        headerBg: 'from-amber-950/30 via-rose-950/20 to-transparent',
        accentText: 'text-amber-300',
        totalAvailable: isMultiGroupMode && sectionDataMap['multicolor'] ? sectionDataMap['multicolor'].totalAvailable : undefined,
        hasMore: isMultiGroupMode && sectionDataMap['multicolor'] ? sectionDataMap['multicolor'].hasMore : false,
        isLoadingMore: isMultiGroupMode && sectionDataMap['multicolor'] ? sectionDataMap['multicolor'].isLoadingMore : false,
        cards: sortWithinGroup(displayedCards.filter(c => !c.types.includes('Land') && c.colors.length > 1))
      },
      {
        id: 'colorless',
        name: 'Colorless Artifacts & Spells',
        shortLabel: 'Colorless',
        pip: '◇',
        manaSymbol: '{C}',
        pipBg: 'bg-slate-800/50 text-slate-200 border-slate-500/40 hover:bg-slate-800/70',
        activePill: 'bg-slate-700 text-white font-black border-slate-400',
        headerBorder: 'border-slate-500/30',
        headerBg: 'from-slate-900/50 via-[#10141a] to-transparent',
        accentText: 'text-slate-300',
        totalAvailable: isMultiGroupMode && sectionDataMap['colorless'] ? sectionDataMap['colorless'].totalAvailable : undefined,
        hasMore: isMultiGroupMode && sectionDataMap['colorless'] ? sectionDataMap['colorless'].hasMore : false,
        isLoadingMore: isMultiGroupMode && sectionDataMap['colorless'] ? sectionDataMap['colorless'].isLoadingMore : false,
        cards: sortWithinGroup(displayedCards.filter(c => !c.types.includes('Land') && c.colors.length === 0))
      },
      {
        id: 'lands',
        name: 'Lands & Utility Mana',
        shortLabel: 'Lands',
        pip: '🏔️',
        pipBg: 'bg-stone-800/70 text-stone-200 border-stone-600/40 hover:bg-stone-800/90',
        activePill: 'bg-stone-700 text-stone-100 font-black border-stone-400',
        headerBorder: 'border-stone-600/30',
        headerBg: 'from-stone-900/60 via-[#141414] to-transparent',
        accentText: 'text-stone-300',
        totalAvailable: isMultiGroupMode && sectionDataMap['lands'] ? sectionDataMap['lands'].totalAvailable : undefined,
        hasMore: isMultiGroupMode && sectionDataMap['lands'] ? sectionDataMap['lands'].hasMore : false,
        isLoadingMore: isMultiGroupMode && sectionDataMap['lands'] ? sectionDataMap['lands'].isLoadingMore : false,
        cards: sortWithinGroup(displayedCards.filter(c => c.types.includes('Land')))
      }
    ];
  }, [displayedCards, sortOrder, isMultiGroupMode, sectionDataMap]);

  const activeColorGroups = useMemo(() => {
    return colorGroups.filter(g => g.cards.length > 0);
  }, [colorGroups]);

  const toggleCollapse = (id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToSection = (id: string) => {
    if (collapsedSections[id]) {
      setCollapsedSections(prev => ({ ...prev, [id]: false }));
    }
    setTimeout(() => {
      const el = document.getElementById(`section-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Card Tile Renderer
  const renderCardTile = (card: Card) => {
    const ownedCount = userCollection[card.arenaId] || 0;

    return (
      <div
        key={`${card.id}-${card.collectorNumber}`}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/json', JSON.stringify(card));
          e.dataTransfer.setData('text/plain', card.name);
          e.dataTransfer.effectAllowed = 'copy';
        }}
        className="card-tile group rounded-2xl overflow-hidden flex flex-col justify-between cursor-grab active:cursor-grabbing p-2 transition duration-200"
        onClick={() => onSelectCardDetail(card)}
      >
        <div className="relative overflow-hidden rounded-xl shadow border border-black/40 mb-2 bg-black">
          <CardImage
            src={card.imageUrl}
            cardName={card.name}
            alt={card.name}
            draggable={false}
            className="w-full h-auto object-cover group-hover:brightness-105 group-hover:scale-[1.02] transition duration-200 pointer-events-none"
          />
          
          {/* Mana Value (CMC) Badge */}
          <span className="absolute top-1.5 left-1.5 bg-black/85 backdrop-blur-md text-amber-300 text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md border border-white/20 shadow">
            {card.cmc} MV
          </span>

          {/* Digital / Alchemy Badge */}
          {card.isDigitalOnly && (
            <span className="absolute top-1.5 right-1.5 bg-purple-950/90 text-purple-200 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-700 shadow">
              Digital
            </span>
          )}

          {/* Interactive Ownership Pips Overlay */}
          <div className="absolute bottom-1.5 inset-x-1.5 flex justify-center z-10">
            <OwnershipPips
              card={card}
              userCollection={userCollection}
              interactive={true}
              size="sm"
              showBadge={true}
              onCountChange={(_, updated) => onUpdateCollection?.(updated)}
            />
          </div>
        </div>

        {/* Card Meta & Action Footer */}
        <div className="p-1.5 flex items-center justify-between gap-2 border-t border-white/5">
          <div className="min-w-0 flex-1">
            <span className="font-bold text-xs text-stone-100 truncate block group-hover:text-amber-300 transition">
              {card.name}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-mono">
              <span className="truncate">{card.manaCost || (card.types.includes('Land') ? 'Land' : '')}</span>
              <span className="text-stone-600">•</span>
              <span className="uppercase text-[9px] text-stone-500">{card.set}</span>
            </div>
          </div>

          <button
            onClick={e => {
              e.stopPropagation();
              onAddCardToDeck(card);
            }}
            draggable={false}
            onDragStart={(e) => e.stopPropagation()}
            className="p-1.5 btn-mythic-spark rounded-lg transition shadow-sm hover:scale-110 active:scale-95 flex-shrink-0"
            title="Add to active deck"
          >
            <Plus className="w-3.5 h-3.5 font-bold" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Hero Cockpit */}
      <div className="arena-panel rounded-3xl p-5 md:p-6 shadow-2xl space-y-4 border border-white/10 bg-[#0d1017]/95 backdrop-blur-md">
        
        {/* Top Header Row: Title, Collection Ownership Quick Toggle, and Filters Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-fantasy font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400" />
              <span>MTG Arena Card Library</span>
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Browse every card available on MTG Arena. Real-time Scryfall indexing with arena-grade filter controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Collection / Crafting State Segmented Control */}
            <div className="flex items-center bg-[#090b10] p-1 rounded-xl border border-white/10 text-xs shadow-inner">
              <button
                type="button"
                onClick={() => setOwnershipFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition select-none ${
                  effectiveOwnershipFilter === 'all'
                    ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="View all Arena cards"
              >
                All Cards
              </button>
              <button
                type="button"
                onClick={() => setOwnershipFilter('owned')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 select-none ${
                  effectiveOwnershipFilter === 'owned'
                    ? 'bg-emerald-600 text-white shadow-sm font-black'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="View cards in your collection (1+ owned)"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Collected</span>
              </button>
              <button
                type="button"
                onClick={() => setOwnershipFilter('unowned')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 select-none ${
                  effectiveOwnershipFilter === 'unowned'
                    ? 'bg-purple-600 text-white shadow-sm font-black'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="View missing cards craftable with wildcards (0 owned)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Craftable</span>
              </button>
            </div>

            {/* Active Card Count */}
            <div className="flex items-center gap-2 text-xs text-stone-300 bg-[#121622] px-3.5 py-1.5 rounded-xl border border-white/5 shadow-inner font-bold">
              {isLoading ? (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Querying Arena...
                </span>
              ) : (
                <span>
                  {effectiveOwnershipFilter !== 'all' ? `${displayedCards.length} / ` : ''}
                  {totalCount} cards found
                </span>
              )}
            </div>

            {/* Arena Filter Modal Button */}
            <button
              onClick={() => setIsAdvancedOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm border ${
                activeFiltersCount > 0
                  ? 'btn-mythic-spark border-amber-400/50 text-white'
                  : 'bg-[#161c28] text-stone-300 border-white/10 hover:border-amber-400/40 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar + Sort Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search card name, rules text, or Arena syntax (e.g. t:creature, s:otj, r:rare, cmc=3, q=0)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#090b10] border border-white/10 rounded-xl pl-11 pr-10 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition shadow-inner font-medium"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-200 transition"
                title="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto bg-[#090b10] border border-white/10 rounded-xl px-3 py-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-stone-400 font-bold whitespace-nowrap">Sort:</span>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              className="bg-transparent text-stone-200 font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="edhrec" className="bg-[#121622] text-stone-200">Popularity / EDHREC</option>
              <option value="color" className="bg-[#121622] text-stone-200">Color (WUBRG)</option>
              <option value="cmc_asc" className="bg-[#121622] text-stone-200">Mana Cost: Low → High</option>
              <option value="cmc_desc" className="bg-[#121622] text-stone-200">Mana Cost: High → Low</option>
              <option value="name" className="bg-[#121622] text-stone-200">Card Name (A-Z)</option>
              <option value="rarity" className="bg-[#121622] text-stone-200">Rarity: Mythic → Common</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Strip: Formats, Mana Colors, Mana Value Pips */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Format Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-fantasy font-bold text-stone-400 uppercase mr-1">Format:</span>
              {(['brawl', 'standard', 'timeless', 'historic', 'explorer', 'alchemy'] as FormatType[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-3 py-1 rounded-xl font-bold capitalize transition ${
                    selectedFormat === fmt
                      ? 'btn-mythic-spark shadow-sm'
                      : 'bg-[#121622] text-stone-400 hover:text-stone-200 border border-white/5 hover:bg-[#171c28]'
                  }`}
                >
                  {fmt === 'explorer' ? 'Pioneer' : fmt}
                </button>
              ))}
            </div>

        {/* Glowing Mana Runes Filter Bar */}
        <ManaRuneFilterBar
          selectedColors={selectedColors}
          onToggleColor={toggleColor}
          onClearColors={() => setSelectedColors([])}
          colorMode={colorMatchMode === 'exact' ? 'exact' : 'include'}
          onChangeColorMode={(mode) => setColorMatchMode(mode === 'include' ? 'selected' : mode as ColorMatchMode)}
          label="Mana Filter"
          className="w-full"
        />

            {/* Mana Value (CMC) Pips: 0 1 2 3 4 5 6 7+ */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-fantasy font-bold text-stone-400 uppercase mr-1">
                Mana Value:
              </span>
              <div className="flex items-center gap-1 bg-[#090b10] p-1 rounded-xl border border-white/10">
                {CMC_PIPS.map(cmc => {
                  const isSelected = selectedCmcs.includes(cmc);
                  return (
                    <button
                      key={cmc}
                      onClick={() => toggleCmc(cmc)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-black transition flex items-center justify-center ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 shadow-md font-bold ring-2 ring-amber-400 scale-105'
                          : 'text-stone-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title={`Mana value: ${cmc}`}
                    >
                      {cmc}
                    </button>
                  );
                })}
              </div>

              {selectedCmcs.length > 0 && (
                <button
                  onClick={() => setSelectedCmcs([])}
                  className="text-[11px] text-stone-400 hover:text-amber-400 ml-1.5 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Reset All */}
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold transition ml-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* --- Authentic MTG Arena Filter Modal --- */}
        {isAdvancedOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setIsAdvancedOpen(false)}
          >
            <div 
              className="bg-[#0c1018] border border-amber-500/40 rounded-3xl p-5 sm:p-7 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 text-stone-200 custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-fantasy font-black text-lg text-white uppercase tracking-wider">
                      MTG Arena Filter Controls
                    </h3>
                    <p className="text-xs text-stone-400">
                      Fine-tune search results using authentic Arena color matching, rarities, sets, and card types.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAdvancedOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition"
                  title="Close filter modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Section 1: Colors & Match Mode */}
              <div className="bg-[#121622] p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-fantasy font-black uppercase text-amber-400 tracking-wider">
                    Colors & Matching Rules
                  </span>
                  
                  {/* Arena Color Match Modes */}
                  <div className="flex items-center gap-1 bg-[#090b10] p-1 rounded-xl border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => setColorMatchMode('selected')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        colorMatchMode === 'selected'
                          ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                          : 'text-stone-400 hover:text-white'
                      }`}
                      title="Cards with only selected colors (MTG Arena default)"
                    >
                      Match Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorMatchMode('any')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        colorMatchMode === 'any'
                          ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                          : 'text-stone-400 hover:text-white'
                      }`}
                      title="Cards containing any of the selected colors"
                    >
                      Match Any
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorMatchMode('multi_only')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        colorMatchMode === 'multi_only'
                          ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                          : 'text-stone-400 hover:text-white'
                      }`}
                      title="Cards with 2 or more colors"
                    >
                      Multicolor Only
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {MANA_COLORS.map(c => {
                    const isSelected = selectedColors.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleColor(c.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition border ${
                          isSelected
                            ? `${c.activeRing} scale-110 opacity-100 ring-offset-2 ring-offset-[#121622]`
                            : `border-white/10 ${c.hoverRing} opacity-60 hover:opacity-100 hover:scale-105 bg-[#090b10]`
                        }`}
                        title={c.name}
                      >
                        {c.manaSymbol ? (
                          <ManaCost manaCost={c.manaSymbol} size="md" />
                        ) : (
                          <span className="text-amber-400 font-black text-base">★</span>
                        )}
                      </button>
                    );
                  })}
                  {selectedColors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedColors([])}
                      className="text-xs text-stone-400 hover:text-amber-400 ml-2 font-semibold"
                    >
                      Clear colors
                    </button>
                  )}
                </div>
              </div>

              {/* Grid: Card Types, Rarities, Collection & Rules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Column 1: Card Types */}
                <div className="bg-[#121622] p-4 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-fantasy font-black uppercase text-amber-400 tracking-wider">
                      Card Types
                    </span>
                    {selectedTypes.length > 0 && (
                      <button
                        onClick={() => setSelectedTypes([])}
                        className="text-[10px] text-stone-400 hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CARD_TYPES.map(t => {
                      const isSelected = selectedTypes.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => toggleType(t)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left flex items-center justify-between border transition ${
                            isSelected
                              ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-sm'
                              : 'bg-[#090b10] text-stone-400 border-white/5 hover:border-white/20 hover:text-stone-200'
                          }`}
                        >
                          <span>{t}</span>
                          {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Rarity */}
                <div className="bg-[#121622] p-4 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-fantasy font-black uppercase text-amber-400 tracking-wider">
                      Rarity
                    </span>
                    {selectedRarities.length > 0 && (
                      <button
                        onClick={() => setSelectedRarities([])}
                        className="text-[10px] text-stone-400 hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {CARD_RARITIES.map(r => {
                      const isSelected = selectedRarities.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          onClick={() => toggleRarity(r.id)}
                          className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold text-left flex items-center justify-between border transition ${
                            isSelected
                              ? `${r.activeBg} font-black ring-1 ring-white/30`
                              : `bg-[#090b10] ${r.color} border-white/5 hover:border-white/20`
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-current opacity-90 shadow-sm" />
                            <span>{r.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Collection Status & Special */}
                <div className="bg-[#121622] p-4 rounded-2xl border border-white/5 space-y-3">
                  <span className="text-xs font-fantasy font-black uppercase text-amber-400 tracking-wider block">
                    Collection & Rules
                  </span>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'all', label: 'All Cards' },
                        { id: 'owned', label: 'Collected (1+)' },
                        { id: 'playsets', label: 'Playsets (4x)' },
                        { id: 'unowned', label: 'Craftable (0x)' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setOwnershipFilter(opt.id as OwnershipStatus)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold text-center transition ${
                            effectiveOwnershipFilter === opt.id
                              ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                              : 'bg-[#090b10] text-stone-400 hover:text-stone-200 border border-white/5'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <button
                        onClick={() => setIsLegendary(prev => !prev)}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between border transition ${
                          isLegendary
                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/60'
                            : 'bg-[#090b10] text-stone-400 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>Legendary Only</span>
                        </div>
                        {isLegendary && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>

                      <button
                        onClick={() => setDigitalOnly(prev => !prev)}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between border transition ${
                          digitalOnly
                            ? 'bg-purple-950/60 text-purple-200 border-purple-500/60'
                            : 'bg-[#090b10] text-stone-400 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>Digital Only / Alchemy</span>
                        </div>
                        {digitalOnly && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Arena Sets / Expansions */}
              <div className="bg-[#121622] p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-fantasy font-black uppercase text-amber-400 tracking-wider">
                      Arena Sets & Expansions
                    </span>
                    <span className="text-[11px] text-stone-400">
                      ({selectedSets.length ? `${selectedSets.length} selected` : 'All Sets'})
                    </span>
                  </div>

                  {selectedSets.length > 0 && (
                    <button
                      onClick={() => setSelectedSets([])}
                      className="text-xs text-stone-400 hover:text-amber-400 font-semibold"
                    >
                      Clear Sets
                    </button>
                  )}
                </div>

                {/* Categories & Search */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 text-[11px] w-full sm:w-auto">
                    {(['all', 'standard', 'eternal', 'remastered', 'alchemy'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSetSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg capitalize font-bold whitespace-nowrap transition ${
                          setSelectedCategory === cat
                            ? 'bg-amber-400 text-stone-950 font-black'
                            : 'bg-[#090b10] text-stone-400 hover:text-stone-200 border border-white/5'
                        }`}
                      >
                        {cat === 'eternal' ? 'Historic / Eternal' : cat}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Find set (e.g. MH3, Bloomburrow, OTJ)..."
                    value={setSearchQuery}
                    onChange={e => setSetSearchQuery(e.target.value)}
                    className="w-full sm:flex-1 bg-[#090b10] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Scrollable Set Grid */}
                <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 pr-1 custom-scrollbar">
                  {filteredSets.map(s => {
                    const isSelected = selectedSets.includes(s.code);
                    return (
                      <button
                        key={s.code}
                        onClick={() => toggleSet(s.code)}
                        className={`px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition border ${
                          isSelected
                            ? 'bg-amber-500/25 text-amber-200 border-amber-500/60 font-bold'
                            : 'bg-[#090b10] text-stone-400 border-white/5 hover:text-stone-200 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="font-mono text-[10px] px-1 rounded bg-white/10 text-stone-300 flex-shrink-0 font-bold">
                            {s.code}
                          </span>
                          <span className="truncate text-[11px]">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1.5">
                          <span className="text-[10px] font-mono text-stone-500">
                            {s.releaseYear}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs text-stone-400">
                  {activeFiltersCount} active filter criteria applied.
                </span>

                <div className="flex items-center gap-3">
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-amber-400 transition"
                    >
                      Reset All
                    </button>
                  )}
                  <button
                    onClick={() => setIsAdvancedOpen(false)}
                    className="btn-mythic-spark px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg"
                  >
                    Apply & Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- Active Filters Tag Strip --- */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10 text-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase mr-1">Active:</span>

            {/* Colors */}
            {selectedColors.map(c => {
              const colorDef = MANA_COLORS.find(col => col.id === c);
              return (
                <span
                  key={c}
                  className="bg-stone-800/80 border border-white/10 text-amber-300 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5"
                >
                  {colorDef?.manaSymbol ? (
                    <ManaCost manaCost={colorDef.manaSymbol} size="sm" />
                  ) : c === 'M' ? (
                    <span className="text-amber-400">★</span>
                  ) : null}
                  <span>{colorDef?.name || c}</span>
                  <button onClick={() => toggleColor(c)} className="hover:text-white ml-0.5" title={`Remove ${colorDef?.name || c} filter`}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {/* CMCs */}
            {selectedCmcs.map(cmc => (
              <span
                key={cmc}
                className="bg-stone-800/80 border border-white/10 text-amber-300 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
              >
                <span>CMC: {cmc}</span>
                <button onClick={() => toggleCmc(cmc)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Types */}
            {selectedTypes.map(t => (
              <span
                key={t}
                className="bg-stone-800/80 border border-white/10 text-sky-300 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
              >
                <span>{t}</span>
                <button onClick={() => toggleType(t)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Rarities */}
            {selectedRarities.map(r => (
              <span
                key={r}
                className="bg-stone-800/80 border border-white/10 text-orange-300 px-2 py-0.5 rounded-lg text-[11px] font-bold capitalize flex items-center gap-1"
              >
                <span>{r}</span>
                <button onClick={() => toggleRarity(r)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Sets */}
            {selectedSets.map(s => (
              <span
                key={s}
                className="bg-stone-800/80 border border-white/10 text-amber-300 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 font-mono"
              >
                <span>Set: {s}</span>
                <button onClick={() => toggleSet(s)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Color Match Mode */}
            {colorMatchMode !== 'selected' && (
              <span className="bg-stone-800/80 border border-white/10 text-amber-300 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <span>Mode: {colorMatchMode === 'any' ? 'Match Any' : 'Multicolor Only'}</span>
                <button onClick={() => setColorMatchMode('selected')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Ownership */}
            {effectiveOwnershipFilter !== 'all' && (
              <span className="bg-stone-800/80 border border-white/10 text-emerald-300 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 capitalize">
                <span>{effectiveOwnershipFilter === 'unowned' ? 'Craftable (0x)' : effectiveOwnershipFilter === 'owned' ? 'Collected (1+)' : effectiveOwnershipFilter}</span>
                <button onClick={() => { setOwnershipFilter('all'); setSearchTerm(prev => prev.replace(/\b(q=[0-4]|q:[0-4]|q>[0-3]|q>=[1-4]|\?craftable)\b/gi, '').trim()); }} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Legendary */}
            {isLegendary && (
              <span className="bg-stone-800/80 border border-white/10 text-amber-300 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <span>Legendary</span>
                <button onClick={() => setIsLegendary(false)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Digital Only */}
            {digitalOnly && (
              <span className="bg-stone-800/80 border border-white/10 text-purple-300 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <span>Digital / Alchemy</span>
                <button onClick={() => setDigitalOnly(false)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-[11px] text-stone-400 hover:text-amber-400 underline font-semibold ml-1"
            >
              Clear all
            </button>
          </div>
        )}

      </div>

      {/* --- Sticky Quick-Jump Navigation Ribbon --- */}
      {displayedCards.length > 0 && (
        <div className="sticky top-2 z-20 bg-[#090b10]/95 backdrop-blur-md p-2 md:p-2.5 rounded-2xl border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-2">
          {/* Quick Jump Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
            <span className="text-[10px] font-fantasy font-bold text-stone-400 uppercase mr-1 px-1 flex-shrink-0 hidden lg:inline">
              Jump to:
            </span>
            {activeColorGroups.map(group => (
              <button
                key={group.id}
                onClick={() => scrollToSection(group.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition hover:scale-105 active:scale-95 shadow-sm whitespace-nowrap flex-shrink-0 ${group.pipBg}`}
                title={`Jump to ${group.name} (${group.cards.length} cards)`}
              >
                {group.manaSymbol ? (
                  <ManaCost manaCost={group.manaSymbol} size="sm" />
                ) : (
                  <span className="font-mono">{group.pip}</span>
                )}
                <span className="hidden sm:inline">{group.shortLabel}</span>
                <span className="text-[10px] font-mono opacity-80 bg-black/40 px-1 rounded">
                  {group.cards.length}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Switcher: By Color vs Flat List */}
          <div className="flex items-center gap-1 bg-[#121622] p-1 rounded-xl border border-white/5 flex-shrink-0">
            <button
              onClick={() => setIsGroupedByColor(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                isGroupedByColor
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="Organize cards by Color & Lands"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>By Color</span>
            </button>
            <button
              onClick={() => setIsGroupedByColor(false)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                !isGroupedByColor
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="View single flat card grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Flat</span>
            </button>
          </div>
        </div>
      )}

      {/* --- Card Visual Area --- */}
      <div className="min-h-[460px]">
        {isLoading && cards.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="font-semibold text-stone-300">Searching MTG Arena Library...</p>
            <p className="text-xs text-stone-500">Organizing cards by color and mana value</p>
          </div>
        ) : displayedCards.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-2">
            <p className="font-semibold text-stone-300 text-base">No cards matched your filter query</p>
            <p className="text-xs text-stone-500 max-w-sm">
              Try removing some filter restrictions (such as specific sets, rarities, or exact CMC values).
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="mt-3 px-4 py-1.5 btn-mythic-spark rounded-xl text-xs font-bold text-white shadow-sm"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {isGroupedByColor ? (
              <div className="space-y-8">
                {activeColorGroups.map(group => {
                  const isCollapsed = collapsedSections[group.id];

                  return (
                    <section
                      key={group.id}
                      id={`section-${group.id}`}
                      className={`scroll-mt-20 rounded-3xl border transition-all duration-200 shadow-xl overflow-hidden bg-[#0a0d14]/80 backdrop-blur-sm ${group.headerBorder}`}
                    >
                      {/* Section Header */}
                      <div
                        onClick={() => toggleCollapse(group.id)}
                        className={`p-4 md:px-5 md:py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-gradient-to-r ${group.headerBg} hover:brightness-110 transition border-b border-white/5`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-inner border ${group.pipBg}`}>
                            {group.manaSymbol ? (
                              <ManaCost manaCost={group.manaSymbol} size="md" />
                            ) : (
                              group.pip
                            )}
                          </div>
                          <div className="flex items-center gap-2.5">
                            <h3 className={`font-fantasy font-black text-base md:text-lg tracking-wide uppercase ${group.accentText}`}>
                              {group.name}
                            </h3>
                            <span className="text-xs font-mono font-bold text-stone-300 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10 shadow-inner">
                              {group.totalAvailable ? `Showing ${group.cards.length} of ${group.totalAvailable.toLocaleString()} cards` : `${group.cards.length} ${group.cards.length === 1 ? 'card' : 'cards'}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-stone-400">
                          <span className="hidden sm:inline">{isCollapsed ? 'Expand' : 'Collapse'}</span>
                          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                          </div>
                        </div>
                      </div>

                      {/* Section Cards Grid */}
                      {!isCollapsed && (
                        <div className="p-4 md:p-5">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {group.cards.map(renderCardTile)}
                          </div>

                          {/* Load More Button for this specific color section */}
                          {isMultiGroupMode && group.hasMore && (
                            <div className="flex justify-center pt-5 pb-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoadMoreSection(group.id);
                                }}
                                disabled={group.isLoadingMore}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#141a29] hover:bg-[#1c2438] text-stone-200 hover:text-white border border-white/10 hover:border-amber-400/40 transition shadow-md flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                {group.isLoadingMore ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                    <span>Loading next 175 {group.shortLabel} cards...</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Load More {group.shortLabel} Spells (+175 cards)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              /* Flat View Fallback */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {displayedCards.map(renderCardTile)}
              </div>
            )}

            {/* Pagination / Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold btn-mythic-spark shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading Next 175 Cards...</span>
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      <span>Load More Cards (Page {page + 1})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default CardLibraryView;
