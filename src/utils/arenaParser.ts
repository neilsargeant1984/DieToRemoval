import { Card, FormatType } from '../types/card';
import { Deck, DeckCard } from '../types/deck';
import { UserCollection, WildcardInventory } from '../types/collection';
import { ARENA_CARDS } from '../data/arenaCards';
import { fetchCardsBatch, fetchCardByArenaId, fetchCardByNameOrSet, getCachedCardByArenaId } from '../services/scryfallService';
import { lookupArenaId } from '../services/ownershipService';

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

function createCardFromMtgaMeta(arenaId: number, name: string, set: string, collectorNumber: string): Card {
  const cleanSet = (set || 'MTGA').toLowerCase();
  const cleanNum = collectorNumber || '1';
  return {
    id: `${cleanSet}-${cleanNum}-${arenaId}`,
    arenaId,
    name,
    manaCost: '',
    cmc: 0,
    colors: [],
    colorIdentity: [],
    typeLine: 'Card',
    types: ['Creature'],
    rarity: 'rare',
    set: set.toUpperCase(),
    setName: set.toUpperCase(),
    collectorNumber: cleanNum,
    imageUrl: `https://api.scryfall.com/cards/${cleanSet}/${cleanNum}?format=image`,
    oracleText: '',
    legalities: { standard: true, timeless: true, historic: true, explorer: true, brawl: true, alchemy: true }
  };
}

/**
 * Creates a basic fallback Card for cards not returned by API (e.g. custom Arena art IDs)
 */
function createFallbackCard(arenaId: number, name: string = `Arena Card #${arenaId}`): Card {
  const meta = lookupArenaId(arenaId);
  if (meta) {
    return createCardFromMtgaMeta(arenaId, meta.name, meta.set, meta.collectorNumber);
  }
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
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/aa/Magic_the_gathering-card_back.jpg',
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
  const finalDecks: Deck[] = [];
  const processedDeckNames = new Set<string>();
  const newCollectionCards: Record<number, number> = {};

  // 1. Look for any "Exporting deck data to clipboard:" blocks in the log
  const exportRegex = /Exporting deck data to clipboard:\s*([\s\S]+?)(?=\n\[|\n\{|$)/gi;
  let expMatch;
  while ((expMatch = exportRegex.exec(logContent)) !== null) {
    const deckText = expMatch[1].trim();
    if (deckText.length > 20) {
      try {
        const parsed = await parseArenaFormatAsync(deckText);
        if (parsed.mainboard.length > 0 || parsed.commander) {
          const deckName = parsed.suggestedTitle || 'Exported Arena Deck';
          processedDeckNames.add(deckName.toLowerCase());

          for (const item of parsed.mainboard) {
            if (item.card.arenaId) {
              newCollectionCards[item.card.arenaId] = Math.max(newCollectionCards[item.card.arenaId] || 0, item.quantity);
            }
          }
          if (parsed.commander?.card.arenaId) {
            newCollectionCards[parsed.commander.card.arenaId] = Math.max(newCollectionCards[parsed.commander.card.arenaId] || 0, 1);
          }

          finalDecks.push({
            id: `arena-export-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: deckName,
            format: parsed.detectedFormat,
            commander: parsed.commander,
            mainboard: parsed.mainboard,
            sideboard: parsed.sideboard,
            isImported: true,
            source: 'arena',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Failed to parse embedded exported deck in log:', err);
      }
    }
  }

  // 2. Look for any pasted Arena card lists in the log or mixed input: e.g. "1 Archangel of Thune (MAR) 41"
  const cardLineRegex = /^\s*\d+x?\s+[A-Za-z0-9]/;
  const inputLines = logContent.split(/\r?\n/);
  const cardLines = inputLines.filter(l => 
    cardLineRegex.test(l) && 
    !l.includes('[Unity') && 
    !l.includes('{') && 
    !l.includes('[Accounts') && 
    !l.includes('[TaskLogger')
  );

  if (cardLines.length >= 3 && finalDecks.length === 0) {
    try {
      const parsedRaw = await parseArenaFormatAsync(cardLines.join('\n'));
      if (parsedRaw.mainboard.length > 0 || parsedRaw.commander) {
        const rawName = parsedRaw.suggestedTitle || 'Imported Card List';
        if (!processedDeckNames.has(rawName.toLowerCase())) {
          processedDeckNames.add(rawName.toLowerCase());
          for (const item of parsedRaw.mainboard) {
            if (item.card.arenaId) {
              newCollectionCards[item.card.arenaId] = Math.max(newCollectionCards[item.card.arenaId] || 0, item.quantity);
            }
          }
          if (parsedRaw.commander?.card.arenaId) {
            newCollectionCards[parsedRaw.commander.card.arenaId] = Math.max(newCollectionCards[parsedRaw.commander.card.arenaId] || 0, 1);
          }
          finalDecks.push({
            id: `pasted-deck-${Date.now()}`,
            name: rawName,
            format: parsedRaw.detectedFormat,
            commander: parsedRaw.commander,
            mainboard: parsedRaw.mainboard,
            sideboard: parsedRaw.sideboard,
            isImported: true,
            source: 'imported',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch {}
  }

  // 3. Scan RPC calls: DeckUpsertDeckV3, EventSetDeckV3, DeckGetAllPreconDecksV3, DeckGetDeckSummariesV3
  const extractedDeckMap = new Map<string, {
    name: string;
    format: FormatType;
    commanderId?: number;
    deckTileId?: number;
    mainMap: Map<number, number>;
    sideMap: Map<number, number>;
  }>();

  const allCardIds = new Set<number>();
  const lines = logContent.split(/\r?\n/);

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    // Handle DeckGetDeckSummariesV3 or StartHook responses (which list ALL user decks & cards in DecksInternal / DeckSummaries!)
    if (
      line.includes('DecksInternal') ||
      line.includes('DeckSummaries') ||
      line.includes('DeckGetDeckSummaries') ||
      (lineIdx > 0 && (lines[lineIdx - 1].includes('StartHook') || lines[lineIdx - 1].includes('DeckGetDeckSummaries')))
    ) {
      const idx = line.indexOf('{');
      if (idx !== -1) {
        try {
          const jsonStr = line.substring(idx);
          const obj = JSON.parse(jsonStr);
          const summaries = Array.isArray(obj.Summaries) 
            ? obj.Summaries 
            : (Array.isArray(obj.DeckSummaries) ? obj.DeckSummaries : (Array.isArray(obj.payload?.Summaries) ? obj.payload.Summaries : []));
          
          const decksInternal = obj.DecksInternal && typeof obj.DecksInternal === 'object' ? obj.DecksInternal : null;

          for (const summary of summaries) {
            const deckId = summary?.DeckIdInternal || summary?.DeckId || summary?.id;
            if (!summary || !deckId) continue;
            const name = summary.Name || 'MTG Arena Deck';
            
            // Filter out Arena system starter precons like ?=?Loc/Decks/Precon/PRECON_EPP2023_UB
            if (name.startsWith('?=?') || name.startsWith('?=?Loc') || name.startsWith('Loc/Decks/Precon')) {
              continue;
            }
            
            // Format detection
            const rawFormat = (summary.Attributes?.find((a: any) => a.name === 'Format')?.value || '').toLowerCase();
            let format: FormatType = 'historic';
            if (rawFormat.includes('brawl')) {
              format = 'brawl';
            } else if (rawFormat.includes('standard')) {
              format = 'standard';
            } else if (rawFormat.includes('timeless')) {
              format = 'timeless';
            } else if (rawFormat.includes('explorer') || rawFormat.includes('pioneer')) {
              format = 'explorer';
            } else if (rawFormat.includes('alchemy')) {
              format = 'alchemy';
            } else if (rawFormat.includes('historic')) {
              format = 'historic';
            } else if (name.toLowerCase().startsWith('(b) ') || name.toLowerCase().includes('brawl')) {
              format = 'brawl';
            } else if (name.toLowerCase().startsWith('(s) ') || name.toLowerCase().includes('standard')) {
              format = 'standard';
            } else if (name.toLowerCase().startsWith('(h) ') || name.toLowerCase().includes('historic')) {
              format = 'historic';
            } else if (name.toLowerCase().startsWith('(t) ') || name.toLowerCase().includes('timeless')) {
              format = 'timeless';
            }

            const rawTileId = summary.DeckTileId || summary.Attributes?.find((a: any) => a.name === 'TileID')?.value;
            const deckTileId = rawTileId ? parseInt(String(rawTileId), 10) : undefined;
            if (deckTileId && !isNaN(deckTileId)) {
              allCardIds.add(deckTileId);
            }

            const mainMap = new Map<number, number>();
            const sideMap = new Map<number, number>();
            let commanderId: number | undefined;

            // Check if full deck card list exists in DecksInternal!
            if (decksInternal && decksInternal[deckId]) {
              const fullDeck = decksInternal[deckId];
              if (Array.isArray(fullDeck.MainDeck)) {
                for (const item of fullDeck.MainDeck) {
                  const cid = item.cardId || item.id;
                  const q = item.quantity || 1;
                  if (cid) {
                    mainMap.set(cid, (mainMap.get(cid) || 0) + q);
                    allCardIds.add(cid);
                    newCollectionCards[cid] = Math.max(newCollectionCards[cid] || 0, q);
                  }
                }
              }
              if (Array.isArray(fullDeck.Sideboard)) {
                for (const item of fullDeck.Sideboard) {
                  const cid = item.cardId || item.id;
                  const q = item.quantity || 1;
                  if (cid) {
                    sideMap.set(cid, (sideMap.get(cid) || 0) + q);
                    allCardIds.add(cid);
                    newCollectionCards[cid] = Math.max(newCollectionCards[cid] || 0, q);
                  }
                }
              }
              if (Array.isArray(fullDeck.CommandZone) && fullDeck.CommandZone.length > 0) {
                commanderId = fullDeck.CommandZone[0].cardId || fullDeck.CommandZone[0].id;
                if (commanderId) {
                  allCardIds.add(commanderId);
                  newCollectionCards[commanderId] = Math.max(newCollectionCards[commanderId] || 0, 1);
                }
              }
            }

            if (!extractedDeckMap.has(deckId)) {
              extractedDeckMap.set(deckId, {
                name,
                format,
                commanderId,
                deckTileId,
                mainMap,
                sideMap
              });
            } else if (mainMap.size > 0) {
              const existing = extractedDeckMap.get(deckId)!;
              if (existing.mainMap.size === 0) {
                existing.mainMap = mainMap;
                existing.sideMap = sideMap;
                if (commanderId) existing.commanderId = commanderId;
              }
            }
          }
        } catch {
          // Skip malformed entries
        }
      }
    }

    if (line.includes('DeckUpsertDeckV3') || line.includes('EventSetDeckV3')) {
      const idx = line.indexOf('{');
      if (idx === -1) continue;

      try {
        const jsonStr = line.substring(idx);
        const obj = JSON.parse(jsonStr);

        let payload: any = obj;
        if (typeof obj.request === 'string') {
          payload = JSON.parse(obj.request);
        } else if (obj.request && typeof obj.request === 'object') {
          payload = obj.request;
        }

        if (payload.Deck && payload.Summary) {
          const name = payload.Summary.Name || 'MTG Arena Deck';
          if (name.startsWith('?=?') || name.startsWith('?=?Loc') || name.startsWith('Loc/Decks/Precon')) {
            continue;
          }
          const deckId = payload.Summary.DeckId || payload.Summary.Name;
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

          // Merge or overwrite summary entry with complete cards list
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

  // Batch resolve Arena card IDs (prioritize commanders and deck tiles for instant UI rendering)
  const resolvedCards = new Map<number, Card>();

  // 1. Check local bundled cards, persistent cache, and official MTGA database (0ms)
  for (const cid of allCardIds) {
    const cached = getCachedCardByArenaId(cid);
    if (cached) {
      resolvedCards.set(cid, cached);
    } else {
      const meta = lookupArenaId(cid);
      if (meta) {
        resolvedCards.set(cid, createCardFromMtgaMeta(cid, meta.name, meta.set, meta.collectorNumber));
      }
    }
  }

  // 2. Identify priority cards (Commanders & Deck Art Tiles) that require immediate Scryfall card imagery
  const priorityCids = new Set<number>();
  for (const rawDeck of extractedDeckMap.values()) {
    if (rawDeck.commanderId) priorityCids.add(rawDeck.commanderId);
    if (rawDeck.deckTileId) priorityCids.add(rawDeck.deckTileId);
  }

  // Immediately resolve priority commanders and tile art (paced to avoid 429)
  const missingPriority = Array.from(priorityCids).filter(cid => !resolvedCards.has(cid));
  const priorityBatchSize = 4;
  for (let i = 0; i < missingPriority.length; i += priorityBatchSize) {
    const batch = missingPriority.slice(i, i + priorityBatchSize);
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
    if (i + priorityBatchSize < missingPriority.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // 3. For deck cards, resolve up to 150 critical cards synchronously and fill remainder with fallback cards
  const remainingMissing = Array.from(allCardIds).filter(cid => !resolvedCards.has(cid));
  const syncFetchLimit = 150;
  const toFetch = remainingMissing.slice(0, syncFetchLimit);
  const deferred = remainingMissing.slice(syncFetchLimit);

  // Set fallbacks for deferred cards immediately
  for (const cid of deferred) {
    resolvedCards.set(cid, createFallbackCard(cid));
  }

  // Fetch top 150 deck cards in chunks of 4 with rate-limit pacing
  const deckBatchSize = 4;
  for (let i = 0; i < toFetch.length; i += deckBatchSize) {
    const batch = toFetch.slice(i, i + deckBatchSize);
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
    if (i + deckBatchSize < toFetch.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Construct final Deck objects from RPC calls (if not already added via export section)
  for (const [deckId, rawDeck] of extractedDeckMap.entries()) {
    // If we already parsed this deck via the full export text, skip duplicate degraded list
    if (processedDeckNames.has(rawDeck.name.toLowerCase()) || 
        finalDecks.some(d => d.name.toLowerCase().includes(rawDeck.name.toLowerCase()) || rawDeck.name.toLowerCase().includes(d.name.toLowerCase()))) {
      continue;
    }

    // Skip decks that have NO cards in their mainboard
    if (rawDeck.mainMap.size === 0) {
      continue;
    }

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
    
    // Fallback 1: check deckTileId
    if ((!cmdCard || cmdCard.name.startsWith('Arena Card')) && rawDeck.deckTileId) {
      const tileCard = resolvedCards.get(rawDeck.deckTileId);
      if (tileCard && !tileCard.name.startsWith('Arena Card')) {
        cmdCard = tileCard;
      }
    }

    // Fallback 2: fuzzy match commander name from deck title, e.g. "(B) Jace" -> "Jace"
    if (!cmdCard || cmdCard.name.startsWith('Arena Card')) {
      const cleanTitle = rawDeck.name
        .replace(/^\([A-Za-z0-9]+\)\s*/, '')
        .replace(/\s*\(\d+\)$/, '')
        .trim();

      if (cleanTitle.length >= 3) {
        const localMatch = ARENA_CARDS.find(c => c.name.toLowerCase().includes(cleanTitle.toLowerCase()));
        if (localMatch) {
          cmdCard = localMatch;
        } else {
          const fetchedCard = await fetchCardByNameOrSet(cleanTitle);
          if (fetchedCard) {
            cmdCard = fetchedCard;
          }
        }
      }
    }

    let deckTileCard: Card | undefined;
    if (rawDeck.deckTileId) {
      const tileCard = resolvedCards.get(rawDeck.deckTileId);
      if (tileCard && !tileCard.name.startsWith('Arena Card')) {
        deckTileCard = tileCard;
      }
    }

    if (!deckTileCard && cmdCard && !cmdCard.name.startsWith('Arena Card')) {
      deckTileCard = cmdCard;
    }

    // Only set commander zone for brawl formats or explicit command zone decks
    if (cmdCard && (rawDeck.format === 'brawl' || rawDeck.commanderId)) {
      commander = { card: cmdCard, quantity: 1 };
    }

    finalDecks.push({
      id: `arena-import-${deckId}-${Date.now()}`,
      name: rawDeck.name,
      format: rawDeck.format,
      commander,
      deckTileCard,
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

/**
 * Extracts MTG Arena Wildcards from Player.log or Tracker JSON.
 * Recognizes MTG Arena's exact InventoryInfo payload (WildCardCommons, WildCardUnCommons, WildCardRares, WildCardMythics)
 * where missing keys default to 0. Also supports legacy/tracker formats.
 */
export function parsePlayerLogWildcards(logContent: string): WildcardInventory | null {
  if (!logContent || typeof logContent !== 'string') return null;

  try {
    // 1. Direct match on MTG Arena exact keys: "WildCardCommons": 553, "WildCardUnCommons": 79
    // MTG Arena completely omits "WildCardRares" or "WildCardMythics" when the user has 0!
    const cMatch = logContent.match(/"?WildCardCommons"?\s*:\s*(\d+)/i);
    const uMatch = logContent.match(/"?WildCardUnCommons"?\s*:\s*(\d+)/i);
    const rMatch = logContent.match(/"?WildCardRares"?\s*:\s*(\d+)/i);
    const mMatch = logContent.match(/"?WildCardMythics"?\s*:\s*(\d+)/i);

    if (cMatch || uMatch || rMatch || mMatch) {
      return {
        common: cMatch ? parseInt(cMatch[1], 10) : 0,
        uncommon: uMatch ? parseInt(uMatch[1], 10) : 0,
        rare: rMatch ? parseInt(rMatch[1], 10) : 0,
        mythic: mMatch ? parseInt(mMatch[1], 10) : 0,
      };
    }

    // 3. Fallback: Legacy format ("wcCommon", "wcUncommon", ...)
    const wcCommonMatch = logContent.match(/"?wcCommon"?\s*:\s*(\d+)/i);
    const wcUncommonMatch = logContent.match(/"?wcUncommon"?\s*:\s*(\d+)/i);
    const wcRareMatch = logContent.match(/"?wcRare"?\s*:\s*(\d+)/i);
    const wcMythicMatch = logContent.match(/"?wcMythic"?\s*:\s*(\d+)/i);

    if (wcCommonMatch || wcUncommonMatch || wcRareMatch || wcMythicMatch) {
      return {
        common: wcCommonMatch ? parseInt(wcCommonMatch[1], 10) : 0,
        uncommon: wcUncommonMatch ? parseInt(wcUncommonMatch[1], 10) : 0,
        rare: wcRareMatch ? parseInt(wcRareMatch[1], 10) : 0,
        mythic: wcMythicMatch ? parseInt(wcMythicMatch[1], 10) : 0,
      };
    }

    // 4. Fallback: Tracker JSON formats ("wildcards": { "common": X, ... })
    const wildcardsBlockMatch = logContent.match(/"?wildcards"?\s*:\s*\{([^}]+)\}/i);
    if (wildcardsBlockMatch) {
      const block = wildcardsBlockMatch[1];
      const c = block.match(/"?common"?\s*:\s*(\d+)/i);
      const u = block.match(/"?uncommon"?\s*:\s*(\d+)/i);
      const r = block.match(/"?rare"?\s*:\s*(\d+)/i);
      const m = block.match(/"?mythic"?\s*:\s*(\d+)/i);
      if (c || u || r || m) {
        return {
          common: c ? parseInt(c[1], 10) : 0,
          uncommon: u ? parseInt(u[1], 10) : 0,
          rare: r ? parseInt(r[1], 10) : 0,
          mythic: m ? parseInt(m[1], 10) : 0,
        };
      }
    }
  } catch (err) {
    console.error('Error parsing wildcards from log content:', err);
  }

  return null;
}


