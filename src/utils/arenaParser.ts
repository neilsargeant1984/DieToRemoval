import { Card, FormatType } from '../types/card';
import { Deck, DeckCard } from '../types/deck';
import { UserCollection } from '../types/collection';
import { ARENA_CARDS } from '../data/arenaCards';
import { fetchCardsBatch, fetchCardByArenaId, fetchCardByNameOrSet } from '../services/scryfallService';

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
 * Synchronous local parser for MTG Arena text format against the bundled cardPool.
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

  // Regular expression: matches "4 Lightning Bolt (STA) 42" or "4x Lightning Bolt" or "4 Lightning Bolt"
  const lineRegex = /^(\d+)x?\s+(.+?)(?:\s+\(([A-Za-z0-9_-]+)\)\s+([A-Za-z0-9_-]+))?$/;

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
    } else if (lower === 'commander' || lower === 'companion') {
      currentSection = 'commander';
      continue;
    }

    const match = line.match(lineRegex);
    if (!match) continue;

    const qty = parseInt(match[1], 10);
    const rawCardName = match[2].trim();
    const setCode = match[3];
    const collectorNum = match[4];

    // Clean Alchemy A- prefix for lookup
    const cleanName = rawCardName.replace(/^A-/, '').trim();

    let matchedCard = cardPool.find(
      c => c.name.toLowerCase() === rawCardName.toLowerCase() || c.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (setCode && collectorNum) {
      const exactSetMatch = cardPool.find(
        c => (c.name.toLowerCase() === rawCardName.toLowerCase() || c.name.toLowerCase() === cleanName.toLowerCase()) && 
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
      unrecognizedCards.push(`${qty} ${rawCardName}`);
    }
  }

  return { mainboard, sideboard, commander, unrecognizedCards };
}

export interface ParsedDeckResult {
  mainboard: DeckCard[];
  sideboard: DeckCard[];
  commander?: DeckCard;
  unrecognizedCards: string[];
  detectedFormat: FormatType;
  suggestedTitle: string;
}

/**
 * Asynchronously parses MTG Arena formatted deck text using high-performance
 * batch Scryfall API resolution (<500ms for 100 cards).
 */
export async function parseArenaFormatAsync(
  text: string,
  cardPool: Card[] = ARENA_CARDS
): Promise<ParsedDeckResult> {
  const lines = text.split(/\r?\n/);
  type RawEntry = {
    section: 'deck' | 'sideboard' | 'commander';
    qty: number;
    rawName: string;
    cleanName: string;
    setCode?: string;
    collectorNum?: string;
  };

  const rawEntries: RawEntry[] = [];
  let currentSection: 'deck' | 'sideboard' | 'commander' = 'deck';
  const lineRegex = /^(\d+)x?\s+(.+?)(?:\s+\(([A-Za-z0-9_-]+)\)\s+([A-Za-z0-9_-]+))?$/;

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
    } else if (lower === 'commander' || lower === 'companion') {
      currentSection = 'commander';
      continue;
    }

    const match = line.match(lineRegex);
    if (!match) continue;

    const qty = parseInt(match[1], 10);
    const rawCardName = match[2].trim();
    const setCode = match[3];
    const collectorNum = match[4];
    const cleanName = rawCardName.replace(/^A-/, '').trim();

    rawEntries.push({
      section: currentSection,
      qty,
      rawName: rawCardName,
      cleanName,
      setCode,
      collectorNum
    });
  }

  // 1. Identify which cards match in local pool first (0ms)
  const resolvedMap = new Map<string, Card>();
  const neededFromScryfall: Array<{ name: string; set?: string; collector_number?: string }> = [];

  for (const entry of rawEntries) {
    let local = cardPool.find(
      c => c.name.toLowerCase() === entry.rawName.toLowerCase() ||
           c.name.toLowerCase() === entry.cleanName.toLowerCase()
    );

    if (entry.setCode && entry.collectorNum) {
      const setMatch = cardPool.find(
        c => (c.name.toLowerCase() === entry.rawName.toLowerCase() || c.name.toLowerCase() === entry.cleanName.toLowerCase()) &&
             c.set.toLowerCase() === entry.setCode!.toLowerCase()
      );
      if (setMatch) local = setMatch;
    }

    if (local) {
      resolvedMap.set(entry.rawName.toLowerCase(), local);
    } else {
      neededFromScryfall.push({
        name: entry.cleanName,
        set: entry.setCode,
        collector_number: entry.collectorNum
      });
    }
  }

  // 2. Fetch missing cards in batches via Scryfall collection API
  if (neededFromScryfall.length > 0) {
    const { cards } = await fetchCardsBatch(neededFromScryfall);
    for (const card of cards) {
      resolvedMap.set(card.name.toLowerCase(), card);
      // Also map split faces (e.g. "Fire // Ice" -> "fire")
      if (card.name.includes(' // ')) {
        const front = card.name.split(' // ')[0].toLowerCase();
        resolvedMap.set(front, card);
      }
    }
  }

  // 3. Assemble final deck sections
  const mainboard: DeckCard[] = [];
  const sideboard: DeckCard[] = [];
  let commander: DeckCard | undefined;
  const unrecognizedCards: string[] = [];

  for (const entry of rawEntries) {
    let card = resolvedMap.get(entry.rawName.toLowerCase()) ||
               resolvedMap.get(entry.cleanName.toLowerCase());

    if (!card && entry.rawName.includes(' // ')) {
      const front = entry.rawName.split(' // ')[0].trim().toLowerCase();
      card = resolvedMap.get(front);
    }

    // Last resort fallback: single fetch if still not found
    if (!card) {
      card = await fetchCardByNameOrSet(entry.cleanName, entry.setCode, entry.collectorNum) || undefined;
      if (card) {
        resolvedMap.set(entry.rawName.toLowerCase(), card);
      }
    }

    if (card) {
      const deckEntry: DeckCard = { card, quantity: entry.qty };
      if (entry.section === 'commander') {
        commander = deckEntry;
      } else if (entry.section === 'sideboard') {
        sideboard.push(deckEntry);
      } else {
        mainboard.push(deckEntry);
      }
    } else {
      unrecognizedCards.push(`${entry.qty} ${entry.rawName}`);
    }
  }

  // 4. Auto-detect format and suggest title
  let detectedFormat: FormatType = 'standard';
  let suggestedTitle = 'Imported Arena Deck';

  const totalMainCards = mainboard.reduce((sum, item) => sum + item.quantity, 0);

  if (commander) {
    detectedFormat = 'brawl';
    suggestedTitle = `${commander.card.name} Brawl`;
  } else if (totalMainCards >= 90) {
    // 100 card format without explicit commander tag
    detectedFormat = 'brawl';
    suggestedTitle = 'Historic Brawl Deck';
  } else if (totalMainCards === 60) {
    // Check legality flags
    const hasHistoricOnly = mainboard.some(i => i.card.legalities?.historic && !i.card.legalities?.standard);
    if (hasHistoricOnly) {
      detectedFormat = 'historic';
      suggestedTitle = 'Historic Deck';
    } else {
      detectedFormat = 'standard';
      suggestedTitle = 'Standard Deck';
    }
  }

  return {
    mainboard,
    sideboard,
    commander,
    unrecognizedCards,
    detectedFormat,
    suggestedTitle
  };
}

/**
 * Creates a basic fallback Card for cards not returned by API (e.g. custom Arena art IDs)
 */
function createFallbackCard(arenaId: number, name: string = `Arena Card #${arenaId}`): Card {
  return {
    id: `arena-card-${arenaId}`,
    arenaId,
    name,
    manaCost: '',
    cmc: 0,
    colors: [],
    colorIdentity: [],
    typeLine: 'Card',
    types: ['Creature'],
    rarity: 'rare',
    set: 'MTGA',
    setName: 'MTG Arena',
    collectorNumber: `${arenaId}`,
    imageUrl: 'https://cards.scryfall.io/back.jpg',
    oracleText: '',
    legalities: { standard: true, timeless: true, historic: true, explorer: true, brawl: true, alchemy: true }
  };
}

/**
 * Extracts all MTG Arena decks and collection card counts from Player.log.
 * MTG Arena logs deck updates in DeckUpsertDeckV3, EventSetDeckV3, and DeckGetAllPreconDecksV3.
 */
export async function parsePlayerLogDecks(logContent: string): Promise<{
  decks: Deck[];
  newCollectionCards: Record<number, number>;
}> {
  const extractedDeckMap = new Map<string, {
    name: string;
    format: FormatType;
    commanderId?: number;
    deckTileId?: number;
    mainMap: Map<number, number>;
    sideMap: Map<number, number>;
  }>();

  const allCardIds = new Set<number>();
  const newCollectionCards: Record<number, number> = {};

  // Process log line by line to safely parse full JSON objects without nested-brace truncation
  const lines = logContent.split(/\r?\n/);

  for (const line of lines) {
    if (line.includes('DeckUpsertDeckV3') || line.includes('EventSetDeckV3') || line.includes('DeckGetAllPreconDecksV3')) {
      const idx = line.indexOf('{');
      if (idx === -1) continue;

      try {
        const jsonStr = line.substring(idx);
        const obj = JSON.parse(jsonStr);

        // DeckUpsertDeckV3 stores payload in obj.request
        let payload: any = obj;
        if (typeof obj.request === 'string') {
          payload = JSON.parse(obj.request);
        } else if (obj.request && typeof obj.request === 'object') {
          payload = obj.request;
        }

        // 1. Single deck upsert
        if (payload.Deck && payload.Summary) {
          const deckId = payload.Summary.DeckId || payload.Summary.Name;
          const name = payload.Summary.Name || 'MTG Arena Deck';
          const formatAttr = payload.Summary.Attributes?.find((a: any) => a.name === 'Format')?.value?.toLowerCase();
          
          let format: FormatType = 'brawl';
          if (formatAttr === 'standard') format = 'standard';
          else if (formatAttr === 'historic') format = 'historic';
          else if (formatAttr === 'timeless') format = 'timeless';
          else if (formatAttr === 'explorer') format = 'explorer';
          else if (formatAttr === 'alchemy') format = 'alchemy';

          const mainMap = new Map<number, number>();
          const sideMap = new Map<number, number>();

          if (Array.isArray(payload.Deck.MainDeck)) {
            for (const item of payload.Deck.MainDeck) {
              const cid = item.cardId || item.id;
              const q = item.quantity || 1;
              if (cid) {
                mainMap.set(cid, (mainMap.get(cid) || 0) + q);
                allCardIds.add(cid);
                newCollectionCards[cid] = Math.max(newCollectionCards[cid] || 0, q);
              }
            }
          }

          if (Array.isArray(payload.Deck.Sideboard)) {
            for (const item of payload.Deck.Sideboard) {
              const cid = item.cardId || item.id;
              const q = item.quantity || 1;
              if (cid) {
                sideMap.set(cid, (sideMap.get(cid) || 0) + q);
                allCardIds.add(cid);
                newCollectionCards[cid] = Math.max(newCollectionCards[cid] || 0, q);
              }
            }
          }

          let commanderId: number | undefined;
          if (Array.isArray(payload.Deck.CommandZone) && payload.Deck.CommandZone.length > 0) {
            commanderId = payload.Deck.CommandZone[0].cardId || payload.Deck.CommandZone[0].id;
            if (commanderId) {
              allCardIds.add(commanderId);
              newCollectionCards[commanderId] = Math.max(newCollectionCards[commanderId] || 0, 1);
            }
          }

          const rawTileId = payload.Summary.DeckTileId || payload.Summary.Attributes?.find((a: any) => a.name === 'TileID')?.value;
          const deckTileId = rawTileId ? parseInt(String(rawTileId), 10) : undefined;
          if (deckTileId && !isNaN(deckTileId)) {
            allCardIds.add(deckTileId);
          }

          extractedDeckMap.set(deckId, {
            name,
            format,
            commanderId,
            deckTileId,
            mainMap,
            sideMap
          });
        }
      } catch {
        // Skip malformed entries
      }
    }
  }

  // Batch resolve all needed Arena card IDs
  const resolvedCards = new Map<number, Card>();

  // Check local cards first (0ms)
  for (const cid of allCardIds) {
    const local = ARENA_CARDS.find(c => c.arenaId === cid);
    if (local) {
      resolvedCards.set(cid, local);
    }
  }

  // Concurrently fetch remaining unindexed card IDs via Scryfall
  const missingCids = Array.from(allCardIds).filter(cid => !resolvedCards.has(cid));
  const fetchBatchSize = 10;
  for (let i = 0; i < missingCids.length; i += fetchBatchSize) {
    const batch = missingCids.slice(i, i + fetchBatchSize);
    await Promise.all(
      batch.map(async cid => {
        const card = await fetchCardByArenaId(cid);
        if (card) {
          resolvedCards.set(cid, card);
        } else {
          resolvedCards.set(cid, createFallbackCard(cid));
        }
      })
    );
    if (i + fetchBatchSize < missingCids.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Construct final Deck objects
  const finalDecks: Deck[] = [];

  for (const [deckId, rawDeck] of extractedDeckMap.entries()) {
    const mainboard: DeckCard[] = [];
    const sideboard: DeckCard[] = [];

    for (const [cid, qty] of rawDeck.mainMap.entries()) {
      const card = resolvedCards.get(cid) || createFallbackCard(cid);
      mainboard.push({ card, quantity: qty });
    }

    for (const [cid, qty] of rawDeck.sideMap.entries()) {
      const card = resolvedCards.get(cid) || createFallbackCard(cid);
      sideboard.push({ card, quantity: qty });
    }

    let commander: DeckCard | undefined;
    let cmdCard = rawDeck.commanderId ? resolvedCards.get(rawDeck.commanderId) : undefined;
    if ((!cmdCard || cmdCard.name.startsWith('Arena Card')) && rawDeck.deckTileId) {
      const tileCard = resolvedCards.get(rawDeck.deckTileId);
      if (tileCard && !tileCard.name.startsWith('Arena Card')) {
        cmdCard = tileCard;
      }
    }

    if (cmdCard) {
      commander = { card: cmdCard, quantity: 1 };
    }

    finalDecks.push({
      id: `arena-import-${deckId}-${Date.now()}`,
      name: rawDeck.name,
      format: rawDeck.format,
      commander,
      mainboard,
      sideboard,
      isImported: true,
      source: 'arena',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return { decks: finalDecks, newCollectionCards };
}

/**
 * Parses MTG Arena Player.log or Tracker JSON/CSV to extract the user's card collection.
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
    const trimmed = logContent.trim();
    // 1. Direct JSON map: { "82133": 4, "76543": 2 }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
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

    // 2. Array JSON export: [ { "id": 82133, "count": 4 } ]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const parsedArray = JSON.parse(trimmed);
      if (Array.isArray(parsedArray)) {
        for (const item of parsedArray) {
          const arenaId = parseInt(item.id || item.arenaId || item.cardId, 10);
          const count = parseInt(item.count || item.quantity || 1, 10);
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
    }
  } catch {
    // Continue with regex pattern search
  }

  // 3. Search for legacy GetPlayerCards payload in log text
  const payloadRegex = /"payload"\s*:\s*(\{[^}]+\})/g;
  let match;
  let foundPayload: Record<string, number> | null = null;

  while ((match = payloadRegex.exec(logContent)) !== null) {
    try {
      const candidate = JSON.parse(match[1]);
      const keys = Object.keys(candidate);
      if (keys.length > 5 && keys.some(k => !isNaN(parseInt(k, 10)))) {
        foundPayload = candidate;
      }
    } catch {
      // Continue search
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
