export interface ArenaSet {
  code: string;
  name: string;
  category: 'standard' | 'eternal' | 'remastered' | 'anthology' | 'alchemy';
  releaseYear: number;
}

export const ARENA_SETS: ArenaSet[] = [
  // Current & Recent Standard Sets
  { code: 'FDN', name: 'Foundations', category: 'standard', releaseYear: 2024 },
  { code: 'DSK', name: 'Duskmourn: House of Horror', category: 'standard', releaseYear: 2024 },
  { code: 'BLB', name: 'Bloomburrow', category: 'standard', releaseYear: 2024 },
  { code: 'OTJ', name: 'Outlaws of Thunder Junction', category: 'standard', releaseYear: 2024 },
  { code: 'BIG', name: 'The Big Score', category: 'standard', releaseYear: 2024 },
  { code: 'OTP', name: 'Breaking News', category: 'standard', releaseYear: 2024 },
  { code: 'MKM', name: 'Murders at Karlov Manor', category: 'standard', releaseYear: 2024 },
  { code: 'LCI', name: 'The Lost Caverns of Ixalan', category: 'standard', releaseYear: 2023 },
  { code: 'WOE', name: 'Wilds of Eldraine', category: 'standard', releaseYear: 2023 },
  { code: 'MOM', name: 'March of the Machine', category: 'standard', releaseYear: 2023 },
  { code: 'MUL', name: 'Multiverse Legends', category: 'eternal', releaseYear: 2023 },
  { code: 'ONE', name: 'Phyrexia: All Will Be One', category: 'standard', releaseYear: 2023 },
  { code: 'BRO', name: 'The Brothers\' War', category: 'standard', releaseYear: 2022 },
  { code: 'DMU', name: 'Dominaria United', category: 'standard', releaseYear: 2022 },
  { code: 'SNC', name: 'Streets of New Capenna', category: 'eternal', releaseYear: 2022 },
  { code: 'NEO', name: 'Kamigawa: Neon Dynasty', category: 'eternal', releaseYear: 2022 },
  { code: 'VOW', name: 'Innistrad: Crimson Vow', category: 'eternal', releaseYear: 2021 },
  { code: 'MID', name: 'Innistrad: Midnight Hunt', category: 'eternal', releaseYear: 2021 },
  { code: 'AFR', name: 'Adventures in the Forgotten Realms', category: 'eternal', releaseYear: 2021 },
  { code: 'STX', name: 'Strixhaven: School of Mages', category: 'eternal', releaseYear: 2021 },
  { code: 'STA', name: 'Mystical Archive', category: 'eternal', releaseYear: 2021 },
  { code: 'KHM', name: 'Kaldheim', category: 'eternal', releaseYear: 2021 },
  { code: 'ZNR', name: 'Zendikar Rising', category: 'eternal', releaseYear: 2020 },
  { code: 'IKO', name: 'Ikoria: Lair of Behemoths', category: 'eternal', releaseYear: 2020 },
  { code: 'THB', name: 'Theros Beyond Death', category: 'eternal', releaseYear: 2020 },
  { code: 'ELD', name: 'Throne of Eldraine', category: 'eternal', releaseYear: 2019 },
  { code: 'WAR', name: 'War of the Spark', category: 'eternal', releaseYear: 2019 },
  { code: 'RNA', name: 'Ravnica Allegiance', category: 'eternal', releaseYear: 2019 },
  { code: 'GRN', name: 'Guilds of Ravnica', category: 'eternal', releaseYear: 2018 },
  { code: 'DOM', name: 'Dominaria', category: 'eternal', releaseYear: 2018 },
  { code: 'RIX', name: 'Rivals of Ixalan', category: 'eternal', releaseYear: 2018 },
  { code: 'XLN', name: 'Ixalan', category: 'eternal', releaseYear: 2017 },

  // Horizons & Eternal Sets
  { code: 'MH3', name: 'Modern Horizons 3', category: 'eternal', releaseYear: 2024 },
  { code: 'LTR', name: 'The Lord of the Rings: Tales of Middle-earth', category: 'eternal', releaseYear: 2023 },
  { code: 'LTC', name: 'Tales of Middle-earth Commander', category: 'eternal', releaseYear: 2023 },
  { code: 'SPG', name: 'Special Guests', category: 'eternal', releaseYear: 2024 },
  { code: 'FRC', name: 'Reality Fracture Commander', category: 'eternal', releaseYear: 2024 },

  // Remastered Sets
  { code: 'SIR', name: 'Shadows over Innistrad Remastered', category: 'remastered', releaseYear: 2023 },
  { code: 'SIS', name: 'Shadows of the Past', category: 'remastered', releaseYear: 2023 },
  { code: 'KLR', name: 'Kaladesh Remastered', category: 'remastered', releaseYear: 2020 },
  { code: 'AKR', name: 'Amonkhet Remastered', category: 'remastered', releaseYear: 2020 },

  // Anthologies & Historic / Timeless Expansions
  { code: 'EA1', name: 'Explorer Anthology 1', category: 'anthology', releaseYear: 2022 },
  { code: 'EA2', name: 'Explorer Anthology 2', category: 'anthology', releaseYear: 2022 },
  { code: 'EA3', name: 'Explorer Anthology 3', category: 'anthology', releaseYear: 2023 },
  { code: 'HA1', name: 'Historic Anthology 1', category: 'anthology', releaseYear: 2019 },
  { code: 'HA2', name: 'Historic Anthology 2', category: 'anthology', releaseYear: 2020 },
  { code: 'HA3', name: 'Historic Anthology 3', category: 'anthology', releaseYear: 2020 },
  { code: 'HA4', name: 'Historic Anthology 4', category: 'anthology', releaseYear: 2021 },
  { code: 'HA5', name: 'Historic Anthology 5', category: 'anthology', releaseYear: 2021 },
  { code: 'HA6', name: 'Historic Anthology 6', category: 'anthology', releaseYear: 2022 },
  { code: 'HA7', name: 'Historic Anthology 7', category: 'anthology', releaseYear: 2023 },
  { code: 'TA1', name: 'Timeless Anthology 1', category: 'anthology', releaseYear: 2024 },

  // Alchemy Sets
  { code: 'Y25', name: 'Alchemy: Duskmourn / Foundations', category: 'alchemy', releaseYear: 2024 },
  { code: 'Y24', name: 'Alchemy: Karlov / Thunder Junction / Bloomburrow', category: 'alchemy', releaseYear: 2024 },
  { code: 'Y23', name: 'Alchemy: The Brothers\' War / Phyrexia', category: 'alchemy', releaseYear: 2023 },
  { code: 'Y22', name: 'Alchemy: Innistrad / Kamigawa / New Capenna', category: 'alchemy', releaseYear: 2022 },
  { code: 'HBG', name: 'Alchemy Horizons: Baldur\'s Gate', category: 'alchemy', releaseYear: 2022 }
];
