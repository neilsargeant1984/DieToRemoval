import { DeckCard } from '../types/deck';
import { Card, CardTypeCategory, ManaColor } from '../types/card';

export interface ManaCurvePoint {
  cmc: number;
  label: string;
  count: number;
}

export interface ColorPipStat {
  color: ManaColor;
  label: string;
  pips: number;
  landSources: number;
  badgeColor: string;
  barColor: string;
}

export interface TypeBreakdownPoint {
  type: CardTypeCategory;
  count: number;
  percentage: number;
}

export interface DeckStats {
  totalCards: number;
  landCount: number;
  nonLandCount: number;
  averageCmc: number;
  manaCurve: ManaCurvePoint[];
  colorPips: ColorPipStat[];
  typeBreakdown: TypeBreakdownPoint[];
}

export function calculateDeckStats(mainboard: DeckCard[]): DeckStats {
  let totalCards = 0;
  let landCount = 0;
  let totalNonLandCmc = 0;
  let nonLandCount = 0;

  const cmcCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  const typeCounts: Partial<Record<CardTypeCategory, number>> = {};
  const pips: Record<ManaColor, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  const landSources: Record<ManaColor, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };

  for (const item of mainboard) {
    const { card, quantity } = item;
    totalCards += quantity;

    const isLand = card.types.includes('Land');
    if (isLand) {
      landCount += quantity;
      // Check which colors this land produces
      for (const color of card.colorIdentity) {
        landSources[color] = (landSources[color] || 0) + quantity;
      }
    } else {
      nonLandCount += quantity;
      totalNonLandCmc += card.cmc * quantity;
      const bucket = Math.min(card.cmc, 7);
      cmcCounts[bucket] = (cmcCounts[bucket] || 0) + quantity;

      // Parse pips from mana cost string e.g. {1}{U}{U} or {2}{R}{W}
      const matches = card.manaCost.match(/\{([WUBRGC])\}/g) || [];
      for (const m of matches) {
        const symbol = m.replace(/[\{\}]/g, '') as ManaColor;
        if (pips[symbol] !== undefined) {
          pips[symbol] += quantity;
        }
      }
    }

    // Type distribution
    for (const t of card.types) {
      typeCounts[t] = (typeCounts[t] || 0) + quantity;
    }
  }

  const averageCmc = nonLandCount > 0 ? Number((totalNonLandCmc / nonLandCount).toFixed(2)) : 0;

  const manaCurve: ManaCurvePoint[] = [
    { cmc: 1, label: '1', count: cmcCounts[1] || 0 },
    { cmc: 2, label: '2', count: cmcCounts[2] || 0 },
    { cmc: 3, label: '3', count: cmcCounts[3] || 0 },
    { cmc: 4, label: '4', count: cmcCounts[4] || 0 },
    { cmc: 5, label: '5', count: cmcCounts[5] || 0 },
    { cmc: 6, label: '6', count: cmcCounts[6] || 0 },
    { cmc: 7, label: '7+', count: cmcCounts[7] || 0 }
  ];

  const colorPips: ColorPipStat[] = [
    { color: 'W', label: 'White', pips: pips.W, landSources: landSources.W, badgeColor: 'bg-amber-100 text-amber-900 border-amber-300', barColor: '#fef08a' },
    { color: 'U', label: 'Blue', pips: pips.U, landSources: landSources.U, badgeColor: 'bg-blue-600 text-white border-blue-400', barColor: '#3b82f6' },
    { color: 'B', label: 'Black', pips: pips.B, landSources: landSources.B, badgeColor: 'bg-neutral-800 text-neutral-200 border-neutral-600', barColor: '#52525b' },
    { color: 'R', label: 'Red', pips: pips.R, landSources: landSources.R, badgeColor: 'bg-red-600 text-white border-red-400', barColor: '#ef4444' },
    { color: 'G', label: 'Green', pips: pips.G, landSources: landSources.G, badgeColor: 'bg-emerald-600 text-white border-emerald-400', barColor: '#10b981' }
  ];

  const typeOrder: CardTypeCategory[] = ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Planeswalker', 'Land'];
  const typeBreakdown: TypeBreakdownPoint[] = typeOrder
    .map(type => ({
      type,
      count: typeCounts[type] || 0,
      percentage: totalCards > 0 ? Math.round(((typeCounts[type] || 0) / totalCards) * 100) : 0
    }))
    .filter(t => t.count > 0);

  return {
    totalCards,
    landCount,
    nonLandCount,
    averageCmc,
    manaCurve,
    colorPips,
    typeBreakdown
  };
}

/**
 * Simulates drawing an opening hand of 7 cards from the mainboard.
 */
export function simulateOpeningHand(mainboard: DeckCard[], handSize: number = 7): {
  hand: Card[];
  remainingLibrary: Card[];
} {
  const library: Card[] = [];
  for (const item of mainboard) {
    for (let i = 0; i < item.quantity; i++) {
      library.push(item.card);
    }
  }

  // Fisher-Yates Shuffle
  for (let i = library.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [library[i], library[j]] = [library[j], library[i]];
  }

  const hand = library.slice(0, handSize);
  const remainingLibrary = library.slice(handSize);

  return { hand, remainingLibrary };
}
