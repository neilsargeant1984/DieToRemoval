import { DeckCard } from '../types/deck';
import { CardRarity } from '../types/card';
import { DeckWildcardCost, UserCollection, WildcardInventory } from '../types/collection';

const BASIC_LAND_NAMES = new Set(['Plains', 'Island', 'Swamp', 'Mountain', 'Forest']);

export function calculateDeckWildcards(
  mainboard: DeckCard[],
  sideboard: DeckCard[] = [],
  commander?: DeckCard,
  userCollection: UserCollection = {},
  userInventory: WildcardInventory = { common: 0, uncommon: 0, rare: 0, mythic: 0 }
): DeckWildcardCost {
  const allCards: DeckCard[] = [...mainboard, ...sideboard];
  if (commander) {
    allCards.push(commander);
  }

  // Aggregate quantities by arenaId and card rarity
  const aggregateMap = new Map<number, { rarity: CardRarity; totalQty: number; name: string }>();

  for (const item of allCards) {
    const { card, quantity } = item;
    // Basic lands do not cost wildcards in MTG Arena
    if (BASIC_LAND_NAMES.has(card.name)) {
      continue;
    }

    const current = aggregateMap.get(card.arenaId);
    if (current) {
      current.totalQty += quantity;
    } else {
      aggregateMap.set(card.arenaId, {
        rarity: card.rarity,
        totalQty: quantity,
        name: card.name
      });
    }
  }

  const total = { common: 0, uncommon: 0, rare: 0, mythic: 0 };
  const missing = { common: 0, uncommon: 0, rare: 0, mythic: 0 };
  let totalCardsMissing = 0;

  for (const [arenaId, data] of aggregateMap.entries()) {
    const owned = userCollection[arenaId] || 0;
    const needed = Math.max(0, data.totalQty - owned);

    total[data.rarity] += data.totalQty;
    if (needed > 0) {
      missing[data.rarity] += needed;
      totalCardsMissing += needed;
    }
  }

  // Can the user craft with their available wildcard stash?
  const canCraftWithAvailableWildcards =
    userInventory.common >= missing.common &&
    userInventory.uncommon >= missing.uncommon &&
    userInventory.rare >= missing.rare &&
    userInventory.mythic >= missing.mythic;

  // Approximate vault progress: commons = 0.1%, uncommons = 0.3%
  const vaultProgressEstimate = Number(
    ((missing.common * 0.1) + (missing.uncommon * 0.3)).toFixed(1)
  );

  return {
    total,
    missing,
    canCraftWithAvailableWildcards,
    totalCardsMissing,
    vaultProgressEstimate
  };
}
