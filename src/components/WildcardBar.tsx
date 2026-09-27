import React, { useState } from 'react';
import { DeckWildcardCost, WildcardInventory } from '../types/collection';
import { Sparkles, AlertCircle, Edit3, Check } from 'lucide-react';

interface WildcardBarProps {
  cost: DeckWildcardCost;
  inventory: WildcardInventory;
  onUpdateInventory: (newInv: WildcardInventory) => void;
  hasCollectionLoaded: boolean;
}

export const WildcardBar: React.FC<WildcardBarProps> = ({
  cost,
  inventory,
  onUpdateInventory,
  hasCollectionLoaded
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<WildcardInventory>(inventory);

  const handleSave = () => {
    onUpdateInventory(editForm);
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Summary status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Arena Crafting Cost
            </span>
            {cost.canCraftWithAvailableWildcards ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Craftable in Arena!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                {cost.missing.rare > 0 || cost.missing.mythic > 0
                  ? `Missing ${cost.missing.rare} R / ${cost.missing.mythic} M`
                  : `Missing ${cost.totalCardsMissing} cards`}
              </span>
            )}
          </div>

          {hasCollectionLoaded ? (
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
              Synced with your Collection
            </span>
          ) : (
            <span className="text-xs text-slate-500 italic">
              (Assuming 0 cards owned. Sync Player.log for true cost)
            </span>
          )}
        </div>

        {/* Middle: Wildcard counters (Common, Uncommon, Rare, Mythic) */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Common */}
          <div className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-500 border border-slate-400 shadow-sm" title="Common Wildcard" />
            <div className="text-xs">
              <span className="text-slate-400">C: </span>
              <span className="font-semibold text-slate-200">{cost.missing.common}</span>
              <span className="text-slate-600 text-[10px]"> ({inventory.common} owned)</span>
            </div>
          </div>

          {/* Uncommon */}
          <div className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <div className="w-3.5 h-3.5 rounded-full bg-sky-400 border border-sky-300 shadow-sm" title="Uncommon Wildcard" />
            <div className="text-xs">
              <span className="text-slate-400">U: </span>
              <span className="font-semibold text-slate-200">{cost.missing.uncommon}</span>
              <span className="text-slate-600 text-[10px]"> ({inventory.uncommon} owned)</span>
            </div>
          </div>

          {/* Rare */}
          <div className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-amber-900/40">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-300 shadow-sm shadow-amber-500/20" title="Rare Wildcard" />
            <div className="text-xs">
              <span className="text-amber-300/80">R: </span>
              <span className={`font-bold ${cost.missing.rare > inventory.rare ? 'text-amber-400' : 'text-slate-200'}`}>
                {cost.missing.rare}
              </span>
              <span className="text-slate-500 text-[10px]"> ({inventory.rare} owned)</span>
            </div>
          </div>

          {/* Mythic */}
          <div className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-orange-900/40">
            <div className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-orange-400 shadow-sm shadow-orange-500/30" title="Mythic Wildcard" />
            <div className="text-xs">
              <span className="text-orange-400/80">M: </span>
              <span className={`font-bold ${cost.missing.mythic > inventory.mythic ? 'text-orange-400' : 'text-slate-200'}`}>
                {cost.missing.mythic}
              </span>
              <span className="text-slate-500 text-[10px]"> ({inventory.mythic} owned)</span>
            </div>
          </div>

          {/* Edit Inventory button */}
          <button
            onClick={() => {
              setEditForm(inventory);
              setIsEditing(!isEditing);
            }}
            className="text-xs text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition flex items-center gap-1"
            title="Edit your available wildcards"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Stash</span>
          </button>
        </div>
      </div>

      {/* Popover to quickly tweak available wildcards */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3 bg-slate-950/50 p-2.5 rounded-lg animate-in fade-in">
          <span className="text-xs text-slate-300 font-medium">Your Current Arena Wildcard Stash:</span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-slate-400 font-semibold">C:</span>
              <input
                type="number"
                min="0"
                value={editForm.common}
                onChange={e => setEditForm({ ...editForm, common: parseInt(e.target.value) || 0 })}
                className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-sky-400 font-semibold">U:</span>
              <input
                type="number"
                min="0"
                value={editForm.uncommon}
                onChange={e => setEditForm({ ...editForm, uncommon: parseInt(e.target.value) || 0 })}
                className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-amber-400 font-semibold">R:</span>
              <input
                type="number"
                min="0"
                value={editForm.rare}
                onChange={e => setEditForm({ ...editForm, rare: parseInt(e.target.value) || 0 })}
                className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-orange-400 font-semibold">M:</span>
              <input
                type="number"
                min="0"
                value={editForm.mythic}
                onChange={e => setEditForm({ ...editForm, mythic: parseInt(e.target.value) || 0 })}
                className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </label>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded text-xs transition"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
