import React, { useState, useEffect } from 'react';
import { DeckCard } from '../types/deck';
import { Card } from '../types/card';
import { simulateOpeningHand } from '../utils/deckAnalytics';
import { X, RefreshCw, PlusCircle, Shuffle, ShieldAlert } from 'lucide-react';

interface GoldfishModalProps {
  mainboard: DeckCard[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCardDetail: (card: Card) => void;
}

export const GoldfishModal: React.FC<GoldfishModalProps> = ({
  mainboard,
  isOpen,
  onClose,
  onSelectCardDetail
}) => {
  const [hand, setHand] = useState<Card[]>([]);
  const [library, setLibrary] = useState<Card[]>([]);
  const [mulliganCount, setMulliganCount] = useState(0);

  const resetGame = () => {
    const { hand: newHand, remainingLibrary } = simulateOpeningHand(mainboard, 7);
    setHand(newHand);
    setLibrary(remainingLibrary);
    setMulliganCount(0);
  };

  useEffect(() => {
    if (isOpen) {
      resetGame();
    }
  }, [isOpen]);

  const handleMulligan = () => {
    const { hand: newHand, remainingLibrary } = simulateOpeningHand(mainboard, 7);
    setHand(newHand);
    setLibrary(remainingLibrary);
    setMulliganCount(prev => prev + 1);
  };

  const handleDrawOne = () => {
    if (library.length === 0) return;
    const drawn = library[0];
    setHand(prev => [...prev, drawn]);
    setLibrary(prev => prev.slice(1));
  };

  if (!isOpen) return null;

  const totalMainCards = mainboard.reduce((acc, c) => acc + c.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="arena-panel rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#c5a059]/20">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-amber-500" />
            <h2 className="font-fantasy font-black text-lg text-slate-100">Sample Hand & Goldfish Playtest</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-full bg-[#161b26] hover:bg-[#1f2637] transition border border-[#c5a059]/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {totalMainCards < 7 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <ShieldAlert className="w-8 h-8 mx-auto text-amber-500" />
            <p className="font-fantasy font-bold text-slate-200">Not enough cards in mainboard</p>
            <p className="text-xs">Add at least 7 cards to simulate an opening hand.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-4 space-y-5">
            {/* Control Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-[#0e121a] p-3 rounded-2xl border border-[#c5a059]/25 shadow-sm">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">
                  Hand: <strong className="text-amber-400 font-extrabold">{hand.length}</strong> cards
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">
                  Library: <strong className="text-slate-200 font-bold">{library.length}</strong> left
                </span>
                {mulliganCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/40 text-[11px] font-bold">
                    Mulligans taken: {mulliganCount} (Bottom {mulliganCount} cards)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDrawOne}
                  disabled={library.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b26] hover:bg-[#202737] disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold border border-[#c5a059]/30 transition shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
                  Draw 1 Card
                </button>
                <button
                  onClick={handleMulligan}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b26] hover:bg-[#202737] text-slate-200 rounded-xl text-xs font-bold border border-[#c5a059]/30 transition shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                  London Mulligan
                </button>
                <button
                  onClick={resetGame}
                  className="btn-mythic-spark px-3.5 py-1.5 text-slate-950 rounded-xl text-xs font-black transition shadow-sm"
                >
                  New Hand
                </button>
              </div>
            </div>

            {/* Hand Cards Fan / Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 min-h-[220px]">
              {hand.map((card, idx) => (
                <div
                  key={`${card.id}-${idx}`}
                  onClick={() => onSelectCardDetail(card)}
                  className="group relative rounded-2xl overflow-hidden shadow-md border border-[#c5a059]/30 hover:border-amber-400 hover:scale-105 transition transform cursor-pointer flex flex-col bg-[#121622] card-tile"
                >
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-1.5 bg-[#0e121a] text-center border-t border-[#c5a059]/20">
                    <p className="text-[11px] font-bold text-slate-200 truncate group-hover:text-amber-300">
                      {card.name}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {card.manaCost || 'Land'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
