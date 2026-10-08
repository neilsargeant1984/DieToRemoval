import { Card, CardFace, CardRarity, CardTypeCategory, FormatType } from '../types/card';
import { ARENA_CARDS } from '../data/arenaCards';
import { FunctionalRole } from '../utils/roleClassifier';
import { isCardOnArena } from './ownershipService';

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
  colors?: string[];
  colorMode?: 'exact' | 'include' | 'at_most';
  type?: CardTypeCategory | null;
  types?: CardTypeCategory[];
  rarity?: CardRarity | null;
  rarities?: CardRarity[];
  set?: string;
  sets?: string[];
  cmcValues?: (number | '7+')[];
  isLegendary?: boolean;
  digitalOnly?: boolean;
  isCommander?: boolean;
  commanderColorIdentity?: string[];
  roleFilter?: FunctionalRole | 'lands' | null;
  order?: 'edhrec' | 'name' | 'cmc' | 'rarity' | 'rank' | 'color';
  dir?: 'asc' | 'desc';
  page?: number;
}


export function getScryfallHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...extraHeaders
  };
  // In Node.js / CLI testing environments, Scryfall requires a custom User-Agent.
  // In browser environments, setting User-Agent is forbidden by W3C Fetch spec
  // and causes CORS preflight rejections.
  if (typeof window === 'undefined') {
    headers['User-Agent'] = 'BrawlDeckBuilder/1.0 (Web; MTGA)';
  }
  return headers;
}

export interface SearchResult {
  cards: Card[];
  totalCards: number;
  hasMore: boolean;
}

/**
 * Constructs a flexible Scryfall query token from user input.
 * If the user inputs explicit Scryfall operators (e.g. `t:`, `c:`, `o:`, `(`),
 * it preserves their syntax. Otherwise, it tokenizes the terms and searches both
 * card name and card types/subtypes for each word (e.g. "sphinx", "goblin", "nicol bolas").
 */
export function buildSmartSearchQuery(raw: string): string | undefined {
  const term = raw.trim();
  if (!term) return undefined;

  // Preserve explicit Scryfall syntax
  if (term.includes(':') || term.includes('(') || term.includes(')')) {
    return term;
  }

  // Tokenize by spaces, ignoring commas or apostrophes
  const tokens = term.replace(/[,']/g, ' ').split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return undefined;

  return tokens.map(t => `(name:"${t}" or t:"${t}")`).join(' ');
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

  // Support double-faced and flip cards
  let cardFaces: CardFace[] | undefined = undefined;
  if (raw.card_faces && raw.card_faces.length > 0) {
    cardFaces = raw.card_faces.map((f: any, idx: number) => {
      let faceImg = f.image_uris?.normal || f.image_uris?.large || f.image_uris?.small;
      if (!faceImg && idx === 1) {
        const frontImg = raw.card_faces[0]?.image_uris?.normal || raw.card_faces[0]?.image_uris?.large || raw.image_uris?.normal;
        if (frontImg && frontImg.includes('/front/')) {
          faceImg = frontImg.replace('/front/', '/back/');
        } else if (raw.id) {
          faceImg = `https://api.scryfall.com/cards/${raw.id}?format=image&face=back`;
        } else if (raw.set && raw.collector_number) {
          faceImg = `https://api.scryfall.com/cards/${raw.set.toLowerCase()}/${raw.collector_number}?format=image&face=back`;
        } else if (raw.name) {
          faceImg = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(raw.name.split(' // ')[0].replace(/^A-/, '').trim())}&format=image&face=back`;
        }
      }
      return {
        name: f.name || '',
        manaCost: f.mana_cost || '',
        typeLine: f.type_line || '',
        oracleText: f.oracle_text || '',
        power: f.power,
        toughness: f.toughness,
        loyalty: f.loyalty,
        imageUrl: faceImg,
        colors: f.colors || [],
        flavorText: f.flavor_text
      };
    });

    const face = raw.card_faces[0];
    if (!imageUrl) {
      imageUrl = face.image_uris?.normal || face.image_uris?.large;
    }
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
    'Battle',
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

  // Extract subtypes from type line (everything after '—' on each card face)
  const subtypes: string[] = [];
  const faces = typeLine.split('//');
  for (const face of faces) {
    if (face.includes('—')) {
      const subPart = face.split('—')[1].trim();
      for (const w of subPart.split(/\s+/).filter(Boolean)) {
        if (!subtypes.includes(w)) {
          subtypes.push(w);
        }
      }
    }
  }
  if (subtypes.length === 0 && raw.card_faces && Array.isArray(raw.card_faces)) {
    for (const face of raw.card_faces) {
      if (face.type_line && face.type_line.includes('—')) {
        const subPart = face.type_line.split('—')[1].trim();
        for (const w of subPart.split(/\s+/).filter(Boolean)) {
          if (!subtypes.includes(w)) {
            subtypes.push(w);
          }
        }
      }
    }
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
  const isArenaGame = (Array.isArray(raw.games) && raw.games.includes('arena')) || isCardOnArena(raw.name);
  const legalities: Record<FormatType, boolean> = {
    standard: rawLegalities.standard === 'legal',
    timeless: rawLegalities.timeless === 'legal' || rawLegalities.timeless === 'restricted',
    historic: rawLegalities.historic === 'legal',
    explorer: rawLegalities.explorer === 'legal',
    brawl: isArenaGame && (rawLegalities.brawl === 'legal' || rawLegalities.standardbrawl === 'legal'),
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
    subtypes: subtypes.length > 0 ? subtypes : undefined,
    oracleText,
    power,
    toughness,
    loyalty,
    rarity: validRarity,
    set: (raw.set || 'ARENA').toUpperCase(),
    setName: raw.set_name || 'MTG Arena',
    collectorNumber: raw.collector_number || '1',
    imageUrl: imageUrl || (raw.name ? `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(raw.name)}&format=image` : 'https://cards.scryfall.io/back.png'),
    cardFaces,
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

  // Color filter (array or single)
  if (params.colors && params.colors.length > 0) {
    const normalColors = params.colors.filter(c => ['W', 'U', 'B', 'R', 'G'].includes(c));
    const hasColorless = params.colors.includes('C');
    const hasMulti = params.colors.includes('M');

    const colorClauses: string[] = [];
    if (normalColors.length > 0) {
      if (params.colorMode === 'exact') {
        colorClauses.push(`c=${normalColors.join('').toLowerCase()}`);
      } else {
        colorClauses.push(`(${normalColors.map(c => `c:${c.toLowerCase()}`).join(' or ')})`);
      }
    }
    if (hasColorless) {
      colorClauses.push('c:c');
    }
    if (hasMulti) {
      colorClauses.push('c:m');
    }
    if (colorClauses.length > 0) {
      parts.push(`(${colorClauses.join(' or ')})`);
    }
  } else if (params.color) {
    if (params.color === 'C') {
      parts.push('c:c');
    } else if (params.color === 'M') {
      parts.push('c:m');
    } else {
      parts.push(`c:${params.color.toLowerCase()}`);
    }
  }

  // Mana Value / CMC filter
  if (params.cmcValues && params.cmcValues.length > 0) {
    const cmcClauses = params.cmcValues.map(v => {
      if (v === '7+' || v === 7) return 'cmc>=7';
      return `cmc:${v}`;
    });
    parts.push(`(${cmcClauses.join(' or ')})`);
  }

  // Type filter (array or single)
  if (params.types && params.types.length > 0) {
    parts.push(`(${params.types.map(t => `t:${t.toLowerCase()}`).join(' or ')})`);
  } else if (params.type) {
    parts.push(`t:${params.type.toLowerCase()}`);
  }

  // Rarity filter (array or single)
  if (params.rarities && params.rarities.length > 0) {
    parts.push(`(${params.rarities.map(r => `r:${r.toLowerCase()}`).join(' or ')})`);
  } else if (params.rarity) {
    parts.push(`r:${params.rarity}`);
  }

  // Set filter (array or single)
  if (params.sets && params.sets.length > 0) {
    parts.push(`(${params.sets.map(s => `s:${s.toLowerCase()}`).join(' or ')})`);
  } else if (params.set) {
    parts.push(`s:${params.set.toLowerCase()}`);
  }

  // Legendary filter
  if (params.isLegendary) {
    parts.push('t:legendary');
  }

  // Commander Color Identity constraint (Brawl)
  if (params.commanderColorIdentity !== undefined) {
    if (params.commanderColorIdentity.length === 0) {
      parts.push('id:c');
    } else {
      parts.push(`id<=${params.commanderColorIdentity.join('').toLowerCase()}`);
    }
  }

  // Commander filter
  if (params.isCommander) {
    parts.push('(t:legendary t:creature or t:planeswalker)');
  }

  // Functional Role filter
  if (params.roleFilter) {
    if (params.roleFilter === 'ramp') {
      parts.push('((t:artifact o:"add ") or (o:"search your library for a" o:"land") or (t:creature o:"{t}: add") or o:"create a treasure token" or "Smothering Tithe") -t:land');
    } else if (params.roleFilter === 'protection') {
      parts.push('(o:hexproof or o:indestructible or o:"phase out" or o:"ward {" or o:"protection from")');
    } else if (params.roleFilter === 'removal') {
      parts.push('((o:"destroy target" or o:"exile target" or o:"counter target" or ((t:instant or t:sorcery) and (o:"damage to target" or o:"deals 3 damage to any target")) or "Orcish Bowmasters") and -o:"destroy all" and -o:"exile all" and -o:"from a graveyard" and -o:"from target player\'s graveyard")');
    } else if (params.roleFilter === 'board_wipe') {
      parts.push('(o:"destroy all" or o:"exile all" or o:"each creature gets -" or o:"all creatures get -")');
    } else if (params.roleFilter === 'card_advantage') {
      parts.push('((o:"draw a card" or o:"draw two cards" or o:"draw three cards" or o:"draw cards" or o:"draws a card" or o:investigate or (o:"exile the top" (o:"you may play" or o:"you may cast"))) and -(o:"whenever an opponent draws" -o:"you draw") and -"Orcish Bowmasters" and -"Smothering Tithe")');
    } else if (params.roleFilter === 'lands') {
      parts.push('t:land');
    } else if (params.roleFilter === 'threats') {
      parts.push('(t:creature or t:planeswalker)');
    } else if (params.roleFilter === 'sideboard') {
      parts.push('(t:instant or t:sorcery or o:"destroy" or o:"exile" or o:"counter" or o:"protection" or o:"graveyard")');
    }
  }

  // Search term
  const trimmed = params.query?.trim();
  if (trimmed) {
    if (trimmed.includes(' or ') || trimmed.includes(' OR ')) {
      parts.push(`(${trimmed})`);
    } else {
      parts.push(trimmed);
    }
  }

  // Always prefer canonical default card art over promo/secret lair variants
  if (!parts.some(p => p.includes('prefer:'))) {
    parts.push('prefer:default');
  }

  const queryString = parts.join(' ');
  const page = params.page || 1;
  const order = params.order || 'cmc';
  const dir = params.dir || 'asc';
  const cacheKey = `${queryString}__order_${order}__dir_${dir}__page_${page}`;

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
    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(queryString)}&order=${order}&dir=${dir}&page=${page}`;
    const response = await fetch(url, {
      headers: getScryfallHeaders()
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
    const allParsed = rawList.map(transformScryfallCard);
    // Strict commander color identity enforcement on all returned cards
    let cards = params.commanderColorIdentity !== undefined
      ? allParsed.filter((c: Card) => c.colorIdentity.every((col: string) => params.commanderColorIdentity!.includes(col)))
      : allParsed;
    
    // Deterministic CMC sort tie-break if sorted by CMC
    if (order === 'cmc') {
      cards = [...cards].sort((a, b) => {
        if (dir === 'asc') {
          if (a.cmc !== b.cmc) return a.cmc - b.cmc;
        } else {
          if (a.cmc !== b.cmc) return b.cmc - a.cmc;
        }
        return a.name.localeCompare(b.name);
      });
    }

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
    let fallbackFiltered = ARENA_CARDS.filter(c => {
      if (params.format && !c.legalities[params.format]) return false;
      if (params.digitalOnly && !c.isDigitalOnly && !c.isAlchemyRebalanced) return false;
      if (params.isLegendary && !c.typeLine.toLowerCase().includes('legendary')) return false;
      if (params.isCommander) {
        const isLegendary = c.typeLine.toLowerCase().includes('legendary');
        const isCreature = c.types.includes('Creature');
        const isPlaneswalker = c.types.includes('Planeswalker');
        if (!((isLegendary && isCreature) || isPlaneswalker)) return false;
      }
      if (params.commanderColorIdentity) {
        const isLegal = c.colorIdentity.every(col => params.commanderColorIdentity!.includes(col));
        if (!isLegal) return false;
      }
      if (params.colors && params.colors.length > 0) {
        const matchesColor = params.colors.some(col => {
          if (col === 'C') return c.colors.length === 0;
          if (col === 'M') return c.colors.length > 1;
          return c.colors.includes(col as any);
        });
        if (!matchesColor) return false;
      } else if (params.color) {
        if (params.color === 'C' && c.colors.length > 0) return false;
        if (params.color === 'M' && c.colors.length < 2) return false;
        if (!['C', 'M'].includes(params.color) && !c.colors.includes(params.color as any)) return false;
      }
      if (params.cmcValues && params.cmcValues.length > 0) {
        const matchesCmc = params.cmcValues.some(val => {
          if (val === '7+' || val === 7) return c.cmc >= 7;
          return c.cmc === val;
        });
        if (!matchesCmc) return false;
      }
      if (params.types && params.types.length > 0) {
        if (!params.types.some(t => c.types.includes(t))) return false;
      } else if (params.type && !c.types.includes(params.type)) {
        return false;
      }
      if (params.rarities && params.rarities.length > 0) {
        if (!params.rarities.includes(c.rarity)) return false;
      } else if (params.rarity && c.rarity !== params.rarity) {
        return false;
      }
      if (params.sets && params.sets.length > 0) {
        if (!params.sets.map(s => s.toUpperCase()).includes(c.set.toUpperCase())) return false;
      } else if (params.set && c.set.toUpperCase() !== params.set.toUpperCase()) {
        return false;
      }
      if (trimmed) {
        const cleanTerms = trimmed
          .replace(/\((.*?)\)/g, ' $1 ')
          .replace(/[tofri]:\S+/gi, ' ')
          .replace(/\b(or|and|not)\b/gi, ' ')
          .replace(/["']/g, '')
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean);

        if (cleanTerms.length > 0) {
          const matchAll = cleanTerms.every(term => 
            c.name.toLowerCase().includes(term) || c.oracleText.toLowerCase().includes(term)
          );
          if (!matchAll) return false;
        }
      }
      return true;
    });

    if (order === 'cmc') {
      fallbackFiltered.sort((a, b) => {
        if (dir === 'asc') {
          if (a.cmc !== b.cmc) return a.cmc - b.cmc;
        } else {
          if (a.cmc !== b.cmc) return b.cmc - a.cmc;
        }
        return a.name.localeCompare(b.name);
      });
    } else if (order === 'color') {
      const getColorWeight = (c: Card) => {
        if (c.types.includes('Land')) return 7;
        if (c.colors.length > 1) return 5;
        if (c.colors.length === 0) return 6;
        if (c.colors.includes('W')) return 0;
        if (c.colors.includes('U')) return 1;
        if (c.colors.includes('B')) return 2;
        if (c.colors.includes('R')) return 3;
        if (c.colors.includes('G')) return 4;
        return 6;
      };
      fallbackFiltered.sort((a, b) => {
        const weightA = getColorWeight(a);
        const weightB = getColorWeight(b);
        if (weightA !== weightB) return weightA - weightB;
        if (a.cmc !== b.cmc) return a.cmc - b.cmc;
        return a.name.localeCompare(b.name);
      });
    }

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

const ARENA_CACHE_KEY = 'arenaforge_scryfall_arena_cache';
// In-memory cache for Arena ID card fetches, backed by localStorage
const arenaIdCardCache = new Map<number, Card>();

// Initialize persistent cache
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(ARENA_CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) {
        for (const [k, v] of Object.entries(parsed)) {
          const numId = parseInt(k, 10);
          if (!isNaN(numId) && v) {
            arenaIdCardCache.set(numId, v as Card);
          }
        }
      }
    }
  }
} catch {
  // Ignore localStorage parsing error
}

let cacheSaveTimeout: any = null;
function persistArenaCardCache() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (cacheSaveTimeout) clearTimeout(cacheSaveTimeout);
  cacheSaveTimeout = setTimeout(() => {
    try {
      const obj: Record<number, Card> = {};
      let count = 0;
      for (const [k, v] of arenaIdCardCache.entries()) {
        obj[k] = v;
        count++;
        if (count >= 1500) break;
      }
      localStorage.setItem(ARENA_CACHE_KEY, JSON.stringify(obj));
    } catch {
      // Ignore quota exceeded
    }
  }, 1000);
}

export function getCachedCardByArenaId(arenaId: number): Card | null {
  if (arenaIdCardCache.has(arenaId)) return arenaIdCardCache.get(arenaId)!;
  const local = ARENA_CARDS.find(c => c.arenaId === arenaId);
  if (local) {
    arenaIdCardCache.set(arenaId, local);
    return local;
  }
  return null;
}

export function getAllCachedCards(): Card[] {
  return Array.from(arenaIdCardCache.values());
}

export function saveCardsToArenaCache(cards: Card[]) {
  for (const c of cards) {
    if (c.arenaId) {
      arenaIdCardCache.set(c.arenaId, c);
    }
  }
  persistArenaCardCache();
}

/**
 * Resolves a list of Arena IDs in small paced batches, saving to persistent cache.
 */
export async function batchResolveArenaCards(
  arenaIds: number[],
  onBatchResolved?: (newCards: Card[]) => void
): Promise<Card[]> {
  const missing = arenaIds.filter(id => !arenaIdCardCache.has(id));
  const resolved: Card[] = [];

  for (const id of arenaIds) {
    const cached = arenaIdCardCache.get(id);
    if (cached) resolved.push(cached);
  }

  if (missing.length === 0) return resolved;

  // Process missing cards in small batches of 4 with 80ms delay
  const chunkSize = 4;
  for (let i = 0; i < missing.length; i += chunkSize) {
    const chunk = missing.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async id => {
        try {
          return await fetchCardByArenaId(id);
        } catch {
          return null;
        }
      })
    );

    const validNewCards: Card[] = [];
    for (const card of chunkResults) {
      if (card) {
        resolved.push(card);
        validNewCards.push(card);
      }
    }

    if (validNewCards.length > 0 && onBatchResolved) {
      onBatchResolved(validNewCards);
    }

    if (i + chunkSize < missing.length) {
      await new Promise(r => setTimeout(r, 80));
    }
  }

  return resolved;
}


/**
 * Fetches a card by its MTG Arena ID from Scryfall.
 */
export async function fetchCardByArenaId(arenaId: number): Promise<Card | null> {
  // Check memory / localStorage cache first
  const cached = getCachedCardByArenaId(arenaId);
  if (cached) {
    return cached;
  }

  try {
    let res = await fetch(`https://api.scryfall.com/cards/arena/${arenaId}`, {
      headers: getScryfallHeaders()
    });

    if (res.status === 429) {
      // Rate limited: back off 1.5 seconds and retry once
      await new Promise(r => setTimeout(r, 1500));
      res = await fetch(`https://api.scryfall.com/cards/arena/${arenaId}`, {
        headers: getScryfallHeaders()
      });
    }

    if (!res.ok) {
      return null;
    }

    const raw = await res.json();
    const card = transformScryfallCard(raw);
    arenaIdCardCache.set(arenaId, card);
    persistArenaCardCache();
    return card;
  } catch (err) {
    console.warn(`Failed to fetch card by Arena ID ${arenaId}:`, err);
    return null;
  }
}

export interface CardIdentifier {
  name: string;
  set?: string;
  collector_number?: string;
}

/**
 * Fetches cards in high-performance batches using Scryfall's /cards/collection endpoint.
 * Chunks requests to 75 items max per Scryfall guidelines.
 * Includes intelligent fallbacks for set/number mismatches and Alchemy A- prefixes.
 */
export async function fetchCardsBatch(
  identifiers: CardIdentifier[]
): Promise<{ cards: Card[]; notFound: CardIdentifier[] }> {
  if (identifiers.length === 0) {
    return { cards: [], notFound: [] };
  }

  const cards: Card[] = [];
  const notFound: CardIdentifier[] = [];

  // Chunk into slices of 75
  const chunkSize = 75;
  for (let i = 0; i < identifiers.length; i += chunkSize) {
    const chunk = identifiers.slice(i, i + chunkSize);

    // Format identifiers for Scryfall
    const scryfallPayload = chunk.map(item => {
      if (item.set && item.collector_number) {
        return { set: item.set.toLowerCase(), collector_number: item.collector_number };
      }
      const cleanName = item.name.replace(/^A-/, '').trim();
      return { name: cleanName };
    });

    try {
      let res = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: getScryfallHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ identifiers: scryfallPayload })
      });

      // Handle 429 rate limit backoff
      if (res.status === 429) {
        console.warn('Scryfall rate limit hit. Backing off 1.5 seconds...');
        await new Promise(r => setTimeout(r, 1500));
        res = await fetch('https://api.scryfall.com/cards/collection', {
          method: 'POST',
          headers: getScryfallHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ identifiers: scryfallPayload })
        });
      }

      if (!res.ok) {
        console.warn(`Scryfall batch fetch returned status ${res.status}`);
        // Fallback to sequential fetching for this chunk
        for (const item of chunk) {
          const card = await fetchCardByNameOrSet(item.name, item.set, item.collector_number);
          if (card) cards.push(card);
          else notFound.push(item);
          await new Promise(r => setTimeout(r, 80));
        }
        continue;
      }

      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        for (const raw of data.data) {
          cards.push(transformScryfallCard(raw));
        }
      }

      // Handle un-matched items from this batch
      if (data.not_found && Array.isArray(data.not_found) && data.not_found.length > 0) {
        // Try fallback lookup by name for items that had set/collector_number
        const retryByName: CardIdentifier[] = [];
        for (const nf of data.not_found) {
          const orig = chunk.find(c => 
            (c.set && c.set.toLowerCase() === nf.set?.toLowerCase() && c.collector_number === nf.collector_number) ||
            c.name.toLowerCase() === nf.name?.toLowerCase() ||
            c.name.replace(/^A-/, '').toLowerCase() === nf.name?.toLowerCase()
          );
          if (orig && (orig.set || orig.name.startsWith('A-'))) {
            retryByName.push({ name: orig.name.replace(/^A-/, '').trim() });
          } else if (orig) {
            notFound.push(orig);
          }
        }

        if (retryByName.length > 0) {
          try {
            const retryRes = await fetch('https://api.scryfall.com/cards/collection', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'ArenaForge/1.0'
              },
              body: JSON.stringify({ identifiers: retryByName.map(r => ({ name: r.name })) })
            });
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              if (retryData.data) {
                for (const raw of retryData.data) {
                  cards.push(transformScryfallCard(raw));
                }
              }
              if (retryData.not_found) {
                for (const rnf of retryData.not_found) {
                  const orig = chunk.find(c => c.name.replace(/^A-/, '').toLowerCase() === rnf.name?.toLowerCase());
                  if (orig) notFound.push(orig);
                }
              }
            }
          } catch {
            // Ignore retry error
          }
        }
      }
    } catch (err) {
      console.warn('Error during Scryfall batch collection query:', err);
    }
  }

  return { cards, notFound };
}

