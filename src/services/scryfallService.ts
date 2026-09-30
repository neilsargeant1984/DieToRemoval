import { Card, CardRarity, CardTypeCategory, FormatType } from '../types/card';
import { ARENA_CARDS } from '../data/arenaCards';
import { FunctionalRole } from '../utils/roleClassifier';

// In-memory cache for search queries to provide 0ms instant response on repeat searches
const searchCache = new Map<string, { cards: Card[]; totalCards: number; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes cache

// Spellbook dictionary for known digital cards
const SPELLBOOK_MAP = new Map<string, any>();
for (const card of ARENA_CARDS) {
  if (card.spellbook && card.spellbook.length > 0) {
    SPELLBOOK_MAP.set(card.name.toLowerCase(), card.spellbook);
  }
}

export interface SearchArenaParams {
  query?: string;
  format?: FormatType;
  color?: string | null;
  type?: CardTypeCategory | null;
  rarity?: CardRarity | null;
  digitalOnly?: boolean;
  commanderColorIdentity?: string[];
  roleFilter?: FunctionalRole | 'lands' | null;
  page?: number;
}

export interface SearchResult {
  cards: Card[];
  totalCards: number;
  hasMore: boolean;
}

/**
 * Transforms Scryfall API JSON object to our standardized Card model
 */
export function transformScryfallCard(raw: any): Card {
  // Extract images (support double-faced and flip cards)
  let imageUrl = raw.image_uris?.normal || raw.image_uris?.large || raw.image_uris?.small;
  let manaCost = raw.mana_cost || '';
  let oracleText = raw.oracle_text || '';
  let power = raw.power;
  let toughness = raw.toughness;
  let loyalty = raw.loyalty;

  if (!imageUrl && raw.card_faces && raw.card_faces.length > 0) {
    const face = raw.card_faces[0];
    imageUrl = face.image_uris?.normal || face.image_uris?.large;
    if (!manaCost && face.mana_cost) {
      manaCost = face.mana_cost;
    }
    if (!oracleText) {
      oracleText = raw.card_faces
        .map((f: any) => `${f.name}:\n${f.oracle_text || ''}`)
        .join('\n\n');
    }
    if (power === undefined) power = face.power;
    if (toughness === undefined) toughness = face.toughness;
    if (loyalty === undefined) loyalty = face.loyalty;
  }

  // Parse Card Types
  const typeLine = raw.type_line || '';
  const parsedTypes: CardTypeCategory[] = [];
  const typeKeywords: CardTypeCategory[] = [
    'Creature',
    'Planeswalker',
    'Instant',
    'Sorcery',
    'Artifact',
    'Enchantment',
    'Land'
  ];

  for (const t of typeKeywords) {
    if (typeLine.includes(t)) {
      parsedTypes.push(t);
    }
  }
  if (parsedTypes.length === 0) {
    parsedTypes.push('Artifact');
  }

  // Generate fallback integer ID if arena_id is missing on promo/alchemy prints
  let arenaId = raw.arena_id;
  if (!arenaId) {
    let hash = 0;
    const str = `${raw.name}-${raw.set}-${raw.collector_number}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    arenaId = Math.abs(hash);
  }

  // Rarity validation
  const validRarity: CardRarity = ['common', 'uncommon', 'rare', 'mythic'].includes(raw.rarity)
    ? raw.rarity
    : 'rare';

  // Digital mechanics check
  const isDigitalOnly =
    raw.digital === true ||
    raw.set_type === 'alchemy' ||
    (raw.promo_types && raw.promo_types.includes('alchemy'));

  const isAlchemyRebalanced =
    raw.name.startsWith('A-') ||
    (raw.promo_types && raw.promo_types.includes('rebalanced'));

  // Attach known digital spellbooks
  const cleanName = raw.name.replace(/^A-/, '').toLowerCase();
  const spellbook = SPELLBOOK_MAP.get(cleanName) || undefined;

  // Format legalities
  const rawLegalities = raw.legalities || {};
  const legalities: Record<FormatType, boolean> = {
    standard: rawLegalities.standard === 'legal',
    timeless: rawLegalities.timeless === 'legal' || rawLegalities.timeless === 'restricted',
    historic: rawLegalities.historic === 'legal',
    explorer: rawLegalities.explorer === 'legal',
    brawl: rawLegalities.brawl === 'legal' || rawLegalities.standardbrawl === 'legal',
    alchemy: rawLegalities.alchemy === 'legal'
  };

  return {
    id: raw.id,
    arenaId,
    name: raw.name,
    manaCost,
    cmc: raw.cmc || 0,
    colors: raw.colors || [],
    colorIdentity: raw.color_identity || [],
    typeLine,
    types: parsedTypes,
    oracleText,
    power,
    toughness,
    loyalty,
    rarity: validRarity,
    set: (raw.set || 'ARENA').toUpperCase(),
    setName: raw.set_name || 'MTG Arena',
    collectorNumber: raw.collector_number || '1',
    imageUrl: imageUrl || 'https://cards.scryfall.io/normal/front/1/4/14f5f561-39fd-4dad-b225-40cc1eddb563.jpg',
    isDigitalOnly,
    isAlchemyRebalanced,
    spellbook,
    digitalMechanic: spellbook ? 'spellbook' : (isDigitalOnly ? 'conjure' : undefined),
    legalities
  };
}

/**
 * Searches Scryfall API live, strictly scoped to MTG Arena cards (game:arena).
 */
export async function searchArenaCards(params: SearchArenaParams): Promise<SearchResult> {
  const parts: string[] = ['game:arena'];

  // Format filter
  if (params.format) {
    if (params.format === 'brawl') {
      parts.push('(f:brawl or f:standardbrawl)');
    } else {
      parts.push(`f:${params.format}`);
    }
  }

  // Digital only filter
  if (params.digitalOnly) {
    parts.push('(is:digital or set_type:alchemy or is:rebalanced)');
  }

  // Color filter
  if (params.color) {
    if (params.color === 'C') {
      parts.push('c:c');
    } else if (params.color === 'M') {
      parts.push('c:m');
    } else {
      parts.push(`c:${params.color.toLowerCase()}`);
    }
  }

  // Type filter
  if (params.type) {
    parts.push(`t:${params.type.toLowerCase()}`);
  }

  // Rarity filter
  if (params.rarity) {
    parts.push(`r:${params.rarity}`);
  }

  // Commander Color Identity constraint (Brawl)
  if (params.commanderColorIdentity !== undefined) {
    if (params.commanderColorIdentity.length === 0) {
      parts.push('id:c');
    } else {
      parts.push(`id<=${params.commanderColorIdentity.join('').toLowerCase()}`);
    }
  }

  // Functional Role filter
  if (params.roleFilter) {
    if (params.roleFilter === 'ramp') {
      parts.push('((t:artifact o:"add ") or (o:"search your library for a" o:"land") or (t:creature o:"{t}: add") or o:"create a treasure token") -t:land');
    } else if (params.roleFilter === 'protection') {
      parts.push('(o:hexproof or o:indestructible or o:"phase out" or o:"ward {" or o:"protection from")');
    } else if (params.roleFilter === 'removal') {
      parts.push('((o:"destroy target" or o:"exile target" or o:"counter target" or o:"deals 3 damage to any target") and -o:"destroy all" and -o:"exile all")');
    } else if (params.roleFilter === 'board_wipe') {
      parts.push('(o:"destroy all" or o:"exile all" or o:"each creature gets -" or o:"all creatures get -")');
    } else if (params.roleFilter === 'card_advantage') {
      parts.push('(o:"draw a card" or o:"draw two cards" or o:"draws a card" or o:investigate or (o:"exile the top" o:"you may play"))');
    } else if (params.roleFilter === 'lands') {
      parts.push('t:land');
    }
  }

  // Search term
  const trimmed = params.query?.trim();
  if (trimmed) {
    // If user provided a specific search term
    parts.push(trimmed);
  }

  const queryString = parts.join(' ');
  const page = params.page || 1;
  const cacheKey = `${queryString}__page_${page}`;

  // Check cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      cards: cached.cards,
      totalCards: cached.totalCards,
      hasMore: cached.totalCards > page * 175
    };
  }

  try {
    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(queryString)}&order=name&page=${page}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.status === 404) {
      // Scryfall returns 404 when 0 cards match the query
      return { cards: [], totalCards: 0, hasMore: false };
    }

    if (!response.ok) {
      throw new Error(`Scryfall API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawList = data.data || [];
    const cards = rawList.map(transformScryfallCard);
    const totalCards = data.total_cards || cards.length;

    // Cache results
    searchCache.set(cacheKey, { cards, totalCards, timestamp: Date.now() });

    return {
      cards,
      totalCards,
      hasMore: data.has_more || false
    };
  } catch (error) {
    console.warn('Scryfall live search failed or offline, falling back to local dataset:', error);

    // Fallback to local ARENA_CARDS dataset
    const fallbackFiltered = ARENA_CARDS.filter(c => {
      if (params.format && !c.legalities[params.format]) return false;
      if (params.digitalOnly && !c.isDigitalOnly && !c.isAlchemyRebalanced) return false;
      if (params.color) {
        if (params.color === 'C' && c.colors.length > 0) return false;
        if (params.color === 'M' && c.colors.length < 2) return false;
        if (!['C', 'M'].includes(params.color) && !c.colors.includes(params.color as any)) return false;
      }
      if (params.type && !c.types.includes(params.type)) return false;
      if (params.rarity && c.rarity !== params.rarity) return false;
      if (trimmed) {
        const q = trimmed.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.oracleText.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    return {
      cards: fallbackFiltered,
      totalCards: fallbackFiltered.length,
      hasMore: false
    };
  }
}

/**
 * Fetches a single card by exact/fuzzy name or set and collector number.
 */
export async function fetchCardByNameOrSet(
  name: string,
  setCode?: string,
  collectorNumber?: string
): Promise<Card | null> {
  try {
    let url = '';
    if (setCode && collectorNumber) {
      url = `https://api.scryfall.com/cards/${encodeURIComponent(setCode.toLowerCase())}/${encodeURIComponent(collectorNumber)}`;
    } else {
      url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`;
    }

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      // If set search failed, fallback to name search
      if (setCode && collectorNumber) {
        return fetchCardByNameOrSet(name);
      }
      return null;
    }

    const raw = await res.json();
    return transformScryfallCard(raw);
  } catch (err) {
    console.warn(`Failed to fetch card "${name}":`, err);
    return null;
  }
}

