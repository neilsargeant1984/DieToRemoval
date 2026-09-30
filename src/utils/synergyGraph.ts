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
  | 'flicker';

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
  | 'spellbook';

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
  if (/(whenever|if).*(you gain life|gained life)/i.test(text)) {
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
  if (/\bdelirium\b/i.test(text) || /\bescape\b/i.test(text) || /\bcards in your graveyard\b/i.test(text) || /\bundergrowth\b/i.test(text)) {
    demands.push('graveyard');
    archetypes.push('Graveyard / Delirium');
  }
  if (/\bpay \{e\}\b/i.test(text) || /(whenever|if).*get \{e\}/i.test(text)) {
    demands.push('energy');
    archetypes.push('Energy Engine');
  }
  if (/for each token|whenever a token/i.test(text)) {
    demands.push('tokens');
    archetypes.push('Tokens');
  }

  // --- EXTRACT SUPPLIES (PAYOFFS & ENABLERS) ---
  if (/\blifelink\b/i.test(text) || /\bgain(s)?\s+(\d+|x)?\s*life\b/i.test(text)) {
    supplies.push('gains_life');
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
  if (/\bmill(s)?\b/i.test(text) || /\bdiscard(s)?\s+(a|two|three|\d+|x)?\s*card/i.test(text) || /\beach player discards\b/i.test(text)) {
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

  const p1 = extractCardSynergies(commanderCard);
  const p2 = extractCardSynergies(candidateCard);
  const candidateText = (candidateCard.oracleText || '').toLowerCase();

  let score = 0;
  const matchReasons: string[] = [];

  // Match 1: Candidate supplies what Commander demands
  for (const dem of p1.demands) {
    if (dem === 'lifegain' && p2.supplies.includes('gains_life')) {
      score += 40;
      matchReasons.push(`Supplies Life Gain to trigger ${commanderCard.name}`);
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
      if (p2.supplies.includes('creates_tokens') || candidateText.includes('sacrifice a creature') || candidateText.includes('as an additional cost to cast this spell, sacrifice')) {
        score += 35;
        matchReasons.push(`Provides sacrifice fodder and death triggers for ${commanderCard.name}`);
      }
      if (p2.supplies.includes('reanimates')) {
        score += 30;
        matchReasons.push(`Recur sacrificed creatures back to the battlefield`);
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
  if (!isColorless && candidateCard.colors.some(c => commanderCard.colorIdentity.includes(c))) {
    score += 10;
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
