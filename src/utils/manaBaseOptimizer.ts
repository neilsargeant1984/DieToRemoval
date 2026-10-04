import { Card, ManaColor } from '../types/card';
import { DeckCard } from '../types/deck';
import { UserCollection } from '../types/collection';
import { 
  ArenaLandCard, 
  ARENA_LANDS_DATABASE, 
  convertArenaLandToCard 
} from '../data/arenaLands';

export interface ColorPipRatio {
  color: ManaColor;
  pips: number;
  percentage: number;
  sourcesRecommended: number;
  actualSources: number;
}

export interface ManaBaseResult {
  recommendedLands: DeckCard[];
  targetLandCount: number;
  colorPips: ColorPipRatio[];
  consistencyScore: number; // 0-100
  tierName: string;
  notes: string[];
  breakdown: {
    rainbowStaples: DeckCard[];
    fetchAndShock: DeckCard[];
    triomesAndSurveils: DeckCard[];
    dualsAndPathways: DeckCard[];
    channelAndUtility: DeckCard[];
    basics: DeckCard[];
  };
}

export interface ManaBaseOptimizerOptions {
  commander?: Card;
  mainboard: DeckCard[];
  format?: string;
  isStandardBrawl?: boolean;
  targetLandCount?: number;
  preserveCustomNonBasics?: boolean;
  preference?: 'optimal' | 'wildcard_friendly';
  userCollection?: UserCollection;
}

/**
 * Extracts non-land colored pips from all spells in the mainboard.
 */
export function extractNonLandPips(mainboard: DeckCard[]): Record<ManaColor, number> {
  const pips: Record<ManaColor, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };

  for (const item of mainboard) {
    const { card, quantity } = item;
    if (card.types.includes('Land')) continue;

    // Handle hybrid mana e.g. {W/U}
    const hybridMatches = card.manaCost.match(/\{([WUBRG])\/([WUBRG])\}/g) || [];
    for (const h of hybridMatches) {
      const parts = h.replace(/[\{\}]/g, '').split('/');
      const c1 = parts[0] as ManaColor;
      const c2 = parts[1] as ManaColor;
      if (pips[c1] !== undefined) pips[c1] += 0.5 * quantity;
      if (pips[c2] !== undefined) pips[c2] += 0.5 * quantity;
    }

    // Handle single pips e.g. {W}, {U}, {B}, {R}, {G}
    const cleanCost = card.manaCost.replace(/\{[WUBRG]\/[WUBRG]\}/g, '');
    const singleMatches = cleanCost.match(/\{([WUBRGC])\}/g) || [];
    for (const m of singleMatches) {
      const symbol = m.replace(/[\{\}]/g, '') as ManaColor;
      if (pips[symbol] !== undefined) {
        pips[symbol] += quantity;
      }
    }
  }

  return pips;
}

/**
 * Generates the best possible MTG Arena mana base for any format.
 */
export function generateOptimalManaBase(options: ManaBaseOptimizerOptions): ManaBaseResult {
  const {
    commander,
    mainboard,
    format = 'brawl',
    isStandardBrawl = false,
    preserveCustomNonBasics = false,
    userCollection = {}
  } = options;

  const isStandard = format.toLowerCase() === 'standard';

  // 1. Calculate colored pip distribution
  const pips = extractNonLandPips(mainboard);

  // 2. Determine Color Identity Dynamically
  let colorIdentity: ManaColor[] = [];
  if (commander) {
    colorIdentity = (commander.colorIdentity || []) as ManaColor[];
  } else {
    // If no commander (Standard/Pioneer), derive color identity from deck's pips
    colorIdentity = (['W', 'U', 'B', 'R', 'G'] as ManaColor[]).filter(c => pips[c] > 0);
  }
  
  const colorCount = colorIdentity.length;
  const totalColoredPips = colorIdentity.reduce((sum, col) => sum + (pips[col] || 0), 0);

  // 3. Determine optimal target land count
  let targetLandCount = options.targetLandCount;
  if (!targetLandCount || targetLandCount <= 0) {
    if (isStandard || isStandardBrawl) {
      targetLandCount = 24;
    } else {
      // 100-card Brawl base
      const cmdCmc = commander ? commander.cmc : 4;
      if (cmdCmc <= 3) {
        targetLandCount = 36;
      } else if (cmdCmc >= 6) {
        targetLandCount = 38;
      } else {
        targetLandCount = 37;
      }
    }
  }

  // 4. Preserve custom utility lands if requested
  const preservedLands: DeckCard[] = [];
  const preservedNames = new Set<string>();

  const basicNames = new Set(['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes']);

  if (preserveCustomNonBasics) {
    for (const item of mainboard) {
      if (item.card.types.includes('Land') && !basicNames.has(item.card.name)) {
        preservedLands.push(item);
        preservedNames.add(item.card.name.toLowerCase());
      }
    }
  }

  // Helper land query from verified Arena database
  const getArenaLand = (id: string): ArenaLandCard | undefined => {
    return ARENA_LANDS_DATABASE.find(l => l.id === id);
  };

  const getArenaLandByName = (name: string): ArenaLandCard | undefined => {
    return ARENA_LANDS_DATABASE.find(l => l.name.toLowerCase() === name.toLowerCase());
  };

  // Find lands matching a specific cycle and color criteria
  const findCycleLands = (cycle: string, matchColors: ManaColor[]): ArenaLandCard[] => {
    const colorSet = new Set(matchColors);
    return ARENA_LANDS_DATABASE.filter(l => {
      if (l.cycle !== cycle) return false;
      // All colors produced must be within commander color identity
      if (l.colorIdentity.length > 0 && !l.colorIdentity.every(c => colorSet.has(c as ManaColor))) {
        return false;
      }
      return true;
    });
  };

  const selectedNonBasics: ArenaLandCard[] = [];

  const addLandIfLegal = (land?: ArenaLandCard) => {
    if (!land) return;
    if (preservedNames.has(land.name.toLowerCase())) return;
    if (selectedNonBasics.some(l => l.id === land.id)) return;

    // Exclude commander-specific cards if building for Standard
    if (isStandard && ['command-tower', 'plaza-of-heroes', 'the-world-tree', 'mana-confluence'].includes(land.id)) {
      return;
    }

    // Check color identity legality
    const isLegal = land.colorIdentity.length === 0 || 
      land.colorIdentity.every(c => colorIdentity.includes(c as ManaColor));

    if (isLegal) {
      selectedNonBasics.push(land);
    }
  };

  const notes: string[] = [];
  let tierName = '';

  // =========================================================================
  // 5. CURATE BEST NON-BASIC LANDS ACCORDING TO COLOR COUNT (0 TO 5 COLORS)
  // =========================================================================

  if (colorCount === 0) {
    // 0 COLORS: COLORLESS
    tierName = 'Colorless Utility Matrix & Wastes';
    notes.push('Maximized colorless utility lands with Wastes for basic land searchability and field wipe resilience.');

    const colorlessUtilityIds = [
      'blast-zone', 'demolition-field', 'field-of-ruin', 'mirrex', 'mishra-s-foundry',
      'reliquary-tower', 'scavenger-grounds', 'arch-of-orazca', 'karn-s-bastion', 'war-room'
    ];
    for (const id of colorlessUtilityIds) {
      addLandIfLegal(getArenaLand(id));
    }
  } else if (colorCount === 1) {
    // 1 COLOR: MONOCOLOR
    const singleColor = colorIdentity[0];
    tierName = `Monocolor Devotion & Channel Engine (${singleColor})`;
    notes.push('Includes Nykthos, Shrine to Nyx, Kamigawa Channel land, and Eldraine Castle alongside optimized basics.');

    if (!isStandard) addLandIfLegal(getArenaLand('nykthos-shrine-to-nyx'));

    const channelMap: Record<string, string> = {
      W: 'eiganjo-seat-of-the-empire', U: 'otawara-soaring-city', B: 'takenuma-abandoned-mire',
      R: 'sokenzan-crucible-of-defiance', G: 'boseiju-who-endures'
    };
    addLandIfLegal(getArenaLand(channelMap[singleColor]));

    const castleMap: Record<string, string> = {
      W: 'castle-ardenvale', U: 'castle-vantress', B: 'castle-locthwain',
      R: 'castle-embereth', G: 'castle-garenbrig'
    };
    addLandIfLegal(getArenaLand(castleMap[singleColor]));

    addLandIfLegal(getArenaLand('demolition-field'));
    if (!isStandard) addLandIfLegal(getArenaLand('war-room'));
    addLandIfLegal(getArenaLand('blast-zone'));
    addLandIfLegal(getArenaLand('mirrex'));
  } else if (colorCount === 2) {
    // 2 COLORS: GUILDS
    tierName = `Guild Optimization: Fetches, Shocks, Surveil & Duals (${colorIdentity.join('')})`;
    notes.push('Premier untapped fixing: On-Color Fetch, Shock, Surveil, Fastland, Slowland, Painland & Channel lands.');

    if (!isStandard) addLandIfLegal(getArenaLand('command-tower'));
    if (!isStandard) addLandIfLegal(getArenaLand('mana-confluence'));
    
    // On-Color Fetch Land
    const fetches = findCycleLands('fetch', colorIdentity);
    for (const f of fetches) {
      if (f.colorsProduced.every(c => (colorIdentity as ManaColor[]).includes(c as ManaColor))) {
        addLandIfLegal(f);
      }
    }

    findCycleLands('shock', colorIdentity).forEach(addLandIfLegal);
    findCycleLands('surveil', colorIdentity).forEach(addLandIfLegal);
    findCycleLands('fastland', colorIdentity).forEach(addLandIfLegal);
    findCycleLands('slowland', colorIdentity).forEach(addLandIfLegal);
    findCycleLands('painland', colorIdentity).forEach(addLandIfLegal);
    findCycleLands('pathway', colorIdentity).forEach(addLandIfLegal);

    for (const col of colorIdentity) {
      const channel = ARENA_LANDS_DATABASE.find(l => l.cycle === 'channel' && l.colorsProduced.includes(col));
      addLandIfLegal(channel);
    }
  } else if (colorCount === 3) {
    // 3 COLORS: SHARDS & WEDGES
    tierName = `Tricolor Fixing: Triome, Fetches, Shocks & Surveils (${colorIdentity.join('')})`;
    notes.push('Complete 3-color package: On-color Triome, Fetchlands, Shocklands, Surveils, and untapped Fast/Slow lands.');

    if (!isStandard) {
      addLandIfLegal(getArenaLand('command-tower'));
      addLandIfLegal(getArenaLand('mana-confluence'));
      addLandIfLegal(getArenaLand('reflecting-pool'));
    }

    findCycleLands('triome', colorIdentity).forEach(addLandIfLegal);

    const fetches = ARENA_LANDS_DATABASE.filter(
      l => l.cycle === 'fetch' && l.colorsProduced.every(c => (colorIdentity as ManaColor[]).includes(c as ManaColor))
    );
    fetches.forEach(addLandIfLegal);

    findCycleLands('shock', colorIdentity).forEach(addLandIfLegal);
    findCycleLands('surveil', colorIdentity).forEach(addLandIfLegal);
    findCycleLands('slowland', colorIdentity).forEach(addLandIfLegal);
    findCycleLands('fastland', colorIdentity).forEach(addLandIfLegal);

    for (const col of colorIdentity) {
      const channel = ARENA_LANDS_DATABASE.find(l => l.cycle === 'channel' && l.colorsProduced.includes(col));
      addLandIfLegal(channel);
    }
  } else if (colorCount === 4) {
    // 4 COLORS
    tierName = `4-Color Nexus: 4 Triomes, 6 Fetches & 6 Shocks (${colorIdentity.join('')})`;
    notes.push('Extensive multi-color network: 4 matching Triomes, Fetchlands, Shocklands, and Channel lands.');

    if (!isStandard) {
      addLandIfLegal(getArenaLand('command-tower'));
      addLandIfLegal(getArenaLand('mana-confluence'));
      addLandIfLegal(getArenaLand('reflecting-pool'));
    }

    findCycleLands('triome', colorIdentity).forEach(addLandIfLegal);

    ARENA_LANDS_DATABASE.filter(
      l => l.cycle === 'fetch' && l.colorsProduced.every(c => (colorIdentity as ManaColor[]).includes(c as ManaColor))
    ).forEach(addLandIfLegal);

    findCycleLands('shock', colorIdentity).forEach(addLandIfLegal);
    findCycleLands('surveil', colorIdentity).slice(0, 4).forEach(addLandIfLegal);
    findCycleLands('slowland', colorIdentity).slice(0, 3).forEach(addLandIfLegal);

    for (const col of colorIdentity) {
      const channel = ARENA_LANDS_DATABASE.find(l => l.cycle === 'channel' && l.colorsProduced.includes(col));
      addLandIfLegal(channel);
    }
  } else if (colorCount >= 5) {
    // 5 COLORS
    tierName = '5-Color Omniscience: Shocks, Fetches, Triomes & Rainbow Core';
    notes.push('The ultimate 5-color mana base: Shocklands, Fetchlands, Triomes, and 1 of each Basic land.');

    if (!isStandard) {
      addLandIfLegal(getArenaLand('command-tower'));
      addLandIfLegal(getArenaLand('mana-confluence'));
      addLandIfLegal(getArenaLand('reflecting-pool'));
      addLandIfLegal(getArenaLand('the-world-tree'));
    }

    ARENA_LANDS_DATABASE.filter(l => l.cycle === 'shock').forEach(addLandIfLegal);
    ARENA_LANDS_DATABASE.filter(l => l.cycle === 'fetch').forEach(addLandIfLegal);

    const triomeKeys = ['zagoth-triome', 'savai-triome', 'ketria-triome', 'raffine-s-tower', 'spara-s-headquarters'];
    for (const k of triomeKeys) {
      addLandIfLegal(getArenaLand(k));
    }
  }

  // Combine preserved custom lands and selected non-basics (scaling quantities for Standard)
  const finalNonBasics: DeckCard[] = [];

  for (const p of preservedLands) {
    finalNonBasics.push(p);
  }

  for (const land of selectedNonBasics) {
    const currentNonBasicCount = finalNonBasics.reduce((sum, c) => sum + c.quantity, 0);
    const maxNonBasicsAllowed = targetLandCount - (colorCount > 0 ? colorCount : 1);
    
    if (currentNonBasicCount < maxNonBasicsAllowed) {
      const spaceLeft = maxNonBasicsAllowed - currentNonBasicCount;
      // Legendary lands and channel lands should remain singletons even in Standard to prevent dead draws
      const isLegendary = ['eiganjo-seat-of-the-empire', 'otawara-soaring-city', 'takenuma-abandoned-mire', 'sokenzan-crucible-of-defiance', 'boseiju-who-endures', 'nykthos-shrine-to-nyx'].includes(land.id);
      
      const copies = Math.min(isStandard && !isLegendary ? 4 : 1, spaceLeft);
      
      finalNonBasics.push({
        card: convertArenaLandToCard(land),
        quantity: copies
      });
    }
  }

  // =========================================================================
  // 6. HAMILTON-HARE QUOTA TO SMOOTHLY DISTRIBUTE BASIC LANDS BY PIP RATIO
  // =========================================================================

  const nonBasicQty = finalNonBasics.reduce((sum, c) => sum + c.quantity, 0);
  const basicSlotsRemaining = Math.max(0, targetLandCount - nonBasicQty);
  const basicCards: DeckCard[] = [];

  const basicNameMap: Record<ManaColor, string> = {
    W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest', C: 'Wastes'
  };

  if (colorCount === 0) {
    const wastesLand = getArenaLand('wastes');
    if (wastesLand && basicSlotsRemaining > 0) {
      basicCards.push({
        card: convertArenaLandToCard(wastesLand),
        quantity: basicSlotsRemaining
      });
    }
  } else if (colorCount === 1) {
    const col = colorIdentity[0];
    const basicCard = getArenaLandByName(basicNameMap[col]);
    if (basicCard && basicSlotsRemaining > 0) {
      basicCards.push({
        card: convertArenaLandToCard(basicCard),
        quantity: basicSlotsRemaining
      });
    }
  } else {
    const minBasicsPerColor = colorCount <= 3 ? (basicSlotsRemaining >= colorCount * 2 ? 2 : 1) : 1;
    let reservedBasics = colorCount * minBasicsPerColor;

    if (basicSlotsRemaining < reservedBasics) {
      reservedBasics = 0;
    }

    const unallocatedSlots = basicSlotsRemaining - (reservedBasics > 0 ? reservedBasics : 0);
    const quotas: { color: ManaColor; exact: number; integer: number; remainder: number }[] = [];

    for (const col of colorIdentity) {
      const colPips = pips[col] || 0;
      const fraction = totalColoredPips > 0 ? colPips / totalColoredPips : 1 / colorCount;
      const exact = fraction * unallocatedSlots;
      const integer = Math.floor(exact);
      quotas.push({ color: col, exact, integer, remainder: exact - integer });
    }

    let distributed = quotas.reduce((a, b) => a + b.integer, 0);
    quotas.sort((a, b) => b.remainder - a.remainder);

    let idx = 0;
    while (distributed < unallocatedSlots && idx < quotas.length) {
      quotas[idx].integer += 1;
      distributed += 1;
      idx += 1;
    }

    for (const q of quotas) {
      const totalQty = q.integer + (reservedBasics > 0 ? minBasicsPerColor : 0);
      if (totalQty > 0) {
        const basicEntry = getArenaLandByName(basicNameMap[q.color]);
        if (basicEntry) {
          basicCards.push({
            card: convertArenaLandToCard(basicEntry),
            quantity: totalQty
          });
        }
      }
    }
  }

  const allRecommended = [...finalNonBasics, ...basicCards];

  // =========================================================================
  // 7. CALCULATE EFFECTIVE MANA SOURCES & KARSTEN CONSISTENCY RATING
  // =========================================================================

  const effectiveSources: Record<ManaColor, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };

  for (const item of allRecommended) {
    const cardName = item.card.name;
    const qty = item.quantity;
    const arenaEntry = getArenaLandByName(cardName);

    if (arenaEntry) {
      if (arenaEntry.cycle === 'rainbow_staple') {
        for (const col of colorIdentity) {
          effectiveSources[col] += qty;
        }
      } else if (arenaEntry.cycle === 'fetch') {
        for (const col of arenaEntry.colorsProduced) {
          if (colorIdentity.includes(col as any)) {
            effectiveSources[col as ManaColor] += qty;
          }
        }
      } else {
        for (const col of arenaEntry.colorsProduced) {
          effectiveSources[col as ManaColor] += qty;
        }
      }
    } else {
      for (const col of item.card.colorIdentity) {
        effectiveSources[col as ManaColor] += qty;
      }
    }
  }

  const colorPipStats: ColorPipRatio[] = colorIdentity.map(col => {
    const colPips = pips[col] || 0;
    const percentage = totalColoredPips > 0 ? Math.round((colPips / totalColoredPips) * 100) : Math.round(100 / colorCount);
    const sourcesRecommended = Math.max(14, Math.round(targetLandCount * (percentage / 100) * 0.9));
    return {
      color: col,
      pips: colPips,
      percentage,
      sourcesRecommended,
      actualSources: effectiveSources[col] || 0
    };
  });

  let consistencyScore = 95;
  for (const stat of colorPipStats) {
    if (stat.actualSources < 14 && stat.pips > 0) {
      consistencyScore -= 8;
    }
  }
  consistencyScore = Math.max(70, Math.min(99, consistencyScore));

  const breakdown = {
    rainbowStaples: allRecommended.filter(i => {
      const e = getArenaLandByName(i.card.name);
      return e?.cycle === 'rainbow_staple';
    }),
    fetchAndShock: allRecommended.filter(i => {
      const e = getArenaLandByName(i.card.name);
      return e?.cycle === 'fetch' || e?.cycle === 'shock';
    }),
    triomesAndSurveils: allRecommended.filter(i => {
      const e = getArenaLandByName(i.card.name);
      return e?.cycle === 'triome' || e?.cycle === 'surveil';
    }),
    dualsAndPathways: allRecommended.filter(i => {
      const e = getArenaLandByName(i.card.name);
      return e?.cycle === 'fastland' || e?.cycle === 'slowland' || e?.cycle === 'painland' || e?.cycle === 'pathway';
    }),
    channelAndUtility: allRecommended.filter(i => {
      const e = getArenaLandByName(i.card.name);
      return e?.cycle === 'channel' || e?.cycle === 'castle' || e?.cycle === 'colorless_utility';
    }),
    basics: allRecommended.filter(i => basicNames.has(i.card.name))
  };

  return {
    recommendedLands: allRecommended,
    targetLandCount,
    colorPips: colorPipStats,
    consistencyScore,
    tierName,
    notes,
    breakdown
  };
}
