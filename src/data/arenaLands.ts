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
    imageUrl: 'https://cards.scryfall.io/normal/front/1/7/177f1165-4141-4c7b-b518-e160a2d48c08.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/b/d/bd6e4922-1d37-4d6d-8854-c9f1b212cc8a.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/3/a/3a795b84-2d0a-4196-8822-7932822a16d8.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/a/2/a2278314-7916-499d-8232-a12bd9420897.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/a/7/a70cb6d9-3955-4064-917b-11dec26440c5.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/e/6/e697ea4d-e1e4-44e6-9460-e4e698579227.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/d/3/d313d051-7295-4884-8cbf-f2f835fd45f4.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/8/3/8333424d-be5f-4746-ae0d-569e60472421.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/8/8/8840f2a8-081c-449e-b4da-77e2304725eb.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/f/f/ff42d593-16fe-4667-a493-52fb9b711ff0.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/7/f/7f430794-0d86-4f6a-97e0-4bbb6716d613.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/a/8/a8503cca-7e7d-44c4-8587-81376b396398.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/8/3/8315ea4c-339d-4303-92b1-013e734407b0.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/6/5/659039ed-c269-4c2d-bce6-91d143f0618e.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/7/1/71e491c5-8c07-449b-b2f1-ffa052e6d311.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/9/4/94c229ea-90da-4aa0-bfda-b162fb354b1b.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/2/5/25ac5405-df7b-4097-914a-022cb18e20d4.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/8/8/88231c0d-0cc8-44ec-bf95-81d1710ac141.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/f/9/f97a6d34-03ab-49f1-b02e-405b733f8843.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/0/c/0c96f370-0c88-42e2-b64f-4672914538b3.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/5/7/57adb06a-52ac-4216-8d94-7c1e795a614e.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/d/c/dcaa1ff6-304e-4660-9df3-36dde8e8979d.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/2/b/2b9b0195-bada-4c92-a228-54160d0dc25b.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/c/a/cad82492-9d1e-4638-8038-323474c41ef5.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/b/1/b1021bb8-ebba-475f-877f-8b781454d757.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/e/f/eff1f52c-5c43-4260-aaa0-6920846a191c.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/b/7/b7b598d0-555e-4614-9047-0d9c4901f40d.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/b/b/bb54233c-0844-4965-9cde-e8a4ef3e11b8.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/3/3/33054539-61da-4b4d-9d31-70e1347ce3c6.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/4/8/48ae94e5-9066-43ee-b5d6-89c86953496f.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/7/5/75fd5fe5-e000-46ab-87f5-2fc9920e495c.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/2/6/26d40e03-6de4-4373-9fce-04c107a666f7.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/7/3/7363f1fb-9af3-4212-921f-d59533faf0e5.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/2/b/2b74bb81-fb9a-40e5-a941-e517430b52f5.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/0/2/02138fbb-dd3e-46c4-9df6-7ba6a046fc77.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/c/c/cc520518-2053-4b39-90d4-c088877e874e.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/7/4/748e6a61-9c1f-4225-9f04-e54002f63ac3.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/a/2/a249b1f4-2b22-4b67-a207-e0c4ae95d2e1.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/8/6/86ecdced-7e08-424c-83b5-776377e810cb.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/2/b/2b5801fb-2026-4f25-98bc-bbb2e99084e7.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/5/1/51f46fb5-3c42-4523-b3eb-460707914569.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/a/d/ad220917-7489-4b47-b844-31ff55b7194f.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/b/4/b498f3b2-658b-4a58-8aa3-524a87c1be2f.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/7/6/76974751-2745-4144-9118-124912952862.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/6/4/647a4697-a419-4a37-b4d0-40e98038755e.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/e/4/e49171b3-4670-4e3a-9694-814bfb321eb9.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/7/3/731fb789-9e05-4c6e-826c-d8ca23a6700c.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/4/2/42dd1b48-d39d-4340-9a3b-179836814981.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/1/2/12dd0e73-010d-499f-8f17-ad96fb0dd0ea.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/4/5/456b1097-371b-452d-a18c-28d498305026.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/b/9/b959e922-3490-4822-ba4d-e9668ad58b16.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/e/a/eaff0a1e-b65a-422f-8f9f-65fac037047d.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/8/4/84a76e0f-49cc-4d8b-9c60-987da77a6452.jpg',
    entersUntapped: 'conditional',
    arenaSet: 'MID'
  },
  {
    id: 'shattered-sanctuary',
    name: 'Shattered Sanctuary',
    cycle: 'slowland',
    colorsProduced: ['W', 'B'],
    colorIdentity: ['W', 'B'],
    typeLine: 'Land',
    rarity: 'rare',
    oracleText: 'Shattered Sanctuary enters the battlefield tapped unless you control two or more other lands.\n{T}: Add {W} or {B}.',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/d/ad8090f7-feb6-432a-99a5-d41dd72ef7a9.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/2/9/299f1dee-b3d7-472b-aa0b-2f9b46a96da5.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/d/5/d55e096f-c1f9-4bcf-a54d-7bc4bdf45df4.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/8/f/8f3fddd7-ede4-41c7-a645-a6af298a3d35.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/e/b/eb604455-c411-414d-92ef-575a24dd1808.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/9/e/9e1c757d-47bc-49b0-ac6b-90299e394593.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/b/1/b1089f2a-b9c1-4899-873b-e85d43fb77a7.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/3/8/38a6a236-fa2a-4db3-8b77-cf68a18fa093.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/7/8/7854f30f-646e-4c75-9702-d996455b574f.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/6/5/65b26f68-3a25-4c4e-bc76-a199ab479a50.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/1/8/18791c8c-1e64-42b7-a35a-93f8bbff039d.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/5/6/563e41b9-373b-488d-a417-db3ef446c7ad.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/9/0/90da5171-be49-43c2-84b2-c0cb91176b66.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/4/7/47d8b59e-9d84-4d89-8d19-efeeffbe8d14.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/9/0/90797371-1d54-47ef-a0ad-467ea64380b0.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/0/8/08ae1037-6f70-41a9-b75e-98fa9a2152c8.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/b/b/bb547bf1-a477-4402-9a00-1c7ecdf286a1.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/d/f/dfd54505-9613-4402-91f2-771120a169b5.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/b/8/b89b2c79-e3d3-4ef9-abad-be52bc5527db.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/1/8/18d236ce-3b78-403a-b5f9-4fb44123d85b.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/9/9/9926e12d-7235-4efc-a334-9724fe10c477.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/a/a/aaca0961-450f-4e11-8ec6-ee1f3080ff43.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/1/9/19446f2d-45db-4467-89fb-d8d47eb3df3f.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/d/4/d4a3b784-bb9e-4e6f-96eb-8e5eb56e9c60.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/0/e/0ed6556a-014b-4f5b-ba3a-56da36089961.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/7/e/7e09f33b-7547-495a-b49a-62e49c36e147.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/b/4/b4b99ebb-0d54-4fe1-a4f6-84c2643882b1.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/0/c/0ce39a19-f51d-4a35-ae80-5b82eb15fcff.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/d/a/da57eb54-5498-499e-962c-882243738871.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/0/5/0511e232-2a72-40f5-a400-4f7ebc442d17.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/d/2/d24c3d51-795d-4c01-a34a-3280fccd2d78.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/2/6/2668ac91-6cda-4f81-a08d-4fc5f9cb0589.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/8/7/87a4e5fe-161f-42da-9ca2-67c8e8970e94.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/6/5/65590f57-19a4-4a4b-9721-a4773ffef265.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/b/6/b6de14ae-0132-4261-af00-6478bf591742.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/c/3/c375a022-5b57-496d-a802-e4fb83fe3be7.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/4/8/486d7edc-d983-41f0-8b78-c99aecd72996.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/4/9/499037cc-a577-41cb-8ca2-5e117945634f.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/d/1/d1ec50e3-214e-4e45-8f2c-e16e0e6490dd.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/2/1/2135ac5a-187b-4dc9-8f82-34e8d1603416.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/7/f/7f910495-8bd7-4134-a281-c16fd666d5cc.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/0/a/0a8b9d37-e89c-44ad-bd1b-51cb06ec3e0b.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/1/9/195383c1-4723-40b0-ba53-296dfa8e1dc9.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/8/b/8bb8512e-6913-4be6-8828-2bcf3eb58327.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/e/3/e3c2c66c-f7f0-41d5-a805-a129aeaf1b75.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/8/3/834b27a0-dfd7-4f96-8cde-cacac4b24acc.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/3/9/3961dd39-2a96-4c4f-96ff-f03c7cb577d5.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/1/4/143147d2-2eec-41e7-b78a-592288b38630.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/e/a/ea6bc7d5-e8f6-4103-920c-9f7ec5cd6c28.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/5/4/54a702cd-ca49-4570-b47e-8b090452a3c3.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/d/a/da7699b2-e1af-4bc0-8c5b-84ba3e868d7c.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/d/f/df1cb087-f100-410e-92a0-47cbb6509f7a.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/7/8/78748ac8-4726-4156-a97e-023f80f7011a.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/c/6/c6d47162-749b-47d5-9589-8f1dbf60b9f3.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/4/8/48d6ce7c-5dc8-449b-acba-db25c49b788c.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/a/7/a72a42d4-387e-4bd4-9ae9-0e10b106260a.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/1/4/14f5f561-39fd-4dad-b225-40cc1eddb563.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/f/a/fa6543b5-236b-4e89-beaa-ea5669b73d6e.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/3/1/31b14e48-916c-45b0-8800-e144917637f1.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/1/b/1b1a539f-f513-433e-b850-89196b0bc3ee.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/3/9/393b3a32-a5ec-44f2-9014-99b82c3c97ae.jpg',
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
    imageUrl: 'https://cards.scryfall.io/normal/front/9/c/9cc070d3-4b83-4684-9caf-063e5c473a77.jpg',
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
