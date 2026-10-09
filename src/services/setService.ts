import { ArenaSet, ARENA_SETS } from '../data/arenaSets';
import { ARENA_SET_ART, getSetBannerArt, getSetIconSvgUri } from '../data/arenaSetArt';
import { getScryfallHeaders } from './scryfallService';

export interface SetDiscoveryResult {
  latestSet: ArenaSet;
  upcomingSet: ArenaSet | null;
  allSets: ArenaSet[];
  lastUpdated: number;
}

const SETS_STORAGE_KEY = 'dietoremoval_arena_sets_v2';
const BANNER_CACHE_PREFIX = 'dietoremoval_banner_art_v2_';
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours cache

/**
 * Returns the latest active MTG Arena release synchronously from localStorage cache,
 * falling back safely to pre-bundled ARENA_SETS[0] (0ms instant first render).
 */
export function getLatestArenaSetSync(): ArenaSet {
  try {
    const raw = localStorage.getItem(SETS_STORAGE_KEY);
    if (raw) {
      const parsed: SetDiscoveryResult = JSON.parse(raw);
      if (parsed?.latestSet?.code) {
        return parsed.latestSet;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return ARENA_SETS[0];
}

/**
 * Returns the next upcoming MTG Arena release (if one is scheduled within ~90 days).
 */
export function getUpcomingArenaSetSync(): ArenaSet | null {
  try {
    const raw = localStorage.getItem(SETS_STORAGE_KEY);
    if (raw) {
      const parsed: SetDiscoveryResult = JSON.parse(raw);
      if (parsed?.upcomingSet?.code) {
        return parsed.upcomingSet;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

/**
 * Returns the complete list of known & discovered sets synchronously.
 */
export function getAllArenaSetsSync(): ArenaSet[] {
  try {
    const raw = localStorage.getItem(SETS_STORAGE_KEY);
    if (raw) {
      const parsed: SetDiscoveryResult = JSON.parse(raw);
      if (Array.isArray(parsed?.allSets) && parsed.allSets.length > 0) {
        return parsed.allSets;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return ARENA_SETS;
}

/**
 * Dynamically queries Scryfall's /sets API to discover newly released and upcoming sets.
 * Merges discovered sets with our curated Arena set history, caches them locally,
 * and notifies components of any newly released sets.
 */
export async function refreshArenaSetsAsync(forceRefresh = false): Promise<SetDiscoveryResult> {
  const now = new Date();

  // Check cache first
  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(SETS_STORAGE_KEY);
      if (raw) {
        const parsed: SetDiscoveryResult = JSON.parse(raw);
        if (parsed?.lastUpdated && Date.now() - parsed.lastUpdated < CACHE_TTL_MS) {
          return parsed;
        }
      }
    } catch {
      // Refresh if corrupt
    }
  }

  try {
    const response = await fetch('https://api.scryfall.com/sets', {
      headers: getScryfallHeaders()
    });

    if (!response.ok) {
      throw new Error(`Scryfall sets API returned HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!json || !Array.isArray(json.data)) {
      throw new Error('Invalid Scryfall response structure');
    }

    // Filter relevant MTG sets (exclude tokens, promos, memorabilia, minigames)
    const validSetTypes = new Set(['expansion', 'core', 'masters', 'alchemy', 'draft_innovation', 'commander']);
    const rawSets = json.data.filter((s: any) => 
      validSetTypes.has(s.set_type) &&
      s.set_type !== 'token' &&
      s.set_type !== 'memorabilia' &&
      s.set_type !== 'promo' &&
      s.code &&
      s.name &&
      s.released_at
    );

    // Map discovered sets to ArenaSet structure
    const discoveredMap = new Map<string, ArenaSet>();

    // 1. Seed with known curated sets first
    for (const s of ARENA_SETS) {
      discoveredMap.set(s.code.toUpperCase(), { ...s });
    }

    // 2. Overlay & add discovered sets from Scryfall
    for (const s of rawSets) {
      const codeUpper = s.code.toUpperCase();
      const releaseDate = s.released_at;
      const releaseYear = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : new Date().getFullYear();

      let category: ArenaSet['category'] = 'standard';
      if (s.set_type === 'alchemy') {
        category = 'alchemy';
      } else if (s.set_type === 'masters' || s.name.toLowerCase().includes('remastered')) {
        category = 'remastered';
      } else if (s.set_type === 'commander') {
        category = 'eternal';
      } else if (s.name.toLowerCase().includes('anthology')) {
        category = 'anthology';
      }

      if (discoveredMap.has(codeUpper)) {
        // Update release dates or card count if available
        const existing = discoveredMap.get(codeUpper)!;
        existing.releaseDate = releaseDate;
        existing.releaseYear = releaseYear;
      } else {
        // Only include new expansions, core, or alchemy sets to avoid non-Arena bloat
        if (['expansion', 'core', 'alchemy', 'masters'].includes(s.set_type)) {
          discoveredMap.set(codeUpper, {
            code: codeUpper,
            name: s.name,
            category,
            releaseYear,
            releaseDate
          });
        }
      }
    }

    // Sort all sets descending by release date (newest first)
    const allSets = Array.from(discoveredMap.values()).sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
      return dateB - dateA;
    });

    // Determine the active latest standard / premier set (released_at <= now)
    // Filter for premier standard expansions first
    const releasedStandardSets = allSets.filter(s => 
      s.category === 'standard' &&
      s.releaseDate &&
      new Date(s.releaseDate) <= now
    );

    const latestSet: ArenaSet = releasedStandardSets[0] || allSets[0] || ARENA_SETS[0];

    // Find the closest upcoming expansion (releaseDate > now, within next 120 days)
    const upcomingSets = allSets.filter(s =>
      s.category === 'standard' &&
      s.releaseDate &&
      new Date(s.releaseDate) > now
    ).sort((a, b) => {
      const dateA = new Date(a.releaseDate!).getTime();
      const dateB = new Date(b.releaseDate!).getTime();
      return dateA - dateB; // Closest upcoming first
    });

    const upcomingSet: ArenaSet | null = upcomingSets[0] || null;

    const result: SetDiscoveryResult = {
      latestSet,
      upcomingSet,
      allSets,
      lastUpdated: Date.now()
    };

    try {
      localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(result));
    } catch {
      // LocalStorage quota safe
    }

    return result;
  } catch (err) {
    console.warn('Set auto-discovery fallback to static registry:', err);
    return {
      latestSet: ARENA_SETS[0],
      upcomingSet: null,
      allSets: ARENA_SETS,
      lastUpdated: Date.now()
    };
  }
}

/**
 * Resolves high-resolution panoramic banner artwork for any set.
 * Checks the static curated registry first. If not found, dynamically queries
 * Scryfall for the set's flagship planeswalker/mythic card and caches it.
 */
export async function resolveSetBannerArt(setCode: string): Promise<string> {
  const upper = setCode.toUpperCase();

  // 1. Fast check in static art registry
  if (ARENA_SET_ART[upper]?.artCrop) {
    return ARENA_SET_ART[upper].artCrop;
  }
  const clean = upper.replace(/^Y/, '');
  if (ARENA_SET_ART[clean]?.artCrop) {
    return ARENA_SET_ART[clean].artCrop;
  }

  // 2. Check localStorage dynamic banner cache
  const cacheKey = `${BANNER_CACHE_PREFIX}${upper}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    // Ignore storage read error
  }

  // 3. Dynamically fetch top iconic card art from Scryfall
  try {
    const query = `set:${setCode.toLowerCase()} (t:planeswalker or r:mythic or r:rare)`;
    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=edhrec`;
    const res = await fetch(url, { headers: getScryfallHeaders() });
    
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.[0]?.image_uris?.art_crop) {
        const artCrop = data.data[0].image_uris.art_crop;
        try {
          localStorage.setItem(cacheKey, artCrop);
        } catch {
          // LocalStorage quota safe
        }
        return artCrop;
      }
    }
  } catch (err) {
    console.warn(`Dynamic banner art fetch failed for ${setCode}:`, err);
  }

  // 4. Default banner fallback
  return getSetBannerArt(setCode);
}

export { getSetIconSvgUri };
