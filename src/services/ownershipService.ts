import { Card, CardRarity } from '../types/card';
import { UserCollection, WildcardInventory } from '../types/collection';
import { Deck } from '../types/deck';
import arenaDatabaseData from '../data/arenaDatabase.json';
import { ARENA_CARDS } from '../data/arenaCards';

// Type mapping for the compact arenaDatabase
const arenaDatabase = arenaDatabaseData as unknown as Record<string, [string, string, string]>;

// Name to Arena IDs index for instant multi-print ownership resolution
const nameToIdsMap = new Map<string, number[]>();
for (const [idStr, data] of Object.entries(arenaDatabase)) {
  const numId = parseInt(idStr, 10);
  const cardName = data[0].toLowerCase();
  const existing = nameToIdsMap.get(cardName);
  if (existing) {
    existing.push(numId);
  } else {
    nameToIdsMap.set(cardName, [numId]);
  }
}

// Also index curated Arena cards & digital exclusives
for (const card of ARENA_CARDS) {
  const cName = card.name.toLowerCase();
  if (!nameToIdsMap.has(cName)) {
    nameToIdsMap.set(cName, [card.arenaId || 0]);
  }
}

/**
 * Fast O(1) verification checking if a given card exists in MTG Arena.
 * Matches against the comprehensive 25,000+ card official MTGA database,
 * resolving split cards, MDFCs, and Alchemy/rebalanced prefixes.
 */
export function isCardOnArena(cardName: string): boolean {
  if (!cardName) return false;
  const rawClean = cardName.trim().toLowerCase();
  if (nameToIdsMap.has(rawClean)) return true;

  // Strip "A-" Alchemy rebalance prefix
  const withoutA = rawClean.replace(/^a-/, '').trim();
  if (nameToIdsMap.has(withoutA)) return true;

  // Handle double-faced / MDFC / flip cards ("Front // Back")
  const frontFace = rawClean.split('//')[0].trim();
  if (nameToIdsMap.has(frontFace)) return true;

  const frontFaceNoA = withoutA.split('//')[0].trim();
  if (nameToIdsMap.has(frontFaceNoA)) return true;

  // Handle split cards formatted with triple slashes ("Front /// Back")
  const frontFaceTriple = rawClean.split('///')[0].trim();
  if (nameToIdsMap.has(frontFaceTriple)) return true;

  return false;
}

/**
 * Resolves an MTG Arena GrpId into its official card name, set code, and collector number.
 */
export function lookupArenaId(arenaId: number): { name: string; set: string; collectorNumber: string } | null {
  const entry = arenaDatabase[String(arenaId)];
  if (!entry) return null;
  return {
    name: entry[0],
    set: entry[1],
    collectorNumber: entry[2]
  };
}

/**
 * Returns the player's true total owned copies (0-4) of a card, aggregating across
 * all printings, showcase arts, and reprints with the same card name.
 */
export function getCardOwnedCount(cardOrName: Card | string, userCollection: UserCollection = {}): number {
  if (!cardOrName || !userCollection) return 0;

  const cardName = typeof cardOrName === 'string' ? cardOrName : cardOrName.name;
  const cleanName = cardName.replace(/^A-/, '').trim().toLowerCase();

  // If card object provided, check its specific arenaId first
  let maxSpecific = 0;
  if (typeof cardOrName !== 'string' && cardOrName.arenaId) {
    maxSpecific = Number(userCollection[cardOrName.arenaId]) || 0;
  }

  // Also check all alternative Arena IDs registered under this card name
  let totalOwnedAcrossPrints = maxSpecific;
  const allIds = nameToIdsMap.get(cleanName);
  if (allIds && allIds.length > 0) {
    for (const id of allIds) {
      const count = Number(userCollection[id]) || 0;
      // In MTG, a user owns whichever printing they possess, capped at 4 total playable copies
      if (count > totalOwnedAcrossPrints) {
        totalOwnedAcrossPrints = count;
      }
    }
  }

  return Math.min(4, Math.max(0, totalOwnedAcrossPrints));
}

/**
 * Updates the user's owned count for a specific card, updating localStorage and dispatching
 * an event so all UI components re-render in real time.
 */
export function setCardOwnedCount(
  card: Card,
  count: number,
  currentUserCollection: UserCollection
): UserCollection {
  const newCount = Math.max(0, Math.min(4, Math.round(count)));
  const updatedCollection: UserCollection = { ...currentUserCollection };

  // Set the specific arenaId
  if (card.arenaId) {
    if (newCount > 0) {
      updatedCollection[card.arenaId] = newCount;
    } else {
      delete updatedCollection[card.arenaId];
    }
  }

  // Also sync alternative Arena IDs for this card name so all printings reflect the count
  const cleanName = card.name.replace(/^A-/, '').trim().toLowerCase();
  const allIds = nameToIdsMap.get(cleanName);
  if (allIds && allIds.length > 0) {
    for (const id of allIds) {
      if (newCount > 0) {
        updatedCollection[id] = newCount;
      } else {
        delete updatedCollection[id];
      }
    }
  }

  // Persist to localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('arenaforge_user_collection', JSON.stringify(updatedCollection));
      window.dispatchEvent(new CustomEvent('collection-updated', { detail: updatedCollection }));
    }
  } catch (err) {
    console.warn('Failed to save user collection to localStorage:', err);
  }

  return updatedCollection;
}

export interface DeckCraftingCost {
  required: {
    common: number;
    uncommon: number;
    rare: number;
    mythic: number;
  };
  available: WildcardInventory;
  remaining: {
    common: number;
    uncommon: number;
    rare: number;
    mythic: number;
  };
  canCraft: boolean;
  missingCardsCount: number;
}

/**
 * Calculates the exact wildcards required to craft an entire deck based on the user's
 * current collection and available wildcard balances.
 */
export function calculateDeckCraftingCost(
  deck: Deck,
  userCollection: UserCollection = {},
  wildcardInventory: WildcardInventory = { common: 0, uncommon: 0, rare: 0, mythic: 0 }
): DeckCraftingCost {
  const required = {
    common: 0,
    uncommon: 0,
    rare: 0,
    mythic: 0
  };

  let missingCardsCount = 0;

  // Process all cards in mainboard
  const allDeckCards = [...deck.mainboard, ...(deck.sideboard || [])];
  if (deck.commander) {
    allDeckCards.push(deck.commander);
  }

  // Aggregate required counts by unique card name
  const deckCardsByName = new Map<string, { card: Card; neededTotal: number }>();
  for (const dc of allDeckCards) {
    const name = dc.card.name.toLowerCase();
    const existing = deckCardsByName.get(name);
    if (existing) {
      existing.neededTotal += dc.quantity;
    } else {
      deckCardsByName.set(name, { card: dc.card, neededTotal: dc.quantity });
    }
  }

  for (const { card, neededTotal } of deckCardsByName.values()) {
    // Basic lands are infinite and free on Arena
    if (card.types.includes('Land') && ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'].includes(card.name)) {
      continue;
    }

    const owned = getCardOwnedCount(card, userCollection);
    const deficit = Math.max(0, neededTotal - owned);

    if (deficit > 0) {
      missingCardsCount += deficit;
      const rarity = (card.rarity || 'common').toLowerCase() as CardRarity;
      if (rarity === 'mythic') {
        required.mythic += deficit;
      } else if (rarity === 'rare') {
        required.rare += deficit;
      } else if (rarity === 'uncommon') {
        required.uncommon += deficit;
      } else {
        required.common += deficit;
      }
    }
  }

  const remaining = {
    common: (wildcardInventory.common || 0) - required.common,
    uncommon: (wildcardInventory.uncommon || 0) - required.uncommon,
    rare: (wildcardInventory.rare || 0) - required.rare,
    mythic: (wildcardInventory.mythic || 0) - required.mythic
  };

  const canCraft = remaining.common >= 0 && remaining.uncommon >= 0 && remaining.rare >= 0 && remaining.mythic >= 0;

  return {
    required,
    available: wildcardInventory,
    remaining,
    canCraft,
    missingCardsCount
  };
}
