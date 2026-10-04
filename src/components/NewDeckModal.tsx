import React from 'react';
import { FormatType } from '../types/card';
import { X, Crown, Swords } from 'lucide-react';

interface NewDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDeck: (format: FormatType) => void;
}

export const NewDeckModal: React.FC<NewDeckModalProps> = ({ isOpen, onClose, onCreateDeck }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100">Create New Deck</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-400 mb-4">Choose a format for your new deck:</p>
          
          <button
            onClick={() => { onCreateDeck('brawl'); onClose(); }}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-amber-500/50 transition group"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <Crown className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-100 text-lg">Brawl (100-Card)</div>
              <div className="text-xs text-slate-400">Choose a Commander and build a singleton deck.</div>
            </div>
          </button>

          <button
            onClick={() => { onCreateDeck('standard'); onClose(); }}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-blue-500/50 transition group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
              <Swords className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-100 text-lg">Standard (60-Card)</div>
              <div className="text-xs text-slate-400">Build a competitive deck with up to 4 copies of each card.</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
