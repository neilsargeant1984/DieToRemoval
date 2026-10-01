import React, { useState, useEffect } from 'react';
import { Card } from '../types/card';
import { calculateSynergy, SynergyMatchResult } from '../utils/synergyGraph';
import { explainSynergy } from '../utils/synergyExplainer';
import { searchArenaCards } from '../services/scryfallService';
import { classifyCardRoles, getCardRoleChips, RoleChip } from '../utils/roleClassifier';
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
  Info,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchArenaCommunityMeta, EDHRECCardView } from '../services/edhrecService';
import { getCommanderTriggerConfig } from '../utils/commanderTriggers';

export type SynergyCategoryTab = 
  | 'meta_consensus'
  | 'meta_staples'
  | 'commander_triggers'
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
  const [internalTab, setInternalTab] = useState<SynergyCategoryTab>('meta_consensus');
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
  const [communityMeta, setCommunityMeta] = useState<EDHRECCardView[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const triggerConfig = getCommanderTriggerConfig(commander);

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
        const triggerPromise = (triggerConfig.hasTriggers && triggerConfig.scryfallQuery)
          ? searchArenaCards({
              format: 'brawl',
              commanderColorIdentity: commander.colorIdentity,
              query: triggerConfig.scryfallQuery,
              order: 'edhrec'
            })
          : Promise.resolve({ cards: [], totalCards: 0, hasMore: false });

        // Query EDHREC Community Consensus + Scryfall role pools concurrently
        const [communityRes, generalRes, rampRes, removalRes, wipeRes, protRes, triggerRes] = await Promise.allSettled([
          fetchArenaCommunityMeta(commander),
          searchArenaCards({
            format: 'brawl',
            commanderColorIdentity: commander.colorIdentity,
            query: '-t:basic',
            order: 'edhrec'
          }),
          searchArenaCards({
            format: 'brawl',
            commanderColorIdentity: commander.colorIdentity,
            roleFilter: 'ramp',
            order: 'edhrec'
          }),
          searchArenaCards({
            format: 'brawl',
            commanderColorIdentity: commander.colorIdentity,
            roleFilter: 'removal',
            order: 'edhrec'
          }),
          searchArenaCards({
            format: 'brawl',
            commanderColorIdentity: commander.colorIdentity,
            roleFilter: 'board_wipe',
            order: 'edhrec'
          }),
          searchArenaCards({
            format: 'brawl',
            commanderColorIdentity: commander.colorIdentity,
            roleFilter: 'protection',
            order: 'edhrec'
          }),
          triggerPromise
        ]);

        if (communityRes.status === 'fulfilled' && communityRes.value?.cards) {
          setCommunityMeta(communityRes.value.cards);
        }

        const cardMap = new Map<string, Card>();

        // Also add community cards into candidate pool
        if (communityRes.status === 'fulfilled' && communityRes.value?.cards) {
          for (const item of communityRes.value.cards) {
            cardMap.set(item.card.id, item.card);
          }
        }

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
        addCards(triggerRes);

        const allCards = Array.from(cardMap.values());
        setCandidates(allCards);

        // Run Causal Synergy Graph
        const scored: SynergyMatchResult[] = [];
        for (const c of allCards) {
          const match = calculateSynergy(commander, c);
          const isTrigger = triggerConfig.hasTriggers && triggerConfig.isTriggerCard(c);

          if (match) {
            if (isTrigger) {
              match.score = Math.max(match.score + 25, 82);
              match.matchReasons.unshift(triggerConfig.getCardReason(commander, c));
            }
            scored.push(match);
          } else {
            // Also include functional role staples and trigger enablers
            const role = classifyCardRoles(c);
            if (isTrigger || role.roles.length > 0) {
              scored.push({
                card: c,
                score: isTrigger ? 82 : 65,
                matchReasons: isTrigger 
                  ? [triggerConfig.getCardReason(commander, c)]
                  : [role.explanation[0] || 'Functional Role Staple'],
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

  const [multiRoleOnly, setMultiRoleOnly] = useState<boolean>(false);

  // Filter based on active tab
  const getTabResults = (): { card: Card; score: number; badge: string; reason: string; roleChips: RoleChip[] }[] => {
    if (activeTab === 'meta_consensus') {
      return communityMeta.map(item => {
        const causalMatch = calculateSynergy(commander, item.card);
        const roleChips = getCardRoleChips(item.card);
        let reason = causalMatch 
          ? explainSynergy(commander, causalMatch)
          : `Played in ${item.inclusion}% of community decks (${item.numDecks.toLocaleString()} decks)`;

        if (roleChips.length >= 2) {
          reason = `Multi-Role (${roleChips.length}-in-1: ${roleChips.map(r => r.label).join(' • ')}). ${reason}`;
        }

        return {
          card: item.card,
          score: item.inclusion,
          badge: roleChips.length >= 2 ? `✨ ${roleChips.length}-in-1 Engine` : `🔥 ${item.inclusion}% of Decks`,
          reason,
          roleChips
        };
      });
    }

    if (activeTab === 'meta_staples') {
      // Build elite iconic staples combining community play + causal synergy + archetype pillars
      const stapleMap = new Map<string, { card: Card; score: number; badge: string; reason: string; roleChips: RoleChip[] }>();

      const universalStaples = new Set([
        'Arcane Signet', 'Mind Stone', 'Coldsteel Heart', 'Swiftfoot Boots', 
        'Lightning Greaves', 'Command Tower', 'Dark Ritual', 'Jet Medallion',
        'Toxic Deluge', 'The Meathook Massacre', 'Phyrexian Tower', 'Demonic Tutor'
      ]);

      const archetypeStapleArtifacts = new Set([
        'Skullclamp', 'Ashnod\'s Altar', 'Phyrexian Altar', 'Altar of Dementia'
      ]);

      for (const item of communityMeta) {
        const c = item.card;
        const causal = calculateSynergy(commander, c);
        const isOnColor = c.colors.some(col => commander.colorIdentity.includes(col));
        const isIconic = universalStaples.has(c.name) || archetypeStapleArtifacts.has(c.name);

        // Skip generic colorless artifact creatures without high direct synergy from staples
        if (c.types.includes('Artifact') && c.types.includes('Creature') && c.colors.length === 0 && (!causal || causal.score < 50)) {
          continue;
        }

        const roleChips = getCardRoleChips(c);
        const causalScore = causal ? causal.score : 40;
        const inclusionScore = item.inclusion;
        const bonus = (isOnColor ? 15 : (isIconic ? 15 : 0)) + (roleChips.length >= 2 ? 10 : 0);

        const stapleScore = Math.min(99, Math.round((inclusionScore * 0.45) + (causalScore * 0.45) + bonus));

        if (stapleScore >= 45) {
          let reason = causal ? explainSynergy(commander, causal) : `Iconic community staple (${item.inclusion}% deck inclusion)`;
          if (roleChips.length >= 2) {
            reason = `Multi-Role (${roleChips.length}-in-1: ${roleChips.map(r => r.label).join(' • ')}). ${reason}`;
          }

          stapleMap.set(c.id, {
            card: c,
            score: stapleScore,
            badge: roleChips.length >= 2 ? `✨ ${roleChips.length}-in-1 Staple` : `⭐ ${stapleScore}% Staple`,
            reason,
            roleChips
          });
        }
      }

      // Also include high causal synergy cards that score >= 50
      for (const item of scoredSynergies) {
        const c = item.card;
        if (stapleMap.has(c.id)) continue;
        if (item.score >= 50) {
          const isOnColor = c.colors.some(col => commander.colorIdentity.includes(col));
          if (isOnColor || universalStaples.has(c.name) || archetypeStapleArtifacts.has(c.name)) {
            const roleChips = getCardRoleChips(c);
            let reason = explainSynergy(commander, item);
            if (roleChips.length >= 2) {
              reason = `Multi-Role (${roleChips.length}-in-1: ${roleChips.map(r => r.label).join(' • ')}). ${reason}`;
            }

            stapleMap.set(c.id, {
              card: c,
              score: item.score,
              badge: roleChips.length >= 2 ? `✨ ${roleChips.length}-in-1 Core` : `⭐ ${item.score}% Synergy Core`,
              reason,
              roleChips
            });
          }
        }
      }

      const stapleList = Array.from(stapleMap.values());
      stapleList.sort((a, b) => b.score - a.score);
      return stapleList;
    }

    if (activeTab === 'commander_triggers' && triggerConfig.hasTriggers) {
      const triggerCards: { card: Card; score: number; badge: string; reason: string; roleChips: RoleChip[] }[] = [];
      const seen = new Set<string>();

      for (const item of scoredSynergies) {
        const c = item.card;
        if (triggerConfig.isTriggerCard(c)) {
          seen.add(c.id);
          const roleChips = getCardRoleChips(c);
          const score = Math.max(item.score, 75);
          let reason = triggerConfig.getCardReason(commander, c);
          if (roleChips.length >= 2) {
            reason = `Multi-Role (${roleChips.length}-in-1: ${roleChips.map(r => r.label).join(' • ')}). ${reason}`;
          }

          triggerCards.push({
            card: c,
            score,
            badge: roleChips.length >= 2 ? `✨ ${roleChips.length}-in-1 Trigger` : triggerConfig.getCardBadge(c),
            reason,
            roleChips
          });
        }
      }

      for (const item of communityMeta) {
        const c = item.card;
        if (!seen.has(c.id) && triggerConfig.isTriggerCard(c)) {
          seen.add(c.id);
          const roleChips = getCardRoleChips(c);
          const score = Math.max(item.inclusion, 75);
          let reason = triggerConfig.getCardReason(commander, c);
          if (roleChips.length >= 2) {
            reason = `Multi-Role (${roleChips.length}-in-1: ${roleChips.map(r => r.label).join(' • ')}). ${reason}`;
          }

          triggerCards.push({
            card: c,
            score,
            badge: roleChips.length >= 2 ? `✨ ${roleChips.length}-in-1 Trigger` : triggerConfig.getCardBadge(c),
            reason,
            roleChips
          });
        }
      }

      triggerCards.sort((a, b) => b.score - a.score);
      return triggerCards;
    }

    const isArtifactCommander = commander.types.includes('Artifact') || 
      (commander.oracleText || '').toLowerCase().includes('artifact');

    const multiColorFixingRocks = new Set([
      'Chromatic Lantern', 'Commander\'s Sphere', 'Manalith', 'Celestial Prism',
      'Letter of Acceptance', 'Network Terminal', 'Spinning Wheel', 'Altar of the Pantheon'
    ]);

    return scoredSynergies
      .filter(item => {
        const c = item.card;
        if (activeTab === 'creatures') {
          if (!c.types.includes('Creature')) return false;
          // Filter out generic colorless artifact creatures unless commander cares about artifacts or card has high synergy
          const isColorlessArtifactCreature = c.types.includes('Artifact') && c.colors.length === 0;
          if (isColorlessArtifactCreature && !isArtifactCommander) {
            if (item.score < 55) return false;
          }
          return true;
        }
        if (activeTab === 'instants') return c.types.includes('Instant');
        if (activeTab === 'sorceries') return c.types.includes('Sorcery');
        if (activeTab === 'artifacts') return c.types.includes('Artifact') && !c.types.includes('Creature');
        if (activeTab === 'enchantments') return c.types.includes('Enchantment') && !c.types.includes('Creature');
        if (activeTab === 'planeswalkers') return c.types.includes('Planeswalker');
        if (activeTab === 'lands') return c.types.includes('Land');
        
        const roles = classifyCardRoles(c);
        if (activeTab === 'ramp') {
          if (!roles.roles.includes('ramp')) return false;
          // Filter out 3+ CMC multi-color fixing rocks for mono-color commanders
          if (commander.colorIdentity.length <= 1) {
            if (multiColorFixingRocks.has(c.name)) return false;
            const co = (c.oracleText || '').toLowerCase();
            if (c.types.includes('Artifact') && c.cmc >= 3 && co.includes('any color') && !co.includes('draw') && !co.includes('sacrifice')) {
              return false;
            }
          }
          return true;
        }
        if (activeTab === 'protection') return roles.roles.includes('protection');
        if (activeTab === 'removal') return roles.roles.includes('removal');
        if (activeTab === 'board_wipe') return roles.roles.includes('board_wipe');
        if (activeTab === 'card_draw') return roles.roles.includes('card_advantage');
        
        return false;
      })
      .map(item => {
        const roleChips = getCardRoleChips(item.card);
        let badge = roleChips.length >= 2 ? `✨ ${roleChips.length}-in-1` : `${item.score}% Match`;
        let reason = explainSynergy(commander, item);

        if (activeTab === 'card_draw') {
          const co = (item.card.oracleText || '').toLowerCase();
          const isSacDraw = (co.includes('sacrifice') || co.includes('dies')) && (co.includes('draw') || co.includes('investigate'));
          if (isSacDraw) {
            badge = roleChips.length >= 3 ? `✨ 3-in-1 Engine` : `💡 Sac Draw Engine`;
            reason = `Sacrifice Draw Engine: Converts creatures into steady card draw and commander death triggers`;
          }
        }

        if (roleChips.length >= 2) {
          const roleNames = roleChips.map(r => r.label).join(' • ');
          reason = `Multi-Role Powerhouse (${roleChips.length}-in-1: ${roleNames}). ${reason}`;
        }

        return {
          card: item.card,
          score: item.score,
          badge,
          reason,
          roleChips
        };
      })
      .sort((a, b) => {
        if (activeTab === 'creatures') {
          // Sort on-color creatures before colorless creatures
          const aColorless = a.card.colors.length === 0 ? 1 : 0;
          const bColorless = b.card.colors.length === 0 ? 1 : 0;
          if (aColorless !== bColorless) return aColorless - bColorless;
        }
        if (activeTab === 'ramp' && commander.colorIdentity.length <= 1) {
          const monoColorRampStaples = new Set([
            'Arcane Signet', 'Mind Stone', 'Coldsteel Heart', 'Thought Vessel',
            'Jet Medallion', 'Ruby Medallion', 'Sapphire Medallion', 'Emerald Medallion', 'Pearl Medallion',
            'Dark Ritual', 'Cabal Stronghold', 'Solemn Simulacrum', 'Wayfarer\'s Bauble',
            'Guardian Idol', 'Fellwar Stone', 'Bontu\'s Monument', 'Heraldic Banner',
            'Phyrexian Tower', 'Pitiless Plunderer', 'Black Market Connections'
          ]);
          const aStaple = monoColorRampStaples.has(a.card.name) ? 1 : 0;
          const bStaple = monoColorRampStaples.has(b.card.name) ? 1 : 0;
          if (aStaple !== bStaple) return bStaple - aStaple;
        }
        return b.score - a.score;
      });
  };

  const currentTabList = getTabResults();
  const multiRoleCount = currentTabList.filter(item => item.roleChips.length >= 2).length;
  const displayedList = multiRoleOnly ? currentTabList.filter(item => item.roleChips.length >= 2) : currentTabList;

  const handleAdd = (card: Card) => {
    onAddCard(card);
    confetti({ particleCount: 30, spread: 45 });
  };

  const tabs: { id: SynergyCategoryTab; label: string; icon: string }[] = [
    { id: 'meta_consensus', label: 'What People Are Playing', icon: '🔥' },
    { id: 'meta_staples', label: 'Staple Cards', icon: '⭐' },
    ...(triggerConfig.hasTriggers ? [{ id: 'commander_triggers' as SynergyCategoryTab, label: triggerConfig.tabLabel, icon: '🎯' }] : []),
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

        {/* Multi-Role Filter Toggle & Card Count */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMultiRoleOnly(!multiRoleOnly)}
            title="Filter to show only multi-role powerhouses that fulfill 2 or more functional roles"
            className={`text-xs px-2.5 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 ${
              multiRoleOnly
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                : 'bg-[#151a24] text-slate-400 hover:text-slate-200 hover:bg-[#1f2636] border-[#262f42]'
            }`}
          >
            <span>✨</span>
            <span>Multi-Role Only</span>
            {multiRoleCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${multiRoleOnly ? 'bg-slate-950 text-amber-300' : 'bg-[#1f2737] text-slate-300'}`}>
                {multiRoleCount}
              </span>
            )}
          </button>

          <span className="text-xs text-slate-500 font-medium">
            {displayedList.length} cards matched
          </span>
        </div>
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
        ) : displayedList.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Flame className="w-8 h-8 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">
              {multiRoleOnly ? `No multi-role cards found in ${activeTab}` : `No ${activeTab} synergies found`}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {multiRoleOnly ? 'Try turning off "Multi-Role Only" or switching tabs.' : 'Try switching to other tabs above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {displayedList.map(item => {
              const { card, score, badge, reason, roleChips } = item;
              const isInDeck = deckCardIds.has(card.id);
              const isOwned = (userCollection[card.arenaId] || 0) > 0;

              return (
                <div
                  key={card.id}
                  className="group relative bg-[#131722] hover:bg-[#1a2030] border border-[#232b3d] hover:border-amber-400/80 rounded-xl overflow-hidden shadow-lg transition duration-200 flex flex-col justify-between hover:scale-[1.02]"
                >
                  {/* Card Art Clickable (100% Unobscured card title & mana cost) */}
                  <div
                    onClick={() => onSelectCardDetail(card)}
                    className="relative cursor-pointer overflow-hidden"
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-auto object-cover group-hover:brightness-105 transition"
                    />

                    {/* Owned badge at subtle bottom corner, away from card title and mana cost */}
                    {isOwned && (
                      <div className="absolute bottom-1.5 left-1.5 bg-emerald-950/90 text-emerald-300 font-bold text-[9px] px-1.5 py-0.5 rounded border border-emerald-700/60 shadow pointer-events-none">
                        Owned
                      </div>
                    )}
                  </div>

                  {/* Card Meta & 1-Line Tactical Why It Works */}
                  <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Name & Synergy/Staple Badge Row */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span 
                          className="font-bold text-slate-100 text-xs truncate group-hover:text-amber-300 transition"
                          title={card.name}
                        >
                          {card.name}
                        </span>
                        <span className="flex-shrink-0 bg-[#090d14] text-amber-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded border border-amber-500/40 whitespace-nowrap shadow-sm">
                          {badge || `${score}% Match`}
                        </span>
                      </div>

                      {/* Multi-Role Chips (Displays when card fulfills 2+ functional roles) */}
                      {roleChips.length >= 2 && (
                        <div className="flex flex-wrap items-center gap-1 my-1">
                          <span className="text-[8.5px] font-extrabold text-amber-300 bg-amber-500/15 px-1 py-0.5 rounded border border-amber-500/30 whitespace-nowrap flex items-center gap-0.5">
                            <span>✨</span>
                            <span>{roleChips.length}-in-1</span>
                          </span>
                          {roleChips.map(rc => (
                            <span
                              key={rc.id}
                              className={`text-[8.5px] px-1.5 py-0.5 rounded border font-semibold flex items-center gap-0.5 whitespace-nowrap ${rc.style}`}
                            >
                              <span>{rc.icon}</span>
                              <span>{rc.label}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-amber-200/80 line-clamp-2 leading-tight bg-[#0f121a] p-1.5 rounded border border-[#1e2536]">
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
