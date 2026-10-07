import React, { useState, useEffect } from 'react';
import { Card } from '../types/card';
import { calculateSynergy, SynergyMatchResult } from '../utils/synergyGraph';
import { explainSynergy } from '../utils/synergyExplainer';
import { searchArenaCards } from '../services/scryfallService';
import { isCardOnArena } from '../services/ownershipService';
import { UserCollection } from '../types/collection';
import { CardImage } from './CardImage';
import { 
  X, 
  Sparkles, 
  Plus, 
  Loader2, 
  Check, 
  Layers, 
  Flame, 
  ShieldCheck, 
  HelpCircle,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SynergyMatrixDrawerProps {
  commander?: Card;
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: Card) => void;
  userCollection: UserCollection;
}

export const SynergyMatrixDrawer: React.FC<SynergyMatrixDrawerProps> = ({
  commander,
  isOpen,
  onClose,
  onAddCard,
  userCollection
}) => {
  const [activeTab, setActiveTab] = useState<'Creature' | 'Instant/Sorcery' | 'Artifact/Enchantment' | 'Land'>('Creature');
  const [results, setResults] = useState<SynergyMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen || !commander) return;

    setIsLoading(true);

    const computeSynergies = async () => {
      try {
        // Query legal cards in Commander's Color Identity on MTG Arena
        const searchRes = await searchArenaCards({
          format: 'brawl',
          commanderColorIdentity: commander.colorIdentity,
          query: '-t:basic'
        });

        // Run Causal Synergy Graph against all candidates
        const scored: SynergyMatchResult[] = [];
        for (const candidate of searchRes.cards) {
          if (!isCardOnArena(candidate.name)) continue;
          const match = calculateSynergy(commander, candidate);
          if (match) {
            scored.push(match);
          }
        }

        // Sort descending by synergy score
        scored.sort((a, b) => b.score - a.score);
        setResults(scored);
      } catch (err) {
        console.error('Failed to compute synergies:', err);
      } finally {
        setIsLoading(false);
      }
    };

    computeSynergies();
  }, [isOpen, commander]);

  if (!isOpen || !commander) return null;

  const filtered = results.filter(r => r.category === activeTab);

  const handleAdd = (card: Card) => {
    onAddCard(card);
    setAddedIds(prev => new Set(prev).add(card.id));
    confetti({ particleCount: 30, spread: 40 });
  };

  const tabs = [
    { id: 'Creature' as const, label: 'Creatures', icon: '🗡️' },
    { id: 'Instant/Sorcery' as const, label: 'Instants & Sorceries', icon: '⚡' },
    { id: 'Artifact/Enchantment' as const, label: 'Artifacts & Enchantments', icon: '🛡️' },
    { id: 'Land' as const, label: 'Lands', icon: '🏔️' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Causal Synergy Matrix:</span>
                <span className="text-amber-400">{commander.name}</span>
              </h2>
              <span className="text-xs text-slate-400">
                AI Cause-and-Effect Analysis • Legal in {commander.colorIdentity.join('/') || 'Colorless'} Identity
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          {tabs.map(t => {
            const count = results.filter(r => r.category === t.id).length;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-900 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[400px] max-h-[560px]">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="font-semibold text-slate-200">Analyzing Causal Synergy Graph...</p>
              <p className="text-xs text-slate-500">Matching Enablers vs Payoffs across MTG Arena catalog</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Flame className="w-8 h-8 text-slate-600 mb-2" />
              <p className="font-semibold text-slate-400">No {activeTab.toLowerCase()} synergies found</p>
              <p className="text-xs mt-1">Check other categories above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(res => {
                const { card, score } = res;
                const isOwned = (userCollection[card.arenaId] || 0) > 0;
                const isAdded = addedIds.has(card.id);
                const explanation = explainSynergy(commander, res);

                return (
                  <div
                    key={card.id}
                    className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 rounded-xl p-3 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group shadow-md"
                  >
                    {/* Left: Thumbnail & Card Specs */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <CardImage
                        src={card.imageUrl}
                        cardName={card.name}
                        alt={card.name}
                        className="w-12 h-16 object-cover rounded-md border border-slate-800 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition truncate">
                            {card.name}
                          </span>
                          <span className="text-xs font-mono text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {card.manaCost}
                          </span>
                          {isOwned && (
                            <span className="text-[10px] px-2 py-0.2 rounded font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                              Owned
                            </span>
                          )}
                        </div>

                        {/* Natural Language Explanation Box */}
                        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg px-2.5 py-1 text-xs text-slate-300 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{explanation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Score Pill & Quick Add Button */}
                    <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80">
                      <div className="text-center px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Synergy</span>
                        <span className="text-xs font-extrabold text-amber-300">{score}%</span>
                      </div>

                      <button
                        onClick={() => handleAdd(card)}
                        disabled={isAdded}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition shadow ${
                          isAdded
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:scale-105'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Deck</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
