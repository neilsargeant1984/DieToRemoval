import React, { useState } from 'react';
import { Deck } from '../types/deck';
import { AlertTriangle, Plus, X } from 'lucide-react';

interface SaveDeckConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckToSave: Deck;
  conflictingDeck: Deck;
  onOverwrite: () => void;
  onSaveAsNew: (newName: string) => void;
}

export const SaveDeckConflictModal: React.FC<SaveDeckConflictModalProps> = ({
  isOpen,
  onClose,
  deckToSave,
  conflictingDeck,
  onOverwrite,
  onSaveAsNew
}) => {
  const [newName, setNewName] = useState<string>(() => {
    return `${deckToSave.name} (Variant)`;
  });

  if (!isOpen) return null;

  const commanderName = deckToSave.commander?.card.name || 'this commander';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="arena-panel rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-fantasy font-black text-base text-slate-100">
                Commander Conflict Detected
              </h3>
              <span className="text-xs text-amber-400 font-bold">
                "{conflictingDeck.name}" already uses {commanderName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 bg-[#161b26] hover:bg-[#1f2637] transition border border-[#c5a059]/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conflict Explainer */}
        <div className="bg-[#0e121a] border border-[#c5a059]/25 rounded-2xl p-4 space-y-2 text-xs text-slate-300 shadow-sm">
          <p>
            You already have a saved deck named <strong className="text-amber-400">"{conflictingDeck.name}"</strong> with the same Commander ({commanderName}).
          </p>
          <p className="text-slate-400">
            Would you like to overwrite your existing deck list, or save this list as a new separate brew?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3.5">
          {/* Option A: Overwrite Existing Deck */}
          <div className="bg-[#131722] border border-[#c5a059]/25 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div>
              <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                <span>Overwrite Existing Deck</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Replaces "{conflictingDeck.name}" ({conflictingDeck.mainboard.length} cards) with your current list ({deckToSave.mainboard.length} cards).
              </p>
            </div>
            <button
              onClick={() => {
                onOverwrite();
                onClose();
              }}
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition shadow flex-shrink-0"
            >
              Overwrite
            </button>
          </div>

          {/* Option B: Save as New Deck */}
          <div className="bg-[#161b26] border border-amber-500/40 rounded-2xl p-4 space-y-2.5 shadow-sm">
            <div>
              <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                <span>Save as New Brew</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Keeps your previous deck untouched and creates a new entry in My Decks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="New Deck Name"
                className="flex-1 bg-[#0e121a] border border-[#c5a059]/30 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 shadow-inner"
              />
              <button
                onClick={() => {
                  if (newName.trim()) {
                    onSaveAsNew(newName.trim());
                    onClose();
                  }
                }}
                disabled={!newName.trim()}
                className="btn-mythic-spark px-4 py-2 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl transition shadow-md flex items-center gap-1.5 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save as New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cancel */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveDeckConflictModal;
