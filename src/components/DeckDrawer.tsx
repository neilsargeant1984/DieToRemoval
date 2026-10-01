import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Deck } from '../types/deck';
import { Card } from '../types/card';
import { UserCollection, DeckWildcardCost } from '../types/collection';
import { ManaCost } from './ManaCost';
import { CardImage } from './CardImage';
import { 
  X, 
  Trash2, 
  Layers, 
  Download, 
  Crown, 
  Plus, 
  Minus,
  PanelRightClose
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
  variant?: 'inline' | 'drawer';
  onAddCard?: (card: Card) => void;
}

export const DeckDrawer: React.FC<DeckDrawerProps> = ({
  isOpen,
  onClose,
  deck,
  onUpdateDeck,
  onSelectCardDetail,
  onOpenExport,
  wildcardCost,
  userCollection,
  variant = 'drawer',
  onAddCard
}) => {
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [dropToast, setDropToast] = useState<{ message: string; type: 'success' | 'warn' } | null>(null);
  const dragCounter = useRef<number>(0);
  const toastTimeoutRef = useRef<number | null>(null);

  if (!isOpen) return null;

  const commander = deck.commander?.card;
  const mainCount = deck.mainboard.reduce((a, b) => a + b.quantity, 0);
  const totalDeckCount = mainCount + (commander ? 1 : 0);
  const targetDeckSize = deck.format === 'brawl' ? 100 : 60;

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes('application/json') || e.dataTransfer.types.includes('text/plain')) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);

    try {
      const rawJson = e.dataTransfer.getData('application/json');
      if (!rawJson) return;
      const droppedCard: Card = JSON.parse(rawJson);
      if (!droppedCard || !droppedCard.name) return;

      const list = [...deck.mainboard];
      const isBasic = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'].includes(droppedCard.name);
      const maxCopies = isBasic ? 99 : (deck.format === 'brawl' ? 1 : 4);
      const existing = list.find(c => c.card.name.toLowerCase().trim() === droppedCard.name.toLowerCase().trim());
      const existingQty = existing ? existing.quantity : 0;

      if (existingQty >= maxCopies) {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setDropToast({
          message: deck.format === 'brawl' && !isBasic 
            ? `"${droppedCard.name}" is already in your Brawl deck (Singleton: 1 max)`
            : `Max ${maxCopies} copies of "${droppedCard.name}" already in deck`,
          type: 'warn'
        });
        toastTimeoutRef.current = window.setTimeout(() => setDropToast(null), 3000);
        return;
      }

      if (onAddCard) {
        onAddCard(droppedCard);
      } else {
        if (existing) {
          existing.quantity += 1;
        } else {
          list.push({ card: droppedCard, quantity: 1 });
        }
        onUpdateDeck({ ...deck, mainboard: list, updatedAt: new Date().toISOString() });
      }

      confetti({ particleCount: 35, spread: 50, origin: { x: 0.85, y: 0.5 } });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setDropToast({
        message: `Added "${droppedCard.name}" to Decklist`,
        type: 'success'
      });
      toastTimeoutRef.current = window.setTimeout(() => setDropToast(null), 2500);
    } catch (err) {
      console.error('Failed to parse dropped card:', err);
    }
  };

  // Group cards into complete, clear categories
  const groups: Record<string, typeof deck.mainboard> = {
    Creatures: deck.mainboard.filter(c => c.card.types.includes('Creature')),
    Planeswalkers: deck.mainboard.filter(
      c => c.card.types.includes('Planeswalker') && !c.card.types.includes('Creature')
    ),
    'Instants & Sorceries': deck.mainboard.filter(
      c =>
        (c.card.types.includes('Instant') || c.card.types.includes('Sorcery')) &&
        !c.card.types.includes('Creature') &&
        !c.card.types.includes('Planeswalker')
    ),
    'Artifacts & Enchantments': deck.mainboard.filter(
      c =>
        (c.card.types.includes('Artifact') || c.card.types.includes('Enchantment')) &&
        !c.card.types.includes('Creature') &&
        !c.card.types.includes('Instant') &&
        !c.card.types.includes('Sorcery') &&
        !c.card.types.includes('Planeswalker')
    ),
    Lands: deck.mainboard.filter(c => c.card.types.includes('Land')),
    'Other Spells': deck.mainboard.filter(
      c =>
        !c.card.types.includes('Creature') &&
        !c.card.types.includes('Planeswalker') &&
        !c.card.types.includes('Instant') &&
        !c.card.types.includes('Sorcery') &&
        !c.card.types.includes('Artifact') &&
        !c.card.types.includes('Enchantment') &&
        !c.card.types.includes('Land')
    )
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

  const panelContent = (
    <div 
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full bg-[#0e121a] border relative transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-2xl ${
        isDragOver 
          ? 'border-amber-400 ring-2 ring-amber-400/90 ring-inset bg-amber-950/20' 
          : 'border-[#c5a059]/25'
      } ${
        variant === 'inline'
          ? 'rounded-3xl h-[calc(100vh-100px)] arena-panel-elevated'
          : 'max-w-md h-full rounded-l-3xl border-l'
      }`}
    >
      {/* Drop Zone Visual Cue Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-[#0e121a]/90 backdrop-blur-sm border-2 border-dashed border-amber-400 rounded-3xl flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center mb-3 animate-bounce shadow-lg shadow-amber-500/20">
            <Plus className="w-8 h-8 text-amber-300" />
          </div>
          <h4 className="font-fantasy font-black text-base text-amber-200">
            Drop to Add to Decklist
          </h4>
          <p className="text-xs text-stone-300 mt-1 max-w-[220px]">
            Release anywhere to add this card to your Brawl deck!
          </p>
        </div>
      )}

      {/* Floating Drop Toast Notification */}
      {dropToast && (
        <div className={`absolute top-16 left-4 right-4 z-40 px-3 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center justify-center gap-2 border animate-in slide-in-from-top-2 duration-200 pointer-events-none ${
          dropToast.type === 'warn'
            ? 'bg-rose-950/95 text-rose-300 border-rose-700/80 shadow-rose-950/50'
            : 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-amber-500/20'
        }`}>
          <span>{dropToast.type === 'warn' ? '⚠️' : '✨'}</span>
          <span className="truncate">{dropToast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#121622] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-fantasy font-black text-sm text-white flex items-center gap-2">
              <span>Decklist</span>
              <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                totalDeckCount === targetDeckSize
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-orange-950 text-orange-300 border border-orange-700'
              }`}>
                {totalDeckCount} / {targetDeckSize}
              </span>
            </h3>
            <span className="text-[11px] text-stone-400">
              {deck.format === 'brawl' ? 'Brawl Singleton Deck' : 'Constructed Deck'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-stone-400 hover:text-amber-300 hover:bg-white/10 transition border border-transparent hover:border-white/10"
          title="Hide Decklist"
        >
          <PanelRightClose className="w-4 h-4 text-stone-400" />
          <span className="text-xs font-bold">Hide</span>
        </button>
      </div>

      {/* Card Stacks */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Commander Card Row if present */}
        {commander && (
          <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between shadow-sm">
            <div 
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
              onClick={() => onSelectCardDetail(commander)}
              onMouseEnter={() => setHoveredCard(commander)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Crown className="w-4 h-4 text-amber-400 flex-shrink-0 group-hover:scale-110 transition" />
              <div className="min-w-0">
                <span className="font-bold text-xs text-amber-300 truncate block group-hover:underline">
                  {commander.name}
                </span>
                <span className="text-[10px] text-amber-400/80 font-medium">Commander</span>
              </div>
            </div>
            <ManaCost manaCost={commander.manaCost} size="sm" />
          </div>
        )}

        {/* Empty State */}
        {deck.mainboard.length === 0 && (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-stone-500">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 border border-white/10">
              <Layers className="w-6 h-6 text-stone-400" />
            </div>
            <p className="font-fantasy font-bold text-stone-300 text-sm">Decklist is empty</p>
            <p className="text-xs text-stone-500 mt-1 max-w-[240px]">
              Drag &amp; drop cards here or click &quot;+ Add to Deck&quot; from synergies to populate your Brawl deck!
            </p>
          </div>
        )}

        {/* Grouped Mainboard Cards */}
        {Object.entries(groups).map(([groupName, cards]) => {
          if (cards.length === 0) return null;
          const count = cards.reduce((a, b) => a + b.quantity, 0);

          return (
            <div key={groupName} className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-fantasy font-bold uppercase tracking-wider text-stone-400 px-1">
                <span>{groupName}</span>
                <span className="text-stone-500 font-mono font-bold">{count}</span>
              </div>

              <div className="space-y-1">
                {cards.map(item => {
                  const { card, quantity } = item;
                  const isBasic = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'].includes(card.name);

                  return (
                    <div
                      key={card.id}
                      onMouseEnter={() => setHoveredCard(card)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className="group flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#141926] hover:bg-[#1c2335] border border-white/5 hover:border-amber-400/40 transition text-xs shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isBasic ? (
                          <div className="flex items-center gap-0.5 bg-[#0d1017] px-1 rounded border border-white/10">
                            <button
                              onClick={() => handleAdjustBasicLand(card.id, -1)}
                              className="text-stone-400 hover:text-rose-400 p-0.5 transition"
                              title="Decrease count"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="font-mono font-bold text-amber-300 w-3 text-center text-[10px]">
                              {quantity}
                            </span>
                            <button
                              onClick={() => handleAdjustBasicLand(card.id, 1)}
                              className="text-stone-400 hover:text-emerald-400 p-0.5 transition"
                              title="Increase count"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono text-stone-500 font-bold text-[10px] w-3">1</span>
                        )}

                        <button
                          onClick={() => onSelectCardDetail(card)}
                          className="font-bold text-stone-200 hover:text-amber-300 truncate text-left transition"
                        >
                          {card.name}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {card.manaCost && (
                          <ManaCost manaCost={card.manaCost} size="sm" />
                        )}

                        {!isBasic && (
                          <button
                            onClick={() => handleRemove(card.id)}
                            className="text-stone-500 hover:text-rose-400 p-0.5 opacity-0 group-hover:opacity-100 transition"
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
      <div className="p-4 border-t border-white/10 bg-[#121622] space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-400 font-medium">Crafting Cost:</span>
          <span className="text-amber-300 font-bold font-mono">
            {wildcardCost.missing.rare} Rare • {wildcardCost.missing.mythic} Mythic
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onOpenExport}
            className="btn-mythic-spark flex-1 flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-xl transition shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export for Arena</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-[#171c28] hover:bg-[#202738] text-stone-300 hover:text-white font-bold text-xs rounded-xl border border-white/10 transition"
          >
            Hide Tray
          </button>
        </div>
      </div>
    </div>
  );

  const hoverPreview = hoveredCard ? (
    <div className="fixed z-50 pointer-events-none w-56 rounded-2xl shadow-2xl border-2 border-amber-400/80 overflow-hidden bg-black/95 right-6 bottom-6 animate-in fade-in zoom-in-95 duration-150">
      <CardImage
        src={hoveredCard.imageUrl}
        cardName={hoveredCard.name}
        alt={hoveredCard.name}
        className="w-full h-auto object-cover rounded-xl"
      />
    </div>
  ) : null;

  if (variant === 'inline') {
    return (
      <>
        {panelContent}
        {hoverPreview}
      </>
    );
  }

  // Drawer variant (modal slide-in for small screens)
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full animate-in slide-in-from-right duration-200">
        {panelContent}
      </div>
      {hoverPreview}
    </div>
  );
};

export default DeckDrawer;
