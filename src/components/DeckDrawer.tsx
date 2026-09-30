import React, { useState } from 'react';
import { Deck, DeckCard } from '../types/deck';
import { Card } from '../types/card';
import { UserCollection, DeckWildcardCost } from '../types/collection';
import { 
  X, 
  Trash2, 
  Layers, 
  Download, 
  Crown, 
  Plus, 
  Minus,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface DeckDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deck: Deck;
  onUpdateDeck: (updated: Deck) => void;
  onSelectCardDetail: (card: Card) => void;
  onOpenExport: () => void;
  wildcardCost: DeckWildcardCost;
  userCollection: UserCollection;
}

export const DeckDrawer: React.FC<DeckDrawerProps> = ({
  isOpen,
  onClose,
  deck,
  onUpdateDeck,
  onSelectCardDetail,
  onOpenExport,
  wildcardCost,
  userCollection
}) => {
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);

  if (!isOpen) return null;

  const commander = deck.commander?.card;
  const mainCount = deck.mainboard.reduce((a, b) => a + b.quantity, 0);
  const totalDeckCount = mainCount + (commander ? 1 : 0);
  const targetDeckSize = deck.format === 'brawl' ? 100 : 60;

  // Group cards
  const groups = {
    Creatures: deck.mainboard.filter(c => c.card.types.includes('Creature')),
    'Instants & Sorceries': deck.mainboard.filter(
      c => (c.card.types.includes('Instant') || c.card.types.includes('Sorcery')) && !c.card.types.includes('Creature')
    ),
    'Artifacts & Enchantments': deck.mainboard.filter(
      c =>
        (c.card.types.includes('Artifact') || c.card.types.includes('Enchantment')) &&
        !c.card.types.includes('Creature') &&
        !c.card.types.includes('Instant') &&
        !c.card.types.includes('Sorcery')
    ),
    Lands: deck.mainboard.filter(c => c.card.types.includes('Land'))
  };

  const handleRemove = (cardId: string) => {
    onUpdateDeck({
      ...deck,
      mainboard: deck.mainboard.filter(c => c.card.id !== cardId),
      updatedAt: new Date().toISOString()
    });
  };

  const handleAdjustBasicLand = (cardId: string, delta: number) => {
    const list = [...deck.mainboard];
    const idx = list.findIndex(c => c.card.id === cardId);
    if (idx >= 0) {
      const nextQty = list[idx].quantity + delta;
      if (nextQty <= 0) {
        list.splice(idx, 1);
      } else {
        list[idx] = { ...list[idx], quantity: nextQty };
      }
      onUpdateDeck({ ...deck, mainboard: list, updatedAt: new Date().toISOString() });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#0f131c] border-l border-[#232b3d] h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#232b3d] flex items-center justify-between bg-[#141824]">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Active Deck Tray</span>
                <span className={`text-xs px-2 py-0.2 rounded font-mono font-bold ${
                  totalDeckCount === targetDeckSize
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {totalDeckCount} / {targetDeckSize}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {deck.format === 'brawl' ? 'Brawl Singleton Deck' : 'Constructed Deck'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Stacks */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Commander Card Row if present */}
          {commander && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-xs text-amber-300 truncate block">
                    {commander.name}
                  </span>
                  <span className="text-[10px] text-slate-400">Commander</span>
                </div>
              </div>
              <span className="text-xs font-mono text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">
                {commander.manaCost}
              </span>
            </div>
          )}

          {/* Grouped Mainboard Cards */}
          {Object.entries(groups).map(([groupName, cards]) => {
            if (cards.length === 0) return null;
            const count = cards.reduce((a, b) => a + b.quantity, 0);

            return (
              <div key={groupName} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  <span>{groupName}</span>
                  <span className="text-slate-500 font-mono">{count}</span>
                </div>

                <div className="space-y-1">
                  {cards.map(item => {
                    const { card, quantity } = item;
                    const isBasic = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest'].includes(card.name);
                    const isOwned = (userCollection[card.arenaId] || 0) >= quantity;

                    return (
                      <div
                        key={card.id}
                        onMouseEnter={() => setHoveredCard(card)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="group flex items-center justify-between py-1 px-2 rounded-lg bg-[#141824]/60 hover:bg-[#1b2233] border border-[#1f2638] hover:border-slate-700 transition text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isBasic ? (
                            <div className="flex items-center gap-0.5 bg-slate-900 px-1 rounded border border-slate-800">
                              <button
                                onClick={() => handleAdjustBasicLand(card.id, -1)}
                                className="text-slate-400 hover:text-rose-400 p-0.5"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-mono font-bold text-amber-300 w-3 text-center text-[10px]">
                                {quantity}
                              </span>
                              <button
                                onClick={() => handleAdjustBasicLand(card.id, 1)}
                                className="text-slate-400 hover:text-emerald-400 p-0.5"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-slate-500 font-bold text-[10px] w-3">1</span>
                          )}

                          <button
                            onClick={() => onSelectCardDetail(card)}
                            className="font-medium text-slate-200 hover:text-amber-300 truncate text-left"
                          >
                            {card.name}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {card.manaCost && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded">
                              {card.manaCost}
                            </span>
                          )}

                          {!isBasic && (
                            <button
                              onClick={() => handleRemove(card.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 opacity-0 group-hover:opacity-100 transition"
                              title="Remove from deck"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer & Actions */}
        <div className="p-4 border-t border-[#232b3d] bg-[#121622] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Crafting Cost:</span>
            <span className="text-amber-300 font-bold font-mono">
              {wildcardCost.missing.rare} Rare • {wildcardCost.missing.mythic} Mythic
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onOpenExport}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
            >
              <Download className="w-4 h-4" />
              <span>Export for MTG Arena</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-[#1a2130] hover:bg-[#232b3d] text-slate-200 font-semibold text-xs rounded-xl border border-[#2b354a] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
