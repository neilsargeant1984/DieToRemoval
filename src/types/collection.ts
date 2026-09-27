export interface WildcardInventory {
  common: number;
  uncommon: number;
  rare: number;
  mythic: number;
}

export interface DeckWildcardCost {
  total: {
    common: number;
    uncommon: number;
    rare: number;
    mythic: number;
  };
  missing: {
    common: number;
    uncommon: number;
    rare: number;
    mythic: number;
  };
  canCraftWithAvailableWildcards: boolean;
  totalCardsMissing: number;
  vaultProgressEstimate: number; // approximate vault boost or percentage
}

// User collection map: arenaId -> count owned (0 to 4)
export type UserCollection = Record<number, number>;
