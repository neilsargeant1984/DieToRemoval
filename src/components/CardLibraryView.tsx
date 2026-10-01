import React, { useState, useEffect, useRef } from 'react';
import { Card, CardRarity, CardTypeCategory, FormatType } from '../types/card';
import { searchArenaCards } from '../services/scryfallService';
import { Search, Loader2, Globe, X, Plus } from 'lucide-react';

interface CardLibraryViewProps {
  onSelectCardDetail: (card: Card) => void;
  onAddCardToDeck: (card: Card) => void;
}

export const CardLibraryView: React.FC<CardLibraryViewProps> = ({
  onSelectCardDetail,
  onAddCardToDeck
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('brawl');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<CardTypeCategory | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<CardRarity | null>(null);
  const [digitalOnly, setDigitalOnly] = useState(false);

  const [cards, setCards] = useState<Card[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const delay = searchTerm.trim() ? 320 : 50;

    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await searchArenaCards({
          query: searchTerm,
          format: selectedFormat,
          color: selectedColor,
          type: selectedType,
          rarity: selectedRarity,
          digitalOnly: digitalOnly
        });
        setCards(result.cards);
        setTotalCount(result.totalCards);
      } catch (err) {
        console.error('Error fetching cards in library:', err);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchTerm, selectedFormat, selectedColor, selectedType, selectedRarity, digitalOnly]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Hero Cockpit */}
      <div className="arena-panel rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-fantasy font-black text-xl text-white uppercase tracking-wide flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400" />
              <span>MTG Arena Card Library</span>
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Browse every single card available on MTG Arena. Real-time updates directly from the official card catalog.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-300 bg-[#0d1017]/90 px-3.5 py-1.5 rounded-xl border border-white/5 shadow-inner font-bold">
            {isLoading ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Querying Arena...
              </span>
            ) : (
              <span>{totalCount} cards found</span>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search card name, text, or type across all of MTG Arena..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d1017] border border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
          />
          <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Rows: Formats, Colors, Types */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/10 text-xs">
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

          {/* Color Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-fantasy font-bold text-stone-400 uppercase mr-1">Colors:</span>
            {[
              { id: 'W', label: 'W', bg: 'bg-amber-100 text-amber-950 border-amber-300' },
              { id: 'U', label: 'U', bg: 'bg-blue-600 text-white border-blue-400' },
              { id: 'B', label: 'B', bg: 'bg-stone-800 text-stone-200 border-stone-600' },
              { id: 'R', label: 'R', bg: 'bg-red-600 text-white border-red-400' },
              { id: 'G', label: 'G', bg: 'bg-emerald-600 text-white border-emerald-400' },
              { id: 'C', label: 'Colorless', bg: 'bg-stone-700 text-stone-200 border-stone-500' },
              { id: 'M', label: 'Multi', bg: 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 text-white border-transparent' }
            ].map(c => {
              const isSelected = selectedColor === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(isSelected ? null : c.id)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition ${
                    isSelected
                      ? `${c.bg} ring-2 ring-amber-500 ring-offset-1 ring-offset-black scale-105 shadow-sm`
                      : 'bg-[#121622] text-stone-400 border-white/5 hover:border-amber-400'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card Visual Grid */}
      <div className="min-h-[460px]">
        {isLoading && cards.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="font-semibold text-stone-300">Loading MTG Arena Library...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-500">
            <p className="font-semibold text-stone-300">No cards matched your query</p>
            <p className="text-xs text-stone-500 mt-1">Try relaxing filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {cards.map(card => (
              <div
                key={card.id}
                className="card-tile group rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer p-2"
                onClick={() => onSelectCardDetail(card)}
              >
                <div className="relative overflow-hidden rounded-xl shadow border border-black/40 mb-2 bg-black">
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-auto object-cover group-hover:brightness-105 transition"
                  />
                  {card.isDigitalOnly && (
                    <span className="absolute top-1.5 right-1.5 bg-purple-950/90 text-purple-200 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-700 shadow">
                      Digital
                    </span>
                  )}
                </div>

                <div className="p-1.5 flex items-center justify-between gap-2 border-t border-white/5">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-stone-100 truncate block group-hover:text-amber-300">
                      {card.name}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {card.manaCost || 'Land'}
                    </span>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onAddCardToDeck(card);
                    }}
                    className="p-1.5 btn-mythic-spark rounded-lg transition shadow-sm"
                    title="Add to active deck"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardLibraryView;
