import { getLatestArenaSetSync, refreshArenaSetsAsync } from '../services/setService';

export interface StandardSetInfo {
  code: string;
  name: string;
  releaseDate: string;
}

// Chronological Standard sets release history
export const KNOWN_STANDARD_SETS: StandardSetInfo[] = [
  { code: 'FRA', name: 'Reality Fracture', releaseDate: '2026-10-02' },
  { code: 'HOB', name: 'The Hobbit', releaseDate: '2026-08-14' },
  { code: 'MSH', name: 'Marvel Super Heroes', releaseDate: '2026-06-26' },
  { code: 'SOS', name: 'Secrets of Strixhaven', releaseDate: '2026-04-24' },
  { code: 'ECL', name: 'Lorwyn Eclipsed', releaseDate: '2026-01-23' },
  { code: 'SPM', name: "Marvel's Spider-Man", releaseDate: '2025-09-26' },
  { code: 'OM1', name: 'Through the Omenpaths', releaseDate: '2025-09-23' },
  { code: 'EOE', name: 'Edge of Eternities', releaseDate: '2025-08-01' },
  { code: 'FIN', name: 'Final Fantasy', releaseDate: '2025-06-13' },
  { code: 'TDM', name: 'Tarkir: Dragonstorm', releaseDate: '2025-04-11' },
  { code: 'DFT', name: 'Aetherdrift', releaseDate: '2025-02-14' },
  { code: 'FDN', name: 'Foundations', releaseDate: '2024-11-15' },
  { code: 'DSK', name: 'Duskmourn: House of Horror', releaseDate: '2024-09-27' },
  { code: 'BLB', name: 'Bloomburrow', releaseDate: '2024-08-02' },
  { code: 'OTJ', name: 'Outlaws of Thunder Junction', releaseDate: '2024-04-19' },
  { code: 'MKM', name: 'Murders at Karlov Manor', releaseDate: '2024-02-09' },
  { code: 'LCI', name: 'The Lost Caverns of Ixalan', releaseDate: '2023-11-17' },
  { code: 'WOE', name: 'Wilds of Eldraine', releaseDate: '2023-09-08' },
  { code: 'MOM', name: 'March of the Machine', releaseDate: '2023-04-21' },
  { code: 'ONE', name: 'Phyrexia: All Will Be One', releaseDate: '2023-02-10' },
  { code: 'BRO', name: "The Brothers' War", releaseDate: '2022-11-18' },
  { code: 'DMU', name: 'Dominaria United', releaseDate: '2022-09-09' }
];

const SET_CACHE_KEY = 'dietoremoval_latest_standard_set_v1';

/**
 * Returns the latest Standard set that is currently released (releaseDate <= today).
 * Integrates with unified setService and checks deck code overrides.
 */
export function getLatestStandardSetSync(availableSetCodesInDecks?: string[]): StandardSetInfo {
  const now = new Date();

  // If specific set codes are present in the deck database, find the most recent among them
  if (availableSetCodesInDecks && availableSetCodesInDecks.length > 0) {
    const normalizedCodes = new Set(availableSetCodesInDecks.map(c => c.toUpperCase()));
    const matchingSet = KNOWN_STANDARD_SETS.find(
      s => normalizedCodes.has(s.code) && new Date(s.releaseDate) <= now
    );
    if (matchingSet) return matchingSet;
  }

  // Use unified setService sync resolver
  const setServiceLatest = getLatestArenaSetSync();
  if (setServiceLatest?.code) {
    return {
      code: setServiceLatest.code,
      name: setServiceLatest.name,
      releaseDate: setServiceLatest.releaseDate || '2026-10-02'
    };
  }

  // Fallback to the latest released set in known history
  const latestReleased = KNOWN_STANDARD_SETS.find(s => new Date(s.releaseDate) <= now);
  return latestReleased || KNOWN_STANDARD_SETS[0];
}

/**
 * Dynamically queries Scryfall for newly released standard expansions and updates cache.
 */
export async function refreshLatestStandardSetAsync(): Promise<StandardSetInfo> {
  try {
    const discovery = await refreshArenaSetsAsync();
    if (discovery.latestSet) {
      return {
        code: discovery.latestSet.code,
        name: discovery.latestSet.name,
        releaseDate: discovery.latestSet.releaseDate || '2026-10-02'
      };
    }
  } catch (err) {
    console.warn('Could not refresh latest set via setService, using built-in timeline:', err);
  }

  return getLatestStandardSetSync();
}

export interface DeckSetBreakdown {
  latestSet: StandardSetInfo;
  latestSetCopies: number;
  latestSetUniqueCards: Array<{ name: string; quantity: number; isKeyCard: boolean }>;
  isLatestSetDeck: boolean;
  deckTotalCards: number;
  latestSetPercentage: number;
}

/**
 * Analyzes an MTG Arena export text to determine its composition of cards from the latest set.
 */
export function analyzeDeckLatestSet(
  arenaExportText: string,
  keyCards: string[] = [],
  targetSet?: StandardSetInfo
): DeckSetBreakdown {
  const latestSet = targetSet || getLatestStandardSetSync();
  const targetCode = latestSet.code.toUpperCase();

  const lines = arenaExportText.split(/\r?\n/);
  const lineRegex = /^(\d+)x?\s+(.+?)(?:\s+\(([A-Za-z0-9_-]+)\)\s+([A-Za-z0-9_-]+))?$/;

  let totalCards = 0;
  let latestSetCopies = 0;
  const uniqueCardsMap = new Map<string, { quantity: number; isKeyCard: boolean }>();
  const normalizedKeyCards = keyCards.map(k => k.toLowerCase().trim());

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.toLowerCase() === 'deck' || line.toLowerCase() === 'sideboard') continue;

    const match = line.match(lineRegex);
    if (!match) continue;

    const qty = parseInt(match[1], 10);
    const cardName = match[2].trim();
    const setCode = (match[3] || '').toUpperCase();

    totalCards += qty;

    if (setCode === targetCode) {
      latestSetCopies += qty;
      const isKey = normalizedKeyCards.some(k => cardName.toLowerCase().includes(k) || k.includes(cardName.toLowerCase()));
      const existing = uniqueCardsMap.get(cardName);
      if (existing) {
        existing.quantity += qty;
      } else {
        uniqueCardsMap.set(cardName, { quantity: qty, isKeyCard: isKey });
      }
    }
  }

  const latestSetUniqueCards = Array.from(uniqueCardsMap.entries()).map(([name, data]) => ({
    name,
    quantity: data.quantity,
    isKeyCard: data.isKeyCard
  }));

  const hasKeyCard = latestSetUniqueCards.some(c => c.isKeyCard);
  // Qualified as a "Latest Set Deck" if it runs at least 3+ copies from the latest set OR features a key card
  const isLatestSetDeck = latestSetCopies >= 3 || hasKeyCard;
  const latestSetPercentage = totalCards > 0 ? Math.round((latestSetCopies / totalCards) * 100) : 0;

  return {
    latestSet,
    latestSetCopies,
    latestSetUniqueCards,
    isLatestSetDeck,
    deckTotalCards: totalCards,
    latestSetPercentage
  };
}
