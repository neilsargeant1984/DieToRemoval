import { Card, FormatType } from './card';

export interface DeckCard {
  card: Card;
  quantity: number;
}

export interface Deck {
  id: string;
  name: string;
  format: FormatType;
  mainboard: DeckCard[];
  sideboard: DeckCard[];
  commander?: DeckCard;
  description?: string;
  tags?: string[];
  isImported?: boolean;
  source?: 'custom' | 'imported' | 'arena';
  createdAt: string;
  updatedAt: string;
}
