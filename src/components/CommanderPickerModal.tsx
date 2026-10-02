import React, { useState, useEffect } from 'react';
import { Card } from '../types/card';
import { searchArenaCards, buildSmartSearchQuery } from '../services/scryfallService';
import { X, Crown, Search, Loader2 } from 'lucide-react';
import { CardImage } from './CardImage';

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

    let isCancelled = false;
    const term = searchTerm.trim();

    const timer = setTimeout(async () => {
      try {
        // Build flexible query matching card name or creature/card types (e.g. sphinx, goblin)
        const scryfallQuery = term ? buildSmartSearchQuery(term) : undefined;

        const result = await searchArenaCards({
          query: scryfallQuery,
          isCommander: true,
          format: 'brawl'
        });

        if (isCancelled) return;

        // Flexible client filtering: matches card name, type line, subtypes, or oracle text
        if (term) {
          const lowerTerm = term.toLowerCase();
          const tokens = lowerTerm.replace(/[,']/g, ' ').split(/\s+/).filter(Boolean);
          const filtered = result.cards.filter(c => {
            const name = c.name.toLowerCase();
            const typeLine = (c.typeLine || '').toLowerCase();
            const subtypes = (c.subtypes || []).map(s => s.toLowerCase());
            const oracle = (c.oracleText || '').toLowerCase();

            return tokens.every(t =>
              name.includes(t) ||
              typeLine.includes(t) ||
              subtypes.some(s => s.includes(t)) ||
              oracle.includes(t)
            );
          });
          setCommanders(filtered);
        } else {
          setCommanders(result.cards);
        }
      } catch (err) {
        console.error('Error fetching commanders:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, delay);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="arena-panel rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="font-fantasy font-black text-lg text-slate-100">Select Any MTG Arena Commander</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-full bg-[#161b26] hover:bg-[#1f2637] transition border border-[#c5a059]/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Pick any legendary creature or planeswalker available on MTG Arena. The deckbuilder will automatically lock your color identity, optimize your ramp curve, and find synergistic cards.
        </p>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, creature type (e.g. Sphinx, Goblin, Atraxa, Nicol Bolas)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0e121a] border border-[#c5a059]/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition shadow-inner"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>

        {/* Commanders Grid */}
        <div className="flex-1 overflow-y-auto min-h-[360px] max-h-[500px] pr-1">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="font-semibold text-slate-200">Searching Arena Commanders...</p>
            </div>
          ) : commanders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <p className="font-semibold text-slate-200">No commanders found</p>
              <p className="text-xs text-slate-500">
                {searchTerm.trim() ? `No commanders match "${searchTerm}".` : 'No commanders available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {commanders.map(cmd => (
                <div
                  key={cmd.id}
                  onClick={() => {
                    onSelectCommander(cmd);
                    onClose();
                  }}
                  className="card-tile group rounded-2xl overflow-hidden p-2.5 transition cursor-pointer flex flex-col justify-between bg-[#131722]/90 border border-[#c5a059]/25 hover:border-amber-400/60 hover:scale-[1.02]"
                >
                  <div className="rounded-xl overflow-hidden shadow border border-black/50 mb-2 bg-black">
                    <CardImage
                      src={cmd.imageUrl}
                      cardName={cmd.name}
                      alt={cmd.name}
                      className="w-full h-auto object-cover group-hover:brightness-105 transition"
                    />
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 truncate group-hover:text-amber-300 transition">
                        {cmd.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                      <span className="font-mono text-amber-400">{cmd.manaCost}</span>
                      <div className="flex items-center gap-0.5">
                        {cmd.colorIdentity.map(c => (
                          <span
                            key={c}
                            className="w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center bg-[#0e121a] border border-[#c5a059]/30 text-amber-300"
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

export default CommanderPickerModal;
