import React, { useState, useEffect, useMemo } from 'react';
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
  Users,
  Trash2,
  Minus,
  Search,
  X,
  Mountain
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchArenaCommunityMeta, EDHRECCardView } from '../services/edhrecService';
import { getCommanderTriggerConfig } from '../utils/commanderTriggers';
import { getMaxCardCopies } from '../utils/cardRules';
import { ARENA_LANDS_DATABASE, convertArenaLandToCard } from '../data/arenaLands';

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
  onRemoveCard?: (card: Card, removeAll?: boolean) => void;
  onSelectCardDetail: (card: Card) => void;
  userCollection: UserCollection;
  deckCardIds: Set<string>;
  deckCardNames?: Set<string>;
  deckCardCounts?: Map<string, number>;
  activeTab?: SynergyCategoryTab;
  onSelectTab?: (tab: SynergyCategoryTab) => void;
  isDeckTrayOpen?: boolean;
  onToggleDeckTray?: () => void;
  onOpenManaOptimizer?: () => void;
}

export const BrawlSynergyConsole: React.FC<BrawlSynergyConsoleProps> = ({
  commander,
  onAddCard,
  onRemoveCard,
  onSelectCardDetail,
  userCollection,
  deckCardIds,
  deckCardNames,
  deckCardCounts,
  activeTab: controlledTab,
  onSelectTab,
  isDeckTrayOpen,
  onToggleDeckTray,
  onOpenManaOptimizer
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
  const [expandedReasonCardId, setExpandedReasonCardId] = useState<string | null>(null);
  const [tabSearchQuery, setTabSearchQuery] = useState<string>('');
  const [multiRoleOnly, setMultiRoleOnly] = useState<boolean>(false);

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

        const cmdOracle = (commander.oracleText || '').toLowerCase();
        const isLifegainCommander = 
          /(whenever|if).*(you gain|gained)\s+(\d+|one|two|three|or more|\w+)*\s*life/i.test(cmdOracle) ||
          cmdOracle.includes('gain life') ||
          cmdOracle.includes('gained life') ||
          cmdOracle.includes('extort') ||
          cmdOracle.includes('life total');

        const lifegainPromise = isLifegainCommander
          ? searchArenaCards({
              format: 'brawl',
              commanderColorIdentity: commander.colorIdentity,
              query: '(o:gain o:life) or o:lifelink or o:extort or o:"food token"',
              order: 'edhrec'
            })
          : Promise.resolve({ cards: [], totalCards: 0, hasMore: false });

        const planeswalkerPromise = searchArenaCards({
          format: 'brawl',
          commanderColorIdentity: commander.colorIdentity,
          query: 't:planeswalker or (is:transform t:planeswalker)',
          order: 'edhrec'
        });

        // Query EDHREC Community Consensus + Scryfall role pools concurrently
        const [
          communityRes, 
          generalRes, 
          rampRes, 
          removalRes, 
          wipeRes, 
          protRes, 
          triggerRes,
          planeswalkerRes,
          lifegainRes
        ] = await Promise.allSettled([
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
          triggerPromise,
          planeswalkerPromise,
          lifegainPromise
        ]);

        if (communityRes.status === 'fulfilled' && communityRes.value?.cards) {
          const uniqueComm: EDHRECCardView[] = [];
          const commSeen = new Set<string>();
          for (const item of communityRes.value.cards) {
            const key = item.card.name.toLowerCase().trim();
            if (!commSeen.has(key)) {
              commSeen.add(key);
              uniqueComm.push(item);
            }
          }
          setCommunityMeta(uniqueComm);
        }

        const cardMap = new Map<string, Card>();
        const communityMap = new Map<string, EDHRECCardView>();

        // Also add community cards into candidate pool (keyed strictly by canonical card.name to prevent alternate print duplicates)
        if (communityRes.status === 'fulfilled' && communityRes.value?.cards) {
          for (const item of communityRes.value.cards) {
            if (!item.card.colorIdentity.every(col => commander.colorIdentity.includes(col))) continue;
            const key = item.card.name.toLowerCase().trim();
            if (!cardMap.has(key)) {
              cardMap.set(key, item.card);
            }
            if (!communityMap.has(key)) {
              communityMap.set(key, item);
            }
          }
        }

        const addCards = (res: PromiseSettledResult<{ cards: Card[] }>) => {
          if (res.status === 'fulfilled' && res.value?.cards) {
            for (const c of res.value.cards) {
              if (!c.colorIdentity.every(col => commander.colorIdentity.includes(col))) continue;
              const key = c.name.toLowerCase().trim();
              if (!cardMap.has(key)) {
                cardMap.set(key, c);
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
        addCards(planeswalkerRes);
        addCards(lifegainRes);

        const allCards = Array.from(cardMap.values());
        setCandidates(allCards);

        // Run Causal Synergy Graph
        const scored: SynergyMatchResult[] = [];
        for (const c of allCards) {
          const match = calculateSynergy(commander, c);
          const isTrigger = triggerConfig.hasTriggers && triggerConfig.isTriggerCard(c);
          const comm = communityMap.get(c.name.toLowerCase().trim());
          const isWalker = c.types.includes('Planeswalker') || (c.typeLine || '').toLowerCase().includes('planeswalker');
          const isColorless = c.colors.length === 0;
          const isOnColor = c.colors.some(col => commander.colorIdentity.includes(col));
          const oracleTextLower = (c.oracleText || '').toLowerCase();
          const hasLifegain = (oracleTextLower.includes('gain') && oracleTextLower.includes('life')) || 
            oracleTextLower.includes('lifelink') || 
            oracleTextLower.includes('extort') || 
            oracleTextLower.includes('food');

          if (match) {
            if (isTrigger) {
              match.score = Math.max(match.score + 25, 82);
              match.matchReasons.unshift(triggerConfig.getCardReason(commander, c));
            }
            if (isWalker && isLifegainCommander && hasLifegain) {
              match.score = Math.max(match.score, 88);
              if (!match.matchReasons.some(r => r.toLowerCase().includes('lifegain'))) {
                match.matchReasons.unshift(`Lifegain planeswalker: generates repeatable lifegain to trigger ${commander.name}`);
              }
            }
            if (comm && comm.inclusion >= 25) {
              match.score = match.score + Math.round(comm.inclusion * 0.1);
            }
            match.score = Math.min(99, Math.max(1, match.score));
            scored.push(match);
          } else if (comm) {
            // Highly played community card for this commander (EDHREC consensus)
            const commScore = Math.min(95, Math.round(comm.inclusion * 0.75 + (isOnColor ? 20 : 10)));
            scored.push({
              card: c,
              score: Math.max(commScore, 58),
              matchReasons: [
                `Played in ${comm.inclusion}% of community ${commander.name} decks (${comm.numDecks.toLocaleString()} decks)`
              ],
              category: (c.types.includes('Creature') || (c.typeLine || '').toLowerCase().includes('creature'))
                ? 'Creature' 
                : (c.types.includes('Instant') || c.types.includes('Sorcery') ? 'Instant/Sorcery' : (c.types.includes('Land') ? 'Land' : 'Artifact/Enchantment'))
            });
          } else {
            // Check if card is an on-color planeswalker (especially with lifegain for lifegain commanders)
            if (isWalker && isOnColor) {
              const walkerScore = (isLifegainCommander && hasLifegain) ? 88 : 72;
              const walkerReason = (isLifegainCommander && hasLifegain)
                ? `Lifegain planeswalker: generates repeatable lifegain to trigger ${commander.name}`
                : `On-color planeswalker: generates recurring loyalty and board advantage`;
              scored.push({
                card: c,
                score: walkerScore,
                matchReasons: [walkerReason],
                category: 'Artifact/Enchantment'
              });
            } else {
              // Also include functional role staples, trigger enablers, and on-color cards
              const role = classifyCardRoles(c, commander);
              if (isTrigger || role.roles.length > 0) {
                scored.push({
                  card: c,
                  score: isTrigger ? 82 : 65,
                  matchReasons: isTrigger 
                    ? [triggerConfig.getCardReason(commander, c)]
                    : [role.explanation[0] || 'Functional Role Staple'],
                  category: (c.types.includes('Creature') || (c.typeLine || '').toLowerCase().includes('creature'))
                    ? 'Creature' 
                    : (c.types.includes('Instant') || c.types.includes('Sorcery') ? 'Instant/Sorcery' : (c.types.includes('Land') ? 'Land' : 'Artifact/Enchantment'))
                });
              } else {
                // General on-color cards from Scryfall search
                if (isOnColor) {
                  scored.push({
                    card: c,
                    score: 55,
                    matchReasons: [`On-color staple option for ${commander.name}`],
                    category: (c.types.includes('Creature') || (c.typeLine || '').toLowerCase().includes('creature'))
                      ? 'Creature' 
                      : (c.types.includes('Instant') || c.types.includes('Sorcery') ? 'Instant/Sorcery' : (c.types.includes('Land') ? 'Land' : 'Artifact/Enchantment'))
                  });
                }
              }
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

  // Filter based on active tab
  const getTabResults = (): { card: Card; score: number; badge: string; reason: string; roleChips: RoleChip[] }[] => {
    if (!commander) return [];

    if (activeTab === 'lands') {
      const commanderColors = new Set(commander.colorIdentity);
      const legalLands = ARENA_LANDS_DATABASE.filter(land => {
        if (land.colorIdentity.length === 0) return true;
        return land.colorIdentity.every(c => commanderColors.has(c));
      });

      return legalLands.map(land => {
        const card = convertArenaLandToCard(land);
        const roleChips = getCardRoleChips(card);
        let badge = '🏔️ Arena Land';
        if (land.cycle === 'shock') badge = '⚡ Shockland';
        else if (land.cycle === 'fetch') badge = '🎯 Fetchland';
        else if (land.cycle === 'triome') badge = '🔮 Triome';
        else if (land.cycle === 'surveil') badge = '👁️ Surveil Land';
        else if (land.cycle === 'channel') badge = '⛩️ Channel Land';
        else if (land.cycle === 'castle') badge = '🏰 Castle';
        else if (land.cycle === 'rainbow_staple') badge = '🌈 Rainbow Staple';
        else if (land.cycle === 'fastland') badge = '⚡ Fastland';
        else if (land.cycle === 'slowland') badge = '🛡️ Slowland';
        else if (land.cycle === 'painland') badge = '🩸 Painland';
        else if (land.cycle === 'pathway') badge = '🔄 Pathway';

        return {
          card,
          score: land.cycle === 'rainbow_staple' || land.cycle === 'shock' || land.cycle === 'fetch' ? 95 : 85,
          badge,
          reason: `Verified MTG Arena ${land.typeLine} (${land.arenaSet})`,
          roleChips
        };
      });
    }

    if (activeTab === 'meta_consensus') {
      const consensusList = communityMeta.map(item => {
        const causalMatch = calculateSynergy(commander, item.card);
        const roleChips = getCardRoleChips(item.card);
        const causalScore = causalMatch ? causalMatch.score : 35;
        // Synergy-first weighting: 65% causal synergy + 35% community consensus
        const blendedScore = Math.min(99, Math.round(causalScore * 0.65 + item.inclusion * 0.35));
        const reason = causalMatch 
          ? explainSynergy(commander, causalMatch)
          : `Played in ${item.inclusion}% of community decks (${item.numDecks.toLocaleString()} decks)`;

        return {
          card: item.card,
          score: blendedScore,
          badge: roleChips.length >= 2 ? `✨ ${roleChips.length}-in-1 Engine` : `🔥 ${item.inclusion}% of Decks`,
          reason,
          roleChips
        };
      });

      consensusList.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.card.cmc - b.card.cmc;
      });
      return consensusList;
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

        // Skip generic lands from staples tab unless listed in universalStaples (e.g. Command Tower, Phyrexian Tower)
        if (c.types.includes('Land') && !universalStaples.has(c.name)) {
          continue;
        }

        // Skip generic colorless artifact creatures without high direct synergy from staples
        if (c.types.includes('Artifact') && c.types.includes('Creature') && c.colors.length === 0 && (!causal || causal.score < 50)) {
          continue;
        }

        const roleChips = getCardRoleChips(c, commander);
        const causalScore = causal ? causal.score : 40;
        const inclusionScore = item.inclusion;
        const bonus = (isOnColor ? 15 : (isIconic ? 15 : 0)) + (roleChips.length >= 2 ? 10 : 0);

        const stapleScore = Math.min(99, Math.round((causalScore * 0.70) + (inclusionScore * 0.30) + bonus));

        if (stapleScore >= 45) {
          const reason = causal ? explainSynergy(commander, causal) : `Iconic community staple (${item.inclusion}% deck inclusion)`;

          stapleMap.set(c.name.toLowerCase().trim(), {
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
        const key = c.name.toLowerCase().trim();
        if (stapleMap.has(key)) continue;
        if (c.types.includes('Land') && !universalStaples.has(c.name)) continue;
        if (item.score >= 50) {
          const isOnColor = c.colors.some(col => commander.colorIdentity.includes(col));
          if (isOnColor || universalStaples.has(c.name) || archetypeStapleArtifacts.has(c.name)) {
            const roleChips = getCardRoleChips(c, commander);
            const reason = explainSynergy(commander, item);

            stapleMap.set(key, {
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
      stapleList.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.card.cmc - b.card.cmc;
      });
      return stapleList;
    }

    if (activeTab === 'commander_triggers' && triggerConfig.hasTriggers) {
      const triggerCards: { card: Card; score: number; badge: string; reason: string; roleChips: RoleChip[] }[] = [];
      const seen = new Set<string>();

      for (const item of scoredSynergies) {
        const c = item.card;
        const key = c.name.toLowerCase().trim();
        if (triggerConfig.isTriggerCard(c)) {
          seen.add(key);
          const roleChips = getCardRoleChips(c, commander);
          const score = Math.max(item.score, 75);
          const reason = triggerConfig.getCardReason(commander, c);

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
        const key = c.name.toLowerCase().trim();
        if (!seen.has(key) && triggerConfig.isTriggerCard(c)) {
          seen.add(key);
          const roleChips = getCardRoleChips(c, commander);
          const score = Math.max(item.inclusion, 75);
          const reason = triggerConfig.getCardReason(commander, c);

          triggerCards.push({
            card: c,
            score,
            badge: roleChips.length >= 2 ? `✨ ${roleChips.length}-in-1 Trigger` : triggerConfig.getCardBadge(c),
            reason,
            roleChips
          });
        }
      }

      triggerCards.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.card.cmc - b.card.cmc;
      });
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
        // Defense-in-depth: Strict Commander Color Identity Check
        if (!c.colorIdentity.every(col => commander.colorIdentity.includes(col))) return false;

        if (activeTab === 'creatures') {
          const isCreature = c.types.includes('Creature') || (c.typeLine || '').toLowerCase().includes('creature');
          if (!isCreature) return false;
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
        if (activeTab === 'planeswalkers') return c.types.includes('Planeswalker') || (c.typeLine || '').toLowerCase().includes('planeswalker');
        
        const roles = classifyCardRoles(c, commander);
        if (activeTab === 'ramp') {
          if (!roles.roles.includes('ramp')) return false;
          // Filter out generic 3+ CMC multi-color fixing rocks for mono-color commanders
          // BUT preserve rocks that provide direct causal synergy / trigger enablers for the commander (e.g. Inherited Envelope for Ring commanders)
          if (commander.colorIdentity.length <= 1) {
            if (multiColorFixingRocks.has(c.name)) return false;
            const co = (c.oracleText || '').toLowerCase();
            const isSynergyEnabler = item.score >= 70 || (triggerConfig.hasTriggers && triggerConfig.isTriggerCard(c));
            if (!isSynergyEnabler && c.types.includes('Artifact') && c.cmc >= 3 && co.includes('any color') && !co.includes('draw') && !co.includes('sacrifice')) {
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
        const roleChips = getCardRoleChips(item.card, commander);
        let badge = `${item.score}% Match`;
        let reason = explainSynergy(commander, item);

        if (activeTab === 'card_draw') {
          const co = (item.card.oracleText || '').toLowerCase();
          const isSacDraw = (co.includes('sacrifice') || co.includes('dies')) && (co.includes('draw') || co.includes('investigate'));
          if (isSacDraw) {
            badge = roleChips.length >= 3 ? `✨ 3-in-1 Engine` : `💡 Sac Draw Engine`;
            reason = `Sacrifice Draw Engine: Converts creatures into steady card draw and commander death triggers`;
          }
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
        // 1. PRIMARY: Synergy Score descending (Highest Synergy Always First)
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        // 2. TIE BREAKER 1: On-color over Colorless (unless commander is colorless)
        if (commander.colorIdentity.length > 0) {
          const aColorless = a.card.colors.length === 0 ? 1 : 0;
          const bColorless = b.card.colors.length === 0 ? 1 : 0;
          if (aColorless !== bColorless) return aColorless - bColorless;
        }

        // 3. TIE BREAKER 2: Multi-Role Powerhouses (fulfill more functional roles)
        if (b.roleChips.length !== a.roleChips.length) {
          return b.roleChips.length - a.roleChips.length;
        }

        // 4. TIE BREAKER 3: Lower Mana Value / Curve efficiency
        if (a.card.cmc !== b.card.cmc) {
          return a.card.cmc - b.card.cmc;
        }

        // 5. TIE BREAKER 4: Alphabetical
        return a.card.name.localeCompare(b.card.name);
      });
  };

  const rawTabList = getTabResults();
  const tabSeen = new Set<string>();
  const currentTabList = rawTabList.filter(item => {
    const k = item.card.name.toLowerCase().trim();
    if (tabSeen.has(k)) return false;
    tabSeen.add(k);
    return true;
  });
  const multiRoleCount = currentTabList.filter(item => item.roleChips.length >= 2).length;
  const baseDisplayedList = multiRoleOnly ? currentTabList.filter(item => item.roleChips.length >= 2) : currentTabList;

  const displayedList = useMemo(() => {
    if (!tabSearchQuery.trim()) return baseDisplayedList;
    const q = tabSearchQuery.toLowerCase().trim();
    return baseDisplayedList.filter(item => {
      const nameMatch = item.card.name.toLowerCase().includes(q);
      const typeMatch = (item.card.typeLine || '').toLowerCase().includes(q);
      const textMatch = (item.card.oracleText || '').toLowerCase().includes(q);
      const reasonMatch = item.reason.toLowerCase().includes(q);
      const roleMatch = item.roleChips.some(r => r.label.toLowerCase().includes(q));
      return nameMatch || typeMatch || textMatch || reasonMatch || roleMatch;
    });
  }, [baseDisplayedList, tabSearchQuery]);

  const handleAdd = (card: Card) => {
    onAddCard(card);
    confetti({ particleCount: 30, spread: 45 });
  };

  const handleRemove = (card: Card, removeAll: boolean = false) => {
    if (onRemoveCard) {
      onRemoveCard(card, removeAll);
    }
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

  const currentTabObj = tabs.find(t => t.id === activeTab);

  if (!commander) return null;

  return (
    <div className="arena-panel rounded-3xl p-6 shadow-2xl space-y-4">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-fantasy font-black text-lg text-white flex items-center gap-2">
              <span>Commander Synergies</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-950/80 text-orange-300 border border-orange-500/40">
                {commander.name}
              </span>
            </h3>
            <p className="text-[11px] text-stone-400">
              Causal recommendations filtered strictly for {commander.colorIdentity.join('/') || 'Colorless'} legal cards on MTG Arena
            </p>
          </div>
        </div>

        {/* Multi-Role Filter Toggle, Tray Toggle & Card Count */}
        <div className="flex items-center gap-2.5">
          {onToggleDeckTray && (
            <button
              onClick={onToggleDeckTray}
              title={isDeckTrayOpen ? 'Hide Active Deck Tray' : 'Show Active Deck Tray'}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 shadow-sm ${
                isDeckTrayOpen
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-[#0d1017]/90 text-stone-300 hover:text-white border-white/5 hover:bg-[#141926]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{isDeckTrayOpen ? 'Hide Deck Tray' : 'Show Deck Tray'}</span>
            </button>
          )}

          <button
            onClick={() => setMultiRoleOnly(!multiRoleOnly)}
            title="Filter to show only multi-role powerhouses that fulfill 2 or more functional roles"
            className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 shadow-sm ${
              multiRoleOnly
                ? 'btn-mythic-spark shadow-md'
                : 'bg-[#0d1017]/90 text-stone-300 hover:text-white border-white/5 hover:bg-[#141926]'
            }`}
          >
            <span>✨</span>
            <span>Multi-Role Only</span>
            {multiRoleCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${multiRoleOnly ? 'bg-slate-950 text-amber-300' : 'bg-white/10 text-stone-300'}`}>
                {multiRoleCount}
              </span>
            )}
          </button>

          <span className="text-xs text-stone-400 font-medium">
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
                  ? 'btn-mythic-spark shadow-sm'
                  : 'bg-[#121622] text-stone-400 hover:text-stone-200 hover:bg-[#171c28] border border-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab In-Category Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/10">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={tabSearchQuery}
            onChange={(e) => setTabSearchQuery(e.target.value)}
            placeholder={`Search within ${currentTabObj?.label || 'this tab'}... (e.g. card name, rules text)`}
            className="w-full pl-9 pr-8 py-2 bg-[#0d1017] border border-white/10 focus:border-amber-500 rounded-xl text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition shadow-inner"
          />
          {tabSearchQuery && (
            <button
              onClick={() => setTabSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-400 font-medium">
          {tabSearchQuery.trim() ? (
            <span className="text-amber-300 font-bold bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30">
              Showing {displayedList.length} of {baseDisplayedList.length} cards
            </span>
          ) : (
            <span className="text-stone-400 font-medium text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>{displayedList.length} cards • <strong>Ranked by Highest Synergy First</strong></span>
            </span>
          )}
        </div>
      </div>

      {/* 1-Click Auto-Build Banner for Lands Tab */}
      {activeTab === 'lands' && onOpenManaOptimizer && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/30 flex items-center justify-between flex-wrap gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white font-fantasy">
                  1-Click Arena Mana Base Optimizer
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                  {commander.colorIdentity.length}-Color {commander.colorIdentity.length === 0 ? 'Colorless' : commander.colorIdentity.join('')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Automatically balance fetches, shocks, triomes, surveil lands, and pip-weighted basics for {commander.name}.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenManaOptimizer}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-md flex items-center gap-1.5 hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950 font-bold" />
            <span>⚡ Auto-Build Mana Base</span>
          </button>
        </div>
      )}

      {/* Cards Visual Grid (Clean In-Game Presentation) */}
      <div className="min-h-[420px]">
        {isLoading ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <p className="font-semibold text-stone-800">Evaluating Causal Synergies...</p>
            <p className="text-xs text-stone-500">Checking triggers, payoffs, and Arena legalities</p>
          </div>
        ) : displayedList.length === 0 ? (
          tabSearchQuery.trim() ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-2">
              <Search className="w-8 h-8 text-stone-400 mb-1" />
              <p className="font-bold text-stone-800 text-sm">
                No cards matching "{tabSearchQuery}" found in {currentTabObj?.label || 'this tab'}
              </p>
              <p className="text-xs text-stone-500 max-w-md">
                The card may not have direct synergy in this category, or may not be legal in {commander.colorIdentity.join('/') || 'Colorless'} Brawl.
              </p>
              <button
                onClick={() => setTabSearchQuery('')}
                className="mt-2 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
              >
                Clear Tab Search
              </button>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-500">
              <Flame className="w-8 h-8 text-stone-400 mb-2" />
              <p className="font-semibold text-stone-700">
                {multiRoleOnly ? `No multi-role cards found in ${activeTab}` : `No ${activeTab} synergies found`}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {multiRoleOnly ? 'Try turning off "Multi-Role Only" or switching tabs.' : 'Try switching to other tabs above.'}
              </p>
            </div>
          )
        ) : (
          <div className={`grid gap-3.5 ${
            isDeckTrayOpen
              ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
          }`}>
            {displayedList.map(item => {
              const { card, score, badge, reason, roleChips } = item;
              const isBasic = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'].includes(card.name);
              const maxAllowed = getMaxCardCopies(card, 'brawl');
              const isMultiCopy = maxAllowed > 1;
              const countInDeck = (deckCardCounts && deckCardCounts.get(card.name.toLowerCase().trim())) 
                ?? ((deckCardNames?.has(card.name) || deckCardIds.has(card.id)) ? 1 : 0);
              const canAddMore = countInDeck < maxAllowed;
              const isOwned = (userCollection[card.arenaId] || 0) > 0;

              return (
                <div
                  key={card.id}
                  className="card-tile group rounded-2xl p-2.5 flex flex-col justify-between"
                >
                  {/* Card Art Clickable (100% Unobscured card title & mana cost) */}
                  <div
                    onClick={() => onSelectCardDetail(card)}
                    className="relative cursor-pointer overflow-hidden rounded-xl shadow-md border border-black/40 mb-2 bg-black"
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-auto object-cover group-hover:brightness-105 transition"
                    />

                    {/* Owned badge at subtle bottom corner */}
                    {isOwned && (
                      <div className="absolute bottom-1.5 left-1.5 bg-emerald-950/90 text-emerald-300 font-bold text-[9px] px-1.5 py-0.5 rounded border border-emerald-600/60 shadow pointer-events-none">
                        Owned
                      </div>
                    )}
                  </div>

                  {/* Card Meta & 1-Line Tactical Why It Works */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Name & Synergy/Staple Badge Row */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span 
                          className="font-bold text-stone-100 text-xs truncate group-hover:text-amber-300 transition"
                          title={card.name}
                        >
                          {card.name}
                        </span>
                        <span className="flex-shrink-0 bg-orange-950/80 text-orange-300 font-black text-[9px] px-2 py-0.5 rounded-full border border-orange-500/40 whitespace-nowrap shadow-sm">
                          {badge || `${score}% Match`}
                        </span>
                      </div>

                      {/* Multi-Role Chips (Displays when card fulfills 2+ functional roles) */}
                      {roleChips.length >= 2 && (
                        <div className="flex flex-wrap items-center gap-1 my-1">
                          <span className="text-[8.5px] font-extrabold text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/40 whitespace-nowrap flex items-center gap-0.5">
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

                      {/* Tactical Synergy Reason Box */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedReasonCardId(prev => prev === card.id ? null : card.id);
                        }}
                        title={`Synergy Breakdown:\n${reason}\n\n(Click to ${expandedReasonCardId === card.id ? 'collapse' : 'expand'})`}
                        className={`group/reason relative p-2 rounded-xl border transition-all cursor-pointer ${
                          expandedReasonCardId === card.id
                            ? 'bg-[#1a2030] border-amber-500/60 shadow-md ring-1 ring-amber-400/40 text-stone-200'
                            : 'bg-[#0d1017]/90 border-white/5 hover:border-white/15 hover:bg-[#141926] text-stone-300'
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <span className="text-[11px] leading-tight select-none mt-0.5 flex-shrink-0 text-amber-400">💡</span>
                          <p className={`text-[11px] text-stone-300 font-medium leading-[1.35] ${
                            expandedReasonCardId === card.id ? 'block whitespace-normal' : 'line-clamp-3'
                          }`}>
                            {reason}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[9px] text-stone-400 group-hover/reason:text-amber-300 transition-colors">
                          <span className="italic">
                            {expandedReasonCardId === card.id ? 'Tap to collapse' : 'Why this works'}
                          </span>
                          <span className="text-[9px] opacity-70">
                            {expandedReasonCardId === card.id ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Add to Deck / Remove from Deck Toggle or Multi-Copy Stepper */}
                    {!isMultiCopy ? (
                      <button
                        onClick={() => (countInDeck > 0 ? handleRemove(card, true) : handleAdd(card))}
                        className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                          countInDeck > 0
                            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 hover:scale-[1.02]'
                            : 'btn-mythic-spark hover:scale-[1.02]'
                        }`}
                      >
                        {countInDeck > 0 ? (
                          <>
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Remove Card</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Deck</span>
                          </>
                        )}
                      </button>
                    ) : countInDeck === 0 ? (
                      <button
                        onClick={() => handleAdd(card)}
                        className="btn-mythic-spark w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm hover:scale-[1.02]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Deck</span>
                        {maxAllowed < 100 && (
                          <span className="text-[10px] font-semibold opacity-85">({maxAllowed} Max)</span>
                        )}
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between bg-[#0d1017] border border-white/10 rounded-xl p-0.5 shadow-inner">
                        <button
                          onClick={() => handleRemove(card, false)}
                          title={countInDeck === 1 ? "Remove card from deck" : "Decrease copy"}
                          className="p-1 rounded-lg bg-[#141926] hover:bg-rose-950 text-stone-300 hover:text-rose-300 border border-white/5 hover:border-rose-800 transition"
                        >
                          {countInDeck === 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <div className="flex flex-col items-center px-1">
                          <span className="text-xs font-extrabold text-amber-300 leading-none">
                            {countInDeck}{maxAllowed < 100 ? ` / ${maxAllowed}` : ''}
                          </span>
                          <span className="text-[8px] text-stone-400 uppercase tracking-wider font-bold">in deck</span>
                        </div>

                        <button
                          onClick={() => handleAdd(card)}
                          disabled={!canAddMore}
                          title={canAddMore ? "Add another copy" : `Max ${maxAllowed} copies reached`}
                          className={`p-1 rounded-lg transition border ${
                            canAddMore
                              ? 'btn-mythic-spark shadow-sm hover:scale-105'
                              : 'bg-stone-800 text-stone-500 border-white/5 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5 font-bold" />
                        </button>
                      </div>
                    )}
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
