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
  if (text.includes('whenever you draw') || text.includes('whenever an opponent draws') || text.includes('if you\'ve drawn')) {
    demands.push('draw');
    archetypes.push('Card Draw Triggers');
  }
  if (text.includes('whenever you discard') || text.includes('whenever a player discards')) {
    demands.push('discard');
    archetypes.push('Discard / Madness');
  }
  if (text.includes('whenever you gain life') || text.includes('if you gained life')) {
    demands.push('lifegain');
    archetypes.push('Lifegain Payoffs');
  }
  if (text.includes('whenever a creature dies') || text.includes('whenever another creature dies') || text.includes('sacrifice a creature')) {
    demands.push('death_sacrifice');
    archetypes.push('Aristocrats / Sacrifice');
  }
  if (text.includes('whenever you cast an instant or sorcery') || text.includes('whenever you cast a noncreature spell') || text.includes('magecraft') || text.includes('prowess')) {
    demands.push('spell_cast');
    archetypes.push('Spellslinger / Prowess');
  }
  if (text.includes('whenever an artifact enters') || text.includes('whenever another artifact')) {
    demands.push('artifact_etb');
    archetypes.push('Artifact Engine');
  }
  if (text.includes('whenever another creature enters') || text.includes('whenever a creature enters')) {
    demands.push('creature_etb');
    archetypes.push('Creature ETB / Blink');
  }
  if (text.includes('whenever you put') && text.includes('counter') || text.includes('modified')) {
    demands.push('counters');
    archetypes.push('+1/+1 & Counters');
  }
  if (text.includes('delirium') || text.includes('escape') || text.includes('cards in your graveyard')) {
    demands.push('graveyard');
    archetypes.push('Graveyard / Delirium');
  }
  if (text.includes('pay {e}') || text.includes('whenever you get {e}')) {
    demands.push('energy');
    archetypes.push('Energy Engine');
  }
  if (text.includes('for each token you control') || text.includes('whenever a token enters')) {
    demands.push('tokens');
    archetypes.push('Tokens');
  }

  // --- EXTRACT SUPPLIES (PAYOFFS & ENABLERS) ---
  if (text.includes('you gain') && (text.includes('life') || text.includes('lifelink'))) {
    supplies.push('gains_life');
  }
  if (text.includes('draw a card') || text.includes('draw two cards') || text.includes('draw three cards') || text.includes('target player draws')) {
    supplies.push('draws_cards');
  }
  if (text.includes('create a') && (text.includes('token') || text.includes('tokens'))) {
    supplies.push('creates_tokens');
    if (text.includes('treasure')) {
      supplies.push('produces_treasures');
    }
  }
  if (text.includes('deals') && (text.includes('damage to any target') || text.includes('damage to target'))) {
    supplies.push('deals_burn');
  }
  if (text.includes('mill') || text.includes('discard a card') || text.includes('discards a card')) {
    supplies.push('fills_graveyard');
  }
  if (text.includes('put a +1/+1 counter') || text.includes('proliferate') || text.includes('puts a +1/+1 counter')) {
    supplies.push('produces_counters');
  }
  if (text.includes('you get {e}')) {
    supplies.push('produces_energy');
  }
  if (text.includes('return target creature card from your graveyard') || text.includes('put') && text.includes('graveyard onto the battlefield')) {
    supplies.push('reanimates');
  }
  if (text.includes('exile') && text.includes('return it to the battlefield')) {
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
    if (dem === 'death_sacrifice' && (p2.supplies.includes('creates_tokens') || candidateCard.oracleText?.toLowerCase().includes('sacrifice'))) {
      score += 35;
      matchReasons.push(`Provides sacrifice fodder and death triggers`);
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
