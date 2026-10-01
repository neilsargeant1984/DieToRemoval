import React from 'react';
import { Deck } from '../types/deck';
import { META_DECKS } from '../data/metaDecks';
import { X, Flame, Sparkles, ExternalLink, Zap } from 'lucide-react';

interface MetaDecksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDeck: (deck: Deck) => void;
}

export const MetaDecksModal: React.FC<MetaDecksModalProps> = ({
  isOpen,
  onClose,
  onLoadDeck
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="arena-panel rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="font-fantasy font-black text-lg text-slate-100">MTG Arena Tier 1 Meta Decks</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-full bg-[#161b26] hover:bg-[#1f2637] transition border border-[#c5a059]/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Load an optimized Arena tournament archetype into your workspace to test its Wildcard craft cost against your collection, inspect digital spellbooks, or export directly to the MTG Arena client.
        </p>

        {/* Deck Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {META_DECKS.map(deck => {
            const mainCount = deck.mainboard.reduce((a, b) => a + b.quantity, 0);

            return (
              <div
                key={deck.id}
                className="card-tile bg-[#131722]/80 border border-[#c5a059]/20 hover:border-amber-400/50 rounded-2xl p-4 transition flex flex-col justify-between space-y-3 group shadow-sm hover:bg-[#181e2b]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#161b26] text-amber-400 border border-[#c5a059]/30 capitalize">
                      {deck.format}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{mainCount} cards</span>
                  </div>

                  <h3 className="text-base font-fantasy font-bold text-slate-100 mt-2 group-hover:text-amber-300 transition">
                    {deck.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-medium">
                    {deck.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {deck.tags?.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-[#0e121a] text-slate-400 border border-[#c5a059]/20 font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLoadDeck(deck);
                    onClose();
                  }}
                  className="btn-mythic-spark w-full flex items-center justify-center gap-1.5 py-2.5 text-slate-950 font-black text-xs rounded-xl transition shadow-md"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Load Deck into Workspace
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
