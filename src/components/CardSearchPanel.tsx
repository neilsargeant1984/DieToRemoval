import React, { useState, useEffect, useRef } from 'react';
import { Card, CardRarity, CardTypeCategory, FormatType } from '../types/card';
import { searchArenaCards, buildSmartSearchQuery } from '../services/scryfallService';
import { Search, Plus, Sparkles, BookOpen, X, ShieldAlert, Loader2, Globe } from 'lucide-react';
import { ManaCost } from './ManaCost';

import { FunctionalRole } from '../utils/roleClassifier';

interface CardSearchPanelProps {
  currentFormat: FormatType;
  commander?: Card;
  activeRoleFilter?: FunctionalRole | 'lands' | null;
  onClearRoleFilter?: () => void;
  onAddCard: (card: Card, toSideboard?: boolean) => void;
  onSelectCardDetail: (card: Card) => void;
}

export const CardSearchPanel: React.FC<CardSearchPanelProps> = ({
  currentFormat,
  commander,
  activeRoleFilter,
  onClearRoleFilter,
  onAddCard,
  onSelectCardDetail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<FormatType>(currentFormat);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
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
        const result = await searchArenaCards({
          query: smartQuery,
          format: selectedFormat,
          color: selectedColor,
          type: selectedType,
          rarity: selectedRarity,
          digitalOnly: digitalOnly,
          commanderColorIdentity: (selectedFormat === 'brawl' && commander) ? commander.colorIdentity : undefined,
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
  }, [searchTerm, selectedFormat, selectedColor, selectedType, selectedRarity, digitalOnly, commander, activeRoleFilter]);

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
            const isSelected = selectedColor === c.id;

            if (c.manaSymbol && !c.label) {
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(isSelected ? null : c.id)}
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
                  onClick={() => setSelectedColor(isSelected ? null : c.id)}
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

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedColor(isSelected ? null : c.id)}
                title="Filter by Multicolor"
                aria-label="Multicolor"
                className={`h-7 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-150 border select-none ${
                  isSelected
                    ? `${c.activeRing} scale-105 ring-offset-1 ring-offset-[#0b0e14]`
                    : `border-[#c5a059]/20 ${c.hoverRing} hover:scale-105 text-slate-300`
                }`}
              >
                <span className="text-amber-400 font-bold text-xs">★</span>
                <span>{c.label}</span>
              </button>
            );
          })}
          {selectedColor && (
            <button
              type="button"
              onClick={() => setSelectedColor(null)}
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

      {/* Results List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 min-h-[400px] max-h-[620px]">
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
          cards.map(card => {
            const rarityGems = {
              common: 'bg-stone-400',
              uncommon: 'bg-sky-500',
              rare: 'bg-amber-500',
              mythic: 'bg-orange-500'
            };

            return (
              <div
                key={card.id}
                className="group relative card-tile rounded-xl p-2.5 flex items-center justify-between gap-3 transition cursor-pointer shadow-sm hover:border-amber-400/50"
                onClick={() => onSelectCardDetail(card)}
              >
                {/* Left: Mana & Name */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ${rarityGems[card.rarity]}`}
                    title={`${card.rarity} rarity`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-200 truncate group-hover:text-amber-300 transition">
                        {card.name}
                      </span>
                      {card.isDigitalOnly && (
                        <span className="px-1.5 py-0.2 text-[10px] bg-purple-950/80 text-purple-300 border border-purple-500/50 rounded font-bold flex-shrink-0">
                          Digital
                        </span>
                      )}
                      {card.isAlchemyRebalanced && (
                        <span className="px-1.5 py-0.2 text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 rounded font-bold flex-shrink-0">
                          Rebalanced
                        </span>
                      )}
                      {card.spellbook && (
                        <span className="flex items-center gap-1 px-1.5 py-0.2 text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 rounded font-bold flex-shrink-0">
                          <BookOpen className="w-2.5 h-2.5" />
                          Spellbook ({card.spellbook.length})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate flex items-center gap-2 font-medium">
                      <span>{card.typeLine}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-500 uppercase">{card.set} #{card.collectorNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Mana Cost & Quick Add Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {card.manaCost && (
                    <span className="text-xs font-mono bg-[#0e121a] px-2 py-0.5 rounded-lg text-amber-400 font-bold border border-[#c5a059]/30 shadow-inner">
                      {card.manaCost}
                    </span>
                  )}
                  <button
                    onClick={() => onAddCard(card, false)}
                    className="p-1.5 btn-mythic-spark text-slate-950 rounded-lg transition shadow-sm hover:scale-105"
                    title="Add 1 copy to Mainboard"
                  >
                    <Plus className="w-4 h-4 font-extrabold" />
                  </button>
                  <button
                    onClick={() => onAddCard(card, true)}
                    className="px-2 py-1 bg-[#1c2230] hover:bg-[#252d40] text-slate-300 hover:text-white rounded-lg text-xs font-bold border border-[#c5a059]/30 transition shadow-sm"
                    title="Add 1 copy to Sideboard"
                  >
                    +Side
                  </button>
                </div>
              </div>
            );
          })
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
