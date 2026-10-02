import React, { useState, useEffect } from 'react';
import { WildcardInventory } from '../types/collection';
import { X, Sparkles, Check, Plus, Minus, ShieldCheck, RotateCcw } from 'lucide-react';

interface WildcardPopoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  wildcardInventory: WildcardInventory;
  onUpdateWildcards: (inventory: WildcardInventory) => void;
}

export const WildcardPopoverModal: React.FC<WildcardPopoverModalProps> = ({
  isOpen,
  onClose,
  wildcardInventory,
  onUpdateWildcards
}) => {
  const [mythic, setMythic] = useState(wildcardInventory?.mythic || 0);
  const [rare, setRare] = useState(wildcardInventory?.rare || 0);
  const [uncommon, setUncommon] = useState(wildcardInventory?.uncommon || 0);
  const [common, setCommon] = useState(wildcardInventory?.common || 0);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (wildcardInventory) {
      setMythic(wildcardInventory.mythic || 0);
      setRare(wildcardInventory.rare || 0);
      setUncommon(wildcardInventory.uncommon || 0);
      setCommon(wildcardInventory.common || 0);
    }
  }, [wildcardInventory, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateWildcards({
      mythic: Math.max(0, mythic),
      rare: Math.max(0, rare),
      uncommon: Math.max(0, uncommon),
      common: Math.max(0, common)
    });
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
      onClose();
    }, 400);
  };

  const handleClearAll = () => {
    setMythic(0);
    setRare(0);
    setUncommon(0);
    setCommon(0);
  };

  const wildcardsList = [
    {
      label: 'Mythic Rare',
      short: 'Mythic',
      colorText: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/30',
      iconBg: 'bg-gradient-to-br from-orange-400 to-amber-600',
      value: mythic,
      setValue: setMythic
    },
    {
      label: 'Rare',
      short: 'Rare',
      colorText: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      iconBg: 'bg-gradient-to-br from-yellow-300 to-amber-500',
      value: rare,
      setValue: setRare
    },
    {
      label: 'Uncommon',
      short: 'Uncommon',
      colorText: 'text-sky-300',
      bgColor: 'bg-sky-500/10 border-sky-500/30',
      iconBg: 'bg-gradient-to-br from-sky-300 to-blue-500',
      value: uncommon,
      setValue: setUncommon
    },
    {
      label: 'Common',
      short: 'Common',
      colorText: 'text-stone-300',
      bgColor: 'bg-stone-500/10 border-stone-500/30',
      iconBg: 'bg-gradient-to-br from-stone-300 to-stone-500',
      value: common,
      setValue: setCommon
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="sanctum-panel rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden border border-[#c5a059]/40 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-fantasy font-black text-lg text-stone-900">
                Wildcard Inventory
              </h3>
              <p className="text-[11px] text-stone-500">
                Set your MTG Arena in-game wildcard balances
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wildcard rows */}
        <div className="space-y-2.5">
          {wildcardsList.map(wc => (
            <div
              key={wc.label}
              className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#e5d8b8] shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-lg ${wc.iconBg} flex items-center justify-center text-slate-950 font-black text-xs shadow-sm`}>
                  {wc.short[0]}
                </div>
                <span className="font-bold text-xs text-stone-800">
                  {wc.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => wc.setValue(Math.max(0, wc.value - 1))}
                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-sm transition"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <input
                  type="number"
                  min="0"
                  max="999"
                  value={wc.value}
                  onChange={e => wc.setValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-14 text-center font-mono font-bold text-sm bg-stone-50 border border-stone-200 rounded-lg py-1 text-stone-900 focus:outline-none focus:border-amber-500 shadow-inner"
                />

                <button
                  type="button"
                  onClick={() => wc.setValue(wc.value + 1)}
                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-sm transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info notice */}
        <div className="bg-[#faf6ed] p-3 rounded-xl border border-[#e8dfc8] text-[11px] text-stone-600 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            When building decks, DieToRemoval compares your collection against your wildcards to tell you exactly how many are required to craft any deck.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#e5d8b8]">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-rose-700 font-bold transition px-2 py-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to 0</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
          >
            {justSaved ? <Check className="w-4 h-4" /> : null}
            <span>{justSaved ? 'Saved!' : 'Save Wildcards'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WildcardPopoverModal;
