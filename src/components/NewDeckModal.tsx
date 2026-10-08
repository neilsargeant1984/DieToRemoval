import React from 'react';
import { FormatType } from '../types/card';
import { X, Crown, Swords, Sparkles, ArrowRight } from 'lucide-react';

interface NewDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDeck: (format: FormatType) => void;
  onFindCommander?: () => void;
}

export const NewDeckModal: React.FC<NewDeckModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreateDeck,
  onFindCommander 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0e121a] border border-[#c5a059]/40 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#c5a059]/20 bg-[#121622]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-fantasy font-black text-slate-100">Create New Deck</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-stone-400">Choose a format for your new deck:</p>
          
          {/* Brawl Container with Dual Action */}
          <div className="rounded-2xl border border-amber-500/30 bg-[#141926] p-3.5 space-y-2.5 transition hover:border-amber-400/60 shadow-lg">
            <button
              onClick={() => { onCreateDeck('brawl'); onClose(); }}
              className="w-full flex items-center gap-3.5 text-left group"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 group-hover:bg-amber-500/30 transition border border-amber-500/30 flex-shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-fantasy font-bold text-slate-100 text-base group-hover:text-amber-300 transition">
                    Brawl (100-Card)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Commander
                  </span>
                </div>
                <div className="text-xs text-stone-400 mt-0.5">
                  100-card singleton deck led by a legendary creature or planeswalker.
                </div>
              </div>
            </button>

            {onFindCommander && (
              <button
                onClick={() => { onFindCommander(); onClose(); }}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center justify-between group shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
                  <span>Find a New Commander to Build Around</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition" />
              </button>
            )}
          </div>

          {/* Standard */}
          <button
            onClick={() => { onCreateDeck('standard'); onClose(); }}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-700/60 bg-[#141926] hover:bg-[#1a2133] hover:border-sky-500/50 transition group shadow-md"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 group-hover:bg-sky-500/30 transition border border-sky-500/30 flex-shrink-0">
              <Swords className="w-6 h-6" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-fantasy font-bold text-slate-100 text-base group-hover:text-sky-300 transition">
                  Standard (60-Card)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  Competitive
                </span>
              </div>
              <div className="text-xs text-stone-400 mt-0.5">
                Constructed 60-card deck with up to 4 copies of each card.
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
