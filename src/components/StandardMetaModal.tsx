import React, { useState, useEffect, useMemo } from 'react';
import { Deck, DeckCard } from '../types/deck';
import { UserCollection, WildcardInventory } from '../types/collection';
import { STANDARD_META_DECKS, StandardMetaDeckMeta } from '../data/standardMetaDecks';
import { parseArenaFormatAsync, ParsedDeckResult } from '../utils/arenaParser';
import { calculateDeckWildcards } from '../utils/wildcardCalculator';
import { OwnershipPips } from './OwnershipPips';
import { 
  X, 
  Flame, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';

interface StandardMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDeck: (deck: Deck) => void;
  userCollection: UserCollection;
  wildcardInventory?: WildcardInventory;
}

type CraftFilter = 'all' | 'ready_to_play' | 'craftable_now' | 'tier1';
type ArchetypeFilter = 'all' | 'Aggro' | 'Midrange' | 'Control' | 'Ramp';

export const StandardMetaModal: React.FC<StandardMetaModalProps> = ({
  isOpen,
  onClose,
  onLoadDeck,
  userCollection,
  wildcardInventory = { common: 0, uncommon: 0, rare: 0, mythic: 0 }
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [craftFilter, setCraftFilter] = useState<CraftFilter>('all');
  const [archetypeFilter, setArchetypeFilter] = useState<ArchetypeFilter>('all');
  const [parsedDecks, setParsedDecks] = useState<Record<string, ParsedDeckResult>>({});
  const [loadingDecks, setLoadingDecks] = useState<Record<string, boolean>>({});
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);
  const [copiedDeckId, setCopiedDeckId] = useState<string | null>(null);

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

  const deckCalculations = useMemo(() => {
    const map: Record<string, {
      totalCards: number;
      ownedCount: number;
      ownershipPct: number;
      wcCost: ReturnType<typeof calculateDeckWildcards>;
      isReady: boolean;
      canCraft: boolean;
    }> = {};

    STANDARD_META_DECKS.forEach(meta => {
      const parsed = parsedDecks[meta.id];
      if (!parsed) return;

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
        canCraft
      };
    });

    return map;
  }, [parsedDecks, userCollection, wildcardInventory]);

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

      // Craftability & Tier Filter
      const calc = deckCalculations[deck.id];
      if (craftFilter === 'tier1' && deck.tier !== 'Tier 1') return false;
      if (craftFilter === 'ready_to_play') {
        if (!calc || !calc.isReady) return false;
      }
      if (craftFilter === 'craftable_now') {
        if (!calc || (!calc.canCraft && !calc.isReady)) return false;
      }

      return true;
    });
  }, [searchQuery, archetypeFilter, craftFilter, deckCalculations]);

  if (!isOpen) return null;

  const handleCopyExport = (meta: StandardMetaDeckMeta) => {
    navigator.clipboard.writeText(meta.arenaExportText);
    setCopiedDeckId(meta.id);
    setTimeout(() => setCopiedDeckId(null), 2500);
  };

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
      tags: [meta.tier, meta.archetype, 'Meta'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onLoadDeck(deckToLoad);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="arena-panel rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col max-h-[92vh] border border-[#c5a059]/30">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/30 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-fantasy font-black text-lg sm:text-xl text-white tracking-wide">
                  Standard Meta Tier List & Craftability
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Untapped.gg Parity
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Tournament-winning 60-card archetypes matched live against your MTG Arena collection and wildcard inventory.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Wildcard Stash Summary */}
            <div className="hidden md:flex items-center gap-2.5 bg-[#0e121a] px-3 py-1.5 rounded-xl border border-white/5 text-xs">
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

            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-2 rounded-xl bg-[#141a29] hover:bg-[#1c2438] transition border border-[#c5a059]/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="py-3 space-y-2.5 border-b border-[#c5a059]/20 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <input
                type="text"
                placeholder="Search deck or key card (e.g. Slickshot, Sheoldred, Overlord)..."
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

            {/* Craftability & Tier Filter Pills */}
            <div className="md:col-span-7 flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all' as CraftFilter, label: 'All Meta Decks' },
                { id: 'ready_to_play' as CraftFilter, label: '🟢 100% Owned' },
                { id: 'craftable_now' as CraftFilter, label: '🟡 Craftable Now' },
                { id: 'tier1' as CraftFilter, label: '⭐ Tier 1 Only' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setCraftFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    craftFilter === f.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                      : 'bg-[#0e121a] text-stone-300 border-white/5 hover:border-amber-500/30 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Archetype Sub-Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            <span className="text-stone-400 font-semibold whitespace-nowrap">Playstyle:</span>
            {(['all', 'Aggro', 'Midrange', 'Control', 'Ramp'] as ArchetypeFilter[]).map(arch => (
              <button
                key={arch}
                onClick={() => setArchetypeFilter(arch)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                  archetypeFilter === arch
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {arch === 'all' ? 'All Archetypes' : arch}
              </button>
            ))}
          </div>
        </div>

        {/* Decks Grid */}
        <div className="flex-1 overflow-y-auto pt-3 pr-1 space-y-3 min-h-0">
          {filteredMetaDecks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
              <p className="font-fantasy font-bold text-white text-base">No Meta Decks Match Filters</p>
              <p className="text-xs max-w-md">
                Try switching to "All Meta Decks" or clearing the search query to explore tournament archetypes.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCraftFilter('all');
                  setArchetypeFilter('all');
                }}
                className="mt-2 px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredMetaDecks.map(meta => {
              const calc = deckCalculations[meta.id];
              const parsed = parsedDecks[meta.id];
              const isLoading = loadingDecks[meta.id] || !calc;
              const isExpanded = expandedDeckId === meta.id;
              const isCopied = copiedDeckId === meta.id;

              return (
                <div
                  key={meta.id}
                  className="rounded-2xl border border-[#c5a059]/25 bg-[#0e121a]/90 hover:border-amber-400/50 p-4 transition shadow-lg space-y-3"
                >
                  {/* Top Row: Meta Tier, Name, Winrate, Colors */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        meta.tier === 'Tier 1'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}>
                        {meta.tier}
                      </span>
                      <h3 className="font-fantasy font-black text-base text-white hover:text-amber-300 transition">
                        {meta.name}
                      </h3>
                      <div className="flex items-center gap-0.5">
                        {meta.colors.map(col => (
                          <span
                            key={col}
                            className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-white/20 text-[9px] font-bold text-amber-300 flex items-center justify-center font-mono"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[#141926] text-emerald-300 border border-emerald-500/30">
                        🔥 {meta.winrate} Winrate
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#141926] text-stone-400 border border-white/5">
                        {meta.metaShare} Meta
                      </span>
                    </div>
                  </div>

                  {/* Description & Key Cards */}
                  <div className="text-xs text-stone-300 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="max-w-xl">{meta.description}</p>
                    <div className="flex flex-wrap items-center gap-1 text-[11px] text-stone-400">
                      <span className="font-semibold text-stone-500">Key:</span>
                      {meta.keyCards.map(kc => (
                        <span key={kc} className="px-1.5 py-0.2 rounded bg-black/40 text-stone-300 border border-white/5">
                          {kc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Untapped.gg Craftability Banner & Actions Bar */}
                  <div className="pt-2 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Collection Status Pill */}
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>Calculating collection ownership...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {calc.isReady ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>100% Owned • Ready to Play in Arena</span>
                          </div>
                        ) : calc.canCraft ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-500/50 text-xs font-bold">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>
                              Craftable Now ({calc.ownershipPct}% owned) • Needs {calc.wcCost.missing.rare}R {calc.wcCost.missing.mythic > 0 ? `${calc.wcCost.missing.mythic}M` : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 text-stone-300 border border-slate-700 text-xs font-semibold">
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            <span>
                              {calc.ownershipPct}% Owned • Needs {calc.wcCost.missing.rare}R {calc.wcCost.missing.mythic > 0 ? `${calc.wcCost.missing.mythic}M` : ''} Wildcards
                            </span>
                          </div>
                        )}

                        <span className="text-[11px] text-stone-400">
                          (75 Cards • 60 Main + 15 Side)
                        </span>
                      </div>
                    )}

                    {/* Action Buttons: Inspect, Copy Arena, Load into Builder */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedDeckId(isExpanded ? null : meta.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#141926] hover:bg-[#1c2335] text-stone-300 hover:text-white border border-white/10 transition flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide Cards' : 'View List'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleCopyExport(meta)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#141926] hover:bg-[#1c2335] text-amber-300 hover:text-white border border-amber-500/40 transition flex items-center gap-1.5"
                        title="Copy full MTG Arena export text to clipboard"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied!' : 'Copy Export'}</span>
                      </button>

                      <button
                        onClick={() => handleLoad(meta)}
                        disabled={isLoading}
                        className="btn-mythic-spark px-4 py-1.5 text-xs font-black rounded-xl transition shadow-md flex items-center gap-1.5 hover:scale-105 disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Load Deck</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Decklist Inspection View */}
                  {isExpanded && parsed && (
                    <div className="pt-3 border-t border-white/10 space-y-3 bg-[#0a0d13]/80 p-3 rounded-xl border border-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Mainboard */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-amber-300 uppercase tracking-wider pb-1.5 border-b border-white/10 mb-2">
                            <span>Mainboard ({parsed.mainboard.reduce((s, i) => s + i.quantity, 0)})</span>
                          </div>
                          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                            {parsed.mainboard.map(item => (
                              <div
                                key={item.card.id}
                                className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded hover:bg-white/5 transition"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-mono font-bold text-amber-400 w-4">{item.quantity}</span>
                                  <span className="text-stone-200 truncate">{item.card.name}</span>
                                </div>
                                <OwnershipPips
                                  card={item.card}
                                  userCollection={userCollection}
                                  size="sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sideboard */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-stone-300 uppercase tracking-wider pb-1.5 border-b border-white/10 mb-2">
                            <span>Sideboard ({parsed.sideboard.reduce((s, i) => s + i.quantity, 0)}/15)</span>
                          </div>
                          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                            {parsed.sideboard.map(item => (
                              <div
                                key={item.card.id}
                                className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded hover:bg-white/5 transition"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-mono font-bold text-amber-400 w-4">{item.quantity}</span>
                                  <span className="text-stone-200 truncate">{item.card.name}</span>
                                </div>
                                <OwnershipPips
                                  card={item.card}
                                  userCollection={userCollection}
                                  size="sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
