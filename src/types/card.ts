export type FormatType = 'standard' | 'timeless' | 'historic' | 'explorer' | 'brawl' | 'alchemy';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'mythic';

export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';

export type CardTypeCategory = 
  | 'Creature'
  | 'Planeswalker'
  | 'Instant'
  | 'Sorcery'
  | 'Artifact'
  | 'Enchantment'
  | 'Battle'
  | 'Land';

export interface Card {
  id: string;
  arenaId: number;
  name: string;
  manaCost: string;
  cmc: number;
  colors: ('W' | 'U' | 'B' | 'R' | 'G')[];
  colorIdentity: ('W' | 'U' | 'B' | 'R' | 'G')[];
  typeLine: string;
  types: CardTypeCategory[];
  subtypes?: string[];
  oracleText: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  rarity: CardRarity;
  set: string;
  setName: string;
  collectorNumber: string;
  imageUrl: string;
  // Arena digital-specific mechanics
  isDigitalOnly?: boolean;
  isAlchemyRebalanced?: boolean;
  spellbook?: {
    name: string;
    manaCost: string;
    typeLine: string;
    rarity: CardRarity;
    oracleText: string;
    imageUrl?: string;
  }[];
  digitalMechanic?: 'spellbook' | 'conjure' | 'seek' | 'perpetual' | 'boon';
  legalities: Record<FormatType, boolean>;
}
