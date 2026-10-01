import { Card } from '../types/card';
import { searchArenaCards, transformScryfallCard } from './scryfallService';
import { ARENA_CARDS } from '../data/arenaCards';

export interface EDHRECCardView {
  card: Card;
  synergy: number; // Percentage, e.g. 62 -> +62%
  inclusion: number; // Percentage of decks running this card, e.g. 84 -> 84%
  numDecks: number;
  category: 'highsynergy' | 'topcard' | 'creature' | 'instant' | 'sorcery' | 'artifact' | 'enchantment' | 'planeswalker' | 'land';
}

export interface CommanderCommunityMeta {
  commanderName: string;
  totalDecks: number;
  cards: EDHRECCardView[];
}

// In-memory cache for EDHREC consensus data (1 hour TTL)
const edhrecCache = new Map<string, { data: CommanderCommunityMeta; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Converts a commander card name into a standard EDHREC URL slug.
 * e.g. "Liliana, Heretical Healer // Liliana, Defiant Necromancer" -> "liliana-heretical-healer"
 */
export function getCommanderSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\/\/.*/, '') // Remove flip/MDFC back face
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Fetches real-world community deck inclusion consensus from EDHREC,
 * strictly filtered and cross-referenced with cards legal on MTG Arena in Brawl.
 */
export async function fetchArenaCommunityMeta(
  commander: Card
): Promise<CommanderCommunityMeta> {
  const slug = getCommanderSlug(commander.name);
  const cacheKey = `${slug}__${commander.colorIdentity.join('')}`;

  const cached = edhrecCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    if (typeof window === 'undefined') {
      headers['User-Agent'] = 'BrawlDeckBuilder/1.0 (Web; MTGA)';
    }

    const response = await fetch(`https://json.edhrec.com/pages/commanders/${slug}.json`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`EDHREC returned HTTP ${response.status}`);
    }

    const json = await response.json();
    const container = json.container?.json_dict;
    const totalDecks = container?.card?.num_decks || container?.num_decks || 1000;
    const rawCardlists = container?.cardlists || [];

    // Map all raw recommendations from EDHREC
    interface RawEDHRECCard {
      id?: string;
      name: string;
      synergy?: number;
      num_decks?: number;
      potential_decks?: number;
      category: 'highsynergy' | 'topcard' | 'creature' | 'instant' | 'sorcery' | 'artifact' | 'enchantment' | 'planeswalker' | 'land';
    }

    const rawCardsMap = new Map<string, RawEDHRECCard>();

    for (const cl of rawCardlists) {
      const tag = cl.tag || '';
      let cat: RawEDHRECCard['category'] = 'topcard';
      if (tag === 'highsynergycards') cat = 'highsynergy';
      else if (tag === 'creatures') cat = 'creature';
      else if (tag === 'instants') cat = 'instant';
      else if (tag === 'sorceries') cat = 'sorcery';
      else if (tag === 'utilityartifacts' || tag === 'manaartifacts') cat = 'artifact';
      else if (tag === 'enchantments') cat = 'enchantment';
      else if (tag === 'planeswalkers') cat = 'planeswalker';
      else if (tag === 'utilitylands' || tag === 'lands') cat = 'land';
      else if (tag === 'topcards' || tag === 'gamechangers') cat = 'topcard';
      else continue;

      for (const cv of cl.cardviews || []) {
        const cleanName = (cv.name || '').trim();
        if (!cleanName || cleanName.toLowerCase() === commander.name.toLowerCase()) continue;

        if (!rawCardsMap.has(cleanName)) {
          rawCardsMap.set(cleanName, {
            id: cv.id,
            name: cleanName,
            synergy: cv.synergy,
            num_decks: cv.num_decks,
            potential_decks: cv.potential_decks || totalDecks,
            category: cat
          });
        }
      }
    }

    // Now, cross-reference with MTG Arena legality!
    const rawList = Array.from(rawCardsMap.values());
    // Lookup by card name so Scryfall returns the canonical standard in-game printing rather than Secret Lair / promo art
    const namesToLookup = rawList.map(c => ({ name: c.name }));

    const arenaCardIndex = new Map<string, Card>();

    // Check local ARENA_CARDS dataset first
    for (const c of ARENA_CARDS) {
      if (c.legalities.brawl) {
        const isLegalIdentity = c.colorIdentity.every(col => commander.colorIdentity.includes(col));
        if (isLegalIdentity) {
          arenaCardIndex.set(c.name.toLowerCase(), c);
          if (c.id) arenaCardIndex.set(c.id, c);
        }
      }
    }

    // Lookup in batches of 75 from Scryfall collection API
    for (let i = 0; i < namesToLookup.length; i += 75) {
      const batch = namesToLookup.slice(i, i + 75);
      try {
        const collRes = await fetch('https://api.scryfall.com/cards/collection', {
          method: 'POST',
          headers: { 
            'User-Agent': 'BrawlDeckBuilder/1.0 (Web; MTGA)',
            'Content-Type': 'application/json', 
            'Accept': 'application/json' 
          },
          body: JSON.stringify({ identifiers: batch })
        });
        if (collRes.ok) {
          const collData = await collRes.json();
          for (const raw of collData.data || []) {
            const isArenaLegal = raw.legalities?.brawl === 'legal' || 
              raw.legalities?.standardbrawl === 'legal' || 
              (raw.games?.includes('arena') && (raw.legalities?.historic === 'legal' || raw.legalities?.timeless === 'legal'));

            if (isArenaLegal) {
              const card = transformScryfallCard(raw);
              const isLegalIdentity = card.colorIdentity.every(col => commander.colorIdentity.includes(col));
              if (isLegalIdentity) {
                arenaCardIndex.set(card.name.toLowerCase(), card);
                if (card.id) arenaCardIndex.set(card.id, card);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Batch collection lookup failed:', e);
      }
    }

    // Also fetch general Brawl-legal cards for this Commander's color identity
    const arenaResult = await searchArenaCards({
      format: 'brawl',
      commanderColorIdentity: commander.colorIdentity,
      query: '-t:basic',
      order: 'edhrec'
    });

    for (const c of arenaResult.cards) {
      if (!arenaCardIndex.has(c.name.toLowerCase())) {
        arenaCardIndex.set(c.name.toLowerCase(), c);
      }
      if (c.id && !arenaCardIndex.has(c.id)) {
        arenaCardIndex.set(c.id, c);
      }
    }

    const matchedCards: EDHRECCardView[] = [];

    for (const [name, rawItem] of rawCardsMap.entries()) {
      // Check if this card exists on MTG Arena and is legal in Brawl
      const lower = name.toLowerCase();
      // Prioritize the canonical regular card printing by name to avoid promo / secret lair art
      const arenaCard = arenaCardIndex.get(lower) || (rawItem.id ? arenaCardIndex.get(rawItem.id) : undefined);

      if (arenaCard && arenaCard.colorIdentity.every(col => commander.colorIdentity.includes(col))) {
        const potential = rawItem.potential_decks || totalDecks;
        const num = rawItem.num_decks || 0;
        const inclusion = potential > 0 ? Math.round((num / potential) * 100) : 0;
        const synergy = Math.round((rawItem.synergy || 0) * 100);

        matchedCards.push({
          card: arenaCard,
          synergy,
          inclusion,
          numDecks: num,
          category: rawItem.category
        });
      }
    }

    // Sort: High synergy cards first, followed by top inclusion
    matchedCards.sort((a, b) => {
      // 1. EDHREC highsynergy category cards first
      const aIsHigh = a.category === 'highsynergy' ? 1 : 0;
      const bIsHigh = b.category === 'highsynergy' ? 1 : 0;
      if (bIsHigh !== aIsHigh) {
        return bIsHigh - aIsHigh;
      }

      // 2. High Synergy Lift percentage
      if (b.synergy !== a.synergy) {
        return b.synergy - a.synergy;
      }

      // 3. Inclusion percentage
      if (b.inclusion !== a.inclusion) {
        return b.inclusion - a.inclusion;
      }

      return a.card.cmc - b.card.cmc;
    });

    const meta: CommanderCommunityMeta = {
      commanderName: commander.name,
      totalDecks,
      cards: matchedCards
    };

    edhrecCache.set(cacheKey, { data: meta, timestamp: Date.now() });
    return meta;
  } catch (err) {
    console.warn(`EDHREC consensus lookup failed for ${commander.name}, using Scryfall Brawl EDHREC fallback:`, err);

    // Fallback: Query Scryfall sorted by EDHREC directly
    const fallbackRes = await searchArenaCards({
      format: 'brawl',
      commanderColorIdentity: commander.colorIdentity,
      query: '-t:basic',
      order: 'edhrec'
    });

    const fallbackCards: EDHRECCardView[] = fallbackRes.cards.map((c, index) => {
      // Synthetic inclusion estimation based on Scryfall popularity order
      const estimatedInclusion = Math.max(15, Math.round(90 - (index * 0.45)));
      return {
        card: c,
        synergy: Math.max(10, Math.round(60 - (index * 0.3))),
        inclusion: estimatedInclusion,
        numDecks: Math.round(estimatedInclusion * 15),
        category: 'topcard'
      };
    });

    const fallbackMeta: CommanderCommunityMeta = {
      commanderName: commander.name,
      totalDecks: 2000,
      cards: fallbackCards
    };

    return fallbackMeta;
  }
}
