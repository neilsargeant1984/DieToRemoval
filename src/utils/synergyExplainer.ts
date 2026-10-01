import { Card } from '../types/card';
import { SynergyMatchResult } from './synergyGraph';

/**
 * Generates an articulate, natural-language "Why this works" tactical breakdown
 * explaining the causal mechanics between two cards.
 */
export function explainSynergy(
  commander: Card,
  result: SynergyMatchResult
): string {
  const { card, matchReasons } = result;

  if (matchReasons && matchReasons.length > 0) {
    const primary = matchReasons[0];
    const secondary = matchReasons[1];

    // If primary is already an articulated explanation
    if (primary.includes(':') || primary.startsWith('Format card') || primary.startsWith('Iconic') || primary.startsWith('Played in')) {
      return primary;
    }

    if (secondary) {
      return `${card.name} pairs with ${commander.name}: It ${primary.toLowerCase()}, and ${secondary.toLowerCase()}.`;
    }
    return `${card.name} synergizes with ${commander.name}: It ${primary.toLowerCase()}.`;
  }

  // Fallback archetype summary
  return `${card.name} advances the primary game plan of ${commander.name} by providing complementary mechanical payoffs.`;
}
