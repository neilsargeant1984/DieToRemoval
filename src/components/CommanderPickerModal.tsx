import React, { useState, useEffect } from 'react';
import { Card } from '../types/card';
import { searchArenaCards } from '../services/scryfallService';
import { X, Crown, Search, Loader2, Sparkles } from 'lucide-react';

interface CommanderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommander: (card: Card) => void;
}

export const CommanderPickerModal: React.FC<CommanderPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectCommander
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [commanders, setCommanders] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    const delay = searchTerm.trim() ? 320 : 50;

    const timer = setTimeout(async () => {
      try {
        // Query specifically for legendary creatures and planeswalkers on MTG Arena
        const queryPart = searchTerm.trim() 
          ? `(t:legendary t:creature or t:planeswalker) ${searchTerm.trim()}`
          : `(t:legendary t:creature or t:planeswalker)`;

        const result = await searchArenaCards({
          query: queryPart,
          format: 'brawl'
        });
        setCommanders(result.cards);
      } catch (err) {
        console.error('Error fetching commanders:', err);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isOpen, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Select Any MTG Arena Commander</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Pick any legendary creature or planeswalker available on MTG Arena. The deckbuilder will automatically lock your color identity, optimize your ramp curve, and find synergistic cards.
        </p>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search any Commander (e.g. Rusko, Nicol Bolas, Atraxa, Sheoldred, Etali)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>

        {/* Commanders Grid */}
        <div className="flex-1 overflow-y-auto min-h-[360px] max-h-[500px] pr-1">
          {isLoading && commanders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="font-semibold text-slate-300">Searching Arena Commanders...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {commanders.map(cmd => (
                <div
                  key={cmd.id}
                  onClick={() => {
                    onSelectCommander(cmd);
                    onClose();
                  }}
                  className="group bg-slate-950/70 border border-slate-800 hover:border-amber-400 rounded-xl overflow-hidden p-2 transition cursor-pointer flex flex-col justify-between hover:scale-[1.02] shadow-lg"
                >
                  <img
                    src={cmd.imageUrl}
                    alt={cmd.name}
                    className="w-full h-auto object-cover rounded-lg border border-slate-800/80 group-hover:border-slate-700"
                  />
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 truncate group-hover:text-amber-300 transition">
                        {cmd.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                      <span>{cmd.manaCost}</span>
                      <div className="flex items-center gap-0.5">
                        {cmd.colorIdentity.map(c => (
                          <span
                            key={c}
                            className="w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-200"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
