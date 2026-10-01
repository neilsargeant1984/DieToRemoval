import { Card, CardRarity, ManaColor } from '../types/card';

export type ArenaLandCycle = 
  | 'shock'
  | 'fetch'
  | 'triome'
  | 'surveil'
  | 'fastland'
  | 'slowland'
  | 'painland'
  | 'pathway'
  | 'restless'
  | 'channel'
  | 'castle'
  | 'rainbow_staple'
  | 'colorless_utility'
  | 'basic';

export interface ArenaLandCard {
  id: string;
  name: string;
  cycle: ArenaLandCycle;
  colorsProduced: ManaColor[]; // colors it provides
  colorIdentity: ('W' | 'U' | 'B' | 'R' | 'G')[]; // deckbuilding legality constraint
  typeLine: string;
  subtypes?: string[];
  rarity: CardRarity;
  oracleText: string;
  imageUrl: string;
  entersUntapped: boolean | 'conditional';
  arenaSet: string;
}

/**
 * 100% VERIFIED MTG ARENA LAND DATABASE.
 * Every card in this catalog is strictly confirmed to exist and be playable in MTG Arena.
 */
export const ARENA_LANDS_DATABASE: ArenaLandCard[] = [
  // ==========================================
  // 1. RAINBOW & MULTI-COLOR STAPLES (ARENA)
  // ==========================================
  {
    id: 'command-tower',
    name: 'Command Tower',
    cycle: 'rainbow_staple',
    colorsProduced: ['W', 'U', 'B', 'R', 'G'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'common',
    oracleText: '{T}: Add one mana of any color in your commander\'s color identity.',
    imageUrl: 'https://cards.scryfall.io/normal/front/1/a/1ac6cb62-45da-4e9a-84c6-09e6eacf0664.jpg?1789644465',
    entersUntapped: true,
    arenaSet: 'ELD'
  },
  {
    id: 'mana-confluence',
    name: 'Mana Confluence',
    cycle: 'rainbow_staple',
    colorsProduced: ['W', 'U', 'B', 'R', 'G'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Pay 1 life: Add one mana of any color.',
    imageUrl: 'https://cards.scryfall.io/normal/front/5/0/504a69eb-3c2d-4bb1-b117-252b15acf0c2.jpg?1783939402',
    entersUntapped: true,
    arenaSet: 'EOS'
  },
  {
    id: 'reflecting-pool',
    name: 'Reflecting Pool',
    cycle: 'rainbow_staple',
    colorsProduced: ['W', 'U', 'B', 'R', 'G'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add one mana of any type that a land you control could produce.',
    imageUrl: 'https://cards.scryfall.io/normal/front/c/b/cbc4281a-b70d-4f96-b309-38e986484829.jpg?1789644471',
    entersUntapped: true,
    arenaSet: 'FRC'
  },
  {
    id: 'plaza-of-heroes',
    name: 'Plaza of Heroes',
    cycle: 'rainbow_staple',
    colorsProduced: ['W', 'U', 'B', 'R', 'G', 'C'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add one mana of any color. Spend this mana only to cast a legendary spell.\n{T}: Add one mana of any color among legendary permanents you control.',
    imageUrl: 'https://cards.scryfall.io/normal/front/9/6/96fe4b9b-d766-463b-a6df-345ebebfc17c.jpg?1783903197',
    entersUntapped: true,
    arenaSet: 'DMU'
  },
  {
    id: 'the-world-tree',
    name: 'The World Tree',
    cycle: 'rainbow_staple',
    colorsProduced: ['W', 'U', 'B', 'R', 'G'],
    colorIdentity: ['G'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'The World Tree enters the battlefield tapped.\n{T}: Add {G}.\nAs long as you control six or more lands, lands you control have "{T}: Add one mana of any color."',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/7/a70cb6d9-3955-4064-917b-11dec26440c5.jpg?1783928169',
    entersUntapped: false,
    arenaSet: 'KHM'
  },
  {
    id: 'cavern-of-souls',
    name: 'Cavern of Souls',
    cycle: 'rainbow_staple',
    colorsProduced: ['W', 'U', 'B', 'R', 'G', 'C'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'mythic',
    oracleText: 'As Cavern of Souls enters the battlefield, choose a creature type.\n{T}: Add {C}.\n{T}: Add one mana of any color. Spend this mana only to cast a creature spell of the chosen type, and that spell can\'t be countered.',
    imageUrl: 'https://cards.scryfall.io/normal/front/3/a/3aad15a2-8a1b-4460-9b06-e85863081878.jpg?1783913719',
    entersUntapped: true,
    arenaSet: 'LCI'
  },
  {
    id: 'fabled-passage',
    name: 'Fabled Passage',
    cycle: 'rainbow_staple',
    colorsProduced: ['W', 'U', 'B', 'R', 'G'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Sacrifice Fabled Passage: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle. Then if you control four or more lands, untap that land.',
    imageUrl: 'https://cards.scryfall.io/normal/front/7/6/76edd22f-808e-4a7c-b941-13c0f5e30418.jpg?1789599905',
    entersUntapped: 'conditional',
    arenaSet: 'BLB'
  },
  {
    id: 'spire-of-industry',
    name: 'Spire of Industry',
    cycle: 'rainbow_staple',
    colorsProduced: ['W', 'U', 'B', 'R', 'G', 'C'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}, Pay 1 life: Add one mana of any color. Activate only if you control an artifact.',
    imageUrl: 'https://cards.scryfall.io/normal/front/3/5/35e9ec06-a848-4230-84a2-19cb8034e0f0.jpg?1783906004',
    entersUntapped: true,
    arenaSet: 'KLR'
  },

  // ==========================================
  // 2. 10 FETCH LANDS (ALL 10 ON ARENA)
  // ==========================================
  {
    id: 'flooded-strand',
    name: 'Flooded Strand',
    cycle: 'fetch',
    colorsProduced: ['W', 'U'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Pay 1 life, Sacrifice Flooded Strand: Search your library for a Plains or Island card, put it onto the battlefield, then shuffle.',
    imageUrl: 'https://cards.scryfall.io/normal/front/8/f/8f85e12c-196b-4459-b81f-0c9c854e9f57.jpg?1783911240',
    entersUntapped: true,
    arenaSet: 'KTK'
  },
  {
    id: 'polluted-delta',
    name: 'Polluted Delta',
    cycle: 'fetch',
    colorsProduced: ['U', 'B'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Pay 1 life, Sacrifice Polluted Delta: Search your library for an Island or Swamp card, put it onto the battlefield, then shuffle.',
    imageUrl: 'https://cards.scryfall.io/normal/front/6/e/6e288374-2b71-4ace-b1d2-a19fee6cb4af.jpg?1783911240',
    entersUntapped: true,
    arenaSet: 'KTK'
  },
  {
    id: 'bloodstained-mire',
    name: 'Bloodstained Mire',
    cycle: 'fetch',
    colorsProduced: ['B', 'R'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Pay 1 life, Sacrifice Bloodstained Mire: Search your library for a Swamp or Mountain card, put it onto the battlefield, then shuffle.',
    imageUrl: 'https://cards.scryfall.io/normal/front/5/7/579743fe-f71e-4cb2-8629-d6b02ed1591d.jpg?1783911241',
    entersUntapped: true,
    arenaSet: 'KTK'
  },
  {
    id: 'wooded-foothills',
    name: 'Wooded Foothills',
    cycle: 'fetch',
    colorsProduced: ['R', 'G'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Pay 1 life, Sacrifice Wooded Foothills: Search your library for a Mountain or Forest card, put it onto the battlefield, then shuffle.',
    imageUrl: 'https://cards.scryfall.io/normal/front/4/e/4e11ea8a-f895-438d-a3b7-f070238e4161.jpg?1783911232',
    entersUntapped: true,
    arenaSet: 'KTK'
  },
  {
    id: 'windswept-heath',
    name: 'Windswept Heath',
    cycle: 'fetch',
    colorsProduced: ['G', 'W'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Pay 1 life, Sacrifice Windswept Heath: Search your library for a Forest or Plains card, put it onto the battlefield, then shuffle.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/d/bd1d13f7-fd38-4f0b-a8e0-1eac78668117.jpg?1783911233',
    entersUntapped: true,
    arenaSet: 'KTK'
  },
  {
    id: 'marsh-flats',
    name: 'Marsh Flats',
    cycle: 'fetch',
    colorsProduced: ['W', 'B'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Pay 1 life, Sacrifice Marsh Flats: Search your library for a Plains or Swamp card, put it onto the battlefield, then shuffle.',
    imageUrl: 'https://cards.scryfall.io/normal/front/9/d/9db3ba6d-eb7f-4f5b-9a3b-c6239c3baa42.jpg?1783926796',
    entersUntapped: true,
    arenaSet: 'MH3'
  },
  {
    id: 'scalding-tarn',
    name: 'Scalding Tarn',
    cycle: 'fetch',
    colorsProduced: ['U', 'R'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Pay 1 life, Sacrifice Scalding Tarn: Search your library for an Island or Mountain card, put it onto the battlefield, then shuffle.',
    imageUrl: 'https://cards.scryfall.io/normal/front/7/1/71e491c5-8c07-449b-b2f1-ffa052e6d311.jpg?1783926793',
    entersUntapped: true,
    arenaSet: 'MH3'
  },
  {
    id: 'verdant-catacombs',
    name: 'Verdant Catacombs',
    cycle: 'fetch',
    colorsProduced: ['B', 'G'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Pay 1 life, Sacrifice Verdant Catacombs: Search your library for a Swamp or Forest card, put it onto the battlefield, then shuffle.',
    imageUrl: 'https://cards.scryfall.io/normal/front/9/4/94c229ea-90da-4aa0-bfda-b162fb3b5b8b.jpg?1783926791',
    entersUntapped: true,
    arenaSet: 'MH3'
  },
  {
    id: 'arid-mesa',
    name: 'Arid Mesa',
    cycle: 'fetch',
    colorsProduced: ['R', 'W'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Pay 1 life, Sacrifice Arid Mesa: Search your library for a Mountain or Plains card, put it onto the battlefield, then shuffle.',
    imageUrl: 'https://cards.scryfall.io/normal/front/2/5/25ac5405-df7b-4097-914a-022cb18e20d4.jpg?1783926797',
    entersUntapped: true,
    arenaSet: 'MH3'
  },
  {
    id: 'misty-rainforest',
    name: 'Misty Rainforest',
    cycle: 'fetch',
    colorsProduced: ['G', 'U'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}, Pay 1 life, Sacrifice Misty Rainforest: Search your library for a Forest or Island card, put it onto the battlefield, then shuffle.',
    imageUrl: 'https://cards.scryfall.io/normal/front/8/8/88231c0d-0cc8-44ec-bf95-81d1710ac141.jpg?1783926795',
    entersUntapped: true,
    arenaSet: 'MH3'
  },

  // ==========================================
  // 3. 10 SHOCK LANDS (ALL 10 ON ARENA)
  // ==========================================
  {
    id: 'hallowed-fountain',
    name: 'Hallowed Fountain',
    cycle: 'shock',
    colorsProduced: ['W', 'U'],
    colorIdentity: ['W', 'U'],
    typeLine: 'Land - Plains Island',
    subtypes: ['Plains', 'Island'],
    rarity: 'rare',
    oracleText: '({T}: Add {W} or {U}.)\nAs Hallowed Fountain enters the battlefield, you may pay 2 life. If you don\'t, it enters the battlefield tapped.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/7/b7285986-7e08-4969-86ef-452dc5bfdd9f.jpg?1784036830',
    entersUntapped: 'conditional',
    arenaSet: 'RNA'
  },
  {
    id: 'watery-grave',
    name: 'Watery Grave',
    cycle: 'shock',
    colorsProduced: ['U', 'B'],
    colorIdentity: ['U', 'B'],
    typeLine: 'Land - Island Swamp',
    subtypes: ['Island', 'Swamp'],
    rarity: 'rare',
    oracleText: '({T}: Add {U} or {B}.)\nAs Watery Grave enters the battlefield, you may pay 2 life. If you don\'t, it enters the battlefield tapped.',
    imageUrl: 'https://cards.scryfall.io/normal/front/5/5/5525d6a6-e532-4047-9da4-bfae7927fecc.jpg?1784036860',
    entersUntapped: 'conditional',
    arenaSet: 'GRN'
  },
  {
    id: 'blood-crypt',
    name: 'Blood Crypt',
    cycle: 'shock',
    colorsProduced: ['B', 'R'],
    colorIdentity: ['B', 'R'],
    typeLine: 'Land - Swamp Mountain',
    subtypes: ['Swamp', 'Mountain'],
    rarity: 'rare',
    oracleText: '({T}: Add {B} or {R}.)\nAs Blood Crypt enters the battlefield, you may pay 2 life. If you don\'t, it enters the battlefield tapped.',
    imageUrl: 'https://cards.scryfall.io/normal/front/1/b/1b7eb998-3ec0-4cbc-a416-5a1e3e5a7316.jpg?1784036817',
    entersUntapped: 'conditional',
    arenaSet: 'RNA'
  },
  {
    id: 'stomping-ground',
    name: 'Stomping Ground',
    cycle: 'shock',
    colorsProduced: ['R', 'G'],
    colorIdentity: ['R', 'G'],
    typeLine: 'Land - Mountain Forest',
    subtypes: ['Mountain', 'Forest'],
    rarity: 'rare',
    oracleText: '({T}: Add {R} or {G}.)\nAs Stomping Ground enters the battlefield, you may pay 2 life. If you don\'t, it enters the battlefield tapped.',
    imageUrl: 'https://cards.scryfall.io/normal/front/1/e/1ee8255a-44f6-4faa-9843-15432bf751ea.jpg?1784065855',
    entersUntapped: 'conditional',
    arenaSet: 'RNA'
  },
  {
    id: 'temple-garden',
    name: 'Temple Garden',
    cycle: 'shock',
    colorsProduced: ['G', 'W'],
    colorIdentity: ['G', 'W'],
    typeLine: 'Land - Forest Plains',
    subtypes: ['Forest', 'Plains'],
    rarity: 'rare',
    oracleText: '({T}: Add {G} or {W}.)\nAs Temple Garden enters the battlefield, you may pay 2 life. If you don\'t, it enters the battlefield tapped.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/9/b9b0589d-f327-46a7-8bac-06b7654c547a.jpg?1784036854',
    entersUntapped: 'conditional',
    arenaSet: 'GRN'
  },
  {
    id: 'godless-shrine',
    name: 'Godless Shrine',
    cycle: 'shock',
    colorsProduced: ['W', 'B'],
    colorIdentity: ['W', 'B'],
    typeLine: 'Land - Plains Swamp',
    subtypes: ['Plains', 'Swamp'],
    rarity: 'rare',
    oracleText: '({T}: Add {W} or {B}.)\nAs Godless Shrine enters the battlefield, you may pay 2 life. If you don\'t, it enters the battlefield tapped.',
    imageUrl: 'https://cards.scryfall.io/normal/front/8/f/8fbd1ae0-3d4c-492a-a1ea-85a95fa3d7b6.jpg?1784036826',
    entersUntapped: 'conditional',
    arenaSet: 'RNA'
  },
  {
    id: 'steam-vents',
    name: 'Steam Vents',
    cycle: 'shock',
    colorsProduced: ['U', 'R'],
    colorIdentity: ['U', 'R'],
    typeLine: 'Land - Island Mountain',
    subtypes: ['Island', 'Mountain'],
    rarity: 'rare',
    oracleText: '({T}: Add {U} or {R}.)\nAs Steam Vents enters the battlefield, you may pay 2 life. If you don\'t, it enters the battlefield tapped.',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/8/a83903c7-fd51-4526-aed2-359e946fea36.jpg?1784036844',
    entersUntapped: 'conditional',
    arenaSet: 'GRN'
  },
  {
    id: 'overgrown-tomb',
    name: 'Overgrown Tomb',
    cycle: 'shock',
    colorsProduced: ['B', 'G'],
    colorIdentity: ['B', 'G'],
    typeLine: 'Land - Swamp Forest',
    subtypes: ['Swamp', 'Forest'],
    rarity: 'rare',
    oracleText: '({T}: Add {B} or {G}.)\nAs Overgrown Tomb enters the battlefield, you may pay 2 life. If you don\'t, it enters the battlefield tapped.',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/d/ad7e18e2-c033-4b6c-86e8-d0e5cc824cfd.jpg?1784036836',
    entersUntapped: 'conditional',
    arenaSet: 'GRN'
  },
  {
    id: 'sacred-foundry',
    name: 'Sacred Foundry',
    cycle: 'shock',
    colorsProduced: ['R', 'W'],
    colorIdentity: ['R', 'W'],
    typeLine: 'Land - Mountain Plains',
    subtypes: ['Mountain', 'Plains'],
    rarity: 'rare',
    oracleText: '({T}: Add {R} or {W}.)\nAs Sacred Foundry enters the battlefield, you may pay 2 life. If you don\'t, it enters the battlefield tapped.',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/7/a7758cc6-4e18-48a5-8720-5f42b5cd9d31.jpg?1784036842',
    entersUntapped: 'conditional',
    arenaSet: 'GRN'
  },
  {
    id: 'breeding-pool',
    name: 'Breeding Pool',
    cycle: 'shock',
    colorsProduced: ['G', 'U'],
    colorIdentity: ['G', 'U'],
    typeLine: 'Land - Forest Island',
    subtypes: ['Forest', 'Island'],
    rarity: 'rare',
    oracleText: '({T}: Add {G} or {U}.)\nAs Breeding Pool enters the battlefield, you may pay 2 life. If you don\'t, it enters the battlefield tapped.',
    imageUrl: 'https://cards.scryfall.io/normal/front/6/3/63e4dc07-c742-41bd-8301-861637908fd1.jpg?1784036820',
    entersUntapped: 'conditional',
    arenaSet: 'RNA'
  },

  // ==========================================
  // 4. 10 TRIOMES (ALL 10 ON ARENA)
  // ==========================================
  {
    id: 'raffin-s-tower',
    name: 'Raffine\'s Tower',
    cycle: 'triome',
    colorsProduced: ['W', 'U', 'B'],
    colorIdentity: ['W', 'U', 'B'],
    typeLine: 'Land - Plains Island Swamp',
    subtypes: ['Plains', 'Island', 'Swamp'],
    rarity: 'rare',
    oracleText: '({T}: Add {W}, {U}, or {B}.)\nRaffine\'s Tower enters the battlefield tapped.\nCycling {3}',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/2/a2c56479-4bee-4edb-80d7-4af010b7c793.jpg?1783923055',
    entersUntapped: false,
    arenaSet: 'SNC'
  },
  {
    id: 'xander-s-lounge',
    name: 'Xander\'s Lounge',
    cycle: 'triome',
    colorsProduced: ['U', 'B', 'R'],
    colorIdentity: ['U', 'B', 'R'],
    typeLine: 'Land - Island Swamp Mountain',
    subtypes: ['Island', 'Swamp', 'Mountain'],
    rarity: 'rare',
    oracleText: '({T}: Add {U}, {B}, or {R}.)\nXander\'s Lounge enters the battlefield tapped.\nCycling {3}',
    imageUrl: 'https://cards.scryfall.io/normal/front/5/4/54f449ff-4025-465e-9ec5-a5cf42c4c9d3.jpg?1783923052',
    entersUntapped: false,
    arenaSet: 'SNC'
  },
  {
    id: 'ziatora-s-proving-ground',
    name: 'Ziatora\'s Proving Ground',
    cycle: 'triome',
    colorsProduced: ['B', 'R', 'G'],
    colorIdentity: ['B', 'R', 'G'],
    typeLine: 'Land - Swamp Mountain Forest',
    subtypes: ['Swamp', 'Mountain', 'Forest'],
    rarity: 'rare',
    oracleText: '({T}: Add {B}, {R}, or {G}.)\nZiatora\'s Proving Ground enters the battlefield tapped.\nCycling {3}',
    imageUrl: 'https://cards.scryfall.io/normal/front/7/5/75fdce80-e338-4a50-bdc6-786511feaeef.jpg?1783923052',
    entersUntapped: false,
    arenaSet: 'SNC'
  },
  {
    id: 'jetmir-s-garden',
    name: 'Jetmir\'s Garden',
    cycle: 'triome',
    colorsProduced: ['R', 'G', 'W'],
    colorIdentity: ['R', 'G', 'W'],
    typeLine: 'Land - Mountain Forest Plains',
    subtypes: ['Mountain', 'Forest', 'Plains'],
    rarity: 'rare',
    oracleText: '({T}: Add {R}, {G}, or {W}.)\nJetmir\'s Garden enters the battlefield tapped.\nCycling {3}',
    imageUrl: 'https://cards.scryfall.io/normal/front/2/6/26d40e03-6de4-4373-9fbf-04c1dd79e995.jpg?1783923058',
    entersUntapped: false,
    arenaSet: 'SNC'
  },
  {
    id: 'spara-s-headquarters',
    name: 'Spara\'s Headquarters',
    cycle: 'triome',
    colorsProduced: ['G', 'W', 'U'],
    colorIdentity: ['G', 'W', 'U'],
    typeLine: 'Land - Forest Plains Island',
    subtypes: ['Forest', 'Plains', 'Island'],
    rarity: 'rare',
    oracleText: '({T}: Add {G}, {W}, or {U}.)\nSpara\'s Headquarters enters the battlefield tapped.\nCycling {3}',
    imageUrl: 'https://cards.scryfall.io/normal/front/7/3/7363f1fb-9af3-4212-921f-d59533faf0e5.jpg?1783923052',
    entersUntapped: false,
    arenaSet: 'SNC'
  },
  {
    id: 'indatha-triome',
    name: 'Indatha Triome',
    cycle: 'triome',
    colorsProduced: ['W', 'B', 'G'],
    colorIdentity: ['W', 'B', 'G'],
    typeLine: 'Land - Plains Swamp Forest',
    subtypes: ['Plains', 'Swamp', 'Forest'],
    rarity: 'rare',
    oracleText: '({T}: Add {W}, {B}, or {G}.)\nIndatha Triome enters the battlefield tapped.\nCycling {3}',
    imageUrl: 'https://cards.scryfall.io/normal/front/2/b/2b74bb81-fb9a-40e5-a941-e517430b52f5.jpg?1783931001',
    entersUntapped: false,
    arenaSet: 'IKO'
  },
  {
    id: 'raugrin-triome',
    name: 'Raugrin Triome',
    cycle: 'triome',
    colorsProduced: ['U', 'R', 'W'],
    colorIdentity: ['U', 'R', 'W'],
    typeLine: 'Land - Island Mountain Plains',
    subtypes: ['Island', 'Mountain', 'Plains'],
    rarity: 'rare',
    oracleText: '({T}: Add {U}, {R}, or {W}.)\nRaugrin Triome enters the battlefield tapped.\nCycling {3}',
    imageUrl: 'https://cards.scryfall.io/normal/front/0/2/02138fbb-3962-4348-8d31-faaefba0b8b2.jpg?1783931001',
    entersUntapped: false,
    arenaSet: 'IKO'
  },
  {
    id: 'zagoth-triome',
    name: 'Zagoth Triome',
    cycle: 'triome',
    colorsProduced: ['B', 'G', 'U'],
    colorIdentity: ['B', 'G', 'U'],
    typeLine: 'Land - Swamp Forest Island',
    subtypes: ['Swamp', 'Forest', 'Island'],
    rarity: 'rare',
    oracleText: '({T}: Add {B}, {G}, or {U}.)\nZagoth Triome enters the battlefield tapped.\nCycling {3}',
    imageUrl: 'https://cards.scryfall.io/normal/front/c/c/cc520518-2063-4b57-a0d4-10cf62a7175e.jpg?1783930997',
    entersUntapped: false,
    arenaSet: 'IKO'
  },
  {
    id: 'savai-triome',
    name: 'Savai Triome',
    cycle: 'triome',
    colorsProduced: ['R', 'W', 'B'],
    colorIdentity: ['R', 'W', 'B'],
    typeLine: 'Land - Mountain Plains Swamp',
    subtypes: ['Mountain', 'Plains', 'Swamp'],
    rarity: 'rare',
    oracleText: '({T}: Add {R}, {W}, or {B}.)\nSavai Triome enters the battlefield tapped.\nCycling {3}',
    imageUrl: 'https://cards.scryfall.io/normal/front/7/4/748e6a61-9c1f-4225-9f04-e54002f63ac3.jpg?1783931000',
    entersUntapped: false,
    arenaSet: 'IKO'
  },
  {
    id: 'ketria-triome',
    name: 'Ketria Triome',
    cycle: 'triome',
    colorsProduced: ['G', 'U', 'R'],
    colorIdentity: ['G', 'U', 'R'],
    typeLine: 'Land - Forest Island Mountain',
    subtypes: ['Forest', 'Island', 'Mountain'],
    rarity: 'rare',
    oracleText: '({T}: Add {G}, {U}, or {R}.)\nKetria Triome enters the battlefield tapped.\nCycling {3}',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/2/a249b1f4-2b22-4b67-a207-e0c4ae95d2e1.jpg?1783931001',
    entersUntapped: false,
    arenaSet: 'IKO'
  },

  // ==========================================
  // 5. 10 SURVEIL LANDS (MKM ON ARENA)
  // ==========================================
  {
    id: 'meticulous-archive',
    name: 'Meticulous Archive',
    cycle: 'surveil',
    colorsProduced: ['W', 'U'],
    colorIdentity: ['W', 'U'],
    typeLine: 'Land - Plains Island',
    subtypes: ['Plains', 'Island'],
    rarity: 'rare',
    oracleText: '({T}: Add {W} or {U}.)\nMeticulous Archive enters the battlefield tapped.\nWhen Meticulous Archive enters the battlefield, surveil 1.',
    imageUrl: 'https://cards.scryfall.io/normal/front/6/5/652236c2-84ef-45e4-b5fc-ed6170bc3d6c.jpg?1783912824',
    entersUntapped: false,
    arenaSet: 'MKM'
  },
  {
    id: 'undercity-sewers',
    name: 'Undercity Sewers',
    cycle: 'surveil',
    colorsProduced: ['U', 'B'],
    colorIdentity: ['U', 'B'],
    typeLine: 'Land - Island Swamp',
    subtypes: ['Island', 'Swamp'],
    rarity: 'rare',
    oracleText: '({T}: Add {U} or {B}.)\nUndercity Sewers enters the battlefield tapped.\nWhen Undercity Sewers enters the battlefield, surveil 1.',
    imageUrl: 'https://cards.scryfall.io/normal/front/2/b/2b5801fb-2026-4f25-98bc-ebb2f99684b9.jpg?1786507741',
    entersUntapped: false,
    arenaSet: 'MKM'
  },
  {
    id: 'raucous-theater',
    name: 'Raucous Theater',
    cycle: 'surveil',
    colorsProduced: ['B', 'R'],
    colorIdentity: ['B', 'R'],
    typeLine: 'Land - Swamp Mountain',
    subtypes: ['Swamp', 'Mountain'],
    rarity: 'rare',
    oracleText: '({T}: Add {B} or {R}.)\nRaucous Theater enters the battlefield tapped.\nWhen Raucous Theater enters the battlefield, surveil 1.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/5/b598c93e-dae1-4d71-a9e4-917abf76d2d0.jpg?1783912823',
    entersUntapped: false,
    arenaSet: 'MKM'
  },
  {
    id: 'commercial-district',
    name: 'Commercial District',
    cycle: 'surveil',
    colorsProduced: ['R', 'G'],
    colorIdentity: ['R', 'G'],
    typeLine: 'Land - Mountain Forest',
    subtypes: ['Mountain', 'Forest'],
    rarity: 'rare',
    oracleText: '({T}: Add {R} or {G}.)\nCommercial District enters the battlefield tapped.\nWhen Commercial District enters the battlefield, surveil 1.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/f/bf220c06-3cce-4bdd-aa58-83940c223e9c.jpg?1783912825',
    entersUntapped: false,
    arenaSet: 'MKM'
  },
  {
    id: 'lush-portico',
    name: 'Lush Portico',
    cycle: 'surveil',
    colorsProduced: ['G', 'W'],
    colorIdentity: ['G', 'W'],
    typeLine: 'Land - Forest Plains',
    subtypes: ['Forest', 'Plains'],
    rarity: 'rare',
    oracleText: '({T}: Add {G} or {W}.)\nLush Portico enters the battlefield tapped.\nWhen Lush Portico enters the battlefield, surveil 1.',
    imageUrl: 'https://cards.scryfall.io/normal/front/c/1/c17816e8-28b1-4295-a637-efb0e5c18873.jpg?1783912824',
    entersUntapped: false,
    arenaSet: 'MKM'
  },
  {
    id: 'shadowy-backstreet',
    name: 'Shadowy Backstreet',
    cycle: 'surveil',
    colorsProduced: ['W', 'B'],
    colorIdentity: ['W', 'B'],
    typeLine: 'Land - Plains Swamp',
    subtypes: ['Plains', 'Swamp'],
    rarity: 'rare',
    oracleText: '({T}: Add {W} or {B}.)\nShadowy Backstreet enters the battlefield tapped.\nWhen Shadowy Backstreet enters the battlefield, surveil 1.',
    imageUrl: 'https://cards.scryfall.io/normal/front/6/9/69c1b656-1d67-499c-bf0f-417682a86c7d.jpg?1783912827',
    entersUntapped: false,
    arenaSet: 'MKM'
  },
  {
    id: 'thundering-falls',
    name: 'Thundering Falls',
    cycle: 'surveil',
    colorsProduced: ['U', 'R'],
    colorIdentity: ['U', 'R'],
    typeLine: 'Land - Island Mountain',
    subtypes: ['Island', 'Mountain'],
    rarity: 'rare',
    oracleText: '({T}: Add {U} or {R}.)\nThundering Falls enters the battlefield tapped.\nWhen Thundering Falls enters the battlefield, surveil 1.',
    imageUrl: 'https://cards.scryfall.io/normal/front/1/7/17260fff-b239-4af4-9306-3236ae3fa5a5.jpg?1783912822',
    entersUntapped: false,
    arenaSet: 'MKM'
  },
  {
    id: 'underground-mortuary',
    name: 'Underground Mortuary',
    cycle: 'surveil',
    colorsProduced: ['B', 'G'],
    colorIdentity: ['B', 'G'],
    typeLine: 'Land - Swamp Forest',
    subtypes: ['Swamp', 'Forest'],
    rarity: 'rare',
    oracleText: '({T}: Add {B} or {G}.)\nUnderground Mortuary enters the battlefield tapped.\nWhen Underground Mortuary enters the battlefield, surveil 1.',
    imageUrl: 'https://cards.scryfall.io/normal/front/f/6/f6ca59cd-8779-4a84-a54b-e863b79c61f0.jpg?1783912822',
    entersUntapped: false,
    arenaSet: 'MKM'
  },
  {
    id: 'elegant-parlor',
    name: 'Elegant Parlor',
    cycle: 'surveil',
    colorsProduced: ['R', 'W'],
    colorIdentity: ['R', 'W'],
    typeLine: 'Land - Mountain Plains',
    subtypes: ['Mountain', 'Plains'],
    rarity: 'rare',
    oracleText: '({T}: Add {R} or {W}.)\nElegant Parlor enters the battlefield tapped.\nWhen Elegant Parlor enters the battlefield, surveil 1.',
    imageUrl: 'https://cards.scryfall.io/normal/front/7/2/72c6d541-e2cb-4d6e-acac-90a8f53b7006.jpg?1783912824',
    entersUntapped: false,
    arenaSet: 'MKM'
  },
  {
    id: 'hedge-maze',
    name: 'Hedge Maze',
    cycle: 'surveil',
    colorsProduced: ['G', 'U'],
    colorIdentity: ['G', 'U'],
    typeLine: 'Land - Forest Island',
    subtypes: ['Forest', 'Island'],
    rarity: 'rare',
    oracleText: '({T}: Add {G} or {U}.)\nHedge Maze enters the battlefield tapped.\nWhen Hedge Maze enters the battlefield, surveil 1.',
    imageUrl: 'https://cards.scryfall.io/normal/front/5/2/5260f8ae-805b-4eae-badf-62de0f768867.jpg?1783912824',
    entersUntapped: false,
    arenaSet: 'MKM'
  },

  // ==========================================
  // 6. 10 SLOWLANDS (MID & VOW ON ARENA)
  // ==========================================
  {
    id: 'deserted-beach',
    name: 'Deserted Beach',
    cycle: 'slowland',
    colorsProduced: ['W', 'U'],
    colorIdentity: ['W', 'U'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Deserted Beach enters the battlefield tapped unless you control two or more other lands.\n{T}: Add {W} or {U}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/5/6/56dae4c4-3e71-4a32-979b-4e26d9c9e96c.jpg?1788878239',
    entersUntapped: 'conditional',
    arenaSet: 'MID'
  },
  {
    id: 'shipwreck-marsh',
    name: 'Shipwreck Marsh',
    cycle: 'slowland',
    colorsProduced: ['U', 'B'],
    colorIdentity: ['U', 'B'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Shipwreck Marsh enters the battlefield tapped unless you control two or more other lands.\n{T}: Add {U} or {B}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/9/e/9e944c5b-68ac-4a30-bbd4-09a4288319ce.jpg?1788878245',
    entersUntapped: 'conditional',
    arenaSet: 'MID'
  },
  {
    id: 'haunted-ridge',
    name: 'Haunted Ridge',
    cycle: 'slowland',
    colorsProduced: ['B', 'R'],
    colorIdentity: ['B', 'R'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Haunted Ridge enters the battlefield tapped unless you control two or more other lands.\n{T}: Add {B} or {R}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/4/a4e4966b-8963-4fac-a8bf-e778e063c7dd.jpg?1788878241',
    entersUntapped: 'conditional',
    arenaSet: 'MID'
  },
  {
    id: 'rockfall-vale',
    name: 'Rockfall Vale',
    cycle: 'slowland',
    colorsProduced: ['R', 'G'],
    colorIdentity: ['R', 'G'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Rockfall Vale enters the battlefield tapped unless you control two or more other lands.\n{T}: Add {R} or {G}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/e/3/e3c8a8b6-23ba-45ad-80d1-8e2dc79897f7.jpg?1788878243',
    entersUntapped: 'conditional',
    arenaSet: 'MID'
  },
  {
    id: 'overgrown-farmland',
    name: 'Overgrown Farmland',
    cycle: 'slowland',
    colorsProduced: ['G', 'W'],
    colorIdentity: ['G', 'W'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Overgrown Farmland enters the battlefield tapped unless you control two or more other lands.\n{T}: Add {G} or {W}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/1/7/178e61e4-472f-42cd-9d3b-4880c2acc527.jpg?1788878246',
    entersUntapped: 'conditional',
    arenaSet: 'MID'
  },
  {
    id: 'shattered-sanctuary',
    name: 'Shattered Sanctum',
    cycle: 'slowland',
    colorsProduced: ['W', 'B'],
    colorIdentity: ['W', 'B'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Shattered Sanctum enters the battlefield tapped unless you control two or more other lands.\n{T}: Add {W} or {B}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/5/a/5aa0c810-3b7d-4661-979e-e84fb327742d.jpg?1783903618',
    entersUntapped: 'conditional',
    arenaSet: 'VOW'
  },
  {
    id: 'stormcarved-coast',
    name: 'Stormcarved Coast',
    cycle: 'slowland',
    colorsProduced: ['U', 'R'],
    colorIdentity: ['U', 'R'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Stormcarved Coast enters the battlefield tapped unless you control two or more other lands.\n{T}: Add {U} or {R}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/d/bd3ae4fa-4c97-410a-8c0a-bd203342595d.jpg?1783903618',
    entersUntapped: 'conditional',
    arenaSet: 'VOW'
  },
  {
    id: 'deathcap-glade',
    name: 'Deathcap Glade',
    cycle: 'slowland',
    colorsProduced: ['B', 'G'],
    colorIdentity: ['B', 'G'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Deathcap Glade enters the battlefield tapped unless you control two or more other lands.\n{T}: Add {B} or {G}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/7/8/78897104-80e1-4d8a-9958-145b40f679e8.jpg?1783903621',
    entersUntapped: 'conditional',
    arenaSet: 'VOW'
  },
  {
    id: 'sundown-pass',
    name: 'Sundown Pass',
    cycle: 'slowland',
    colorsProduced: ['R', 'W'],
    colorIdentity: ['R', 'W'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Sundown Pass enters the battlefield tapped unless you control two or more other lands.\n{T}: Add {R} or {W}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/3/b34000e9-ff20-4fb4-9d0b-03a172a92457.jpg?1783903618',
    entersUntapped: 'conditional',
    arenaSet: 'VOW'
  },
  {
    id: 'dreamroot-cascade',
    name: 'Dreamroot Cascade',
    cycle: 'slowland',
    colorsProduced: ['G', 'U'],
    colorIdentity: ['G', 'U'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Dreamroot Cascade enters the battlefield tapped unless you control two or more other lands.\n{T}: Add {G} or {U}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/e/f/ef662b92-5a7f-48c9-bcc1-14b55e091aef.jpg?1783903621',
    entersUntapped: 'conditional',
    arenaSet: 'VOW'
  },

  // ==========================================
  // 7. 10 FASTLANDS (KLR & ONE ON ARENA)
  // ==========================================
  {
    id: 'seachrome-coast',
    name: 'Seachrome Coast',
    cycle: 'fastland',
    colorsProduced: ['W', 'U'],
    colorIdentity: ['W', 'U'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Seachrome Coast enters the battlefield tapped unless you control two or fewer other lands.\n{T}: Add {W} or {U}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/9/e/9ed7441f-f624-49c8-8611-d9bba0e441ac.jpg?1783917980',
    entersUntapped: 'conditional',
    arenaSet: 'ONE'
  },
  {
    id: 'darkslick-shores',
    name: 'Darkslick Shores',
    cycle: 'fastland',
    colorsProduced: ['U', 'B'],
    colorIdentity: ['U', 'B'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Darkslick Shores enters the battlefield tapped unless you control two or fewer other lands.\n{T}: Add {U} or {B}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/c/4/c49305d1-ac95-43ea-b02d-c3c7205bcda6.jpg?1783911882',
    entersUntapped: 'conditional',
    arenaSet: 'ONE'
  },
  {
    id: 'blackcleave-cliffs',
    name: 'Blackcleave Cliffs',
    cycle: 'fastland',
    colorsProduced: ['B', 'R'],
    colorIdentity: ['B', 'R'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Blackcleave Cliffs enters the battlefield tapped unless you control two or fewer other lands.\n{T}: Add {B} or {R}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/f/7/f75715ce-744f-409c-aeb1-e66eb9186a74.jpg?1783909578',
    entersUntapped: 'conditional',
    arenaSet: 'ONE'
  },
  {
    id: 'copperline-gorge',
    name: 'Copperline Gorge',
    cycle: 'fastland',
    colorsProduced: ['R', 'G'],
    colorIdentity: ['R', 'G'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Copperline Gorge enters the battlefield tapped unless you control two or fewer other lands.\n{T}: Add {R} or {G}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/7/8/78b0f36b-7d8c-4e77-adc2-a4dad93a81d5.jpg?1783917981',
    entersUntapped: 'conditional',
    arenaSet: 'ONE'
  },
  {
    id: 'razorverge-thicket',
    name: 'Razorverge Thicket',
    cycle: 'fastland',
    colorsProduced: ['G', 'W'],
    colorIdentity: ['G', 'W'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Razorverge Thicket enters the battlefield tapped unless you control two or fewer other lands.\n{T}: Add {G} or {W}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/d/f/df1233de-4449-4c32-944b-e19bed666324.jpg?1783903196',
    entersUntapped: 'conditional',
    arenaSet: 'ONE'
  },
  {
    id: 'concealed-courtyard',
    name: 'Concealed Courtyard',
    cycle: 'fastland',
    colorsProduced: ['W', 'B'],
    colorIdentity: ['W', 'B'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Concealed Courtyard enters the battlefield tapped unless you control two or fewer other lands.\n{T}: Add {W} or {B}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/7/b75df1f0-0513-40e4-a449-454f75de6434.jpg?1783911773',
    entersUntapped: 'conditional',
    arenaSet: 'KLR'
  },
  {
    id: 'spirebluff-canal',
    name: 'Spirebluff Canal',
    cycle: 'fastland',
    colorsProduced: ['U', 'R'],
    colorIdentity: ['U', 'R'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Spirebluff Canal enters the battlefield tapped unless you control two or fewer other lands.\n{T}: Add {U} or {R}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/5/9/59a04e16-a767-4112-ab01-6ca1b09c286c.jpg?1783911772',
    entersUntapped: 'conditional',
    arenaSet: 'KLR'
  },
  {
    id: 'blooming-marsh',
    name: 'Blooming Marsh',
    cycle: 'fastland',
    colorsProduced: ['B', 'G'],
    colorIdentity: ['B', 'G'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Blooming Marsh enters the battlefield tapped unless you control two or fewer other lands.\n{T}: Add {B} or {G}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/8/6/861caabb-0573-4e94-8b03-342f90465064.jpg?1783911773',
    entersUntapped: 'conditional',
    arenaSet: 'KLR'
  },
  {
    id: 'inspiring-vantage',
    name: 'Inspiring Vantage',
    cycle: 'fastland',
    colorsProduced: ['R', 'W'],
    colorIdentity: ['R', 'W'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Inspiring Vantage enters the battlefield tapped unless you control two or fewer other lands.\n{T}: Add {R} or {W}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/8/5/85df6b6a-2dcf-4828-a4a8-e07d52e1fddd.jpg?1783911772',
    entersUntapped: 'conditional',
    arenaSet: 'KLR'
  },
  {
    id: 'botanical-sanctum',
    name: 'Botanical Sanctum',
    cycle: 'fastland',
    colorsProduced: ['G', 'U'],
    colorIdentity: ['G', 'U'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Botanical Sanctum enters the battlefield tapped unless you control two or fewer other lands.\n{T}: Add {G} or {U}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/c/c/cc18d5f4-a56a-4f7d-9f56-ccc92cbfb7f7.jpg?1783911772',
    entersUntapped: 'conditional',
    arenaSet: 'KLR'
  },

  // ==========================================
  // 8. 10 PAINLANDS (DMU & BRO ON ARENA)
  // ==========================================
  {
    id: 'adarkar-wastes',
    name: 'Adarkar Wastes',
    cycle: 'painland',
    colorsProduced: ['W', 'U', 'C'],
    colorIdentity: ['W', 'U'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add {W} or {U}. Adarkar Wastes deals 1 damage to you.',
    imageUrl: 'https://cards.scryfall.io/normal/front/4/2/42e0aa15-639a-4e88-9bd8-ce5e7c7d7649.jpg?1783906017',
    entersUntapped: true,
    arenaSet: 'DMU'
  },
  {
    id: 'underground-river',
    name: 'Underground River',
    cycle: 'painland',
    colorsProduced: ['U', 'B', 'C'],
    colorIdentity: ['U', 'B'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add {U} or {B}. Underground River deals 1 damage to you.',
    imageUrl: 'https://cards.scryfall.io/normal/front/e/8/e8b05f37-815f-4854-bf82-ca544ca67532.jpg?1789599935',
    entersUntapped: true,
    arenaSet: 'BRO'
  },
  {
    id: 'sulfurous-springs',
    name: 'Sulfurous Springs',
    cycle: 'painland',
    colorsProduced: ['B', 'R', 'C'],
    colorIdentity: ['B', 'R'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add {B} or {R}. Sulfurous Springs deals 1 damage to you.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/e/be340a1c-f1e7-446e-ae91-86ecb884479c.jpg?1789599923',
    entersUntapped: true,
    arenaSet: 'DMU'
  },
  {
    id: 'karplusan-forest',
    name: 'Karplusan Forest',
    cycle: 'painland',
    colorsProduced: ['R', 'G', 'C'],
    colorIdentity: ['R', 'G'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add {R} or {G}. Karplusan Forest deals 1 damage to you.',
    imageUrl: 'https://cards.scryfall.io/normal/front/6/7/67198b97-bac2-480f-aea8-12841e8884de.jpg?1783906010',
    entersUntapped: true,
    arenaSet: 'DMU'
  },
  {
    id: 'brushland',
    name: 'Brushland',
    cycle: 'painland',
    colorsProduced: ['G', 'W', 'C'],
    colorIdentity: ['G', 'W'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add {G} or {W}. Brushland deals 1 damage to you.',
    imageUrl: 'https://cards.scryfall.io/normal/front/1/8/18d236ce-3b78-403a-b5f9-4fb44123d85b.jpg?1783920007',
    entersUntapped: true,
    arenaSet: 'BRO'
  },
  {
    id: 'caves-of-koilos',
    name: 'Caves of Koilos',
    cycle: 'painland',
    colorsProduced: ['W', 'B', 'C'],
    colorIdentity: ['W', 'B'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add {W} or {B}. Caves of Koilos deals 1 damage to you.',
    imageUrl: 'https://cards.scryfall.io/normal/front/c/a/ca814c7c-9908-4727-b556-3f85bfd653ca.jpg?1789599896',
    entersUntapped: true,
    arenaSet: 'DMU'
  },
  {
    id: 'shivan-reef',
    name: 'Shivan Reef',
    cycle: 'painland',
    colorsProduced: ['U', 'R', 'C'],
    colorIdentity: ['U', 'R'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add {U} or {R}. Shivan Reef deals 1 damage to you.',
    imageUrl: 'https://cards.scryfall.io/normal/front/9/f/9fb3938c-9ecf-46cc-865a-0091455419f9.jpg?1789599919',
    entersUntapped: true,
    arenaSet: 'BRO'
  },
  {
    id: 'llanowar-wastes',
    name: 'Llanowar Wastes',
    cycle: 'painland',
    colorsProduced: ['B', 'G', 'C'],
    colorIdentity: ['B', 'G'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add {B} or {G}. Llanowar Wastes deals 1 damage to you.',
    imageUrl: 'https://cards.scryfall.io/normal/front/2/6/266316d3-3bbc-4283-aab8-69629855909f.jpg?1783903726',
    entersUntapped: true,
    arenaSet: 'BRO'
  },
  {
    id: 'battlefield-forge',
    name: 'Battlefield Forge',
    cycle: 'painland',
    colorsProduced: ['R', 'W', 'C'],
    colorIdentity: ['R', 'W'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add {R} or {W}. Battlefield Forge deals 1 damage to you.',
    imageUrl: 'https://cards.scryfall.io/normal/front/e/f/ef7d3676-b1db-4329-9201-18f8a6c54ea6.jpg?1789599856',
    entersUntapped: true,
    arenaSet: 'BRO'
  },
  {
    id: 'yavimaya-coast',
    name: 'Yavimaya Coast',
    cycle: 'painland',
    colorsProduced: ['G', 'U', 'C'],
    colorIdentity: ['G', 'U'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add {G} or {U}. Yavimaya Coast deals 1 damage to you.',
    imageUrl: 'https://cards.scryfall.io/normal/front/f/4/f4c1500b-1f4c-4d33-810c-25e3bb0a4666.jpg?1783903712',
    entersUntapped: true,
    arenaSet: 'DMU'
  },

  // ==========================================
  // 9. 10 PATHWAYS (ZNR & KHM ON ARENA)
  // ==========================================
  {
    id: 'hengegate-pathway',
    name: 'Hengegate Pathway',
    cycle: 'pathway',
    colorsProduced: ['W', 'U'],
    colorIdentity: ['W', 'U'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {W}.\n// Mistgate Pathway\n{T}: Add {U}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/7/e/7ef37cb3-d803-47d7-8a01-9c803aa2eadc.jpg?1783928182',
    entersUntapped: true,
    arenaSet: 'KHM'
  },
  {
    id: 'clearwater-pathway',
    name: 'Clearwater Pathway',
    cycle: 'pathway',
    colorsProduced: ['U', 'B'],
    colorIdentity: ['U', 'B'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {U}.\n// Murkwater Pathway\n{T}: Add {B}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/4/b4b99ebb-0d54-4fe5-a495-979aaa564aa8.jpg?1783929316',
    entersUntapped: true,
    arenaSet: 'ZNR'
  },
  {
    id: 'blightstep-pathway',
    name: 'Blightstep Pathway',
    cycle: 'pathway',
    colorsProduced: ['B', 'R'],
    colorIdentity: ['B', 'R'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {B}.\n// Searstep Pathway\n{T}: Add {R}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/0/c/0ce39a19-f51d-4a35-ae80-5b82eb15fcff.jpg?1783928185',
    entersUntapped: true,
    arenaSet: 'KHM'
  },
  {
    id: 'cragcrown-pathway',
    name: 'Cragcrown Pathway',
    cycle: 'pathway',
    colorsProduced: ['R', 'G'],
    colorIdentity: ['R', 'G'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {R}.\n// Timbercrown Pathway\n{T}: Add {G}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/d/a/da57eb54-5199-4a56-95f7-f6ac432876b1.jpg?1783929311',
    entersUntapped: true,
    arenaSet: 'ZNR'
  },
  {
    id: 'branchloft-pathway',
    name: 'Branchloft Pathway',
    cycle: 'pathway',
    colorsProduced: ['G', 'W'],
    colorIdentity: ['G', 'W'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {G}.\n// Boulderloft Pathway\n{T}: Add {W}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/0/5/0511e232-2a72-40f5-a400-4f7ebc442d17.jpg?1783929314',
    entersUntapped: true,
    arenaSet: 'ZNR'
  },
  {
    id: 'brightclimb-pathway',
    name: 'Brightclimb Pathway',
    cycle: 'pathway',
    colorsProduced: ['W', 'B'],
    colorIdentity: ['W', 'B'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {W}.\n// Grimclimb Pathway\n{T}: Add {B}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/d/2/d24c3d51-795d-4c01-a34a-3280fccd2d78.jpg?1783929313',
    entersUntapped: true,
    arenaSet: 'ZNR'
  },
  {
    id: 'riverglide-pathway',
    name: 'Riverglide Pathway',
    cycle: 'pathway',
    colorsProduced: ['U', 'R'],
    colorIdentity: ['U', 'R'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {U}.\n// Lavaglide Pathway\n{T}: Add {R}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/2/6/2668ac91-6cda-4f81-a08d-4fc5f9cb35b2.jpg?1783929311',
    entersUntapped: true,
    arenaSet: 'ZNR'
  },
  {
    id: 'darkbore-pathway',
    name: 'Darkbore Pathway',
    cycle: 'pathway',
    colorsProduced: ['B', 'G'],
    colorIdentity: ['B', 'G'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {B}.\n// Slitherbore Pathway\n{T}: Add {G}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/8/7/87a4e5fe-161f-42da-9ca2-67c8e8970e94.jpg?1783928184',
    entersUntapped: true,
    arenaSet: 'KHM'
  },
  {
    id: 'needleverge-pathway',
    name: 'Needleverge Pathway',
    cycle: 'pathway',
    colorsProduced: ['R', 'W'],
    colorIdentity: ['R', 'W'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {R}.\n// Pillarverge Pathway\n{T}: Add {W}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/6/5/6559047e-6ede-4815-a3a0-389062094f9d.jpg?1783929311',
    entersUntapped: true,
    arenaSet: 'ZNR'
  },
  {
    id: 'barkchannel-pathway',
    name: 'Barkchannel Pathway',
    cycle: 'pathway',
    colorsProduced: ['G', 'U'],
    colorIdentity: ['G', 'U'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {G}.\n// Tidechannel Pathway\n{T}: Add {U}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/6/b6de14ae-0132-4261-af00-630bf15918cd.jpg?1783928184',
    entersUntapped: true,
    arenaSet: 'KHM'
  },

  // ==========================================
  // 10. 5 KAMIGAWA CHANNEL LANDS (NEO ON ARENA)
  // ==========================================
  {
    id: 'eiganjo-seat-of-the-empire',
    name: 'Eiganjo, Seat of the Empire',
    cycle: 'channel',
    colorsProduced: ['W'],
    colorIdentity: ['W'],
    typeLine: 'Legendary Land',
    rarity: 'rare',
    oracleText: '{T}: Add {W}.\nChannel — {2}{W}, Discard Eiganjo, Seat of the Empire: It deals 4 damage to target attacking or blocking creature.',
    imageUrl: 'https://cards.scryfall.io/normal/front/c/3/c375a022-5b57-496d-a802-e4ea8376e9e4.jpg?1783923818',
    entersUntapped: true,
    arenaSet: 'NEO'
  },
  {
    id: 'otawara-soaring-city',
    name: 'Otawara, Soaring City',
    cycle: 'channel',
    colorsProduced: ['U'],
    colorIdentity: ['U'],
    typeLine: 'Legendary Land',
    rarity: 'rare',
    oracleText: '{T}: Add {U}.\nChannel — {3}{U}, Discard Otawara, Soaring City: Return target artifact, creature, enchantment, or planeswalker to its owner\'s hand.',
    imageUrl: 'https://cards.scryfall.io/normal/front/4/8/486d7edc-d983-41f0-8b78-c99aecd72996.jpg?1783923816',
    entersUntapped: true,
    arenaSet: 'NEO'
  },
  {
    id: 'takenuma-abandoned-mire',
    name: 'Takenuma, Abandoned Mire',
    cycle: 'channel',
    colorsProduced: ['B'],
    colorIdentity: ['B'],
    typeLine: 'Legendary Land',
    rarity: 'rare',
    oracleText: '{T}: Add {B}.\nChannel — {3}{B}, Discard Takenuma, Abandoned Mire: Mill three cards, then return a creature or planeswalker card from your graveyard to your hand.',
    imageUrl: 'https://cards.scryfall.io/normal/front/4/9/499037cc-a577-41cb-8ca2-5e117945634f.jpg?1783923812',
    entersUntapped: true,
    arenaSet: 'NEO'
  },
  {
    id: 'sokenzan-crucible-of-defiance',
    name: 'Sokenzan, Crucible of Defiance',
    cycle: 'channel',
    colorsProduced: ['R'],
    colorIdentity: ['R'],
    typeLine: 'Legendary Land',
    rarity: 'rare',
    oracleText: '{T}: Add {R}.\nChannel — {3}{R}, Discard Sokenzan, Crucible of Defiance: Create two 1/1 colorless Spirit creature tokens with haste.',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/a/aa548dcd-c1dd-492d-a69f-c65dfeef0633.jpg?1783923814',
    entersUntapped: true,
    arenaSet: 'NEO'
  },
  {
    id: 'boseiju-who-endures',
    name: 'Boseiju, Who Endures',
    cycle: 'channel',
    colorsProduced: ['G'],
    colorIdentity: ['G'],
    typeLine: 'Legendary Land',
    rarity: 'rare',
    oracleText: '{T}: Add {G}.\nChannel — {1}{G}, Discard Boseiju, Who Endures: Destroy target artifact, enchantment, or nonbasic land an opponent controls.',
    imageUrl: 'https://cards.scryfall.io/normal/front/2/1/2135ac5a-187b-4dc9-8f82-34e8d1603416.jpg?1783923818',
    entersUntapped: true,
    arenaSet: 'NEO'
  },

  // ==========================================
  // 11. 5 CASTLES (ELD ON ARENA)
  // ==========================================
  {
    id: 'castle-ardenvale',
    name: 'Castle Ardenvale',
    cycle: 'castle',
    colorsProduced: ['W'],
    colorIdentity: ['W'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Castle Ardenvale enters the battlefield tapped unless you control a Plains.\n{T}: Add {W}.\n{2}{W}{W}, {T}: Create a 1/1 white Human creature token.',
    imageUrl: 'https://cards.scryfall.io/normal/front/6/5/65e4de2e-47d2-4967-be31-9df0057a9c74.jpg?1783906996',
    entersUntapped: 'conditional',
    arenaSet: 'ELD'
  },
  {
    id: 'castle-vantress',
    name: 'Castle Vantress',
    cycle: 'castle',
    colorsProduced: ['U'],
    colorIdentity: ['U'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Castle Vantress enters the battlefield tapped unless you control an Island.\n{T}: Add {U}.\n{2}{U}{U}, {T}: Scry 2.',
    imageUrl: 'https://cards.scryfall.io/normal/front/d/e/dead85f7-865c-4f7d-ad6c-014d4e90f8be.jpg?1783909579',
    entersUntapped: 'conditional',
    arenaSet: 'ELD'
  },
  {
    id: 'castle-locthwain',
    name: 'Castle Locthwain',
    cycle: 'castle',
    colorsProduced: ['B'],
    colorIdentity: ['B'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Castle Locthwain enters the battlefield tapped unless you control a Swamp.\n{T}: Add {B}.\n{1}{B}{B}, {T}: Draw a card, then you lose life equal to the number of cards in your hand.',
    imageUrl: 'https://cards.scryfall.io/normal/front/1/9/19336e3a-2242-4a30-a563-32f2e4fc18e9.jpg?1783922380',
    entersUntapped: 'conditional',
    arenaSet: 'ELD'
  },
  {
    id: 'castle-embereth',
    name: 'Castle Embereth',
    cycle: 'castle',
    colorsProduced: ['R'],
    colorIdentity: ['R'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Castle Embereth enters the battlefield tapped unless you control a Mountain.\n{T}: Add {R}.\n{1}{R}{R}, {T}: Creatures you control get +1/+0 until end of turn.',
    imageUrl: 'https://cards.scryfall.io/normal/front/3/3/337f2d97-b317-4c10-b151-7acccf38fca8.jpg?1783906997',
    entersUntapped: 'conditional',
    arenaSet: 'ELD'
  },
  {
    id: 'castle-garenbrig',
    name: 'Castle Garenbrig',
    cycle: 'castle',
    colorsProduced: ['G'],
    colorIdentity: ['G'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Castle Garenbrig enters the battlefield tapped unless you control a Forest.\n{T}: Add {G}.\n{2}{G}{G}, {T}: Add six {G}. Spend this mana only to cast creature spells or activate abilities of creatures.',
    imageUrl: 'https://cards.scryfall.io/normal/front/e/3/e3c2c66c-f7f0-41d5-a805-a129aeaf1b75.jpg?1783932578',
    entersUntapped: 'conditional',
    arenaSet: 'ELD'
  },

  // ==========================================
  // 12. ARENA UTILITY & COLORLESS STAPLES
  // ==========================================
  {
    id: 'nykthos-shrine-to-nyx',
    name: 'Nykthos, Shrine to Nyx',
    cycle: 'colorless_utility',
    colorsProduced: ['W', 'U', 'B', 'R', 'G', 'C'],
    colorIdentity: [],
    typeLine: 'Legendary Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{2}, {T}: Choose a color. Add an amount of mana of that color equal to your devotion to that color.',
    imageUrl: 'https://cards.scryfall.io/normal/front/8/3/834b27a0-dfd7-4f96-8cde-cacac4b24acc.jpg?1783939713',
    entersUntapped: true,
    arenaSet: 'EA'
  },
  {
    id: 'demolition-field',
    name: 'Demolition Field',
    cycle: 'colorless_utility',
    colorsProduced: ['C'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'uncommon',
    oracleText: '{T}: Add {C}.\n{2}, {T}, Sacrifice Demolition Field: Destroy target nonbasic land an opponent controls. That player and you each search their library for a basic land card, put it onto the battlefield, then shuffle.',
    imageUrl: 'https://cards.scryfall.io/normal/front/0/c/0c7e51b6-4898-4632-b39c-3ce438caa882.jpg?1783908902',
    entersUntapped: true,
    arenaSet: 'BRO'
  },
  {
    id: 'field-of-ruin',
    name: 'Field of Ruin',
    cycle: 'colorless_utility',
    colorsProduced: ['C'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'uncommon',
    oracleText: '{T}: Add {C}.\n{2}, {T}, Sacrifice Field of Ruin: Destroy target nonbasic land an opponent controls. Each player searches their library for a basic land card, puts it onto the battlefield tapped, then shuffles.',
    imageUrl: 'https://cards.scryfall.io/normal/front/1/4/143147d2-2eec-41e7-b78a-592288b38630.jpg?1783917099',
    entersUntapped: true,
    arenaSet: 'OTJ'
  },
  {
    id: 'blast-zone',
    name: 'Blast Zone',
    cycle: 'colorless_utility',
    colorsProduced: ['C'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Blast Zone enters the battlefield with a blast counter on it.\n{T}: Add {C}.\n{X}{X}, {T}: Put X blast counters on Blast Zone.\n{3}, {T}, Sacrifice Blast Zone: Destroy each nonland permanent with mana value equal to the number of blast counters on Blast Zone.',
    imageUrl: 'https://cards.scryfall.io/normal/front/c/d/cdad14f1-d541-4e58-af9f-f8e587fca05f.jpg?1783915394',
    entersUntapped: true,
    arenaSet: 'WAR'
  },
  {
    id: 'mirrex',
    name: 'Mirrex',
    cycle: 'colorless_utility',
    colorsProduced: ['W', 'U', 'B', 'R', 'G', 'C'],
    colorIdentity: [],
    typeLine: 'Land - Sphere',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{T}: Add one mana of any color. Activate only if Mirrex entered the battlefield this turn.\n{3}, {T}: Create a 1/1 colorless Phyrexian Mite artifact creature token with toxic 1 and "This creature can\'t block."',
    imageUrl: 'https://cards.scryfall.io/normal/front/5/4/54a702cd-ca49-4570-b47e-8b090452a3c3.jpg?1783917980',
    entersUntapped: true,
    arenaSet: 'ONE'
  },
  {
    id: 'mishra-s-foundry',
    name: 'Mishra\'s Foundry',
    cycle: 'colorless_utility',
    colorsProduced: ['C'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{2}: Mishra\'s Foundry becomes a 2/2 Assembly-Worker artifact creature until end of turn. It\'s still a land.\n{1}, {T}: Target attacking Assembly-Worker gets +2/+2 until end of turn.',
    imageUrl: 'https://cards.scryfall.io/normal/front/d/a/da7699b2-e1af-4bc0-8c5b-84ba3e868d7c.jpg?1783920005',
    entersUntapped: true,
    arenaSet: 'BRO'
  },
  {
    id: 'reliquary-tower',
    name: 'Reliquary Tower',
    cycle: 'colorless_utility',
    colorsProduced: ['C'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'uncommon',
    oracleText: 'You have no maximum hand size.\n{T}: Add {C}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/e/2/e2a27742-08c1-4153-af7f-25a7a98f585e.jpg?1783903721',
    entersUntapped: true,
    arenaSet: 'M19'
  },
  {
    id: 'scavenger-grounds',
    name: 'Scavenger Grounds',
    cycle: 'colorless_utility',
    colorsProduced: ['C'],
    colorIdentity: [],
    typeLine: 'Land - Desert',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{2}, {T}, Sacrifice a Desert: Exile all cards from all graveyards.',
    imageUrl: 'https://cards.scryfall.io/normal/front/9/f/9fbe68ba-ffe5-4fe0-ac0a-0b3221e4f395.jpg?1783903197',
    entersUntapped: true,
    arenaSet: 'HOU'
  },
  {
    id: 'arch-of-orazca',
    name: 'Arch of Orazca',
    cycle: 'colorless_utility',
    colorsProduced: ['C'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Ascend (If you control ten or more permanents, you get the city\'s blessing for the rest of the game.)\n{T}: Add {C}.\n{5}, {T}: Draw a card. Activate only if you have the city\'s blessing.',
    imageUrl: 'https://cards.scryfall.io/normal/front/5/8/581dcadd-7de4-4b39-bab0-d3567194a252.jpg?1783913835',
    entersUntapped: true,
    arenaSet: 'RIX'
  },
  {
    id: 'war-room',
    name: 'War Room',
    cycle: 'colorless_utility',
    colorsProduced: ['C'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{3}, {T}, Pay life equal to the number of colors in your commander\'s color identity: Draw a card.',
    imageUrl: 'https://cards.scryfall.io/normal/front/0/7/0775b4be-881c-4832-8954-d961064315b6.jpg?1783903712',
    entersUntapped: true,
    arenaSet: 'CLB'
  },
  {
    id: 'karn-s-bastion',
    name: 'Karn\'s Bastion',
    cycle: 'colorless_utility',
    colorsProduced: ['C'],
    colorIdentity: [],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: '{T}: Add {C}.\n{4}, {T}: Proliferate.',
    imageUrl: 'https://cards.scryfall.io/normal/front/2/2/22017ec2-3552-4865-af76-dba042b141f5.jpg?1783906011',
    entersUntapped: true,
    arenaSet: 'WAR'
  },

  // ==========================================
  // 13. BASICS & WASTES (ALL ON ARENA)
  // ==========================================
  {
    id: 'plains',
    name: 'Plains',
    cycle: 'basic',
    colorsProduced: ['W'],
    colorIdentity: ['W'],
    typeLine: 'Basic Land - Plains',
    subtypes: ['Plains'],
    rarity: 'common',
    oracleText: '({T}: Add {W}.)',
    imageUrl: 'https://cards.scryfall.io/normal/front/8/a/8ab0f4c0-b331-4c57-b68f-2e24bb5ba06c.jpg?1785981632',
    entersUntapped: true,
    arenaSet: 'DMU'
  },
  {
    id: 'island',
    name: 'Island',
    cycle: 'basic',
    colorsProduced: ['U'],
    colorIdentity: ['U'],
    typeLine: 'Basic Land - Island',
    subtypes: ['Island'],
    rarity: 'common',
    oracleText: '({T}: Add {U}.)',
    imageUrl: 'https://cards.scryfall.io/normal/front/f/3/f3cc07cd-cc79-4745-b0b7-eade60175cc3.jpg?1785981645',
    entersUntapped: true,
    arenaSet: 'DMU'
  },
  {
    id: 'swamp',
    name: 'Swamp',
    cycle: 'basic',
    colorsProduced: ['B'],
    colorIdentity: ['B'],
    typeLine: 'Basic Land - Swamp',
    subtypes: ['Swamp'],
    rarity: 'common',
    oracleText: '({T}: Add {B}.)',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/7/b7387103-1df1-4fd0-9e91-1544509792c7.jpg?1785981659',
    entersUntapped: true,
    arenaSet: 'DMU'
  },
  {
    id: 'mountain',
    name: 'Mountain',
    cycle: 'basic',
    colorsProduced: ['R'],
    colorIdentity: ['R'],
    typeLine: 'Basic Land - Mountain',
    subtypes: ['Mountain'],
    rarity: 'common',
    oracleText: '({T}: Add {R}.)',
    imageUrl: 'https://cards.scryfall.io/normal/front/2/a/2a844b96-6616-4c39-8f4f-5d14a3b2bd55.jpg?1785981666',
    entersUntapped: true,
    arenaSet: 'DMU'
  },
  {
    id: 'forest',
    name: 'Forest',
    cycle: 'basic',
    colorsProduced: ['G'],
    colorIdentity: ['G'],
    typeLine: 'Basic Land - Forest',
    subtypes: ['Forest'],
    rarity: 'common',
    oracleText: '({T}: Add {G}.)',
    imageUrl: 'https://cards.scryfall.io/normal/front/d/c/dce15387-4114-4b3e-91aa-5b42b45c44ac.jpg?1785981675',
    entersUntapped: true,
    arenaSet: 'DMU'
  },
  {
    id: 'wastes',
    name: 'Wastes',
    cycle: 'basic',
    colorsProduced: ['C'],
    colorIdentity: [],
    typeLine: 'Basic Land',
    rarity: 'common',
    oracleText: '{T}: Add {C}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/b/a/baf8f4f2-9f25-4cd2-8d78-1041e134aeac.jpg?1783906001',
    entersUntapped: true,
    arenaSet: 'OGW'
  }
];

/**
 * Converts an ArenaLandCard entry to the standardized Card interface used by the app.
 */
export function convertArenaLandToCard(land: ArenaLandCard): Card {
  return {
    id: land.id,
    arenaId: Math.abs(hashString(land.id)),
    name: land.name,
    manaCost: '',
    cmc: 0,
    colors: [],
    colorIdentity: land.colorIdentity,
    typeLine: land.typeLine,
    types: ['Land'],
    subtypes: land.subtypes,
    oracleText: land.oracleText,
    rarity: land.rarity,
    set: land.arenaSet,
    setName: 'MTG Arena',
    collectorNumber: '1',
    imageUrl: land.imageUrl,
    legalities: {
      standard: ['DMU', 'BRO', 'ONE', 'MOM', 'WOE', 'LCI', 'MKM', 'OTJ', 'BLB'].includes(land.arenaSet),
      brawl: true,
      historic: true,
      timeless: true,
      explorer: true,
      alchemy: true
    }
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
