import React, { useState, useEffect } from 'react';
import { WildcardInventory } from '../types/collection';
import { X, Sparkles, Check, Plus, Minus, Info } from 'lucide-react';

interface WildcardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: WildcardInventory;
  onSaveInventory: (newInventory: WildcardInventory) => void;
}

export const WildcardEditModal: React.FC<WildcardEditModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onSaveInventory
}) => {
  const [common, setCommon] = useState(inventory.common);
  const [uncommon, setUncommon] = useState(inventory.uncommon);
  const [rare, setRare] = useState(inventory.rare);
  const [mythic, setMythic] = useState(inventory.mythic);

  useEffect(() => {
    if (isOpen) {
      setCommon(inventory.common);
      setUncommon(inventory.uncommon);
      setRare(inventory.rare);
      setMythic(inventory.mythic);
    }
  }, [isOpen, inventory]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveInventory({
      common: Math.max(0, common),
      uncommon: Math.max(0, uncommon),
      rare: Math.max(0, rare),
      mythic: Math.max(0, mythic)
    });
    onClose();
  };

  const tiers = [
    {
      id: 'common',
      name: 'Common Wildcards',
      count: common,
      setCount: setCommon,
      color: 'bg-stone-400',
      textColor: 'text-stone-300',
      borderColor: 'border-stone-500/30',
      bgGlow: 'bg-stone-500/10'
    },
    {
      id: 'uncommon',
      name: 'Uncommon Wildcards',
      count: uncommon,
      setCount: setUncommon,
      color: 'bg-cyan-400 shadow-cyan-400/50',
      textColor: 'text-cyan-300',
      borderColor: 'border-cyan-500/40',
      bgGlow: 'bg-cyan-500/10'
    },
    {
      id: 'rare',
      name: 'Rare Wildcards',
      count: rare,
      setCount: setRare,
      color: 'bg-amber-400 shadow-amber-400/50',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-500/40',
      bgGlow: 'bg-amber-500/10'
    },
    {
      id: 'mythic',
      name: 'Mythic Wildcards',
      count: mythic,
      setCount: setMythic,
      color: 'bg-orange-500 shadow-orange-500/60',
      textColor: 'text-orange-300',
      borderColor: 'border-orange-500/40',
      bgGlow: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0f1420] border border-[#c5a059]/40 rounded-2xl shadow-2xl p-6 text-stone-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/40">
            <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h2 className="text-base font-fantasy font-black tracking-wide text-white">
              MANAGE WILDCARD STASH
            </h2>
            <p className="text-xs text-stone-400">
              Set your actual MTG Arena wildcards for brewing accuracy
            </p>
          </div>
        </div>

        {/* Tip Box */}
        <div className="mb-5 p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-stone-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            These counts are compared against decklists when you brew, showing exactly how many cards you need to craft in MTG Arena.
          </span>
        </div>

        {/* Inventory Rows */}
        <div className="space-y-3 mb-6">
          {tiers.map(tier => (
            <div
              key={tier.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${tier.borderColor} ${tier.bgGlow} transition`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-3.5 h-3.5 rounded-full shadow-md ${tier.color}`} />
                <span className={`text-xs font-bold ${tier.textColor}`}>
                  {tier.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => tier.setCount(prev => Math.max(0, prev - 1))}
                  className="w-7 h-7 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 flex items-center justify-center text-stone-300 hover:text-white transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <input
                  type="number"
                  min="0"
                  max="999"
                  value={tier.count}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    tier.setCount(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-14 text-center font-mono font-bold text-sm bg-black/60 border border-white/10 rounded-lg py-1 text-white focus:outline-none focus:border-amber-400"
                />

                <button
                  type="button"
                  onClick={() => tier.setCount(prev => prev + 1)}
                  className="w-7 h-7 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 flex items-center justify-center text-stone-300 hover:text-white transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-stone-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/25 transition"
          >
            <Check className="w-4 h-4" />
            <span>Save Stash</span>
          </button>
        </div>
      </div>
    </div>
  );
};
