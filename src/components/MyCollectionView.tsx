import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, CardRarity, CardTypeCategory, FormatType } from '../types/card';
import { UserCollection, WildcardInventory } from '../types/collection';
import { searchArenaCards, getAllCachedCards } from '../services/scryfallService';
import { matchesColorFilter } from '../utils/colorFilter';
import { CardImage } from './CardImage';
import { ManaCost } from './ManaCost';
import { 
  Sparkles, 
  Search, 
  UploadCloud, 
  CheckCircle2, 
  Layers, 
  Plus, 
  Filter, 
  X, 
  ShieldCheck, 
  PackageCheck,
  Loader2,
  ChevronDown,
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';

interface MyCollectionViewProps {
  userCollection: UserCollection;
  wildcardInventory: WildcardInventory;
  onSelectCardDetail: (card: Card) => void;
  onAddCardToDeck: (card: Card) => void;
  onOpenSync: () => void;
}

type SortOrder = 'owned_desc' | 'name_asc' | 'cmc_asc' | 'cmc_desc' | 'rarity_desc';

const MANA_COLORS = [
  { id: 'W', name: 'White', manaSymbol: '{W}', ring: 'ring-amber-300 border-amber-300/80 bg-amber-50' },
  { id: 'U', name: 'Blue', manaSymbol: '{U}', ring: 'ring-blue-400 border-blue-400/80 bg-blue-50' },
  { id: 'B', name: 'Black', manaSymbol: '{B}', ring: 'ring-stone-400 border-stone-500/80 bg-stone-100' },
  { id: 'R', name: 'Red', manaSymbol: '{R}', ring: 'ring-red-400 border-red-400/80 bg-red-50' },
  { id: 'G', name: 'Green', manaSymbol: '{G}', ring: 'ring-emerald-400 border-emerald-400/80 bg-emerald-50' },
  { id: 'C', name: 'Colorless', label: 'Colorless', ring: 'ring-slate-400 border-slate-500 bg-slate-700 text-white' },
  { id: 'M', name: 'Multicolor', label: 'Multi', ring: 'ring-amber-500 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 text-white' }
];

const RARITY_WEIGHT: Record<string, number> = {
  mythic: 4,
  rare: 3,
  uncommon: 2,
  common: 1
};

export const MyCollectionView: React.FC<MyCollectionViewProps> = ({
  userCollection,
  wildcardInventory,
  onSelectCardDetail,
  onAddCardToDeck,
  onOpenSync
}) => {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<'all_owned' | 'playsets' | 'incomplete' | 'unowned'>('all_owned');
  const [selectedFormat, setSelectedFormat] = useState<FormatType | 'all'>('all');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<CardRarity | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('owned_desc');

  const toggleColor = (colorId: string) => {
    setSelectedColors(prev =>
      prev.includes(colorId) ? prev.filter(c => c !== colorId) : [...prev, colorId]
    );
  };

  // API & Data state
  const [scryfallCards, setScryfallCards] = useState<Card[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute collection statistics directly from the user's full collection
  const stats = useMemo(() => {
    let totalUniqueOwned = 0;
    let totalCardsOwned = 0;
    let playsetCount = 0;
    let incompleteCount = 0;

    for (const [_, countVal] of Object.entries(userCollection)) {
      const count = Number(countVal) || 0;
      if (count > 0) {
        totalUniqueOwned++;
        totalCardsOwned += count;
        if (count >= 4) {
          playsetCount++;
        } else {
          incompleteCount++;
        }
      }
    }

    return {
      totalUniqueOwned,
      totalCardsOwned,
      playsetCount,
      incompleteCount
    };
  }, [userCollection]);

  // Load cards from Scryfall based on search term, format, color, rarity
  const fetchCards = useCallback(async (targetPage: number = 1, append: boolean = false) => {
    if (targetPage === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const res = await searchArenaCards({
        query: searchTerm.trim() || undefined,
        format: selectedFormat === 'all' ? undefined : selectedFormat,
        colors: selectedColors.length > 0 ? selectedColors : undefined,
        rarity: selectedRarity || undefined,
        page: targetPage,
        order: sortOrder === 'name_asc' ? 'name' : sortOrder.startsWith('cmc') ? 'cmc' : 'edhrec',
        dir: sortOrder === 'cmc_desc' ? 'desc' : 'asc'
      });

      if (append) {
        setScryfallCards(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const uniqueNew = (res.cards || []).filter(c => !existingIds.has(c.id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setScryfallCards(res.cards || []);
      }

      setHasMore(res.hasMore);
      setPage(targetPage);
    } catch (err) {
      console.warn('Failed to fetch cards from Scryfall in MyCollectionView:', err);
      if (!append) {
        setScryfallCards([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchTerm, selectedFormat, selectedColors, selectedRarity, sortOrder]);

  // Trigger debounced search when filters change
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchCards(1, false);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fetchCards]);

  // Handle Load More
  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      fetchCards(page + 1, true);
    }
  };

  // Merge Scryfall cards with all cached cards so owned cards are always visible
  const combinedCards = useMemo(() => {
    const cached = getAllCachedCards();
    const map = new Map<string, Card>();

    // 1. Add cached cards first
    for (const c of cached) {
      map.set(c.id, c);
    }

    // 2. Overlay Scryfall cards (newer / full metadata)
    for (const c of scryfallCards) {
      map.set(c.id, c);
    }

    return Array.from(map.values());
  }, [scryfallCards]);

  // Filter cards by ownership, format, color, rarity, and search text
  const filteredCards = useMemo(() => {
    return combinedCards.filter(card => {
      const owned = userCollection[card.arenaId] || 0;

      // Ownership filter
      if (ownershipFilter === 'all_owned' && owned === 0) return false;
      if (ownershipFilter === 'playsets' && owned < 4) return false;
      if (ownershipFilter === 'incomplete' && (owned === 0 || owned >= 4)) return false;
      if (ownershipFilter === 'unowned' && owned > 0) return false;

      // Format filter
      if (selectedFormat !== 'all') {
        if (!card.legalities || !card.legalities[selectedFormat]) return false;
      }

      // Color filter
      if (!matchesColorFilter(card, selectedColors)) return false;

      // Rarity filter
      if (selectedRarity && card.rarity !== selectedRarity) return false;

      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!card.name.toLowerCase().includes(q) && !(card.oracleText || '').toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const ownedA = userCollection[a.arenaId] || 0;
      const ownedB = userCollection[b.arenaId] || 0;

      if (sortOrder === 'owned_desc') {
        if (ownedB !== ownedA) return ownedB - ownedA;
        return a.name.localeCompare(b.name);
      }
      if (sortOrder === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortOrder === 'cmc_asc') {
        return a.cmc - b.cmc;
      }
      if (sortOrder === 'cmc_desc') {
        return b.cmc - a.cmc;
      }
      if (sortOrder === 'rarity_desc') {
        const rA = RARITY_WEIGHT[a.rarity] || 0;
        const rB = RARITY_WEIGHT[b.rarity] || 0;
        return rB - rA;
      }
      return 0;
    });
  }, [combinedCards, userCollection, ownershipFilter, selectedFormat, selectedColors, selectedRarity, searchTerm, sortOrder]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedColors([]);
    setSelectedRarity(null);
    setSelectedFormat('all');
    setOwnershipFilter('all_owned');
    setSortOrder('owned_desc');
  };

  const hasActiveFilters = Boolean(searchTerm || selectedColors.length > 0 || selectedRarity || selectedFormat !== 'all' || ownershipFilter !== 'all_owned');

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="sanctum-panel rounded-3xl p-6 shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="font-fantasy font-black text-xl text-stone-900 flex items-center gap-2">
                <span>My MTG Arena Collection</span>
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Browse all cards in your personal collection, track playsets, and inspect Arena ownership across the entire MTG Arena database.
            </p>
          </div>

          <button
            onClick={onOpenSync}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm border border-amber-300/60 transition self-start md:self-auto hover:scale-102"
          >
            <UploadCloud className="w-4 h-4 text-slate-950" />
            <span>Sync Arena Account</span>
          </button>
        </div>

        {/* Collection Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#faf6ed] border border-[#e8dfc8] rounded-2xl p-3.5 shadow-sm">
            <span className="text-[10px] font-fantasy font-bold text-stone-500 uppercase tracking-wider block">
              Unique Cards Owned
            </span>
            <div className="text-xl font-fantasy font-black text-stone-900 mt-0.5">
              {stats.totalUniqueOwned.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#faf6ed] border border-[#e8dfc8] rounded-2xl p-3.5 shadow-sm">
            <span className="text-[10px] font-fantasy font-bold text-stone-500 uppercase tracking-wider block">
              Total Cards in Vault
            </span>
            <div className="text-xl font-fantasy font-black text-amber-800 mt-0.5">
              {stats.totalCardsOwned.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#faf6ed] border border-[#e8dfc8] rounded-2xl p-3.5 shadow-sm">
            <span className="text-[10px] font-fantasy font-bold text-stone-500 uppercase tracking-wider block">
              Full Playsets (4x)
            </span>
            <div className="text-xl font-fantasy font-black text-emerald-800 mt-0.5">
              {stats.playsetCount.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#faf6ed] border border-[#e8dfc8] rounded-2xl p-3.5 shadow-sm">
            <span className="text-[10px] font-fantasy font-bold text-stone-500 uppercase tracking-wider block">
              Wildcards Available
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs font-bold">
              <span className="text-amber-800" title="Rare">{wildcardInventory.rare}R</span>
              <span className="text-orange-700" title="Mythic">{wildcardInventory.mythic}M</span>
              <span className="text-stone-600" title="Uncommon">{wildcardInventory.uncommon}U</span>
              <span className="text-stone-500" title="Common">{wildcardInventory.common}C</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by card name, oracle text, or creature type in your collection..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#e5d8b8] rounded-xl pl-11 pr-10 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition shadow-inner"
          />
          <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ownership Status & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e5d8b8] text-xs">
          {/* Ownership Filter Pills */}
          <div className="flex items-center bg-[#ede7d8] p-1 rounded-full border border-[#dfd4be] shadow-inner gap-1 flex-wrap">
            {[
              { id: 'all_owned', label: `Owned (${stats.totalUniqueOwned.toLocaleString()})` },
              { id: 'playsets', label: `Playsets 4x (${stats.playsetCount.toLocaleString()})` },
              { id: 'incomplete', label: `Incomplete (${stats.incompleteCount.toLocaleString()})` },
              { id: 'unowned', label: `Unowned (0x)` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setOwnershipFilter(tab.id as any)}
                className={`px-3 py-1 rounded-full font-bold transition text-xs ${
                  ownershipFilter === tab.id
                    ? 'bg-white text-stone-900 shadow-sm border border-amber-500/40'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Color Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-fantasy font-bold text-stone-600 uppercase mr-1">Colors:</span>
            {MANA_COLORS.map(c => {
              const isSelected = selectedColors.includes(c.id);

              if (c.manaSymbol && !c.label) {
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleColor(c.id)}
                    title={`Filter by ${c.name} (${c.id})`}
                    aria-label={c.name}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 select-none border ${
                      isSelected
                        ? `ring-2 ${c.ring} scale-110 opacity-100 ring-offset-1 ring-offset-white shadow-md`
                        : `border-[#e5d8b8] opacity-65 hover:opacity-100 hover:scale-105 bg-white`
                    }`}
                  >
                    <ManaCost manaCost={c.manaSymbol} size="md" />
                  </button>
                );
              }

              if (c.id === 'C') {
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleColor(c.id)}
                    title="Filter by Colorless"
                    aria-label="Colorless"
                    className={`h-7 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-150 border select-none ${
                      isSelected
                        ? `ring-2 ${c.ring} scale-105 ring-offset-1 ring-offset-white shadow-md`
                        : `border-[#e5d8b8] bg-white text-stone-700 hover:scale-105`
                    }`}
                  >
                    <ManaCost manaCost="{C}" size="sm" />
                    <span>{c.label}</span>
                  </button>
                );
              }

              // Multicolor (Gold Symbol button)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleColor(c.id)}
                  title="Filter by Multicolor"
                  aria-label="Multicolor"
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 select-none border ${
                    isSelected
                      ? `ring-2 ${c.ring} scale-110 opacity-100 ring-offset-1 ring-offset-white shadow-md`
                      : `border-[#e5d8b8] opacity-65 hover:opacity-100 hover:scale-105 bg-white`
                  }`}
                >
                  <span className="text-amber-500 font-black text-sm drop-shadow-sm select-none">★</span>
                </button>
              );
            })}
            {selectedColors.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedColors([])}
                className="p-1 text-stone-400 hover:text-stone-600 ml-0.5 rounded-lg hover:bg-black/5 transition"
                title="Clear color filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Row: Format, Rarity, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e5d8b8] text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Format Selector */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-[#e5d8b8]">
              <span className="text-[10px] uppercase font-bold text-stone-400">Format:</span>
              <select
                value={selectedFormat}
                onChange={e => setSelectedFormat(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Formats</option>
                <option value="brawl">Brawl</option>
                <option value="standard">Standard</option>
                <option value="historic">Historic</option>
                <option value="timeless">Timeless</option>
                <option value="explorer">Explorer</option>
              </select>
            </div>

            {/* Rarity Selector */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-[#e5d8b8]">
              <span className="text-[10px] uppercase font-bold text-stone-400">Rarity:</span>
              <select
                value={selectedRarity || ''}
                onChange={e => setSelectedRarity(e.target.value ? (e.target.value as CardRarity) : null)}
                className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer capitalize"
              >
                <option value="">All Rarities</option>
                <option value="mythic">Mythic</option>
                <option value="rare">Rare</option>
                <option value="uncommon">Uncommon</option>
                <option value="common">Common</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-[#e5d8b8]">
              <ArrowUpDown className="w-3 h-3 text-stone-400" />
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as SortOrder)}
                className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="owned_desc">Most Owned First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="cmc_asc">Mana Value (Low to High)</option>
                <option value="cmc_desc">Mana Value (High to Low)</option>
                <option value="rarity_desc">Rarity (Mythic First)</option>
              </select>
            </div>
          </div>

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-stone-500 hover:text-amber-800 transition font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-fantasy font-bold text-stone-600 flex items-center gap-2">
          <span>Showing {filteredCards.length.toLocaleString()} cards</span>
          {isLoading && (
            <div className="flex items-center gap-1 text-amber-700 font-sans">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Searching Arena catalog...</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Grid with Ownership Pips */}
      <div className="min-h-[460px]">
        {filteredCards.length === 0 && !isLoading ? (
          <div className="sanctum-panel rounded-3xl p-12 text-center text-stone-500 space-y-3">
            <PackageCheck className="w-12 h-12 mx-auto text-stone-400" />
            <h3 className="font-fantasy font-bold text-stone-800 text-base">
              {stats.totalUniqueOwned === 0 && ownershipFilter === 'all_owned'
                ? 'Your Arena Collection is Empty'
                : 'No cards found matching these filters'}
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              {stats.totalUniqueOwned === 0 && ownershipFilter === 'all_owned' ? (
                <>
                  Click <strong>Sync Arena Account</strong> to import your cards from MTG Arena Player.log, or switch to the <strong>Unowned</strong> tab to browse all cards in the game.
                </>
              ) : (
                <>
                  Try clearing your search terms or adjusting the format/color filters to find more cards.
                </>
              )}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={onOpenSync}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-sm"
              >
                Sync Arena Account
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredCards.map(card => {
                const ownedCount = userCollection[card.arenaId] || 0;
                const isPlayset = ownedCount >= 4;

                return (
                  <div
                    key={card.id}
                    className="card-item group rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer p-2.5 relative transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                    onClick={() => onSelectCardDetail(card)}
                  >
                    <div className="relative overflow-hidden rounded-xl shadow border border-black/30 mb-2 bg-black aspect-[5/7]">
                      <CardImage
                        src={card.imageUrl}
                        cardName={card.name}
                        alt={card.name}
                        className="w-full h-full object-cover group-hover:brightness-105 transition"
                      />

                      {/* Ownership badge overlay */}
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-10">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-md border ${
                          isPlayset
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : ownedCount > 0
                            ? 'bg-amber-500 text-slate-950 border-amber-300'
                            : 'bg-stone-900/90 text-stone-400 border-stone-700'
                        }`}>
                          {ownedCount}/4 {isPlayset ? 'Playset' : ownedCount > 0 ? 'Owned' : 'Unowned'}
                        </span>
                      </div>

                      {/* 4 Ownership Pips */}
                      <div className="absolute bottom-1.5 left-0 right-0 flex justify-center items-center gap-1.5 px-2 py-0.5 bg-black/75 backdrop-blur-sm mx-3 rounded-full z-10 border border-white/10">
                        {[1, 2, 3, 4].map(pip => (
                          <div
                            key={pip}
                            className={`w-2 h-2 rounded-full transition ${
                              ownedCount >= pip
                                ? 'bg-amber-400 ring-1 ring-amber-200 shadow-sm shadow-amber-400'
                                : 'bg-stone-700/80'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Card Title & Add Action */}
                    <div className="p-1 flex items-center justify-between gap-2 border-t border-[#e8dfc8]">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-stone-900 truncate block group-hover:text-amber-800" title={card.name}>
                          {card.name}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-stone-500 font-mono capitalize">
                          <span>{card.rarity}</span>
                          {card.manaCost && (
                            <span className="ml-auto">
                              <ManaCost manaCost={card.manaCost} size="sm" />
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onAddCardToDeck(card);
                        }}
                        className="p-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-200 text-slate-950 rounded-lg transition shadow-sm border border-amber-300/60 shrink-0"
                        title="Add to active deck"
                      >
                        <Plus className="w-3.5 h-3.5 font-bold" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#ede7d8] hover:bg-[#dfd4be] text-stone-800 font-bold text-xs rounded-xl border border-[#dfd4be] transition shadow-sm disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                      <span>Loading more cards...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 text-stone-600" />
                      <span>Load More Cards</span>
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

export default MyCollectionView;
