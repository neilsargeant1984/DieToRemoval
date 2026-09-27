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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">MTG Arena Tier 1 Meta Decks</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Load an optimized Arena tournament archetype into your workspace to test its Wildcard craft cost against your collection, inspect digital spellbooks, or export directly to the MTG Arena client.
        </p>

        {/* Deck Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {META_DECKS.map(deck => {
            const mainCount = deck.mainboard.reduce((a, b) => a + b.quantity, 0);

            return (
              <div
                key={deck.id}
                className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 rounded-xl p-4 transition flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 capitalize">
                      {deck.format}
                    </span>
                    <span className="text-xs text-slate-500">{mainCount} cards</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 mt-2 group-hover:text-amber-300 transition">
                    {deck.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {deck.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {deck.tags?.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
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
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 font-bold text-xs rounded-lg transition shadow group-hover:bg-amber-500 group-hover:text-slate-950"
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
