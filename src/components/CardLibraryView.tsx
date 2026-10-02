import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardRarity, CardTypeCategory, FormatType } from '../types/card';
import { UserCollection } from '../types/collection';
import { searchArenaCards, buildSmartSearchQuery } from '../services/scryfallService';
import { ARENA_SETS, ArenaSet } from '../data/arenaSets';
import { CardImage } from './CardImage';
import { ManaCost } from './ManaCost';
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
  LayoutGrid
} from 'lucide-react';

interface CardLibraryViewProps {
  onSelectCardDetail: (card: Card) => void;
  onAddCardToDeck: (card: Card) => void;
  userCollection?: UserCollection;
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
    label: 'Colorless',
    activeRing: 'ring-2 ring-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.5)] border-slate-400 bg-slate-800 text-slate-100',
    hoverRing: 'hover:border-slate-400/50 bg-[#121622] text-slate-300'
  },
  {
    id: 'M',
    name: 'Multicolor',
    label: 'Multi',
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
  initialFormat = 'brawl'
}) => {
  // --- Filter State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<FormatType>(initialFormat);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
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

  // Compute active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedColors.length > 0) count++;
    if (selectedCmcs.length > 0) count++;
    if (selectedTypes.length > 0) count += selectedTypes.length;
    if (selectedRarities.length > 0) count += selectedRarities.length;
    if (selectedSets.length > 0) count += selectedSets.length;
    if (digitalOnly) count++;
    if (isLegendary) count++;
    if (ownershipFilter !== 'all') count++;
    return count;
  }, [selectedColors, selectedCmcs, selectedTypes, selectedRarities, selectedSets, digitalOnly, isLegendary, ownershipFilter]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedColors([]);
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

  // Main search query execution (resets page to 1)
  useEffect(() => {
    setIsLoading(true);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const delay = searchTerm.trim() ? 320 : 60;

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await searchArenaCards({
          query: buildSmartSearchQuery(searchTerm),
          format: selectedFormat,
          colors: selectedColors.length > 0 ? selectedColors : undefined,
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
    }, delay);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [
    searchTerm, 
    selectedFormat, 
    selectedColors, 
    selectedCmcs, 
    selectedTypes, 
    selectedRarities, 
    selectedSets, 
    digitalOnly, 
    isLegendary, 
    scryfallOrder, 
    scryfallDir
  ]);

  // Load more cards (pagination)
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const result = await searchArenaCards({
        query: buildSmartSearchQuery(searchTerm),
        format: selectedFormat,
        colors: selectedColors.length > 0 ? selectedColors : undefined,
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

  // Client-side ownership filtering
  const displayedCards = useMemo(() => {
    if (ownershipFilter === 'all') return cards;

    return cards.filter(card => {
      const count = userCollection[card.arenaId] || 0;
      if (ownershipFilter === 'owned') return count > 0;
      if (ownershipFilter === 'playsets') return count >= 4;
      if (ownershipFilter === 'incomplete') return count > 0 && count < 4;
      if (ownershipFilter === 'unowned') return count === 0;
      return true;
    });
  }, [cards, ownershipFilter, userCollection]);

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
        cards: sortWithinGroup(displayedCards.filter(c => c.types.includes('Land')))
      }
    ];
  }, [displayedCards, sortOrder]);

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

          {/* Collection Ownership Pip Badge */}
          {ownedCount > 0 && (
            <div className="absolute bottom-1.5 left-1.5 bg-black/85 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/40 shadow flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{ownedCount >= 4 ? '4x (Playset)' : `${ownedCount}x`}</span>
            </div>
          )}
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
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-fantasy font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400" />
              <span>MTG Arena Card Library</span>
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Browse every card available on MTG Arena. Real-time Scryfall indexing with arena-grade filter controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Card Count */}
            <div className="flex items-center gap-2 text-xs text-stone-300 bg-[#121622] px-3.5 py-1.5 rounded-xl border border-white/5 shadow-inner font-bold">
              {isLoading ? (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Querying Arena...
                </span>
              ) : (
                <span>
                  {ownershipFilter !== 'all' ? `${displayedCards.length} / ` : ''}
                  {totalCount} cards found
                </span>
              )}
            </div>

            {/* Advanced Filters Button */}
            <button
              onClick={() => setIsAdvancedOpen(prev => !prev)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm border ${
                isAdvancedOpen || activeFiltersCount > 0
                  ? 'btn-mythic-spark border-amber-400/50 text-white'
                  : 'bg-[#161c28] text-stone-300 border-white/10 hover:border-amber-400/40 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar + Sort Order */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search card name, rules text, or type across MTG Arena..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#090b10] border border-white/10 rounded-xl pl-11 pr-10 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition shadow-inner font-medium"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-200 transition"
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
          
          {/* Row 1: Formats & Mana Colors */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
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

            {/* Mana Colors (Multi-Selectable) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-fantasy font-bold text-stone-400 uppercase mr-1">Colors:</span>
              {MANA_COLORS.map(c => {
                const isSelected = selectedColors.includes(c.id);

                if (c.manaSymbol && !c.label) {
                  // Single color pips (White Sun, Blue Water Drop, Black Skull, Red Fireball, Green Tree)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleColor(c.id)}
                      title={`Filter by ${c.name} (${c.id})`}
                      aria-label={c.name}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 select-none border ${
                        isSelected
                          ? `${c.activeRing} scale-110 opacity-100 ring-offset-1 ring-offset-[#090b10]`
                          : `border-white/10 ${c.hoverRing} opacity-60 hover:opacity-100 hover:scale-105 bg-[#121622]`
                      }`}
                    >
                      <ManaCost manaCost={c.manaSymbol} size="md" />
                    </button>
                  );
                }

                if (c.id === 'C') {
                  // Colorless with {C} Eldrazi mana pip
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleColor(c.id)}
                      title="Filter by Colorless"
                      aria-label="Colorless"
                      className={`h-7 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-150 border select-none ${
                        isSelected
                          ? `${c.activeRing} scale-105 ring-offset-1 ring-offset-[#090b10]`
                          : `border-white/10 ${c.hoverRing} hover:scale-105 text-stone-300`
                      }`}
                    >
                      <ManaCost manaCost="{C}" size="sm" />
                      <span>{c.label}</span>
                    </button>
                  );
                }

                // Multicolor
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleColor(c.id)}
                    title="Filter by Multicolor"
                    aria-label="Multicolor"
                    className={`h-7 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-150 border select-none ${
                      isSelected
                        ? `${c.activeRing} scale-105 ring-offset-1 ring-offset-[#090b10]`
                        : `border-white/10 ${c.hoverRing} hover:scale-105 text-stone-300`
                    }`}
                  >
                    <span className="text-amber-400 font-bold text-xs">★</span>
                    <span>{c.label}</span>
                  </button>
                );
              })}
              {selectedColors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedColors([])}
                  className="p-1 text-stone-400 hover:text-stone-200 ml-0.5 rounded-lg hover:bg-white/5 transition"
                  title="Clear color filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Mana Cost (CMC) Pips: 0 1 2 3 4 5 6 7+ */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-fantasy font-bold text-stone-400 uppercase mr-1">
                Mana Cost:
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
                      title={`Mana cost: ${cmc}`}
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
                  Clear CMCs
                </button>
              )}
            </div>

            {/* Quick Reset All */}
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* --- Advanced Filters Expandable Drawer --- */}
        {isAdvancedOpen && (
          <div className="pt-4 border-t border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#090b10]/90 p-4 rounded-2xl border border-white/5">
              
              {/* Column 1: Card Types */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-fantasy font-black uppercase text-amber-400 tracking-wider">
                    Card Types
                  </span>
                  {selectedTypes.length > 0 && (
                    <button
                      onClick={() => setSelectedTypes([])}
                      className="text-[10px] text-stone-400 hover:text-stone-200"
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
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                            : 'bg-[#121622] text-stone-400 border-white/5 hover:border-white/20 hover:text-stone-200'
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-fantasy font-black uppercase text-amber-400 tracking-wider">
                    Rarity
                  </span>
                  {selectedRarities.length > 0 && (
                    <button
                      onClick={() => setSelectedRarities([])}
                      className="text-[10px] text-stone-400 hover:text-stone-200"
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
                            : `bg-[#121622] ${r.color} border-white/5 hover:border-white/20`
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                          <span>{r.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 3: Collection Ownership & Attributes */}
              <div className="space-y-2">
                <span className="text-xs font-fantasy font-black uppercase text-amber-400 tracking-wider block">
                  Collection & Rules
                </span>
                <div className="space-y-1.5 text-xs">
                  {/* Ownership status */}
                  <div className="bg-[#121622] p-2 rounded-xl border border-white/5 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Ownership Status
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: 'all', label: 'All Cards' },
                        { id: 'owned', label: 'Owned (1+)' },
                        { id: 'playsets', label: 'Playsets (4x)' },
                        { id: 'unowned', label: 'Missing (0x)' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setOwnershipFilter(opt.id as OwnershipStatus)}
                          className={`px-2 py-1 rounded text-[11px] font-bold text-center transition ${
                            ownershipFilter === opt.id
                              ? 'bg-amber-500 text-stone-950 font-black'
                              : 'bg-black/30 text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special toggles */}
                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => setIsLegendary(prev => !prev)}
                      className={`w-full px-3 py-1.5 rounded-lg font-bold flex items-center justify-between border transition ${
                        isLegendary
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-[#121622] text-stone-400 border-white/5 hover:border-white/20'
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
                      className={`w-full px-3 py-1.5 rounded-lg font-bold flex items-center justify-between border transition ${
                        digitalOnly
                          ? 'bg-purple-950/60 text-purple-200 border-purple-500/50'
                          : 'bg-[#121622] text-stone-400 border-white/5 hover:border-white/20'
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

              {/* Column 4: Arena Sets / Expansions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-fantasy font-black uppercase text-amber-400 tracking-wider">
                    Arena Sets ({selectedSets.length ? `${selectedSets.length} selected` : 'All'})
                  </span>
                  {selectedSets.length > 0 && (
                    <button
                      onClick={() => setSelectedSets([])}
                      className="text-[10px] text-stone-400 hover:text-stone-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Set Category Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[10px]">
                  {(['all', 'standard', 'eternal', 'remastered', 'alchemy'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSetSelectedCategory(cat)}
                      className={`px-2 py-0.5 rounded capitalize font-bold whitespace-nowrap transition ${
                        setSelectedCategory === cat
                          ? 'bg-amber-400 text-stone-950'
                          : 'bg-[#121622] text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Set Search Input */}
                <input
                  type="text"
                  placeholder="Find set (e.g. MH3, Bloomburrow)..."
                  value={setSearchQuery}
                  onChange={e => setSetSearchQuery(e.target.value)}
                  className="w-full bg-[#121622] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />

                {/* Scrollable Set Badges List */}
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {filteredSets.map(s => {
                    const isSelected = selectedSets.includes(s.code);
                    return (
                      <button
                        key={s.code}
                        onClick={() => toggleSet(s.code)}
                        className={`w-full px-2 py-1 rounded text-left flex items-center justify-between text-xs transition border ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 font-bold'
                            : 'bg-black/20 text-stone-400 border-transparent hover:text-stone-200 hover:bg-black/40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="font-mono text-[10px] px-1 rounded bg-white/10 text-stone-300 flex-shrink-0">
                            {s.code}
                          </span>
                          <span className="truncate text-[11px]">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1.5">
                          <span className="text-[10px] font-mono font-medium text-stone-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                            {s.releaseYear}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Done Button Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone-400">
                {activeFiltersCount} active filter criteria applied.
              </span>
              <button
                onClick={() => setIsAdvancedOpen(false)}
                className="btn-mythic-spark px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm"
              >
                Close Filters
              </button>
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

            {/* Ownership */}
            {ownershipFilter !== 'all' && (
              <span className="bg-stone-800/80 border border-white/10 text-emerald-300 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 capitalize">
                <span>{ownershipFilter}</span>
                <button onClick={() => setOwnershipFilter('all')} className="hover:text-white">
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
                              {group.cards.length} {group.cards.length === 1 ? 'card' : 'cards'}
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
