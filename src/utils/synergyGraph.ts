import { Card } from '../types/card';

export type TriggerDemand = 
  | 'draw' 
  | 'discard' 
  | 'lifegain' 
  | 'damage' 
  | 'death_sacrifice' 
  | 'spell_cast' 
  | 'artifact_etb' 
  | 'creature_etb' 
  | 'counters' 
  | 'graveyard' 
  | 'energy' 
  | 'tokens'
  | 'flicker'
  | 'ring_bearer';

export type OutputSupply = 
  | 'gains_life' 
  | 'draws_cards' 
  | 'creates_tokens' 
  | 'deals_burn' 
  | 'fills_graveyard' 
  | 'produces_counters' 
  | 'produces_energy' 
  | 'produces_treasures' 
  | 'reanimates' 
  | 'flicker'
  | 'cheap_cantrip'
  | 'spellbook'
  | 'ring_temptation';

export interface CardSynergyProfile {
  card: Card;
  demands: TriggerDemand[];
  supplies: OutputSupply[];
  archetypes: string[];
}

/**
 * Extracts causal demands (what triggers it) and supplies (what it generates) from rules text.
 */
export function extractCardSynergies(card: Card): CardSynergyProfile {
  const text = (card.oracleText || '').toLowerCase();
  const demands: TriggerDemand[] = [];
  const supplies: OutputSupply[] = [];
  const archetypes: string[] = [];

  // --- EXTRACT DEMANDS (TRIGGERS) ---
  if (/(whenever|if).*(you draw|opponent draws|player draws|you've drawn)/i.test(text)) {
    demands.push('draw');
    archetypes.push('Card Draw Triggers');
  }
  if (/\bdiscard(s)?\s+(a|two|three|\d+|x)?\s*card/i.test(text) || /\beach player discards\b/i.test(text) || /(whenever|if).*discards/i.test(text)) {
    demands.push('discard');
    archetypes.push('Discard / Madness');
  }
  if (
    /(whenever|if).*(you gain|gained)\s+(\d+|one|two|three|or more|\w+)*\s*life/i.test(text) ||
    /life total is greater/i.test(text) ||
    /for each.*life you gained/i.test(text) ||
    /amount of life you gained/i.test(text) ||
    /\bextort\b/i.test(text) ||
    /equal to the life you gained/i.test(text) ||
    /whenever you gain life/i.test(text) ||
    /if you gained \d+ or more life/i.test(text) ||
    (text.includes('life') && (text.includes('starting life total') || text.includes('gained this turn')))
  ) {
    demands.push('lifegain');
    archetypes.push('Lifegain Payoffs');
  }
  if (
    /(whenever|if).*(another)?.*(nontoken)?.*(creature|permanent).*dies/i.test(text) ||
    /\bsacrifice(s)?\s+(a|another|one|\d+)?\s*(nontoken)?\s*(creature|permanent|artifact)\b/i.test(text) ||
    /\bput into (a|your) graveyard from the battlefield\b/i.test(text)
  ) {
    demands.push('death_sacrifice');
    archetypes.push('Aristocrats / Sacrifice');
  }
  if (/(whenever|if).*you cast an? (instant|sorcery|noncreature)/i.test(text) || /\bmagecraft\b/i.test(text) || /\bprowess\b/i.test(text)) {
    demands.push('spell_cast');
    archetypes.push('Spellslinger / Prowess');
  }
  if (/(whenever|if).*artifact.*enters/i.test(text) || /\baffinity for artifacts\b/i.test(text)) {
    demands.push('artifact_etb');
    archetypes.push('Artifact Engine');
  }
  if (/(whenever|if).*(another)?.*creature enters/i.test(text)) {
    demands.push('creature_etb');
    archetypes.push('Creature ETB / Blink');
  }
  if (/(whenever|if).*put.*counter/i.test(text) || /\bmodified\b/i.test(text)) {
    demands.push('counters');
    archetypes.push('+1/+1 & Counters');
  }
  if (/\bdelirium\b/i.test(text) || /\bescape\b/i.test(text) || /\bcards in your graveyard\b/i.test(text) || /\bundergrowth\b/i.test(text) || /(exile|return|cast|put).*card.*from (your|a) graveyard/i.test(text) || /target creature card from your graveyard/i.test(text) || /creature card in your graveyard/i.test(text) || /creature spell from your graveyard/i.test(text)) {
    demands.push('graveyard');
    archetypes.push('Graveyard / Reanimation');
  }
  if (/\bpay \{e\}\b/i.test(text) || /(whenever|if).*get \{e\}/i.test(text)) {
    demands.push('energy');
    archetypes.push('Energy Engine');
  }
  if (/for each token|whenever a token/i.test(text)) {
    demands.push('tokens');
    archetypes.push('Tokens');
  }
  if (text.includes('ring-bearer') || text.includes('whenever the ring tempts you')) {
    demands.push('ring_bearer');
    archetypes.push('The Ring Tempts You');
  }

  // --- EXTRACT SUPPLIES (PAYOFFS & ENABLERS) ---
  if (
    /\blifelink\b/i.test(text) || 
    /\bgain(s)?\s+(\d+|x)?\s*life\b/i.test(text) ||
    /food token/i.test(text) ||
    /\bextort\b/i.test(text) ||
    /creatures (and planeswalkers )?you control have lifelink/i.test(text) ||
    /put a lifelink counter/i.test(text) ||
    /you gain life equal to/i.test(text) ||
    (text.includes('deals') && text.includes('you gain that much life'))
  ) {
    supplies.push('gains_life');
  }
  if (text.includes('the ring tempts you')) {
    supplies.push('ring_temptation');
  }
  if (/\bdraw(s)?\s+(a|two|three|\d+|x)?\s*card/i.test(text) || /\binvestigate\b/i.test(text)) {
    supplies.push('draws_cards');
  }
  if (/\bcreate(s)?\s+(a|two|three|\d+|x)?.*token/i.test(text)) {
    supplies.push('creates_tokens');
    if (/treasure/i.test(text)) {
      supplies.push('produces_treasures');
    }
  }
  if (/\bdeals\s+(\d+|x)?\s*damage to (any target|target player|each opponent|target)/i.test(text)) {
    supplies.push('deals_burn');
  }
  if (/\bmill(s|ing)?\b/i.test(text) || /\bsurveil\b/i.test(text) || /\bdiscard(s|ing)?\b/i.test(text) || /\beach player discards\b/i.test(text) || /put.*into your graveyard/i.test(text) || /search your library.*into your graveyard/i.test(text) || /\bentomb\b/i.test(text)) {
    supplies.push('fills_graveyard');
  }
  if (/put.*counter/i.test(text) || /\bproliferate\b/i.test(text)) {
    supplies.push('produces_counters');
  }
  if (/get \{e\}/i.test(text)) {
    supplies.push('produces_energy');
  }
  if (/\breturn target.*from (your|a) graveyard\b/i.test(text) || /\bput.*from (your|a) graveyard onto the battlefield\b/i.test(text) || /\bcast.*from your graveyard\b/i.test(text)) {
    supplies.push('reanimates');
  }
  if (/\bexile\b.*return it to the battlefield/i.test(text)) {
    supplies.push('flicker');
  }
  if (card.cmc <= 1 && (card.types.includes('Instant') || card.types.includes('Sorcery')) && (text.includes('draw a card') || text.includes('scry'))) {
    supplies.push('cheap_cantrip');
  }
  if (card.spellbook && card.spellbook.length > 0) {
    supplies.push('spellbook');
  }

  return { card, demands, supplies, archetypes };
}

export interface SynergyMatchResult {
  card: Card;
  score: number;
  matchReasons: string[];
  category: 'Creature' | 'Instant/Sorcery' | 'Artifact/Enchantment' | 'Land';
}

/**
 * Calculates causal synergy compatibility between target card (e.g. Commander) and candidate card.
 */
export function calculateSynergy(
  commanderCard: Card,
  candidateCard: Card
): SynergyMatchResult | null {
  // Don't synergize with self
  if (commanderCard.id === candidateCard.id || commanderCard.name === candidateCard.name) {
    return null;
  }

  // Strict Color Identity Check: Candidate color identity MUST be a subset of Commander's
  if (!candidateCard.colorIdentity.every(col => commanderCard.colorIdentity.includes(col))) {
    return null;
  }

  const candidateText = (candidateCard.oracleText || '').toLowerCase();

  // Color text restriction: If a colorless card explicitly refers only to an off-color creature/spell/permanent
  // (e.g. Bontu's Monument specifies "black creature spells you cast cost {1} less", 
  // Hazoret's Monument specifies "red creature spells", etc.),
  // it should NEVER synergize with a commander that does not share that color!
  const colorKeywords: { name: string; code: 'W' | 'U' | 'B' | 'R' | 'G' }[] = [
    { name: 'white', code: 'W' },
    { name: 'blue', code: 'U' },
    { name: 'black', code: 'B' },
    { name: 'red', code: 'R' },
    { name: 'green', code: 'G' }
  ];

  for (const { name: colorName, code: colorCode } of colorKeywords) {
    if (!commanderCard.colorIdentity.includes(colorCode)) {
      // If card specifies "{color} creature spells you cast cost" or "{color} spells you cast cost"
      const costReductionPattern = new RegExp(`\\b${colorName}\\s+(creature\\s+)?spells\\s+you\\s+cast\\s+cost`, 'i');
      if (costReductionPattern.test(candidateText)) {
        return null;
      }
      // Devotion to off-color
      const devotionPattern = new RegExp(`devotion\\s+to\\s+${colorName}`, 'i');
      if (devotionPattern.test(candidateText)) {
        return null;
      }
    }
  }

  const p1 = extractCardSynergies(commanderCard);
  const p2 = extractCardSynergies(candidateCard);

  let score = 0;
  const matchReasons: string[] = [];

  // Match 1: Candidate supplies what Commander demands
  for (const dem of p1.demands) {
    if (dem === 'lifegain') {
      const isWalker = candidateCard.types.includes('Planeswalker') || (candidateCard.typeLine || '').toLowerCase().includes('planeswalker');
      const isFoodOrSacLife = candidateText.includes('food') || (candidateText.includes('sacrifice') && candidateText.includes('gain'));
      const commanderCaresAboutSacrifice = p1.demands.includes('death_sacrifice') || (commanderCard.oracleText || '').toLowerCase().includes('sacrifice');

      if (p2.supplies.includes('gains_life')) {
        // High score for repeatable/creature-based natural lifegain (Soul Warden, Authority of the Consuls, Lifelinkers, Walkers)
        // Modest score for sac-based food outlets unless the commander actively wants creature sacrifice
        let lifeScore = isWalker ? 55 : 45;
        if (isFoodOrSacLife && !commanderCaresAboutSacrifice) {
          lifeScore = 25; // Modest, non-inflated score for sac-dependent incidental lifegain
        }
        score += lifeScore;
        matchReasons.push(isWalker 
          ? `Lifegain planeswalker: generates repeatable lifegain to trigger ${commanderCard.name}` 
          : `Supplies Life Gain to trigger ${commanderCard.name}`);
      }
      if (p2.demands.includes('lifegain')) {
        score += isWalker ? 50 : 38;
        matchReasons.push(`Synergistic lifegain payoff that scales with ${commanderCard.name}`);
      }
    }
    if (dem === 'draw' && p2.supplies.includes('draws_cards')) {
      score += 45;
      matchReasons.push(`Forces card draws to activate ${commanderCard.name}'s draw triggers`);
    }
    if (dem === 'spell_cast' && (candidateCard.types.includes('Instant') || candidateCard.types.includes('Sorcery'))) {
      const boost = p2.supplies.includes('cheap_cantrip') ? 45 : 30;
      score += boost;
      matchReasons.push(`Triggers ${commanderCard.name}'s spellslinger/magecraft engine`);
    }
    if (dem === 'creature_etb' && candidateCard.types.includes('Creature')) {
      score += 25;
      matchReasons.push(`Creature entry triggers ${commanderCard.name}`);
    }
    if (dem === 'death_sacrifice') {
      // 1. Death Triggers & Aristocrat Drains (Blood Artist, Zulaport, Bastion, Meathook)
      if (
        /(whenever|if).*(another)?.*(creature|permanent).*dies.*(lose|draw|gain|create|deals)/i.test(candidateText) ||
        /\bwhenever a creature you control dies\b/i.test(candidateText)
      ) {
        score += 50;
        matchReasons.push(`Drains opponents and triggers value whenever creatures die`);
      }
      // 2. Sac Outlets (Deadly Dispute, Village Rites, Tower, Ashnod's Altar, Diabolic Intent)
      if (
        /sacrifice (a|an|another)?\s*(creature|permanent|artifact)/i.test(candidateText) ||
        /as an additional cost.*sacrifice/i.test(candidateText)
      ) {
        score += 45;
        matchReasons.push(`Instant/repeatable sacrifice outlet to trigger ${commanderCard.name}`);
      }
      // 3. Sacrifice Fodder & Recursive creatures (Gravecrawler, Bitterblossom)
      if (p2.supplies.includes('creates_tokens') || /from your graveyard to (your hand|the battlefield)/i.test(candidateText)) {
        score += 35;
        matchReasons.push(`Provides sacrifice fodder and recurring bodies for ${commanderCard.name}`);
      }
      // 4. Reanimation (Reanimate, Victimize)
      if (p2.supplies.includes('reanimates')) {
        score += 40;
        matchReasons.push(`Reanimates sacrificed creatures back to the battlefield`);
      }
    }
    if (dem === 'discard') {
      if (candidateText.includes('whenever a player discards') || candidateText.includes('whenever an opponent discards') || candidateText.includes('discard a card')) {
        score += 40;
        matchReasons.push(`Rewards you whenever ${commanderCard.name} forces discards`);
      }
    }
    if (dem === 'energy' && p2.supplies.includes('produces_energy')) {
      score += 45;
      matchReasons.push(`Generates energy counters needed for ${commanderCard.name}`);
    }
    if (dem === 'counters' && p2.supplies.includes('produces_counters')) {
      score += 35;
      matchReasons.push(`Adds counters to trigger ${commanderCard.name}'s counter abilities`);
    }
    if (dem === 'graveyard') {
      if (p2.supplies.includes('fills_graveyard')) {
        score += 48;
        matchReasons.push(`Graveyard Fuel: Discards or mills creature targets into your graveyard for ${commanderCard.name}`);
      } else if (
        /additional cost.*discard/i.test(candidateText) ||
        /discard (a|one|two|\d+)?\s*card/i.test(candidateText) ||
        /draw.*then discard/i.test(candidateText)
      ) {
        score += 45;
        matchReasons.push(`Discard Outlet: Discards high-cost creatures from hand into graveyard for ${commanderCard.name}`);
      }
      // High-impact reanimation targets
      if (
        candidateCard.types.includes('Creature') &&
        candidateCard.cmc >= 5 &&
        (/(enters|attacks|dies).*deals|destroy|draw|exile|drain|each opponent/i.test(candidateText) || (parseInt(candidateCard.power || '0', 10) >= 6))
      ) {
        score += 35;
        matchReasons.push(`High-Impact Reanimation Target: Devastating body to reanimate with ${commanderCard.name}`);
      }
    }
    if (dem === 'ring_bearer' && p2.supplies.includes('ring_temptation')) {
      score += 55;
      matchReasons.push(`The Ring Tempts You: Designates Ring-bearer so ${commanderCard.name}'s token copies remain permanently`);
    }
  }

  // Mono-color Devotion Finisher (Gray Merchant of Asphodel, Nykthos)
  if (commanderCard.colorIdentity.length === 1 && /devotion to/i.test(candidateText)) {
    score += 45;
    matchReasons.push(`Devotion finisher capitalizing on mono-${commanderCard.colorIdentity[0]} permanents`);
  }

  // Match 2: Commander supplies what Candidate demands (Two-way synergy!)
  for (const dem of p2.demands) {
    if (dem === 'lifegain' && p1.supplies.includes('gains_life')) {
      score += 35;
      matchReasons.push(`Rewards you whenever ${commanderCard.name} gains life`);
    }
    if (dem === 'draw' && p1.supplies.includes('draws_cards')) {
      score += 35;
      matchReasons.push(`Rewards you whenever ${commanderCard.name} draws cards`);
    }
    if (dem === 'death_sacrifice' && p1.supplies.includes('creates_tokens')) {
      score += 30;
      matchReasons.push(`Consumes the tokens generated by ${commanderCard.name}`);
    }
    if (dem === 'creature_etb' && commanderCard.types.includes('Creature')) {
      score += 20;
      matchReasons.push(`Triggers when ${commanderCard.name} enters the battlefield`);
    }
    if (dem === 'tokens' && p1.supplies.includes('creates_tokens')) {
      score += 30;
      matchReasons.push(`Multiplies the tokens created by ${commanderCard.name}`);
    }
    if (dem === 'energy' && p1.supplies.includes('produces_energy')) {
      score += 35;
      matchReasons.push(`Consumes the energy generated by ${commanderCard.name}`);
    }
  }

  // Match 3: Blink / Flicker synergies for powerful ETB commanders
  if (commanderCard.oracleText?.toLowerCase().includes('when') && commanderCard.oracleText?.toLowerCase().includes('enters the battlefield')) {
    if (p2.supplies.includes('flicker')) {
      score += 50;
      matchReasons.push(`Flickers ${commanderCard.name} to re-trigger its enters-the-battlefield ability`);
    }
  }

  // Match 4: Typal / Tribe matching (e.g. Bird, Wizard, Cat, Dragon)
  if (commanderCard.subtypes && candidateCard.subtypes) {
    for (const sub of commanderCard.subtypes) {
      if (candidateCard.subtypes.includes(sub)) {
        score += 15;
        matchReasons.push(`Shares the ${sub} creature tribe`);
        break;
      }
    }
  }

  // Match 5: Color Affinity (favor on-color cards over generic colorless filler)
  const isColorless = candidateCard.colors.length === 0;
  if (commanderCard.colorIdentity.length > 0) {
    if (!isColorless && candidateCard.colors.some(c => commanderCard.colorIdentity.includes(c))) {
      score += 15;
    } else if (isColorless) {
      // De-prioritize high-cost generic colorless cards unless commander is colorless or artifact-based
      const isArtifactCommander = p1.demands.includes('artifact_etb') || (commanderCard.oracleText || '').toLowerCase().includes('colorless');
      if (!isArtifactCommander) {
        if (candidateCard.cmc >= 5) {
          score -= 15;
        } else {
          score -= 5;
        }
      }
    }
  }

  // Determine Category
  let category: 'Creature' | 'Instant/Sorcery' | 'Artifact/Enchantment' | 'Land' = 'Artifact/Enchantment';
  if (candidateCard.types.includes('Land')) {
    category = 'Land';
  } else if (candidateCard.types.includes('Creature')) {
    category = 'Creature';
  } else if (candidateCard.types.includes('Instant') || candidateCard.types.includes('Sorcery')) {
    category = 'Instant/Sorcery';
  }

  if (score < 15) {
    return null;
  }

  return {
    card: candidateCard,
    score: Math.min(99, score),
    matchReasons,
    category
  };
}
