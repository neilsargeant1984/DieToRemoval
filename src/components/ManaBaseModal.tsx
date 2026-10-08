import React, { useState, useMemo } from 'react';
import { Card, ManaColor } from '../types/card';
import { Deck, DeckCard } from '../types/deck';
import { UserCollection } from '../types/collection';
import { generateOptimalManaBase } from '../utils/manaBaseOptimizer';
import { ManaCost } from './ManaCost';
import { 
  X, 
  Sparkles, 
  Mountain, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ManaBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: Deck;
  onApplyManaBase: (newLands: DeckCard[]) => void;
  onSelectCardDetail?: (card: Card) => void;
  userCollection?: UserCollection;
}

export const ManaBaseModal: React.FC<ManaBaseModalProps> = ({
  isOpen,
  onClose,
  deck,
  onApplyManaBase,
  onSelectCardDetail,
  userCollection = {}
}) => {
  const commander = deck.commander?.card;
  const isStandard = deck.format === 'standard';
  const minLandLimit = isStandard ? 18 : 30;
  const maxLandLimit = isStandard ? 30 : 44;

  const defaultLandTarget = useMemo(() => {
    if (isStandard) return 24;
    const cmdCmc = commander ? commander.cmc : 4;
    return cmdCmc <= 3 ? 36 : (cmdCmc >= 6 ? 38 : 37);
  }, [commander, isStandard]);

  const [targetCount, setTargetCount] = useState<number>(defaultLandTarget);
  const [preserveCustom, setPreserveCustom] = useState<boolean>(false);

  // Sync targetCount when format or commander changes
  React.useEffect(() => {
    setTargetCount(defaultLandTarget);
  }, [defaultLandTarget]);

  // Generate result reactively based on options
  const result = useMemo(() => {
    return generateOptimalManaBase({
      commander,
      mainboard: deck.mainboard,
      format: deck.format,
      targetLandCount: targetCount,
      preserveCustomNonBasics: preserveCustom,
      userCollection
    });
  }, [commander, deck.mainboard, deck.format, targetCount, preserveCustom, userCollection]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyManaBase(result.recommendedLands);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
    onClose();
  };

  const colorBadgeBg: Record<ManaColor, string> = {
    W: 'bg-amber-100 text-amber-900 border-amber-300',
    U: 'bg-blue-600 text-white border-blue-400',
    B: 'bg-neutral-800 text-neutral-200 border-neutral-600',
    R: 'bg-red-600 text-white border-red-400',
    G: 'bg-emerald-600 text-white border-emerald-400',
    C: 'bg-slate-700 text-slate-200 border-slate-500'
  };

  const sections = [
    { title: 'Rainbow & Multi-Color Staples', items: result.breakdown.rainbowStaples, icon: '🌈' },
    { title: 'Fetchlands & Shocklands', items: result.breakdown.fetchAndShock, icon: '⚡' },
    { title: 'Triomes & Surveil Lands', items: result.breakdown.triomesAndSurveils, icon: '🔮' },
    { title: 'Untapped Duals (Fast/Slow/Pain/Pathways)', items: result.breakdown.dualsAndPathways, icon: '🛡️' },
    { title: 'Channel, Castles & Utility Lands', items: result.breakdown.channelAndUtility, icon: '⛩️' },
    { title: 'Basic Lands (Pip Weighted)', items: result.breakdown.basics, icon: '🏔️' }
  ].filter(s => s.items.length > 0);

  const totalGeneratedLands = result.recommendedLands.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f131d] border border-[#c5a059]/40 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#141926] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide font-fantasy">
                  Arena Mana Base Optimizer
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  100% MTG Arena Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {result.tierName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {commander && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-lg border border-slate-700/80">
                <span className="text-xs font-semibold text-slate-300">{commander.name}</span>
                <ManaCost manaCost={commander.manaCost} size="sm" />
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">

          {/* Top Bar: Karsten Math & Pip Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Consistency Gauge */}
            <div className="md:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Karsten Consistency
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {result.consistencyScore}% Rating
                  </span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-200">
                  90%+ Probability on Curve
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Every card in this recommendation is verified playable in MTG Arena. Uses Frank Karsten's mana formulas to ensure your colored spells cast on curve.
                </p>
              </div>

              {/* Land Count Slider */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Target Lands:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTargetCount(Math.max(minLandLimit, targetCount - 1))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-mono font-bold text-amber-300 w-8 text-center">
                    {targetCount}
                  </span>
                  <button
                    onClick={() => setTargetCount(Math.min(maxLandLimit, targetCount + 1))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pip vs Source Distribution */}
            <div className="md:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                Deck Color Pips vs Mana Sources
              </span>

              {result.colorPips.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  Colorless Commander — All sources produce Colorless {`{C}`}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {result.colorPips.map(stat => (
                    <div key={stat.color} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center border ${colorBadgeBg[stat.color]}`}>
                        {stat.color}
                      </span>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-300">
                            {stat.pips} Pips ({stat.percentage}%)
                          </span>
                          <span className="text-amber-300 font-mono font-semibold">
                            {stat.actualSources} Sources
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                          <div 
                            style={{ width: `${Math.min(100, (stat.actualSources / targetCount) * 100)}%` }}
                            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Land Package Preview List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>Recommended Arena Lands</span>
                <span className="text-amber-400 font-mono font-bold">({totalGeneratedLands})</span>
              </h3>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200 transition">
                <input
                  type="checkbox"
                  checked={preserveCustom}
                  onChange={(e) => setPreserveCustom(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                />
                <span>Preserve non-basics already in deck</span>
              </label>
            </div>

            <div className="space-y-3">
              {sections.map(section => (
                <div key={section.title} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
                  <div className="text-xs font-semibold text-amber-300/90 mb-2 flex items-center gap-1.5">
                    <span>{section.icon}</span>
                    <span>{section.title}</span>
                    <span className="text-slate-500 text-[11px] font-mono">
                      ({section.items.reduce((s, i) => s + i.quantity, 0)})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {section.items.map(item => (
                      <div
                        key={item.card.id}
                        onClick={() => onSelectCardDetail?.(item.card)}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {item.quantity > 1 ? (
                            <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/30 flex-shrink-0">
                              {item.quantity}x
                            </span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-amber-400 transition flex-shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 truncate">
                            {item.card.name}
                          </span>
                        </div>

                        <span className="text-[10px] uppercase font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 flex-shrink-0">
                          {item.card.set}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141926] flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-slate-400">
            Total: <span className="font-bold text-white">{totalGeneratedLands} Arena Lands</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition border border-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-lg flex items-center gap-2 hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-slate-950 font-bold" />
              <span>Apply Mana Base to Deck</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
