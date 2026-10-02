import React, { useState } from 'react';
import { Deck, DeckCard } from '../types/deck';
import { Card, CardRarity } from '../types/card';
import { UserCollection, WildcardInventory } from '../types/collection';
import { Plus, Minus, Trash2, ArrowRightLeft, Sparkles, BookOpen, AlertTriangle } from 'lucide-react';
import { getMaxCardCopies } from '../utils/cardRules';
import { ManaCost } from './ManaCost';
import { CardImage } from './CardImage';
import { OwnershipPips } from './OwnershipPips';
import { DeckCraftingCostWidget } from './DeckCraftingCostWidget';
import { getCardOwnedCount } from '../services/ownershipService';

interface DeckListWorkspaceProps {
  deck: Deck;
  userCollection: UserCollection;
  wildcardInventory?: WildcardInventory;
  onOpenWildcardModal?: () => void;
  onUpdateCollection?: (col: UserCollection) => void;
  onUpdateDeck: (updated: Deck) => void;
  onSelectCardDetail: (card: Card) => void;
}

export const DeckListWorkspace: React.FC<DeckListWorkspaceProps> = ({
  deck,
  userCollection,
  wildcardInventory,
  onOpenWildcardModal,
  onUpdateCollection,
  onUpdateDeck,
  onSelectCardDetail
}) => {
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);

  const mainCount = deck.mainboard.reduce((acc, c) => acc + c.quantity, 0);
  const sideCount = deck.sideboard.reduce((acc, c) => acc + c.quantity, 0);

  // Group mainboard cards by category
  const categories = {
    Creatures: deck.mainboard.filter(c => c.card.types.includes('Creature')),
    Planeswalkers: deck.mainboard.filter(c => c.card.types.includes('Planeswalker')),
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

  const handleAdjustQuantity = (card: Card, delta: number, isSideboard: boolean) => {
    const list = isSideboard ? [...deck.sideboard] : [...deck.mainboard];
    const index = list.findIndex(c => c.card.id === card.id);

    if (index >= 0) {
      const current = list[index];
      const newQty = current.quantity + delta;

      if (newQty <= 0) {
        list.splice(index, 1);
      } else {
        // Enforce maximum copies allowed by MTG rules and card text
        const maxAllowed = getMaxCardCopies(card, deck.format);
        if (newQty > maxAllowed) {
          return;
        }
        list[index] = { ...current, quantity: newQty };
      }

      if (isSideboard) {
        onUpdateDeck({ ...deck, sideboard: list, updatedAt: new Date().toISOString() });
      } else {
        onUpdateDeck({ ...deck, mainboard: list, updatedAt: new Date().toISOString() });
      }
    }
  };

  const handleMoveSection = (card: Card, fromSideboard: boolean) => {
    const source = fromSideboard ? [...deck.sideboard] : [...deck.mainboard];
    const target = fromSideboard ? [...deck.mainboard] : [...deck.sideboard];

    const sourceIdx = source.findIndex(c => c.card.id === card.id);
    if (sourceIdx < 0) return;

    const [item] = source.splice(sourceIdx, 1);
    const targetIdx = target.findIndex(c => c.card.id === card.id);

    if (targetIdx >= 0) {
      target[targetIdx].quantity += item.quantity;
    } else {
      target.push(item);
    }

    if (fromSideboard) {
      onUpdateDeck({ ...deck, sideboard: source, mainboard: target, updatedAt: new Date().toISOString() });
    } else {
      onUpdateDeck({ ...deck, mainboard: source, sideboard: target, updatedAt: new Date().toISOString() });
    }
  };

  const handleRemoveCard = (card: Card, isSideboard: boolean) => {
    if (isSideboard) {
      onUpdateDeck({
        ...deck,
        sideboard: deck.sideboard.filter(c => c.card.id !== card.id),
        updatedAt: new Date().toISOString()
      });
    } else {
      onUpdateDeck({
        ...deck,
        mainboard: deck.mainboard.filter(c => c.card.id !== card.id),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const rarityGems: Record<CardRarity, string> = {
    common: 'bg-slate-400',
    uncommon: 'bg-sky-400',
    rare: 'bg-amber-400',
    mythic: 'bg-orange-500'
  };

  const renderCardRow = (item: DeckCard, isSideboard: boolean) => {
    const { card, quantity } = item;
    const isBasic = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'].includes(card.name);
    const owned = isBasic ? 4 : getCardOwnedCount(card, userCollection);
    const needsWildcards = !isBasic && owned < quantity;

    return (
      <div
        key={card.id}
        className={`group flex items-center justify-between py-1.5 px-2.5 rounded-xl border transition text-sm shadow-sm card-tile ${
          needsWildcards
            ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400 hover:bg-[#181e2b]'
            : 'bg-[#131722]/80 border-[#c5a059]/20 hover:border-amber-400/50 hover:bg-[#181e2b]'
        }`}
        onMouseEnter={() => setHoveredCard(card)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* Quantity Controls & Card Name */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex items-center bg-[#0e121a] border border-[#c5a059]/30 rounded-lg px-1 flex-shrink-0 shadow-sm">
            <button
              onClick={() => handleAdjustQuantity(card, -1, isSideboard)}
              className="text-slate-400 hover:text-rose-400 px-1 py-0.5"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-5 text-center font-black text-xs text-amber-400">
              {quantity}
            </span>
            <button
              onClick={() => handleAdjustQuantity(card, 1, isSideboard)}
              className="text-slate-400 hover:text-emerald-400 px-1 py-0.5"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${rarityGems[card.rarity]}`}
            title={`${card.rarity} card`}
          />

          <button
            onClick={() => onSelectCardDetail(card)}
            className="text-left font-bold text-slate-200 hover:text-amber-300 transition truncate text-sm flex items-center gap-1.5"
          >
            <span className="truncate">{card.name}</span>
            {card.spellbook && (
              <span title="Includes Spellbook" className="flex items-center">
                <BookOpen className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              </span>
            )}
            {card.isDigitalOnly && (
              <span title="Arena Digital Exclusive" className="flex items-center">
                <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
              </span>
            )}
          </button>
        </div>

        {/* Owned Status & Mana Cost & Actions */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <OwnershipPips
            card={card}
            userCollection={userCollection}
            size="sm"
            onCountChange={(_, updated) => onUpdateCollection?.(updated)}
          />

          {/* Wildcard deficiency badge */}
          {!isBasic && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-lg font-mono ${
                owned >= quantity
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-medium'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-500/50 font-bold'
              }`}
              title={`You own ${owned} / ${quantity} copies in MTG Arena`}
            >
              {owned >= quantity ? `${owned} owned` : `Need ${quantity - owned} WC`}
            </span>
          )}

          {card.manaCost && (
            <ManaCost manaCost={card.manaCost} size="sm" />
          )}

          {/* Action buttons (Swap section, Delete) */}
          <button
            onClick={() => handleMoveSection(card, isSideboard)}
            className="text-slate-400 hover:text-amber-400 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
            title={isSideboard ? 'Move to Mainboard' : 'Move to Sideboard'}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleRemoveCard(card, isSideboard)}
            className="text-slate-400 hover:text-rose-400 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
            title="Remove card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="arena-panel rounded-2xl p-4 shadow-xl flex flex-col h-full relative">
      {/* Workspace Header & Stats */}
      <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
        <div className="flex items-center gap-3">
          <h2 className="font-fantasy font-black text-base text-slate-100">{deck.name}</h2>
          <span className="text-xs px-3 py-0.5 rounded-full capitalize font-bold bg-[#161b26] text-amber-400 border border-[#c5a059]/30">
            {deck.format}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className={`px-2.5 py-0.5 rounded-lg border shadow-sm ${
            mainCount === 60
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
              : 'bg-[#161b26] text-slate-300 border-[#c5a059]/20'
          }`}>
            Mainboard: <strong className="text-slate-100 font-black">{mainCount}</strong> / 60
          </span>
          <span className={`px-2.5 py-0.5 rounded-lg border shadow-sm ${
            sideCount <= 15
              ? 'bg-[#161b26] text-slate-300 border-[#c5a059]/20'
              : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
          }`}>
            Sideboard: <strong className="text-slate-100 font-black">{sideCount}</strong> / 15
          </span>
        </div>
      </div>

      {/* Live Deck Crafting Cost Breakdown */}
      {wildcardInventory && (
        <div className="mt-3">
          <DeckCraftingCostWidget
            deck={deck}
            userCollection={userCollection}
            wildcardInventory={wildcardInventory}
            onOpenWildcardModal={onOpenWildcardModal || (() => {})}
          />
        </div>
      )}

      {mainCount < 60 && (
        <div className="mt-2 bg-amber-950/40 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-sm font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>MTG Arena requires a minimum of 60 cards in the mainboard for this format.</span>
        </div>
      )}

      {/* Main deck card categories */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-4 pr-1 min-h-[400px] max-h-[620px]">
        {Object.entries(categories).map(([category, cards]) => {
          if (cards.length === 0) return null;
          const catCount = cards.reduce((acc, c) => acc + c.quantity, 0);

          return (
            <div key={category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-fantasy font-bold text-[#c5a059] uppercase tracking-wider px-1">
                <span>{category} ({catCount})</span>
              </div>
              <div className="space-y-1">
                {cards.map(item => renderCardRow(item, false))}
              </div>
            </div>
          );
        })}

        {/* Sideboard Section */}
        {deck.sideboard.length > 0 && (
          <div className="pt-3 border-t border-[#c5a059]/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-fantasy font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>Sideboard ({sideCount})</span>
            </div>
            <div className="space-y-1">
              {deck.sideboard.map(item => renderCardRow(item, true))}
            </div>
          </div>
        )}

        {deck.mainboard.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <p className="font-fantasy font-bold text-slate-200">Your deck is currently empty</p>
            <p className="text-xs mt-1 text-slate-400">
              Add Arena cards from the explorer on the left or load a pre-built Meta Deck.
            </p>
          </div>
        )}
      </div>

      {/* Floating Card Art Tooltip on Hover */}
      {hoveredCard && (
        <div className="absolute right-4 bottom-4 pointer-events-none z-50 w-52 rounded-2xl shadow-2xl border-2 border-[#c5a059] overflow-hidden animate-in fade-in duration-150">
          <CardImage
            src={hoveredCard.imageUrl}
            cardName={hoveredCard.name}
            alt={hoveredCard.name}
            className="w-full h-auto object-cover rounded-xl"
          />
        </div>
      )}
    </div>
  );
};
