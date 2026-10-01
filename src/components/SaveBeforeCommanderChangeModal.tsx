import React from 'react';
import { Card } from '../types/card';
import { Deck } from '../types/deck';
import { AlertCircle, ArrowRight, Save, Trash2, X } from 'lucide-react';

interface SaveBeforeCommanderChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeck: Deck;
  newCommander: Card;
  onSaveAndChange: () => void;
  onDiscardAndChange: () => void;
}

export const SaveBeforeCommanderChangeModal: React.FC<SaveBeforeCommanderChangeModalProps> = ({
  isOpen,
  onClose,
  currentDeck,
  newCommander,
  onSaveAndChange,
  onDiscardAndChange
}) => {
  if (!isOpen) return null;

  const currentCommander = currentDeck.commander?.card;
  const cardCount = currentDeck.mainboard.reduce((acc, c) => acc + c.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="arena-panel rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-fantasy font-black text-base text-slate-100">
                Save Changes to Deck?
              </h3>
              <p className="text-xs text-slate-400">
                Changing Commander for <strong className="text-amber-400">"{currentDeck.name}"</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 bg-[#161b26] hover:bg-[#1f2637] transition border border-[#c5a059]/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Commander Transition Preview */}
        <div className="bg-[#0e121a] border border-[#c5a059]/25 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
          {/* Current Commander */}
          <div className="flex items-center gap-2.5 min-w-0">
            {currentCommander?.imageUrl && (
              <img
                src={currentCommander.imageUrl}
                alt={currentCommander.name}
                className="w-11 h-14 object-cover rounded-lg border border-black/50 flex-shrink-0 shadow-sm bg-black"
              />
            )}
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current</span>
              <p className="text-xs font-bold text-slate-200 truncate">{currentCommander?.name || 'Current'}</p>
              <span className="text-[10px] text-amber-400 font-semibold">{cardCount} cards in deck</span>
            </div>
          </div>

          <div className="flex items-center justify-center p-1.5 rounded-full bg-[#161b26] border border-[#c5a059]/30 text-amber-400 flex-shrink-0 shadow-sm">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* New Commander */}
          <div className="flex items-center gap-2.5 min-w-0 text-right justify-end">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">New Commander</span>
              <p className="text-xs font-bold text-slate-200 truncate">{newCommander.name}</p>
              <span className="text-[10px] text-emerald-400 font-semibold">Fresh singleton list</span>
            </div>
            {newCommander.imageUrl && (
              <img
                src={newCommander.imageUrl}
                alt={newCommander.name}
                className="w-11 h-14 object-cover rounded-lg border border-amber-500/60 flex-shrink-0 shadow-sm bg-black"
              />
            )}
          </div>
        </div>

        {/* Informational Prompt */}
        <p className="text-xs text-slate-300 leading-relaxed">
          Would you like to save your current deck list to <strong className="text-amber-400">My Decks</strong> before changing commanders? Saving will verify conflicts with other saved decks so you never lose your brews.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Option 1: Save & Change */}
          <button
            onClick={onSaveAndChange}
            className="btn-mythic-spark w-full flex items-center justify-center gap-2 py-2.5 px-4 text-slate-950 font-black text-xs rounded-xl transition shadow-md hover:scale-[1.01]"
          >
            <Save className="w-4 h-4" />
            <span>Save to My Decks & Change Commander</span>
          </button>

          {/* Option 2: Don't Save & Change */}
          <button
            onClick={onDiscardAndChange}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#161b26] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-[#c5a059]/30 hover:border-rose-500/50 font-bold text-xs rounded-xl transition shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Don't Save & Change (Start Fresh)</span>
          </button>

          {/* Option 3: Cancel */}
          <button
            onClick={onClose}
            className="w-full py-1.5 text-center text-xs text-slate-400 hover:text-slate-200 font-semibold transition"
          >
            Cancel (Keep Current Deck)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveBeforeCommanderChangeModal;
