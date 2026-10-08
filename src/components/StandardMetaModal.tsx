import React, { useState, useEffect, useMemo } from 'react';
import { Deck, DeckCard } from '../types/deck';
import { Card, ManaColor } from '../types/card';
import { UserCollection, WildcardInventory } from '../types/collection';
import { STANDARD_META_DECKS, StandardMetaDeckMeta } from '../data/standardMetaDecks';
import { parseArenaFormatAsync, ParsedDeckResult } from '../utils/arenaParser';
import { calculateDeckWildcards } from '../utils/wildcardCalculator';
import { getCardOwnedCount } from '../services/ownershipService';
import { CardImage } from './CardImage';
import { 
  getLatestStandardSetSync, 
  refreshLatestStandardSetAsync, 
  analyzeDeckLatestSet, 
  StandardSetInfo 
} from '../utils/metaSetAnalysis';
import { 
  X, 
  Flame, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Search, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  Swords,
  Mountain,
  Shield,
  Info,
  UploadCloud
} from 'lucide-react';

interface StandardMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDeck: (deck: Deck) => void;
  userCollection: UserCollection;
  wildcardInventory?: WildcardInventory;
  onOpenSync?: () => void;
}

type CraftFilter = 'all' | 'ready_to_play' | 'craftable_now' | 'tier1' | 'latest_set';
type ArchetypeFilter = 'all' | 'Aggro' | 'Midrange' | 'Control' | 'Ramp';

// Card type categorization helper for Untapped-style ribbons
function categorizeCards(cards: DeckCard[]) {
  const creatures: DeckCard[] = [];
  const spells: DeckCard[] = [];
  const permanents: DeckCard[] = [];
  const planeswalkers: DeckCard[] = [];
  const lands: DeckCard[] = [];

  for (const item of cards) {
    const types = item.card.types || [];
    if (types.includes('Creature')) {
      creatures.push(item);
    } else if (types.includes('Planeswalker')) {
      planeswalkers.push(item);
    } else if (types.includes('Land')) {
      lands.push(item);
    } else if (types.includes('Instant') || types.includes('Sorcery')) {
      spells.push(item);
    } else {
      permanents.push(item);
    }
  }

  return { creatures, spells, permanents, planeswalkers, lands };
}

export const StandardMetaModal: React.FC<StandardMetaModalProps> = ({
  isOpen,
  onClose,
  onLoadDeck,
  userCollection,
  wildcardInventory = { common: 0, uncommon: 0, rare: 0, mythic: 0 },
  onOpenSync
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [craftFilter, setCraftFilter] = useState<CraftFilter>('all');
  const [archetypeFilter, setArchetypeFilter] = useState<ArchetypeFilter>('all');
  const [parsedDecks, setParsedDecks] = useState<Record<string, ParsedDeckResult>>({});
  const [loadingDecks, setLoadingDecks] = useState<Record<string, boolean>>({});
  const [copiedDeckId, setCopiedDeckId] = useState<string | null>(null);
  const [showSideboardDeckIds, setShowSideboardDeckIds] = useState<Record<string, boolean>>({});
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Dynamic Latest Set Detection
  const [latestSet, setLatestSet] = useState<StandardSetInfo>(() => getLatestStandardSetSync());

  // Hovered Card Tooltip Preview
  const [hoveredCardDetail, setHoveredCardDetail] = useState<{
    card: Card;
    needed: number;
    owned: number;
    x: number;
    y: number;
  } | null>(null);

  // Dynamically refresh latest standard set from Scryfall asynchronously
  useEffect(() => {
    if (!isOpen) return;
    refreshLatestStandardSetAsync().then(set => {
      if (set && set.code !== latestSet.code) {
        setLatestSet(set);
      }
    });
  }, [isOpen]);

  // Parse decks asynchronously as modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    STANDARD_META_DECKS.forEach(meta => {
      if (parsedDecks[meta.id] || loadingDecks[meta.id]) return;

      setLoadingDecks(prev => ({ ...prev, [meta.id]: true }));
      parseArenaFormatAsync(meta.arenaExportText).then(result => {
        if (!isCancelled) {
          setParsedDecks(prev => ({ ...prev, [meta.id]: result }));
          setLoadingDecks(prev => ({ ...prev, [meta.id]: false }));
        }
      }).catch(err => {
        console.error(`Failed to parse meta deck ${meta.name}:`, err);
        if (!isCancelled) {
          setLoadingDecks(prev => ({ ...prev, [meta.id]: false }));
        }
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Mathematical Ownership and Wildcard Cost Calculations
  const deckCalculations = useMemo(() => {
    const map: Record<string, {
      totalCards: number;
      ownedCount: number;
      ownershipPct: number;
      wcCost: ReturnType<typeof calculateDeckWildcards>;
      isReady: boolean;
      canCraft: boolean;
      setBreakdown: ReturnType<typeof analyzeDeckLatestSet>;
    }> = {};

    STANDARD_META_DECKS.forEach(meta => {
      const parsed = parsedDecks[meta.id];
      const setBreakdown = analyzeDeckLatestSet(meta.arenaExportText, meta.keyCards, latestSet);

      if (!parsed) {
        map[meta.id] = {
          totalCards: 75,
          ownedCount: 0,
          ownershipPct: 0,
          wcCost: calculateDeckWildcards([], [], undefined, userCollection, wildcardInventory),
          isReady: false,
          canCraft: false,
          setBreakdown
        };
        return;
      }

      const allCards = [...parsed.mainboard, ...parsed.sideboard];
      const totalCards = allCards.reduce((acc, c) => acc + c.quantity, 0);

      const wcCost = calculateDeckWildcards(
        parsed.mainboard,
        parsed.sideboard,
        undefined,
        userCollection,
        wildcardInventory
      );

      const ownedCount = Math.max(0, totalCards - wcCost.totalCardsMissing);
      const ownershipPct = totalCards > 0 ? Math.round((ownedCount / totalCards) * 100) : 100;
      const isReady = wcCost.totalCardsMissing === 0;
      const canCraft = wcCost.canCraftWithAvailableWildcards && !isReady;

      map[meta.id] = {
        totalCards,
        ownedCount,
        ownershipPct,
        wcCost,
        isReady,
        canCraft,
        setBreakdown
      };
    });

    return map;
  }, [parsedDecks, userCollection, wildcardInventory, latestSet]);

  // Check if user has an active collection populated
  const hasCollectionCards = useMemo(() => {
    return Object.keys(userCollection).length > 0;
  }, [userCollection]);

  // Filtered Decks List
  const filteredMetaDecks = useMemo(() => {
    return STANDARD_META_DECKS.filter(deck => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = deck.name.toLowerCase().includes(q);
        const cardMatch = deck.keyCards.some(k => k.toLowerCase().includes(q));
        const descMatch = deck.description.toLowerCase().includes(q);
        if (!nameMatch && !cardMatch && !descMatch) return false;
      }

      // Archetype Filter
      if (archetypeFilter !== 'all' && deck.archetype !== archetypeFilter) {
        return false;
      }

      // Craftability, Tier & Latest Set Filter
      const calc = deckCalculations[deck.id];
      if (craftFilter === 'tier1' && deck.tier !== 'Tier 1') return false;
      if (craftFilter === 'ready_to_play' && (!calc || !calc.isReady)) return false;
      if (craftFilter === 'craftable_now' && (!calc || (!calc.canCraft && !calc.isReady))) return false;
      if (craftFilter === 'latest_set' && (!calc || !calc.setBreakdown.isLatestSetDeck)) return false;

      return true;
    });
  }, [searchQuery, archetypeFilter, craftFilter, deckCalculations]);

  if (!isOpen) return null;

  // 1-Click Direct MTGA Copy
  const handleCopyExport = (meta: StandardMetaDeckMeta) => {
    navigator.clipboard.writeText(meta.arenaExportText);
    setCopiedDeckId(meta.id);
    setCopyToast(`Copied "${meta.name}" to clipboard! In MTG Arena, open Decks and click Import.`);
    setTimeout(() => {
      setCopiedDeckId(null);
      setCopyToast(null);
    }, 3500);
  };

  // 1-Click Load into Workspace
  const handleLoad = (meta: StandardMetaDeckMeta) => {
    const parsed = parsedDecks[meta.id];
    if (!parsed) return;

    const deckToLoad: Deck = {
      id: `std-meta-${meta.id}-${Date.now()}`,
      name: meta.name,
      format: 'standard',
      mainboard: parsed.mainboard,
      sideboard: parsed.sideboard,
      description: meta.description,
      tags: [meta.tier, meta.archetype, 'Meta', latestSet.code],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onLoadDeck(deckToLoad);
    onClose();
  };

  const toggleSideboard = (deckId: string) => {
    setShowSideboardDeckIds(prev => ({ ...prev, [deckId]: !prev[deckId] }));
  };

  // Color dot renderer
  const renderColorDots = (colors: ManaColor[]) => {
    const colorStyles: Record<ManaColor, string> = {
      W: 'bg-[#f8f6d8] text-stone-900 border-amber-300',
      U: 'bg-[#0e68ab] text-white border-blue-400',
      B: 'bg-[#150b00] text-stone-300 border-stone-600',
      R: 'bg-[#d3202a] text-white border-rose-400',
      G: 'bg-[#00733e] text-white border-emerald-400',
      C: 'bg-stone-700 text-stone-200 border-stone-500'
    };

    return (
      <div className="flex items-center -space-x-1">
        {colors.map(c => (
          <div
            key={c}
            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-black uppercase shadow-sm ${colorStyles[c]}`}
            title={`Color ${c}`}
          >
            {c}
          </div>
        ))}
      </div>
    );
  };

  // Miniature card thumbnail item (Untapped.gg Visual Ribbon Style)
  const renderCardThumbnail = (item: DeckCard) => {
    const isBasicLand = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest'].includes(item.card.name);
    const owned = isBasicLand ? item.quantity : getCardOwnedCount(item.card, userCollection);
    const needed = item.quantity;
    const missing = Math.max(0, needed - owned);

    return (
      <div
        key={`${item.card.id}-${item.card.name}`}
        className="relative group flex-shrink-0 cursor-pointer"
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHoveredCardDetail({
            card: item.card,
            needed,
            owned,
            x: rect.right + 10,
            y: rect.top
          });
        }}
        onMouseLeave={() => setHoveredCardDetail(null)}
      >
        {/* Card Thumbnail Image */}
        <div className="w-[42px] h-[54px] rounded-md overflow-hidden bg-[#121620] border border-stone-800 group-hover:border-amber-400 group-hover:shadow-md transition-all relative">
          <CardImage
            src={item.card.imageUrl}
            cardName={item.card.name}
            alt={item.card.name}
            artCrop={true}
            className="w-full h-full object-cover object-center"
          />

          {/* Owned Count (bottom left badge) */}
          <div className="absolute bottom-0.5 left-0.5 bg-black/85 backdrop-blur-sm text-white font-mono text-[10px] font-bold px-1 py-0.1 rounded leading-none border border-white/10 shadow">
            {owned}x
          </div>

          {/* Missing Wildcards Badge (Untapped red badge with ▲) */}
          {missing > 0 && !isBasicLand && (
            <div 
              className="absolute bottom-0.5 right-0.5 bg-rose-950/95 text-rose-300 border border-rose-500/70 font-mono text-[9px] font-black px-1 py-0.1 rounded leading-none flex items-center gap-0.5 shadow-sm"
              title={`Missing ${missing} copies (Requires ${missing} ${item.card.rarity.toUpperCase()} Wildcards)`}
            >
              <span>{missing}</span>
              <span className="text-[7px]">▲</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="arena-panel rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col max-h-[94vh] border border-[#c5a059]/30">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#c5a059]/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/30 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-fantasy font-black text-lg sm:text-xl text-white tracking-wide">
                  Standard Meta Tier List & Craftability
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Untapped.gg Visual Ribbon Parity
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Latest Set: {latestSet.name} ({latestSet.code})</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Accurate mathematical collection & wildcard matching against tournament-winning 75-card Standard lists.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Wildcard Stash Summary */}
            <div className="hidden lg:flex items-center gap-2.5 bg-[#0e121a] px-3 py-1.5 rounded-xl border border-white/5 text-xs">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Your Stash:</span>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300" title="Rare Wildcards">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>{wildcardInventory.rare} Rare</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-orange-400" title="Mythic Wildcards">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>{wildcardInventory.mythic} Mythic</span>
              </div>
            </div>

            {onOpenSync && (
              <button
                onClick={onOpenSync}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-950/40 to-amber-950/40 hover:from-cyan-900/50 hover:to-amber-900/50 text-cyan-300 hover:text-white text-xs font-bold rounded-xl border border-cyan-500/40 hover:border-cyan-400 shadow-sm transition"
                title="Upload MTG Arena Player.log to calculate exact card ownership"
              >
                <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sync Collection</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-2 rounded-xl bg-[#141a29] hover:bg-[#1c2438] transition border border-[#c5a059]/30"
              title="Close Meta Decks Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collection Status Banner if empty */}
        {!hasCollectionCards && (
          <div className="mt-2.5 bg-blue-950/40 border border-blue-500/30 px-3.5 py-2 rounded-xl text-xs text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>
                <strong>Note on Collection Ownership:</strong> Percentages shown are mathematically accurate. Because your MTG Arena collection isn't synced yet, owned percentages (~25%–37%) reflect the unlimited basic lands provided to every player.
              </span>
            </div>
            {onOpenSync && (
              <button
                onClick={onOpenSync}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold rounded-lg text-xs transition shrink-0 shadow-md flex items-center gap-1.5 self-start sm:self-auto"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Player.log</span>
              </button>
            )}
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="py-3 space-y-2.5 border-b border-[#c5a059]/20 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <input
                type="text"
                placeholder="Search deck or card (Slickshot, Caretaker, Overlord)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d1017] border border-[#c5a059]/30 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 shadow-inner transition"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Craftability & Dynamic Latest Set Filter Tabs */}
            <div className="md:col-span-8 flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
              <button
                onClick={() => setCraftFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  craftFilter === 'all'
                    ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                    : 'bg-[#141926] text-stone-400 hover:text-stone-200 border border-white/5'
                }`}
              >
                All Meta Decks
              </button>

              {/* Dynamic Latest Set Filter Button */}
              <button
                onClick={() => setCraftFilter('latest_set')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  craftFilter === 'latest_set'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg font-black ring-1 ring-purple-300'
                    : 'bg-[#141926] text-purple-300 hover:text-white border border-purple-500/30 hover:border-purple-400'
                }`}
                title={`Show high-performing decks featuring cards from ${latestSet.name} (${latestSet.code})`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>✨ Latest Set ({latestSet.code})</span>
              </button>

              <button
                onClick={() => setCraftFilter('ready_to_play')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  craftFilter === 'ready_to_play'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[#141926] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>100% Owned</span>
              </button>

              <button
                onClick={() => setCraftFilter('craftable_now')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  craftFilter === 'craftable_now'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-[#141926] text-amber-300 hover:text-amber-200 border border-amber-500/30'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Craftable Now</span>
              </button>

              <button
                onClick={() => setCraftFilter('tier1')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  craftFilter === 'tier1'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-[#141926] text-orange-400 hover:text-orange-300 border border-orange-500/30'
                }`}
              >
                <span>⭐ Tier 1 Only</span>
              </button>
            </div>
          </div>

          {/* Playstyle Archetype Pills */}
          <div className="flex items-center gap-2 text-xs text-stone-400 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Playstyle:</span>
            {(['all', 'Aggro', 'Midrange', 'Control', 'Ramp'] as const).map(arch => (
              <button
                key={arch}
                onClick={() => setArchetypeFilter(arch)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition ${
                  archetypeFilter === arch
                    ? 'bg-[#c5a059] text-stone-950 font-bold'
                    : 'bg-[#111622] hover:bg-[#181f30] text-stone-400 border border-white/5'
                }`}
              >
                {arch === 'all' ? 'All Archetypes' : arch}
              </button>
            ))}
          </div>
        </div>

        {/* Copy Notification Toast Banner */}
        {copyToast && (
          <div className="absolute top-20 right-6 z-50 bg-[#121622] border border-sky-400 text-sky-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span className="text-xs font-bold">{copyToast}</span>
          </div>
        )}

        {/* Meta Decks List (Untapped.gg Visual Ribbon Rows) */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4">
          {filteredMetaDecks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Layers className="w-10 h-10 text-stone-600 mb-2" />
              <p className="font-fantasy font-bold text-base text-stone-300">No meta decks matched your filters</p>
              <p className="text-xs mt-1 text-stone-500">
                Try resetting your search query or selecting "All Meta Decks".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCraftFilter('all');
                  setArchetypeFilter('all');
                }}
                className="mt-3 px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredMetaDecks.map(meta => {
              const calc = deckCalculations[meta.id];
              const parsed = parsedDecks[meta.id];
              const isLoading = loadingDecks[meta.id];
              const isCopied = copiedDeckId === meta.id;
              const isSideboardOpen = !!showSideboardDeckIds[meta.id];
              const categories = parsed ? categorizeCards(parsed.mainboard) : null;
              const sideboardCount = parsed ? parsed.sideboard.reduce((a, b) => a + b.quantity, 0) : 15;

              return (
                <div
                  key={meta.id}
                  className="bg-[#0b0e14] border border-[#c5a059]/25 hover:border-[#c5a059]/50 rounded-2xl p-4 shadow-xl transition-all space-y-3 relative group"
                >
                  
                  {/* Row 1: Header (Mana + Name + Stats + Wildcards + Blue MTGA Copy Button) */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-white/5">
                    
                    {/* Left: Colors, Name, Tier, Archetype */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {renderColorDots(meta.colors)}
                      <h3 className="font-fantasy font-black text-base sm:text-lg text-white tracking-wide">
                        {meta.name}
                      </h3>

                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        meta.tier === 'Tier 1'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-stone-800 text-stone-300 border border-stone-700'
                      }`}>
                        {meta.tier}
                      </span>

                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#141926] text-stone-400 border border-white/5">
                        {meta.archetype}
                      </span>

                      {/* Latest Set Badge */}
                      {calc?.setBreakdown.isLatestSetDeck && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/50 flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>{calc.setBreakdown.latestSetCopies} {latestSet.code} Cards</span>
                        </span>
                      )}
                    </div>

                    {/* Middle-Right: Stats, Untapped Wildcard Diamond Breakdown & Actions */}
                    <div className="flex flex-wrap items-center gap-3 justify-between lg:justify-end">
                      
                      {/* Stats */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold px-2.5 py-0.5 rounded-lg bg-[#141926] text-emerald-400 border border-emerald-500/30">
                          🔥 {meta.winrate}
                        </span>
                        <span className="font-semibold px-2 py-0.5 rounded-lg bg-[#141926] text-stone-400 border border-white/5">
                          {meta.metaShare} Meta
                        </span>
                      </div>

                      {/* Untapped.gg Style Wildcard Diamond Indicators */}
                      {isLoading ? (
                        <div className="flex items-center gap-1 text-xs text-stone-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        </div>
                      ) : calc ? (
                        <div className="flex flex-col items-start lg:items-end">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                            {/* Common */}
                            <span className="flex items-center gap-0.5 text-stone-400" title="Common Wildcards">
                              <span className="text-stone-500">♦</span>
                              <span>{calc.wcCost.missing.common}</span>
                            </span>
                            {/* Uncommon */}
                            <span className="flex items-center gap-0.5 text-sky-300" title="Uncommon Wildcards">
                              <span className="text-sky-400">♦</span>
                              <span>{calc.wcCost.missing.uncommon}</span>
                            </span>
                            {/* Rare */}
                            <span className="flex items-center gap-0.5 text-amber-300" title="Rare Wildcards">
                              <span className="text-amber-400">♦</span>
                              <span>{calc.wcCost.missing.rare}</span>
                            </span>
                            {/* Mythic */}
                            <span className="flex items-center gap-0.5 text-orange-400" title="Mythic Wildcards">
                              <span className="text-orange-500">♦</span>
                              <span>{calc.wcCost.missing.mythic}</span>
                            </span>
                          </div>

                          {/* Status text */}
                          <div className="text-[10px] font-bold mt-0.5">
                            {calc.isReady ? (
                              <span className="text-emerald-400 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 100% Owned
                              </span>
                            ) : calc.canCraft ? (
                              <span className="text-amber-400 flex items-center gap-0.5">
                                <Sparkles className="w-3 h-3 text-amber-400" /> Craftable Now
                              </span>
                            ) : (
                              <span className="text-rose-400 flex items-center gap-0.5">
                                ✕ Needs {calc.wcCost.missing.rare}R {calc.wcCost.missing.mythic ? `${calc.wcCost.missing.mythic}M` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* Primary Actions: Prominent Untapped Blue "Copy to MTGA" & "Load Deck" */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyExport(meta)}
                          className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-[#1888df] hover:bg-[#1374bf] text-white transition shadow-md flex items-center gap-1.5 active:scale-95"
                          title="1-Click copy formatted decklist to clipboard for MTG Arena"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                          <span>{isCopied ? 'Copied to MTGA!' : 'Copy to MTGA'}</span>
                        </button>

                        <button
                          onClick={() => handleLoad(meta)}
                          disabled={isLoading}
                          className="btn-mythic-spark px-3.5 py-1.5 text-xs font-black rounded-xl transition shadow-md flex items-center gap-1.5 hover:scale-105 disabled:opacity-50"
                          title="Open this deck in the DieToRemoval Workspace"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Load Deck</span>
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Row 2: Untapped.gg Miniature Thumbnail Ribbon (Grouped by Category) */}
                  {isLoading ? (
                    <div className="h-20 flex items-center justify-center text-xs text-stone-500 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Loading card catalog artwork and ownership...</span>
                    </div>
                  ) : parsed && categories ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-800">
                        
                        {/* Creatures */}
                        {categories.creatures.length > 0 && (
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                              <Swords className="w-3 h-3 text-stone-400" />
                              <span>Creatures ({categories.creatures.reduce((a, b) => a + b.quantity, 0)})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {categories.creatures.map(renderCardThumbnail)}
                            </div>
                          </div>
                        )}

                        {/* Spells (Instants & Sorceries) */}
                        {categories.spells.length > 0 && (
                          <div className="flex flex-col gap-1 flex-shrink-0 border-l border-white/5 pl-3">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                              <Zap className="w-3 h-3 text-sky-400" />
                              <span>Spells ({categories.spells.reduce((a, b) => a + b.quantity, 0)})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {categories.spells.map(renderCardThumbnail)}
                            </div>
                          </div>
                        )}

                        {/* Artifacts & Enchantments */}
                        {categories.permanents.length > 0 && (
                          <div className="flex flex-col gap-1 flex-shrink-0 border-l border-white/5 pl-3">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                              <Shield className="w-3 h-3 text-amber-400" />
                              <span>Enchantments ({categories.permanents.reduce((a, b) => a + b.quantity, 0)})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {categories.permanents.map(renderCardThumbnail)}
                            </div>
                          </div>
                        )}

                        {/* Planeswalkers (if any) */}
                        {categories.planeswalkers.length > 0 && (
                          <div className="flex flex-col gap-1 flex-shrink-0 border-l border-white/5 pl-3">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span>Planeswalkers ({categories.planeswalkers.reduce((a, b) => a + b.quantity, 0)})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {categories.planeswalkers.map(renderCardThumbnail)}
                            </div>
                          </div>
                        )}

                        {/* Lands */}
                        {categories.lands.length > 0 && (
                          <div className="flex flex-col gap-1 flex-shrink-0 border-l border-white/5 pl-3">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                              <Mountain className="w-3 h-3 text-emerald-400" />
                              <span>Lands ({categories.lands.reduce((a, b) => a + b.quantity, 0)})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {categories.lands.map(renderCardThumbnail)}
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Sideboard Toggle & Ribbon */}
                      <div className="pt-1 flex items-center justify-between text-xs text-stone-400">
                        <button
                          onClick={() => toggleSideboard(meta.id)}
                          className="text-[11px] font-bold text-stone-400 hover:text-amber-300 flex items-center gap-1 transition"
                        >
                          <span>{isSideboardOpen ? 'Hide Sideboard' : `Show Sideboard (${sideboardCount} Cards)`}</span>
                          {isSideboardOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        <div className="flex items-center gap-1 text-[11px] text-stone-500">
                          <span>Key Cards:</span>
                          {meta.keyCards.map(k => (
                            <span key={k} className="px-1.5 py-0.2 rounded bg-black/40 text-stone-300 border border-white/5">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>

                      {isSideboardOpen && parsed.sideboard.length > 0 && (
                        <div className="pt-2 border-t border-white/5 bg-[#090c12]/80 p-2.5 rounded-xl border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            Sideboard Cards:
                          </span>
                          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-stone-800">
                            {parsed.sideboard.map(renderCardThumbnail)}
                          </div>
                        </div>
                      )}

                    </div>
                  ) : null}

                </div>
              );
            })
          )}
        </div>

        {/* Floating Card Hover Preview Tooltip */}
        {hoveredCardDetail && (
          <div 
            className="fixed pointer-events-none z-50 w-56 bg-[#0a0d14] rounded-2xl shadow-2xl border-2 border-amber-500/80 p-2 text-xs text-white space-y-2 animate-in fade-in duration-100"
            style={{
              top: Math.min(hoveredCardDetail.y, window.innerHeight - 340),
              left: Math.min(hoveredCardDetail.x, window.innerWidth - 240)
            }}
          >
            <div className="w-full aspect-[2.5/3.5] rounded-xl overflow-hidden bg-black border border-white/10">
              <CardImage
                src={hoveredCardDetail.card.imageUrl}
                cardName={hoveredCardDetail.card.name}
                alt={hoveredCardDetail.card.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-bold text-white text-xs truncate">{hoveredCardDetail.card.name}</p>
              <p className="text-[11px] text-stone-400 capitalize">{hoveredCardDetail.card.rarity} • {hoveredCardDetail.card.set}</p>
              <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-stone-300">Owned: <strong>{hoveredCardDetail.owned}</strong> / {hoveredCardDetail.needed}</span>
                {hoveredCardDetail.needed > hoveredCardDetail.owned ? (
                  <span className="text-rose-400 font-bold">
                    Need {hoveredCardDetail.needed - hoveredCardDetail.owned} WC
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold">Complete</span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
