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

  if (matchReasons.length > 0) {
    // If we have specific reasons, weave them into a crisp sentence
    const primary = matchReasons[0];
    const secondary = matchReasons[1];

    if (secondary) {
      return `${card.name} is a high-value synergy with ${commander.name}: It ${primary.toLowerCase()}, and ${secondary.toLowerCase()}.`;
    }
    return `${card.name} directly fuels ${commander.name}: It ${primary.toLowerCase()}.`;
  }

  // Fallback archetype summary
  return `${card.name} advances the primary game plan of ${commander.name} by providing complementary mechanical payoffs.`;
}
