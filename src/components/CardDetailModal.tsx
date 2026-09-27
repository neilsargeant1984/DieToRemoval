import React from 'react';
import { Card } from '../types/card';
import { X, BookOpen, Sparkles, Layers, ShieldCheck, Tag } from 'lucide-react';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
  onAddCard: (card: Card, toSideboard?: boolean) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  onClose,
  onAddCard
}) => {
  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Card Image */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col items-center">
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full rounded-xl shadow-xl border border-slate-700 object-cover"
          />
          <div className="mt-4 flex gap-2 w-full">
            <button
              onClick={() => {
                onAddCard(card, false);
                onClose();
              }}
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition"
            >
              + Mainboard
            </button>
            <button
              onClick={() => {
                onAddCard(card, true);
                onClose();
              }}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition"
            >
              + Sideboard
            </button>
          </div>
        </div>

        {/* Right: Detailed Metadata & Spellbook */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">{card.name}</h2>
              {card.isDigitalOnly && (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Digital Only
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {card.typeLine} • Mana Value: {card.cmc}
            </div>
          </div>

          {/* Oracle Text */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
            {card.oracleText || 'No rules text.'}
          </div>

          {/* Arena Specific Properties */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">MTG Arena ID</span>
              <span className="font-mono font-semibold text-amber-300">{card.arenaId}</span>
            </div>
            <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">Set & Number</span>
              <span className="font-mono text-slate-200">{card.set} #{card.collectorNumber}</span>
            </div>
          </div>

          {/* Arena Format Legality Matrix */}
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-1.5">
              Arena Format Legalities
            </span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {Object.entries(card.legalities).map(([fmt, isLegal]) => (
                <span
                  key={fmt}
                  className={`px-2 py-0.5 rounded-md font-medium capitalize border ${
                    isLegal
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      : 'bg-slate-950 text-slate-600 border-slate-800 line-through'
                  }`}
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          {/* Digital Spellbook / Conjure Drawer */}
          {card.spellbook && card.spellbook.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                <BookOpen className="w-4 h-4" />
                <span>Spellbook Cards ({card.spellbook.length})</span>
              </div>
              <p className="text-[11px] text-slate-400">
                In MTG Arena, playing or activating this card allows you to draft or conjure one of these specific cards:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {card.spellbook.map((sb, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span>{sb.name}</span>
                      <span className="text-amber-300 font-mono text-[11px]">{sb.manaCost}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                      {sb.oracleText}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
