import React, { useState, useEffect, useRef } from 'react';
import { Card, CardRarity, CardTypeCategory, FormatType } from '../types/card';
import { searchArenaCards, buildSmartSearchQuery } from '../services/scryfallService';
import { Search, Plus, Minus, Trash2, Sparkles, X, ShieldAlert, Loader2, Globe } from 'lucide-react';
import { ManaCost } from './ManaCost';
import { OwnershipPips } from './OwnershipPips';
import { UserCollection } from '../types/collection';
import { FunctionalRole } from '../utils/roleClassifier';
import { getMaxCardCopies } from '../utils/cardRules';

interface CardSearchPanelProps {
  currentFormat: FormatType;
  commander?: Card;
  deckCardCounts?: Map<string, number>;
  sideboardCardCounts?: Map<string, number>;
  activeRoleFilter?: FunctionalRole | 'lands' | null;
  onClearRoleFilter?: () => void;
  onAddCard: (card: Card, toSideboard?: boolean) => void;
  onRemoveCard?: (card: Card, removeAll?: boolean, fromSideboard?: boolean) => void;
  onSelectCardDetail: (card: Card) => void;
  userCollection?: UserCollection;
  onUpdateCollection?: (col: UserCollection) => void;
  deckColors?: string[];
}

export const CardSearchPanel: React.FC<CardSearchPanelProps> = ({
  currentFormat,
  commander,
  deckCardCounts,
  sideboardCardCounts,
  activeRoleFilter,
  onClearRoleFilter,
  onAddCard,
  onRemoveCard,
  onSelectCardDetail,
  userCollection = {},
  onUpdateCollection,
  deckColors = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<FormatType>(currentFormat);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<CardTypeCategory | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<CardRarity | null>(null);
  const [digitalOnly, setDigitalOnly] = useState(false);

  // Live Scryfall Search State
  const [cards, setCards] = useState<Card[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync format changes from parent
  useEffect(() => {
    setSelectedFormat(currentFormat);
  }, [currentFormat]);

  const toggleColor = (colorId: string) => {
    setSelectedColors(prev =>
      prev.includes(colorId) ? prev.filter(c => c !== colorId) : [...prev, colorId]
    );
  };

  // Debounced search effect
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsLoading(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce by 320ms for typing, immediate if no search term
    const delay = searchTerm.trim() ? 320 : 50;

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const smartQuery = buildSmartSearchQuery(searchTerm);
        const useDeckColors = selectedFormat !== 'brawl' && activeRoleFilter && deckColors && deckColors.length > 0 && selectedColors.length === 0;
        const searchColors = selectedColors.length > 0
          ? selectedColors
          : (useDeckColors ? deckColors : undefined);

        const effectiveCommanderColorIdentity = (selectedFormat === 'brawl' && commander)
          ? commander.colorIdentity
          : (useDeckColors && deckColors && deckColors.length > 0)
            ? deckColors
            : undefined;

        const result = await searchArenaCards({
          query: smartQuery,
          format: selectedFormat,
          colors: searchColors,
          type: selectedType,
          rarity: selectedRarity,
          digitalOnly: digitalOnly,
          commanderColorIdentity: effectiveCommanderColorIdentity,
          roleFilter: activeRoleFilter
        });
        setCards(result.cards);
        setTotalCount(result.totalCards);
      } catch (err) {
        console.error('Error fetching cards:', err);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, selectedFormat, selectedColors, selectedType, selectedRarity, digitalOnly, commander, activeRoleFilter, deckColors]);

  return (
    <div className="arena-panel rounded-2xl p-4 shadow-xl flex flex-col h-full">
      {/* Header & Search Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-500" />
            <span className="font-fantasy font-black text-sm text-slate-100 uppercase tracking-wider">
              Arena Card Explorer
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            {isLoading ? (
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Searching Arena...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-amber-500" />
                {totalCount} legal cards
              </span>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search any MTG Arena card (e.g. Nicol Bolas, Counterspell, Sheoldred)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0e121a] border border-[#c5a059]/30 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 shadow-inner transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Active Role Filter Banner */}
        {activeRoleFilter && (
          <div className="flex items-center justify-between bg-[#161b26] border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs shadow-sm">
            <span className="text-amber-300 font-bold flex items-center gap-1.5 capitalize">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Role: {activeRoleFilter.replace('_', ' ')} {commander ? `(${commander.colorIdentity.join('/') || 'Colorless'} Identity)` : ''}
            </span>
            <button
              onClick={onClearRoleFilter}
              className="text-xs text-amber-400 hover:text-amber-200 font-bold flex items-center gap-1"
            >
              <span>Clear Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Format Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {(['standard', 'timeless', 'historic', 'explorer', 'brawl', 'alchemy'] as FormatType[]).map(fmt => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1 rounded-full font-bold capitalize whitespace-nowrap transition text-xs ${
                selectedFormat === fmt
                  ? 'btn-mythic-spark text-slate-950 font-black shadow-md'
                  : 'bg-[#161b26] text-slate-400 hover:bg-[#1f2637] hover:text-slate-100 border border-[#c5a059]/20'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* Color Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Colors:</span>
          {[
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
              hoverRing: 'hover:border-slate-400/50 bg-[#161b26] text-slate-300'
            },
            {
              id: 'M',
              name: 'Multicolor',
              label: 'Multi',
              activeRing: 'ring-2 ring-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 text-white font-black border-transparent',
              hoverRing: 'hover:border-amber-400/50 bg-[#161b26] text-amber-300'
            }
          ].map(c => {
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
                      ? `${c.activeRing} scale-110 opacity-100 ring-offset-1 ring-offset-[#0b0e14]`
                      : `border-[#c5a059]/20 ${c.hoverRing} opacity-60 hover:opacity-100 hover:scale-105 bg-[#161b26]`
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
                      ? `${c.activeRing} scale-105 ring-offset-1 ring-offset-[#0b0e14]`
                      : `border-[#c5a059]/20 ${c.hoverRing} hover:scale-105 text-slate-300`
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
                    ? `${c.activeRing} scale-110 opacity-100 ring-offset-1 ring-offset-[#0b0e14]`
                    : `border-[#c5a059]/20 ${c.hoverRing} opacity-60 hover:opacity-100 hover:scale-105 bg-[#161b26]`
                }`}
              >
                <span className="text-amber-400 font-black text-sm drop-shadow-sm select-none">★</span>
              </button>
            );
          })}
          {selectedFormat !== 'brawl' && deckColors.length > 0 && (() => {
            const isDeckColorsActive = deckColors.length > 0 &&
              selectedColors.length === deckColors.length &&
              deckColors.every(c => selectedColors.includes(c));
            return (
              <button
                type="button"
                onClick={() => {
                  if (isDeckColorsActive) {
                    setSelectedColors([]);
                  } else {
                    setSelectedColors([...deckColors]);
                  }
                }}
                title={`Filter strictly to your deck's colors (${deckColors.join('/')})`}
                className={`h-7 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-150 border select-none ${
                  isDeckColorsActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md scale-105'
                    : 'border-amber-500/30 hover:border-amber-400/60 bg-[#161b26] text-amber-300 hover:scale-105'
                }`}
              >
                <span>🎯</span>
                <span>Deck ({deckColors.join('/')})</span>
              </button>
            );
          })()}
          {selectedColors.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedColors([])}
              className="p-1 text-slate-400 hover:text-slate-200 ml-0.5 rounded-lg hover:bg-white/5 transition"
              title="Clear color filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Types, Rarities & Digital Toggles */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-[#c5a059]/20 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Type:</span>
            {(['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Planeswalker', 'Land'] as CardTypeCategory[]).map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(selectedType === t ? null : t)}
                className={`px-2 py-0.5 rounded-lg text-[11px] transition ${
                  selectedType === t
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/60 shadow-sm'
                    : 'bg-[#161b26] text-slate-400 hover:text-white hover:bg-[#1f2637] border border-[#c5a059]/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Arena Digital Exclusives Toggle */}
          <button
            onClick={() => setDigitalOnly(!digitalOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
              digitalOnly
                ? 'bg-purple-950/70 text-purple-300 border-purple-500 shadow-sm'
                : 'bg-[#161b26] text-slate-400 border-[#c5a059]/20 hover:text-purple-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Digital Only</span>
          </button>
        </div>
      </div>

      {/* Results Layout (Always 3x3 Card Art Grid) */}
      <div className="mt-4 flex-1 overflow-y-auto pr-1 min-h-[400px] max-h-[620px]">
        {isLoading && cards.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="font-fantasy font-bold text-slate-200">Searching MTG Arena card catalog...</p>
            <p className="text-xs text-slate-400">Connecting to Scryfall live Arena index</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <ShieldAlert className="w-10 h-10 mb-2 text-slate-500" />
            <p className="font-fantasy font-bold text-slate-200">No MTG Arena cards found</p>
            <p className="text-xs mt-1 text-slate-400">Try another search term or switch format legality (e.g. Standard vs Timeless).</p>
          </div>
        ) : (
          /* Persistent 3-Column Visual Grid Mode */
          <div className="grid grid-cols-3 gap-3 p-1">
            {cards.map(card => {
              const cardKey = card.name.toLowerCase().trim();
              const mainCount = deckCardCounts?.get(cardKey) || 0;
              const sideCount = sideboardCardCounts?.get(cardKey) || 0;
              const totalCount = mainCount + sideCount;
              const maxAllowed = getMaxCardCopies(card, selectedFormat);
              const isMaxReached = totalCount >= maxAllowed;

              return (
                <div
                  key={card.id}
                  className="group relative rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-amber-400 transition-all shadow-md bg-[#0e121a]"
                  onClick={() => onSelectCardDetail(card)}
                >
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-auto block rounded-lg aspect-[2.5/3.5] object-cover"
                    loading="lazy"
                  />

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-[#0b0e14]/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 backdrop-blur-sm rounded-lg">
                    {/* Top Header: In-deck badge & Ownership pips */}
                    <div onClick={e => e.stopPropagation()} className="flex w-full items-center justify-between">
                      {totalCount > 0 ? (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm leading-none">
                          {totalCount}x in Deck
                        </span>
                      ) : (
                        <span />
                      )}
                      <OwnershipPips
                        card={card}
                        userCollection={userCollection}
                        size="sm"
                        onCountChange={(_, updated) => onUpdateCollection?.(updated)}
                      />
                    </div>

                    {/* Bottom Actions: Add to Deck Stepper + Sideboard */}
                    <div className="w-full flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
                      {/* Add to Deck Button with Plus / Minus Stepper */}
                      {mainCount === 0 ? (
                        <div className="w-full flex items-stretch rounded-lg overflow-hidden shadow-lg border border-amber-400/40 btn-mythic-spark p-0">
                          <button
                            type="button"
                            disabled={true}
                            className="px-2 py-1.5 flex items-center justify-center text-slate-900/30 cursor-not-allowed border-r border-black/10"
                            title="No copies in mainboard"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            disabled={isMaxReached}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isMaxReached) onAddCard(card, false);
                            }}
                            className="flex-1 py-1.5 px-1 flex items-center justify-center text-slate-950 font-black text-xs hover:bg-black/10 transition select-none tracking-tight disabled:opacity-40"
                            title={isMaxReached ? `Maximum ${maxAllowed} copies reached` : "Add to deck"}
                          >
                            <span>Add to Deck</span>
                          </button>
                          <button
                            type="button"
                            disabled={isMaxReached}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isMaxReached) onAddCard(card, false);
                            }}
                            className="px-2 py-1.5 flex items-center justify-center text-slate-950 hover:bg-black/15 transition active:scale-95 border-l border-black/10 disabled:opacity-40"
                            title={isMaxReached ? `Maximum ${maxAllowed} copies reached` : "Add 1 copy"}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full flex items-stretch rounded-lg overflow-hidden shadow-lg border border-amber-400/60 bg-[#0d1017] p-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveCard?.(card, false, false);
                            }}
                            className="px-2 py-1 rounded-md bg-[#161c28] hover:bg-rose-950 text-stone-300 hover:text-rose-300 border border-white/5 hover:border-rose-700 transition active:scale-95 flex items-center justify-center"
                            title={mainCount === 1 ? "Remove card from deck" : "Decrease copies"}
                          >
                            {mainCount === 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isMaxReached}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isMaxReached) onAddCard(card, false);
                            }}
                            className="flex-1 py-1 px-1 flex flex-col items-center justify-center text-center transition hover:bg-white/5 rounded-md mx-0.5 select-none"
                            title={isMaxReached ? `Maximum ${maxAllowed} copies reached` : "Add another copy"}
                          >
                            <span className="text-xs font-black text-amber-300 leading-none">
                              {mainCount} in Deck
                            </span>
                            {maxAllowed < 100 && (
                              <span className="text-[9px] font-semibold text-slate-400 leading-none mt-0.5">
                                ({maxAllowed} Max)
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isMaxReached}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isMaxReached) onAddCard(card, false);
                            }}
                            className={`px-2 py-1 rounded-md border transition active:scale-95 flex items-center justify-center ${
                              isMaxReached
                                ? 'opacity-30 cursor-not-allowed bg-[#161c28] text-stone-500 border-white/5'
                                : 'bg-[#161c28] hover:bg-emerald-950 text-stone-300 hover:text-emerald-300 border border-white/5 hover:border-emerald-700'
                            }`}
                            title={isMaxReached ? `Maximum ${maxAllowed} copies reached` : "Add another copy"}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Sideboard Button / Stepper */}
                      {sideCount === 0 ? (
                        <button
                          type="button"
                          disabled={isMaxReached}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isMaxReached) onAddCard(card, true);
                          }}
                          className="w-full py-1 bg-[#1c2230] text-slate-200 font-bold text-xs border border-[#c5a059]/40 rounded-lg hover:bg-[#252d40] hover:text-white transition flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isMaxReached ? "Max copies reached across deck" : "Add copy to sideboard"}
                        >
                          <Plus className="w-3 h-3 text-[#c5a059]" />
                          <span>Sideboard</span>
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-between bg-[#0d1017] border border-white/10 rounded-lg p-0.5 shadow-inner">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveCard?.(card, false, true);
                            }}
                            className="p-1 rounded-md bg-[#141926] hover:bg-rose-950 text-stone-300 hover:text-rose-300 border border-white/5 hover:border-rose-800 transition"
                            title={sideCount === 1 ? "Remove from sideboard" : "Decrease sideboard copies"}
                          >
                            {sideCount === 1 ? (
                              <Trash2 className="w-3 h-3 text-rose-400" />
                            ) : (
                              <Minus className="w-3 h-3" />
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isMaxReached}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isMaxReached) onAddCard(card, true);
                            }}
                            className="flex-1 text-center font-bold text-sky-300 hover:text-sky-200 text-[11px] truncate px-1"
                            title={isMaxReached ? "Max copies reached across deck" : "Add another copy to sideboard"}
                          >
                            {sideCount} in SB
                          </button>

                          <button
                            type="button"
                            disabled={isMaxReached}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isMaxReached) onAddCard(card, true);
                            }}
                            className={`p-1 rounded-md border transition ${
                              isMaxReached
                                ? 'opacity-30 cursor-not-allowed bg-[#141926] text-stone-500 border-white/5'
                                : 'bg-[#141926] hover:bg-sky-950 text-stone-300 hover:text-sky-300 border border-white/5 hover:border-sky-800'
                            }`}
                            title={isMaxReached ? "Max copies reached across deck" : "Add copy to sideboard"}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer live status */}
      <div className="pt-2 mt-2 border-t border-[#c5a059]/20 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          Live MTG Arena Card Database
        </span>
        <span>Strictly filtered: game:arena</span>
      </div>
    </div>
  );
};
