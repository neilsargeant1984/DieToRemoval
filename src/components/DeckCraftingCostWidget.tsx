import React from 'react';
import { Deck } from '../types/deck';
import { UserCollection, WildcardInventory } from '../types/collection';
import { calculateDeckCraftingCost } from '../services/ownershipService';
import { Sparkles, CheckCircle2, AlertCircle, Edit3, ShieldAlert } from 'lucide-react';

interface DeckCraftingCostWidgetProps {
  deck: Deck;
  userCollection?: UserCollection;
  wildcardInventory?: WildcardInventory;
  onOpenWildcardModal: () => void;
}

export const DeckCraftingCostWidget: React.FC<DeckCraftingCostWidgetProps> = ({
  deck,
  userCollection = {},
  wildcardInventory = { common: 0, uncommon: 0, rare: 0, mythic: 0 },
  onOpenWildcardModal
}) => {
  const cost = calculateDeckCraftingCost(deck, userCollection, wildcardInventory);

  const totalRequired = cost.required.mythic + cost.required.rare + cost.required.uncommon + cost.required.common;

  if (totalRequired === 0) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="font-fantasy font-black text-emerald-300 block">
              100% Owned in Collection
            </span>
            <span className="text-[11px] text-emerald-200/70">
              You own all cards required to play this brew in MTG Arena!
            </span>
          </div>
        </div>

        <button
          onClick={onOpenWildcardModal}
          className="text-[10px] font-bold text-emerald-300 hover:text-emerald-100 flex items-center gap-1 hover:underline shrink-0"
        >
          <span>Wildcards</span>
          <Edit3 className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-3.5 border text-xs shadow-md transition-all ${
      cost.canCraft 
        ? 'bg-[#121622] border-amber-500/40' 
        : 'bg-[#181119] border-rose-500/30'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-1.5 font-fantasy font-black text-sm text-stone-100">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Deck Crafting Cost</span>
          </div>
          <span className="text-[11px] text-stone-400">
            {cost.canCraft ? (
              <span className="text-emerald-400 font-bold">✓ Craftable with your current Wildcard vault</span>
            ) : (
              <span className="text-rose-400 font-medium">Missing wildcards to craft in MTG Arena</span>
            )}
          </span>
        </div>

        {/* Wildcards Needed Breakdown */}
        <div className="flex items-center gap-2 flex-wrap">
          {cost.required.mythic > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40 font-mono font-bold text-xs" title="Mythic Wildcards Needed">
              {cost.required.mythic}M
            </span>
          )}
          {cost.required.rare > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-xs" title="Rare Wildcards Needed">
              {cost.required.rare}R
            </span>
          )}
          {cost.required.uncommon > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono font-bold text-xs" title="Uncommon Wildcards Needed">
              {cost.required.uncommon}U
            </span>
          )}
          {cost.required.common > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-stone-500/20 text-stone-300 border border-stone-500/40 font-mono font-bold text-xs" title="Common Wildcards Needed">
              {cost.required.common}C
            </span>
          )}
        </div>
      </div>

      {/* Available Vault Comparison */}
      <div className="flex items-center justify-between pt-2.5 text-[11px] text-stone-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-stone-500 font-bold uppercase text-[10px]">Your Vault:</span>
          <span>{wildcardInventory.rare || 0}R</span>
          <span>•</span>
          <span>{wildcardInventory.mythic || 0}M</span>
          <span>•</span>
          <span>{wildcardInventory.uncommon || 0}U</span>
          <span>•</span>
          <span>{wildcardInventory.common || 0}C</span>
        </div>

        <button
          onClick={onOpenWildcardModal}
          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition hover:underline"
        >
          <span>Edit Vault</span>
          <Edit3 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default DeckCraftingCostWidget;
