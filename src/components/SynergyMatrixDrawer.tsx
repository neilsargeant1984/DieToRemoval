import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../types/card';
import { Deck } from '../types/deck';
import { calculateSynergy, calculateDeckSynergy, SynergyMatchResult } from '../utils/synergyGraph';
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
  Flame, 
  Layers,
  Compass,
  Zap,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SynergyMatrixDrawerProps {
  commander?: Card;
  deck?: Deck;
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: Card) => void;
  userCollection: UserCollection;
}

export const SynergyMatrixDrawer: React.FC<SynergyMatrixDrawerProps> = ({
  commander,
  deck,
  isOpen,
  onClose,
  onAddCard,
  userCollection
}) => {
  const [activeTab, setActiveTab] = useState<'Creature' | 'Instant/Sorcery' | 'Artifact/Enchantment' | 'Land'>('Creature');
  const [results, setResults] = useState<SynergyMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const isBrawl = deck ? deck.format === 'brawl' : !!commander;
  const brawlCommander = isBrawl ? (commander || deck?.commander?.card) : undefined;

  // Extract non-land cards from mainboard for non-brawl decks
  const deckNonLands = useMemo(() => {
    if (!deck?.mainboard) return [];
    const map = new Map<string, Card>();
    for (const item of deck.mainboard) {
      if (!item.card.types.includes('Land') && !map.has(item.card.name)) {
        map.set(item.card.name, item.card);
      }
    }
    return Array.from(map.values());
  }, [deck?.mainboard]);

  // Derive active deck color identity
  const deckColors = useMemo(() => {
    if (isBrawl && brawlCommander) return brawlCommander.colorIdentity;
    if (!deck?.mainboard) return [];
    const set = new Set<string>();
    deck.mainboard.forEach(item => {
      (item.card.colorIdentity || []).forEach(c => set.add(c));
    });
    return Array.from(set);
  }, [isBrawl, brawlCommander, deck?.mainboard]);

  // Selected focal card in non-brawl mode ('all' for entire deck aggregate)
  const [focalCardName, setFocalCardName] = useState<string>('all');

  // Reset or initialize focal card when non-lands change
  useEffect(() => {
    if (deckNonLands.length === 1) {
      setFocalCardName(deckNonLands[0].name);
    } else if (focalCardName !== 'all' && !deckNonLands.some(c => c.name === focalCardName)) {
      setFocalCardName('all');
    }
  }, [deckNonLands, focalCardName]);

  useEffect(() => {
    if (!isOpen) return;
    if (isBrawl && !brawlCommander) return;
    if (!isBrawl && deckNonLands.length === 0) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const computeSynergies = async () => {
      try {
        const format = isBrawl ? 'brawl' : (deck?.format || 'standard');
        const effectiveCommander = isBrawl
          ? brawlCommander
          : (focalCardName !== 'all' ? deckNonLands.find(c => c.name === focalCardName) : undefined);

        // Fetch Arena-legal cards strictly scoped to legal deck / commander color identity
        const searchRes = await searchArenaCards({
          format: format === 'brawl' ? 'brawl' : format,
          commanderColorIdentity: deckColors.length > 0 ? deckColors : undefined,
          query: '-t:basic'
        });

        // Run Causal Synergy Graph against all candidate cards
        const scored: SynergyMatchResult[] = [];
        for (const candidate of searchRes.cards) {
          if (!isCardOnArena(candidate.name)) continue;

          let match: SynergyMatchResult | null = null;
          if (effectiveCommander) {
            match = calculateSynergy(effectiveCommander, candidate, deckColors);
          } else {
            match = calculateDeckSynergy(deckNonLands, candidate, deckColors);
          }

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
  }, [isOpen, isBrawl, brawlCommander, deck?.format, deckNonLands, deckColors, focalCardName]);

  if (!isOpen) return null;

  const currentFocalCard = isBrawl 
    ? brawlCommander 
    : (focalCardName !== 'all' ? deckNonLands.find(c => c.name === focalCardName) : undefined);

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

  const colorLabels = deckColors.length > 0 ? deckColors.join('/') : 'Colorless';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Causal Synergy Matrix:</span>
                <span className="text-amber-400">
                  {isBrawl 
                    ? brawlCommander?.name 
                    : (currentFocalCard ? currentFocalCard.name : (deck?.name || 'Standard Deck'))}
                </span>
              </h2>
              <span className="text-xs text-slate-400">
                AI Cause-and-Effect Analysis • Legal in {colorLabels} {isBrawl ? 'Brawl' : (deck?.format || 'Standard')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Empty Deck State for Standard */}
        {!isBrawl && deckNonLands.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
            <Compass className="w-10 h-10 text-amber-500/80 mb-1" />
            <h3 className="font-bold text-slate-200 text-base">No Cards in Deck Yet</h3>
            <p className="text-xs text-slate-400 max-w-md">
              Add a build-around card (such as Liliana, Sheoldred, or your key win condition) to your deck to calculate cause-and-effect synergies!
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow"
            >
              Back to Deck Builder
            </button>
          </div>
        )}

        {/* Focal Card Selector for Non-Brawl decks with multiple cards */}
        {!isBrawl && deckNonLands.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-300 scrollbar-thin">
            <span className="font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Target className="w-3.5 h-3.5 text-amber-400" /> Synergize with:
            </span>
            <button
              onClick={() => setFocalCardName('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition shrink-0 ${
                focalCardName === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🌐 Whole Deck ({deckNonLands.length} cards)
            </button>
            {deckNonLands.map(card => (
              <button
                key={card.id}
                onClick={() => setFocalCardName(card.name)}
                className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
                  focalCardName === card.name
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{card.name}</span>
                <span className="text-[10px] opacity-75 font-mono">{card.manaCost}</span>
              </button>
            ))}
          </div>
        )}

        {/* Category Tabs */}
        {(isBrawl ? brawlCommander : deckNonLands.length > 0) && (
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
                    isActive ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-900 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content list */}
        {(isBrawl ? brawlCommander : deckNonLands.length > 0) && (
          <div className="flex-1 overflow-y-auto pr-1 min-h-[400px] max-h-[560px]">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <p className="font-semibold text-slate-200">Analyzing Causal Synergy Graph...</p>
                <p className="text-xs text-slate-500">Matching triggers, enablers, and payoffs across Arena legal cards</p>
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
                  const explanation = explainSynergy(currentFocalCard, res);

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
        )}
      </div>
    </div>
  );
};
