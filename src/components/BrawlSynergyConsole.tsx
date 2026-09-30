import React, { useState, useEffect } from 'react';
import { Card } from '../types/card';
import { calculateSynergy, SynergyMatchResult } from '../utils/synergyGraph';
import { explainSynergy } from '../utils/synergyExplainer';
import { searchArenaCards } from '../services/scryfallService';
import { classifyCardRoles } from '../utils/roleClassifier';
import { UserCollection } from '../types/collection';
import { 
  Sparkles, 
  Plus, 
  Check, 
  Loader2, 
  Flame, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  Zap,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type SynergyCategoryTab = 
  | 'creatures' 
  | 'instants' 
  | 'sorceries' 
  | 'artifacts' 
  | 'enchantments' 
  | 'planeswalkers' 
  | 'lands' 
  | 'ramp'
  | 'protection'
  | 'removal'
  | 'board_wipe'
  | 'card_draw';

interface BrawlSynergyConsoleProps {
  commander?: Card;
  onAddCard: (card: Card) => void;
  onSelectCardDetail: (card: Card) => void;
  userCollection: UserCollection;
  deckCardIds: Set<string>;
  activeTab?: SynergyCategoryTab;
  onSelectTab?: (tab: SynergyCategoryTab) => void;
}

export const BrawlSynergyConsole: React.FC<BrawlSynergyConsoleProps> = ({
  commander,
  onAddCard,
  onSelectCardDetail,
  userCollection,
  deckCardIds,
  activeTab: controlledTab,
  onSelectTab
}) => {
  const [internalTab, setInternalTab] = useState<SynergyCategoryTab>('creatures');
  const activeTab = controlledTab || internalTab;

  const handleTabChange = (tab: SynergyCategoryTab) => {
    if (onSelectTab) {
      onSelectTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const [candidates, setCandidates] = useState<Card[]>([]);
  const [scoredSynergies, setScoredSynergies] = useState<SynergyMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch candidate cards for the Commander's Color Identity across all functional archetypes
  useEffect(() => {
    if (!commander) {
      setCandidates([]);
      setScoredSynergies([]);
      return;
    }

    setIsLoading(true);

    const fetchPool = async () => {
      try {
        // Query general legal cards + specific role pools concurrently
        const [generalRes, rampRes, removalRes, wipeRes, protRes] = await Promise.allSettled([
          searchArenaCards({
            format: 'brawl',
            commanderColorIdentity: commander.colorIdentity,
            query: '-t:basic'
          }),
          searchArenaCards({
            format: 'brawl',
            commanderColorIdentity: commander.colorIdentity,
            roleFilter: 'ramp'
          }),
          searchArenaCards({
            format: 'brawl',
            commanderColorIdentity: commander.colorIdentity,
            roleFilter: 'removal'
          }),
          searchArenaCards({
            format: 'brawl',
            commanderColorIdentity: commander.colorIdentity,
            roleFilter: 'board_wipe'
          }),
          searchArenaCards({
            format: 'brawl',
            commanderColorIdentity: commander.colorIdentity,
            roleFilter: 'protection'
          })
        ]);

        const cardMap = new Map<string, Card>();

        const addCards = (res: PromiseSettledResult<{ cards: Card[] }>) => {
          if (res.status === 'fulfilled' && res.value?.cards) {
            for (const c of res.value.cards) {
              if (!cardMap.has(c.id)) {
                cardMap.set(c.id, c);
              }
            }
          }
        };

        addCards(generalRes);
        addCards(rampRes);
        addCards(removalRes);
        addCards(wipeRes);
        addCards(protRes);

        const allCards = Array.from(cardMap.values());
        setCandidates(allCards);

        // Run Causal Synergy Graph
        const scored: SynergyMatchResult[] = [];
        for (const c of allCards) {
          const match = calculateSynergy(commander, c);
          if (match) {
            scored.push(match);
          } else {
            // Also include functional role staples (e.g. Arcane Signet, Ramp, Removal, Wipes)
            const role = classifyCardRoles(c);
            if (role.roles.length > 0) {
              scored.push({
                card: c,
                score: 75,
                matchReasons: [role.explanation[0] || 'Functional Role Staple'],
                category: c.types.includes('Creature') 
                  ? 'Creature' 
                  : (c.types.includes('Instant') || c.types.includes('Sorcery') ? 'Instant/Sorcery' : (c.types.includes('Land') ? 'Land' : 'Artifact/Enchantment'))
              });
            }
          }
        }

        // Sort descending by score
        scored.sort((a, b) => b.score - a.score);
        setScoredSynergies(scored);
      } catch (err) {
        console.error('Error computing synergies for commander:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPool();
  }, [commander]);

  if (!commander) return null;

  // Filter based on active tab
  const getTabResults = (): { card: Card; score: number; reason: string }[] => {
    return scoredSynergies
      .filter(item => {
        const c = item.card;
        if (activeTab === 'creatures') return c.types.includes('Creature');
        if (activeTab === 'instants') return c.types.includes('Instant');
        if (activeTab === 'sorceries') return c.types.includes('Sorcery');
        if (activeTab === 'artifacts') return c.types.includes('Artifact') && !c.types.includes('Creature');
        if (activeTab === 'enchantments') return c.types.includes('Enchantment') && !c.types.includes('Creature');
        if (activeTab === 'planeswalkers') return c.types.includes('Planeswalker');
        if (activeTab === 'lands') return c.types.includes('Land');
        
        const roles = classifyCardRoles(c);
        if (activeTab === 'ramp') return roles.roles.includes('ramp');
        if (activeTab === 'protection') return roles.roles.includes('protection');
        if (activeTab === 'removal') return roles.roles.includes('removal');
        if (activeTab === 'board_wipe') return roles.roles.includes('board_wipe');
        if (activeTab === 'card_draw') return roles.roles.includes('card_advantage');
        
        return false;
      })
      .map(item => ({
        card: item.card,
        score: item.score,
        reason: explainSynergy(commander, item)
      }));
  };

  const currentTabList = getTabResults();

  const handleAdd = (card: Card) => {
    onAddCard(card);
    confetti({ particleCount: 30, spread: 45 });
  };

  const tabs: { id: SynergyCategoryTab; label: string; icon: string }[] = [
    { id: 'creatures', label: 'Creatures', icon: '🗡️' },
    { id: 'instants', label: 'Instants', icon: '⚡' },
    { id: 'sorceries', label: 'Sorceries', icon: '📜' },
    { id: 'artifacts', label: 'Artifacts', icon: '🛡️' },
    { id: 'enchantments', label: 'Enchantments', icon: '✨' },
    { id: 'planeswalkers', label: 'Planeswalkers', icon: '👑' },
    { id: 'lands', label: 'Lands', icon: '🏔️' },
    { id: 'ramp', label: 'Ramp', icon: '💎' },
    { id: 'protection', label: 'Protection', icon: '🛡️' },
    { id: 'removal', label: 'Removal', icon: '🎯' },
    { id: 'board_wipe', label: 'Board Wipes', icon: '💣' },
    { id: 'card_draw', label: 'Card Draw', icon: '📖' }
  ];

  return (
    <div className="bg-[#10141d]/90 border border-[#232b3d] rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#232b3d]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <span>Brawl Synergy Console</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {commander.name}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Causal recommendations filtered strictly for {commander.colorIdentity.join('/') || 'Colorless'} legal cards on MTG Arena
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {currentTabList.length} cards matched
        </span>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-[#151a24] text-slate-400 hover:text-slate-200 hover:bg-[#1f2636] border border-[#262f42]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Cards Visual Grid (Clean In-Game Presentation) */}
      <div className="min-h-[420px]">
        {isLoading ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="font-semibold text-slate-200">Evaluating Causal Synergies...</p>
            <p className="text-xs text-slate-500">Checking triggers, payoffs, and Arena legalities</p>
          </div>
        ) : currentTabList.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Flame className="w-8 h-8 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No {activeTab} synergies found</p>
            <p className="text-xs text-slate-500 mt-1">Try switching to other tabs above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {currentTabList.map(item => {
              const { card, score, reason } = item;
              const isInDeck = deckCardIds.has(card.id);
              const isOwned = (userCollection[card.arenaId] || 0) > 0;

              return (
                <div
                  key={card.id}
                  className="group relative bg-[#131722] hover:bg-[#1a2030] border border-[#232b3d] hover:border-amber-400/80 rounded-xl overflow-hidden shadow-lg transition duration-200 flex flex-col justify-between hover:scale-[1.02]"
                >
                  {/* Card Art Clickable */}
                  <div
                    onClick={() => onSelectCardDetail(card)}
                    className="relative cursor-pointer overflow-hidden"
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-auto object-cover group-hover:brightness-105 transition"
                    />

                    {/* Synergy Match Score Badge */}
                    <div className="absolute top-1.5 right-1.5 bg-slate-950/90 text-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40 shadow-md">
                      {score}% Match
                    </div>

                    {/* Owned badge */}
                    {isOwned && (
                      <div className="absolute top-1.5 left-1.5 bg-emerald-950/90 text-emerald-300 font-bold text-[9px] px-1.5 py-0.5 rounded border border-emerald-700/60 shadow">
                        Owned
                      </div>
                    )}
                  </div>

                  {/* Card Meta & 1-Line Tactical Why It Works */}
                  <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 truncate group-hover:text-amber-300 transition">
                          {card.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-200/80 line-clamp-2 leading-tight mt-1 bg-[#0f121a] p-1.5 rounded border border-[#1e2536]">
                        💡 {reason}
                      </p>
                    </div>

                    {/* Add to Deck Button (Singleton capped!) */}
                    <button
                      onClick={() => handleAdd(card)}
                      disabled={isInDeck}
                      className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                        isInDeck
                          ? 'bg-[#1b2333] text-emerald-400 border border-emerald-800/40 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:scale-[1.02]'
                      }`}
                    >
                      {isInDeck ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>In Deck</span>
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
  );
};
