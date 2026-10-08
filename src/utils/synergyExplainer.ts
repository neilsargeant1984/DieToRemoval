import { Card } from '../types/card';
import { SynergyMatchResult } from './synergyGraph';

/**
 * Transforms a raw match reason into an articulate, punchy tactical breakdown
 * explaining the causal mechanics without repetitive boilerplate.
 */
function articulateReason(raw: string, commander: Card | undefined, card: Card): string {
  const r = raw.trim();
  const lower = r.toLowerCase();
  const targetName = commander ? commander.name : 'your deck';

  // 1. Community inclusion & meta consensus
  if (r.startsWith('Played in')) {
    return r;
  }

  // 2. Already structured tagged explanations (e.g., "Graveyard Fuel: ...")
  if (r.includes(':') && !lower.startsWith('multi-role powerhouse')) {
    return r;
  }

  // 3. Functional Archetypes & Roles
  if (lower.includes('mass board sweeper') || lower.includes('board wipe')) {
    return `Board wipe: clears opposing threats and resets the board to stabilize.`;
  }
  if (lower.includes('targeted spot removal') || lower.includes('spot removal') || lower === 'removal') {
    return `Targeted removal: answers opposing key threats and protects your planeswalkers.`;
  }
  if (lower.includes('card advantage') || lower.includes('draw engine')) {
    return `Card draw engine: maintains hand size and continuously fuels your game plan.`;
  }
  if (lower.includes('commander & board protection') || lower.includes('protection')) {
    return `Protection: shields ${targetName} and key permanents from removal and combat damage.`;
  }
  if (lower.includes('sacrifice outlet')) {
    return `Sac outlet: triggers death and aristocrat synergies at instant speed.`;
  }
  if (lower.includes('graveyard recursion') || lower.includes('reanimation')) {
    return `Reanimation: recovers key permanents from your graveyard back onto the battlefield.`;
  }
  if (lower.includes('life drain') || lower.includes('aristocrat')) {
    return `Aristocrat drain: chips away at opponents' life totals as creatures die.`;
  }
  if (lower.includes('mana rock') || lower.includes('mana dork') || lower.includes('land ramp') || lower.includes('ramp')) {
    return `Mana acceleration: ramps ahead of curve to cast ${targetName} earlier.`;
  }
  if (lower.includes('graveyard hate')) {
    return `Graveyard interaction: exiles enemy graveyards to disrupt opposing recursion.`;
  }
  if (lower.includes('library search') || lower.includes('tutor')) {
    return `Tutor: searches library directly for crucial answers or combo pieces.`;
  }
  if (lower.includes('modal double-faced') || lower.includes('mdfc')) {
    return `MDFC spell-land: provides mana flexibility on early turns or a spell late.`;
  }
  if (lower.includes('utility land')) {
    return `Utility land: generates mana while providing valuable tactical abilities.`;
  }

  // 4. Synergy Graph causal match reasons
  if (lower.startsWith('supplies life gain')) {
    return `Lifegain fuel: triggers ${targetName}'s lifegain payoffs.`;
  }
  if (lower.startsWith('forces card draws')) {
    return `Draw catalyst: activates ${targetName}'s draw triggers.`;
  }
  if (lower.includes('spellslinger/magecraft engine')) {
    return `Spellslinger engine: triggers ${targetName}'s spellcasting abilities.`;
  }
  if (lower.startsWith('creature entry triggers')) {
    return `ETB enabler: triggers ${targetName} whenever creatures enter.`;
  }
  if (lower.startsWith('drains opponents and triggers value')) {
    return `Aristocrat value: drains opponents and generates value when creatures die.`;
  }
  if (lower.startsWith('instant/repeatable sacrifice outlet')) {
    return `Instant sac outlet: reliably triggers ${targetName}'s death payoffs.`;
  }
  if (lower.startsWith('provides sacrifice fodder')) {
    return `Sacrifice fodder: generates expendable tokens and recursive bodies for ${targetName}.`;
  }
  if (lower.startsWith('reanimates sacrificed creatures')) {
    return `Recursion loop: reanimates sacrificed creatures to re-trigger abilities.`;
  }
  if (lower.startsWith('rewards you whenever') && lower.includes('discards')) {
    return `Discard payoff: punishes opponents whenever cards are discarded.`;
  }
  if (lower.startsWith('generates energy')) {
    return `Energy generator: fuels ${targetName}'s energy requirements.`;
  }
  if (lower.startsWith('adds counters')) {
    return `Counter proliferation: boosts loyalty or +1/+1 counters for ${targetName}.`;
  }
  if (lower.startsWith('flickers')) {
    return `Flicker engine: blinks ${targetName} to repeat enter-the-battlefield triggers.`;
  }
  if (lower.startsWith('shares the') && lower.includes('creature tribe')) {
    return `Tribal synergy: ${r.toLowerCase()}.`;
  }
  if (lower.startsWith('on-color staple option')) {
    const colors = commander?.colorIdentity?.join('/') || 'on-color';
    return `On-color staple: highly efficient staple for ${colors} decks.`;
  }

  // Fallback: clean capitalization & punctuation
  const clean = r.charAt(0).toUpperCase() + r.slice(1);
  return clean.endsWith('.') ? clean : `${clean}.`;
}

/**
 * Generates an articulate, natural-language "Why this works" tactical breakdown
 * explaining the causal mechanics between two cards.
 */
export function explainSynergy(
  commander: Card | undefined,
  result: SynergyMatchResult
): string {
  const { card, matchReasons } = result;

  if (matchReasons && matchReasons.length > 0) {
    const primary = matchReasons[0];
    return articulateReason(primary, commander, card);
  }

  // Fallback archetype summary
  const targetName = commander ? commander.name : 'your deck';
  return `Strategic synergy: reinforces the core game plan of ${targetName} with complementary payoffs.`;
}
