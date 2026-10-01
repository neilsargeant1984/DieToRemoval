import { transformScryfallCard } from './src/services/scryfallService';
import { fetchArenaCommunityMeta, EDHRECCardView } from './src/services/edhrecService';
import { calculateSynergy, SynergyMatchResult } from './src/utils/synergyGraph';
import { classifyCardRoles, getCardRoleChips, RoleChip } from './src/utils/roleClassifier';
import { getCommanderTriggerConfig, CommanderTriggerConfig } from './src/utils/commanderTriggers';
import { explainSynergy } from './src/utils/synergyExplainer';
import { Card, SynergyCategoryTab } from './src/types/card';

// List of 10 iconic and diverse Brawl/Commander staples across archetypes and color identities:
const COMMANDER_NAMES = [
  "Atraxa, Grand Unifier",      // 4-Color (GWUB) ETB / Value Engine
  "Heliod, Sun-Crowned",        // Mono-White Lifegain / +1+1 Counter Combo
  "Krenko, Mob Boss",           // Mono-Red Activated Tap / Goblin Aggro
  "Sauron, the Necromancer",    // Mono-Black Graveyard Reanimation / Ring
  "Stella Lee, Wild Card",      // Izzet (UR) Spellslinger / Cantrips
  "Korvold, Fae-Cursed King",   // Jund (BRG) Sacrifice / Treasures / Aristocrats
  "Yorion, Sky Nomad",          // Azorius (WU) Blink / ETB Permanents
  "Golos, Tireless Pilgrim",    // 5-Color Lands / Activated Ability
  "Baral, Chief of Compliance", // Mono-Blue Control / Instant & Sorcery cost reduction
  "Muldrotha, the Gravetide"    // Sultai (BGU) Graveyard Permanent Replay
];

async function fetchCommander(name: string): Promise<Card> {
  const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'BrawlDeckBuilderAudit/1.0',
      'Accept': 'application/json'
    }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Could not fetch commander ${name}: ${res.status} - ${errText}`);
  }
  const data = await res.json();
  return transformScryfallCard(data);
}

// Simulate BrawlSynergyConsole logic exactly
async function auditCommander(cmdName: string) {
  console.log(`\n======================================================================`);
  console.log(`AUDITING COMMANDER: ${cmdName}`);
  console.log(`======================================================================`);
  
  const commander = await fetchCommander(cmdName);
  console.log(`Colors: [${commander.colorIdentity.join(', ')}] | CMC: ${commander.cmc} | Types: ${commander.typeLine}`);
  console.log(`Rules: ${commander.oracleText.replace(/\n/g, ' ')}`);

  const triggerConfig = getCommanderTriggerConfig(commander);
  console.log(`Trigger Tab Enabled: ${triggerConfig.hasTriggers} (${triggerConfig.triggerType || 'none'}) - Label: "${triggerConfig.tabLabel}"`);

  // Fetch candidate pools
  const communityRes = await fetchArenaCommunityMeta(commander);
  console.log(`Community Meta (EDHREC consensus) items found: ${communityRes.cards.length}`);

  // Fetch search cards
  const queryParts = [`id<=${commander.colorIdentity.join('') || 'c'}`, 'f:brawl', '-t:basic'];
  const scryfallUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(queryParts.join(' '))}&order=edhrec`;
  let searchCards: Card[] = [];
  try {
    const sRes = await fetch(scryfallUrl, {
      headers: {
        'User-Agent': 'BrawlDeckBuilderAudit/1.0',
        'Accept': 'application/json'
      }
    });
    if (sRes.ok) {
      const sData = await sRes.json();
      searchCards = (sData.data || []).map(transformScryfallCard).filter((c: Card) => 
        c.colorIdentity.every(col => commander.colorIdentity.includes(col))
      );
    }
  } catch (e) {
    console.warn("Scryfall query error", e);
  }

  // Combine into cardMap
  const cardMap = new Map<string, Card>();
  const communityMap = new Map<string, EDHRECCardView>();

  for (const item of communityRes.cards) {
    if (!item.card.colorIdentity.every(col => commander.colorIdentity.includes(col))) continue;
    const key = item.card.name.toLowerCase().trim();
    if (!cardMap.has(key)) cardMap.set(key, item.card);
    if (!communityMap.has(key)) communityMap.set(key, item);
  }

  for (const c of searchCards) {
    if (!c.colorIdentity.every(col => commander.colorIdentity.includes(col))) continue;
    const key = c.name.toLowerCase().trim();
    if (!cardMap.has(key)) cardMap.set(key, c);
  }

  const allCards = Array.from(cardMap.values());
  console.log(`Total Unique Candidates in Pool: ${allCards.length}`);

  // Score candidate pool
  const scored: SynergyMatchResult[] = [];
  for (const c of allCards) {
    const match = calculateSynergy(commander, c);
    const isTrigger = triggerConfig.hasTriggers && triggerConfig.isTriggerCard(c);
    const comm = communityMap.get(c.name.toLowerCase().trim());
    const isWalker = c.types.includes('Planeswalker') || (c.typeLine || '').toLowerCase().includes('planeswalker');
    const isOnColor = c.colors.some(col => commander.colorIdentity.includes(col));

    if (match) {
      if (isTrigger) {
        match.score = Math.max(match.score + 25, 82);
        match.matchReasons.unshift(triggerConfig.getCardReason(commander, c));
      }
      if (comm && comm.inclusion >= 25) {
        match.score = match.score + Math.round(comm.inclusion * 0.1);
      }
      match.score = Math.min(99, Math.max(1, match.score));
      scored.push(match);
    } else if (comm) {
      const commScore = Math.min(95, Math.round(comm.inclusion * 0.75 + (isOnColor ? 20 : 10)));
      scored.push({
        card: c,
        score: Math.max(commScore, 58),
        matchReasons: [`Played in ${comm.inclusion}% of community ${commander.name} decks`],
        category: (c.types.includes('Creature') || (c.typeLine || '').toLowerCase().includes('creature'))
          ? 'Creature'
          : (c.types.includes('Instant') || c.types.includes('Sorcery') ? 'Instant/Sorcery' : (c.types.includes('Land') ? 'Land' : 'Artifact/Enchantment'))
      });
    } else {
      const role = classifyCardRoles(c, commander);
      if (isTrigger || role.roles.length > 0) {
        scored.push({
          card: c,
          score: isTrigger ? 82 : 65,
          matchReasons: isTrigger ? [triggerConfig.getCardReason(commander, c)] : [role.explanation[0] || 'Functional Role Staple'],
          category: (c.types.includes('Creature') || (c.typeLine || '').toLowerCase().includes('creature')) ? 'Creature' : 'Artifact/Enchantment'
        });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);

  // Audit Tab Outputs
  const tabsToAudit: { id: SynergyCategoryTab; label: string }[] = [
    { id: 'meta_staples', label: 'Staple Cards' },
    ...(triggerConfig.hasTriggers ? [{ id: 'commander_triggers' as SynergyCategoryTab, label: triggerConfig.tabLabel }] : []),
    { id: 'creatures', label: 'Creatures' },
    { id: 'artifacts', label: 'Artifacts' },
    { id: 'planeswalkers', label: 'Planeswalkers' },
    { id: 'ramp', label: 'Mana Ramp' },
    { id: 'card_draw', label: 'Card Draw' },
    { id: 'removal', label: 'Removal' }
  ];

  for (const tab of tabsToAudit) {
    let tabItems: { card: Card; score: number; reason: string; roleChips: RoleChip[] }[] = [];

    if (tab.id === 'meta_staples') {
      const universalStaples = new Set([
        'Sol Ring', 'Arcane Signet', 'Command Tower', 'Mind Stone', 'Coldsteel Heart',
        'Fellwar Stone', 'Swords to Plowshares', 'Path to Exile', 'Counterspell',
        'Lightning Bolt', 'Demonic Tutor', 'Cultivate', 'Heroic Intervention'
      ]);
      const stapleMap = new Map<string, any>();
      for (const item of communityRes.cards) {
        const c = item.card;
        if (c.types.includes('Land') && !universalStaples.has(c.name)) continue;
        const causal = calculateSynergy(commander, c);
        const isOnColor = c.colors.some(col => commander.colorIdentity.includes(col));
        const isIconic = universalStaples.has(c.name);
        const roleChips = getCardRoleChips(c, commander);
        const causalScore = causal ? causal.score : 40;
        const bonus = (isOnColor ? 15 : (isIconic ? 15 : 0)) + (roleChips.length >= 2 ? 10 : 0);
        const stapleScore = Math.min(99, Math.round((causalScore * 0.70) + (item.inclusion * 0.30) + bonus));
        if (stapleScore >= 45) {
          stapleMap.set(c.name.toLowerCase().trim(), {
            card: c,
            score: stapleScore,
            reason: causal ? explainSynergy(commander, causal) : `Iconic community staple (${item.inclusion}% deck inclusion)`,
            roleChips
          });
        }
      }
      for (const item of scored) {
        const c = item.card;
        const key = c.name.toLowerCase().trim();
        if (stapleMap.has(key)) continue;
        if (c.types.includes('Land') && !universalStaples.has(c.name)) continue;
        if (item.score >= 50) {
          const roleChips = getCardRoleChips(c, commander);
          stapleMap.set(key, {
            card: c,
            score: item.score,
            reason: explainSynergy(commander, item),
            roleChips
          });
        }
      }
      tabItems = Array.from(stapleMap.values()).sort((a, b) => b.score - a.score || a.card.cmc - b.card.cmc);
    } else if (tab.id === 'commander_triggers' && triggerConfig.hasTriggers) {
      const seen = new Set<string>();
      for (const item of scored) {
        if (triggerConfig.isTriggerCard(item.card)) {
          seen.add(item.card.name.toLowerCase().trim());
          tabItems.push({
            card: item.card,
            score: Math.max(item.score, 75),
            reason: triggerConfig.getCardReason(commander, item.card),
            roleChips: getCardRoleChips(item.card, commander)
          });
        }
      }
      tabItems.sort((a, b) => b.score - a.score || a.card.cmc - b.card.cmc);
    } else {
      tabItems = scored
        .filter(item => {
          const c = item.card;
          if (!c.colorIdentity.every(col => commander.colorIdentity.includes(col))) return false;
          if (tab.id === 'creatures') return c.types.includes('Creature');
          if (tab.id === 'artifacts') return c.types.includes('Artifact') && !c.types.includes('Creature');
          if (tab.id === 'planeswalkers') return c.types.includes('Planeswalker');
          const roles = classifyCardRoles(c, commander);
          if (tab.id === 'ramp') return roles.roles.includes('ramp');
          if (tab.id === 'removal') return roles.roles.includes('removal');
          if (tab.id === 'card_draw') return roles.roles.includes('card_advantage');
          return false;
        })
        .map(item => ({
          card: item.card,
          score: item.score,
          reason: explainSynergy(commander, item),
          roleChips: getCardRoleChips(item.card, commander)
        }))
        .sort((a, b) => b.score - a.score || (a.card.colors.length === 0 ? 1 : 0) - (b.card.colors.length === 0 ? 1 : 0) || a.card.cmc - b.card.cmc);
    }

    // Inspect Top 5 cards for anomalies
    const top5 = tabItems.slice(0, 5);
    console.log(`\n  [Tab: ${tab.label}] (${tabItems.length} cards total)`);
    if (top5.length === 0) {
      console.log(`    ⚠️ EMPTY TAB! No cards matched.`);
    } else {
      top5.forEach((item, idx) => {
        const colorStr = item.card.colors.length > 0 ? item.card.colors.join('/') : 'Colorless';
        const isOffColorText = item.card.oracleText.toLowerCase();
        let flaw = '';
        // Check for potential flaws
        if (!item.card.colorIdentity.every(col => commander.colorIdentity.includes(col))) {
          flaw = '🚨 CRITICAL FLAW: OFF-COLOR IDENTITY CARD!';
        }
        console.log(`    #${idx + 1} [${item.score}%] ${item.card.name} (${colorStr}, CMC ${item.card.cmc}) | Roles: [${item.roleChips.map(r => r.label).join(', ')}] ${flaw}`);
        console.log(`        ↳ Reason: ${item.reason}`);
      });
    }
  }
}

async function run() {
  for (const name of COMMANDER_NAMES) {
    try {
      await auditCommander(name);
      // Wait 300ms between commanders to be courteous to Scryfall API
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error(`Audit error for ${name}:`, e);
    }
  }
}

run();
