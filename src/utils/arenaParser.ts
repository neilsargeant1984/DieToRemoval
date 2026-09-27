import { Card } from '../types/card';
import { Deck, DeckCard } from '../types/deck';
import { UserCollection } from '../types/collection';
import { ARENA_CARDS } from '../data/arenaCards';

/**
 * Formats a deck into strict MTG Arena text format for 1-click clipboard export.
 */
export function exportToArenaFormat(deck: Deck): string {
  const lines: string[] = [];

  if (deck.commander) {
    lines.push('Commander');
    lines.push(`${deck.commander.quantity} ${deck.commander.card.name} (${deck.commander.card.set}) ${deck.commander.card.collectorNumber}`);
    lines.push('');
  }

  lines.push('Deck');
  for (const item of deck.mainboard) {
    lines.push(`${item.quantity} ${item.card.name} (${item.card.set}) ${item.card.collectorNumber}`);
  }

  if (deck.sideboard && deck.sideboard.length > 0) {
    lines.push('');
    lines.push('Sideboard');
    for (const item of deck.sideboard) {
      lines.push(`${item.quantity} ${item.card.name} (${item.card.set}) ${item.card.collectorNumber}`);
    }
  }

  return lines.join('\n');
}

/**
 * Parses MTG Arena formatted deck text.
 */
export function parseArenaFormat(text: string, cardPool: Card[] = ARENA_CARDS): {
  mainboard: DeckCard[];
  sideboard: DeckCard[];
  commander?: DeckCard;
  unrecognizedCards: string[];
} {
  const lines = text.split(/\r?\n/);
  const mainboard: DeckCard[] = [];
  const sideboard: DeckCard[] = [];
  let commander: DeckCard | undefined;
  const unrecognizedCards: string[] = [];

  let currentSection: 'deck' | 'sideboard' | 'commander' = 'deck';

  // Regular expression to match standard Arena line:
  // e.g. "4 Lightning Bolt (STA) 42" or "4 Lightning Bolt"
  const lineRegex = /^(\d+)\s+(.+?)(?:\s+\(([A-Za-z0-9_-]+)\)\s+([A-Za-z0-9_-]+))?$/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();
    if (lower === 'deck') {
      currentSection = 'deck';
      continue;
    } else if (lower === 'sideboard') {
      currentSection = 'sideboard';
      continue;
    } else if (lower === 'commander') {
      currentSection = 'commander';
      continue;
    }

    const match = line.match(lineRegex);
    if (!match) {
      continue;
    }

    const qty = parseInt(match[1], 10);
    const cardName = match[2].trim();
    const setCode = match[3];
    const collectorNum = match[4];

    // Attempt exact match first by name (case-insensitive)
    let matchedCard = cardPool.find(
      c => c.name.toLowerCase() === cardName.toLowerCase()
    );

    // If set was provided, try matching set code as well
    if (setCode && collectorNum) {
      const exactSetMatch = cardPool.find(
        c => c.name.toLowerCase() === cardName.toLowerCase() && 
             c.set.toLowerCase() === setCode.toLowerCase()
      );
      if (exactSetMatch) {
        matchedCard = exactSetMatch;
      }
    }

    if (matchedCard) {
      const entry: DeckCard = { card: matchedCard, quantity: qty };
      if (currentSection === 'commander') {
        commander = entry;
      } else if (currentSection === 'sideboard') {
        sideboard.push(entry);
      } else {
        mainboard.push(entry);
      }
    } else {
      unrecognizedCards.push(`${qty} ${cardName}`);
    }
  }

  return { mainboard, sideboard, commander, unrecognizedCards };
}

/**
 * Parses MTG Arena Player.log to extract the user's card collection.
 * Arena logs card inventory inside GetPlayerCardsV3 responses.
 */
export function parsePlayerLog(logContent: string): {
  collection: UserCollection;
  totalUniqueCards: number;
  totalOwnedCards: number;
} {
  const collection: UserCollection = {};
  let totalUniqueCards = 0;
  let totalOwnedCards = 0;

  try {
    // 1. Check if the user pasted raw JSON e.g. { "82133": 4, "76543": 2 }
    if (logContent.trim().startsWith('{') && logContent.trim().endsWith('}')) {
      const parsed = JSON.parse(logContent);
      for (const [key, val] of Object.entries(parsed)) {
        const arenaId = parseInt(key, 10);
        const count = typeof val === 'number' ? val : parseInt(String(val), 10);
        if (!isNaN(arenaId) && !isNaN(count)) {
          collection[arenaId] = Math.min(4, Math.max(0, count));
          totalUniqueCards++;
          totalOwnedCards += collection[arenaId];
        }
      }
      if (totalUniqueCards > 0) {
        return { collection, totalUniqueCards, totalOwnedCards };
      }
    }
  } catch {
    // Continue with regex pattern search
  }

  // 2. Search for GetPlayerCardsV3 or PlayerInventory.GetPlayerCards payload in log text
  const payloadRegex = /"payload"\s*:\s*(\{[^}]+\})/g;
  let match;
  let foundPayload: Record<string, number> | null = null;

  while ((match = payloadRegex.exec(logContent)) !== null) {
    try {
      const candidate = JSON.parse(match[1]);
      // If keys look like numbers and values are numbers
      const keys = Object.keys(candidate);
      if (keys.length > 5 && keys.some(k => !isNaN(parseInt(k, 10)))) {
        foundPayload = candidate;
      }
    } catch {
      // Keep searching
    }
  }

  if (foundPayload) {
    for (const [key, val] of Object.entries(foundPayload)) {
      const arenaId = parseInt(key, 10);
      const count = typeof val === 'number' ? val : parseInt(String(val), 10);
      if (!isNaN(arenaId) && !isNaN(count)) {
        collection[arenaId] = Math.min(4, Math.max(0, count));
        totalUniqueCards++;
        totalOwnedCards += collection[arenaId];
      }
    }
  }

  return { collection, totalUniqueCards, totalOwnedCards };
}
