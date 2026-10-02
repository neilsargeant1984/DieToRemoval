export interface ArenaSet {
  code: string;
  name: string;
  category: 'standard' | 'eternal' | 'remastered' | 'anthology' | 'alchemy';
  releaseYear: number;
  releaseDate?: string;
}

/**
 * Complete list of MTG Arena Sets arranged in strict reverse chronological order
 * (most recent release first at the top, going further and further back in time).
 */
export const ARENA_SETS: ArenaSet[] = [
  // --- 2026 ---
  { code: 'FRA', name: 'Reality Fracture', category: 'standard', releaseYear: 2026, releaseDate: '2026-10-02' },
  { code: 'FRC', name: 'Reality Fracture Commander', category: 'eternal', releaseYear: 2026, releaseDate: '2026-10-02' },
  { code: 'HOB', name: 'The Hobbit', category: 'standard', releaseYear: 2026, releaseDate: '2026-08-14' },
  { code: 'HOC', name: 'The Hobbit Eternal', category: 'eternal', releaseYear: 2026, releaseDate: '2026-08-14' },
  { code: 'MSH', name: 'Marvel Super Heroes', category: 'standard', releaseYear: 2026, releaseDate: '2026-06-26' },
  { code: 'YSOS', name: 'Alchemy: Secrets of Strixhaven', category: 'alchemy', releaseYear: 2026, releaseDate: '2026-05-19' },
  { code: 'SOS', name: 'Secrets of Strixhaven', category: 'standard', releaseYear: 2026, releaseDate: '2026-04-24' },
  { code: 'SOA', name: 'Secrets of Strixhaven Mystical Archive', category: 'eternal', releaseYear: 2026, releaseDate: '2026-04-24' },
  { code: 'YECL', name: 'Alchemy: Lorwyn Eclipsed', category: 'alchemy', releaseYear: 2026, releaseDate: '2026-02-03' },
  { code: 'ECL', name: 'Lorwyn Eclipsed', category: 'standard', releaseYear: 2026, releaseDate: '2026-01-23' },

  // --- 2025 ---
  { code: 'SPM', name: "Marvel's Spider-Man", category: 'standard', releaseYear: 2025, releaseDate: '2025-09-26' },
  { code: 'OM1', name: 'Through the Omenpaths', category: 'standard', releaseYear: 2025, releaseDate: '2025-09-23' },
  { code: 'OMB', name: 'Through the Omenpaths Bonus Sheet', category: 'eternal', releaseYear: 2025, releaseDate: '2025-09-23' },
  { code: 'YEOE', name: 'Alchemy: Edge of Eternities', category: 'alchemy', releaseYear: 2025, releaseDate: '2025-08-19' },
  { code: 'EOE', name: 'Edge of Eternities', category: 'standard', releaseYear: 2025, releaseDate: '2025-08-01' },
  { code: 'EOS', name: 'Edge of Eternities: Stellar Sights', category: 'eternal', releaseYear: 2025, releaseDate: '2025-08-01' },
  { code: 'FIN', name: 'Final Fantasy', category: 'standard', releaseYear: 2025, releaseDate: '2025-06-13' },
  { code: 'YTDM', name: 'Alchemy: Tarkir', category: 'alchemy', releaseYear: 2025, releaseDate: '2025-04-29' },
  { code: 'TDM', name: 'Tarkir: Dragonstorm', category: 'standard', releaseYear: 2025, releaseDate: '2025-04-11' },
  { code: 'YDFT', name: 'Alchemy: Aetherdrift', category: 'alchemy', releaseYear: 2025, releaseDate: '2025-03-04' },
  { code: 'DFT', name: 'Aetherdrift', category: 'standard', releaseYear: 2025, releaseDate: '2025-02-14' },
  { code: 'INR', name: 'Innistrad Remastered', category: 'remastered', releaseYear: 2025, releaseDate: '2025-01-24' },

  // --- 2024 ---
  { code: 'PIO', name: 'Pioneer Masters', category: 'remastered', releaseYear: 2024, releaseDate: '2024-12-10' },
  { code: 'FDN', name: 'Foundations', category: 'standard', releaseYear: 2024, releaseDate: '2024-11-15' },
  { code: 'J25', name: 'Foundations Jumpstart', category: 'standard', releaseYear: 2024, releaseDate: '2024-11-15' },
  { code: 'YDSK', name: 'Alchemy: Duskmourn', category: 'alchemy', releaseYear: 2024, releaseDate: '2024-10-15' },
  { code: 'DSK', name: 'Duskmourn: House of Horror', category: 'standard', releaseYear: 2024, releaseDate: '2024-09-27' },
  { code: 'YBLB', name: 'Alchemy: Bloomburrow', category: 'alchemy', releaseYear: 2024, releaseDate: '2024-08-20' },
  { code: 'BLB', name: 'Bloomburrow', category: 'standard', releaseYear: 2024, releaseDate: '2024-08-02' },
  { code: 'ACR', name: "Assassin's Creed", category: 'eternal', releaseYear: 2024, releaseDate: '2024-07-05' },
  { code: 'MH3', name: 'Modern Horizons 3', category: 'eternal', releaseYear: 2024, releaseDate: '2024-06-14' },
  { code: 'YOTJ', name: 'Alchemy: Outlaws of Thunder Junction', category: 'alchemy', releaseYear: 2024, releaseDate: '2024-05-07' },
  { code: 'OTJ', name: 'Outlaws of Thunder Junction', category: 'standard', releaseYear: 2024, releaseDate: '2024-04-19' },
  { code: 'BIG', name: 'The Big Score', category: 'standard', releaseYear: 2024, releaseDate: '2024-04-19' },
  { code: 'OTP', name: 'Breaking News', category: 'standard', releaseYear: 2024, releaseDate: '2024-04-19' },
  { code: 'YMKM', name: 'Alchemy: Murders at Karlov Manor', category: 'alchemy', releaseYear: 2024, releaseDate: '2024-03-05' },
  { code: 'CLU', name: 'Ravnica: Clue Edition', category: 'eternal', releaseYear: 2024, releaseDate: '2024-02-23' },
  { code: 'MKM', name: 'Murders at Karlov Manor', category: 'standard', releaseYear: 2024, releaseDate: '2024-02-09' },
  { code: 'SPG', name: 'Special Guests', category: 'eternal', releaseYear: 2024, releaseDate: '2024-02-09' },
  { code: 'RVR', name: 'Ravnica Remastered', category: 'remastered', releaseYear: 2024, releaseDate: '2024-01-12' },

  // --- 2023 ---
  { code: 'TA1', name: 'Timeless Anthology 1', category: 'anthology', releaseYear: 2023, releaseDate: '2023-12-12' },
  { code: 'YLCI', name: 'Alchemy: Ixalan', category: 'alchemy', releaseYear: 2023, releaseDate: '2023-12-05' },
  { code: 'LCI', name: 'The Lost Caverns of Ixalan', category: 'standard', releaseYear: 2023, releaseDate: '2023-11-17' },
  { code: 'YWOE', name: 'Alchemy: Wilds of Eldraine', category: 'alchemy', releaseYear: 2023, releaseDate: '2023-10-10' },
  { code: 'WOE', name: 'Wilds of Eldraine', category: 'standard', releaseYear: 2023, releaseDate: '2023-09-08' },
  { code: 'WOT', name: 'Wilds of Eldraine: Enchanting Tales', category: 'eternal', releaseYear: 2023, releaseDate: '2023-09-08' },
  { code: 'HA7', name: 'Historic Anthology 7', category: 'anthology', releaseYear: 2023, releaseDate: '2023-07-18' },
  { code: 'EA3', name: 'Explorer Anthology 3', category: 'anthology', releaseYear: 2023, releaseDate: '2023-07-18' },
  { code: 'LTR', name: 'The Lord of the Rings: Tales of Middle-earth', category: 'eternal', releaseYear: 2023, releaseDate: '2023-06-23' },
  { code: 'LTC', name: 'Tales of Middle-earth Commander', category: 'eternal', releaseYear: 2023, releaseDate: '2023-06-23' },
  { code: 'MAT', name: 'March of the Machine: The Aftermath', category: 'standard', releaseYear: 2023, releaseDate: '2023-05-12' },
  { code: 'MOM', name: 'March of the Machine', category: 'standard', releaseYear: 2023, releaseDate: '2023-04-21' },
  { code: 'MUL', name: 'Multiverse Legends', category: 'eternal', releaseYear: 2023, releaseDate: '2023-04-21' },
  { code: 'SIR', name: 'Shadows over Innistrad Remastered', category: 'remastered', releaseYear: 2023, releaseDate: '2023-03-21' },
  { code: 'SIS', name: 'Shadows of the Past', category: 'remastered', releaseYear: 2023, releaseDate: '2023-03-21' },
  { code: 'YONE', name: 'Alchemy: Phyrexia', category: 'alchemy', releaseYear: 2023, releaseDate: '2023-02-28' },
  { code: 'ONE', name: 'Phyrexia: All Will Be One', category: 'standard', releaseYear: 2023, releaseDate: '2023-02-10' },

  // --- 2022 ---
  { code: 'YBRO', name: "Alchemy: The Brothers' War", category: 'alchemy', releaseYear: 2022, releaseDate: '2022-12-13' },
  { code: 'EA2', name: 'Explorer Anthology 2', category: 'anthology', releaseYear: 2022, releaseDate: '2022-12-13' },
  { code: 'J22', name: 'Jumpstart 2022', category: 'eternal', releaseYear: 2022, releaseDate: '2022-12-02' },
  { code: 'BRO', name: "The Brothers' War", category: 'standard', releaseYear: 2022, releaseDate: '2022-11-18' },
  { code: 'BRR', name: 'Retro Artifacts', category: 'eternal', releaseYear: 2022, releaseDate: '2022-11-18' },
  { code: 'YDMU', name: 'Alchemy: Dominaria', category: 'alchemy', releaseYear: 2022, releaseDate: '2022-10-05' },
  { code: 'DMU', name: 'Dominaria United', category: 'standard', releaseYear: 2022, releaseDate: '2022-09-09' },
  { code: 'HA6', name: 'Historic Anthology 6', category: 'anthology', releaseYear: 2022, releaseDate: '2022-07-28' },
  { code: 'EA1', name: 'Explorer Anthology 1', category: 'anthology', releaseYear: 2022, releaseDate: '2022-07-28' },
  { code: 'HBG', name: "Alchemy Horizons: Baldur's Gate", category: 'alchemy', releaseYear: 2022, releaseDate: '2022-07-07' },
  { code: 'YSNC', name: 'Alchemy: New Capenna', category: 'alchemy', releaseYear: 2022, releaseDate: '2022-06-02' },
  { code: 'SNC', name: 'Streets of New Capenna', category: 'eternal', releaseYear: 2022, releaseDate: '2022-04-29' },
  { code: 'YNEO', name: 'Alchemy: Kamigawa', category: 'alchemy', releaseYear: 2022, releaseDate: '2022-03-17' },
  { code: 'NEO', name: 'Kamigawa: Neon Dynasty', category: 'eternal', releaseYear: 2022, releaseDate: '2022-02-18' },

  // --- 2021 ---
  { code: 'YMID', name: 'Alchemy: Innistrad', category: 'alchemy', releaseYear: 2021, releaseDate: '2021-12-09' },
  { code: 'VOW', name: 'Innistrad: Crimson Vow', category: 'eternal', releaseYear: 2021, releaseDate: '2021-11-19' },
  { code: 'MID', name: 'Innistrad: Midnight Hunt', category: 'eternal', releaseYear: 2021, releaseDate: '2021-09-24' },
  { code: 'J21', name: 'Jumpstart: Historic Horizons', category: 'eternal', releaseYear: 2021, releaseDate: '2021-08-26' },
  { code: 'AFR', name: 'Adventures in the Forgotten Realms', category: 'eternal', releaseYear: 2021, releaseDate: '2021-07-23' },
  { code: 'HA5', name: 'Historic Anthology 5', category: 'anthology', releaseYear: 2021, releaseDate: '2021-05-27' },
  { code: 'STX', name: 'Strixhaven: School of Mages', category: 'eternal', releaseYear: 2021, releaseDate: '2021-04-23' },
  { code: 'STA', name: 'Mystical Archive', category: 'eternal', releaseYear: 2021, releaseDate: '2021-04-23' },
  { code: 'HA4', name: 'Historic Anthology 4', category: 'anthology', releaseYear: 2021, releaseDate: '2021-03-11' },
  { code: 'KHM', name: 'Kaldheim', category: 'eternal', releaseYear: 2021, releaseDate: '2021-02-05' },

  // --- 2020 ---
  { code: 'KLR', name: 'Kaladesh Remastered', category: 'remastered', releaseYear: 2020, releaseDate: '2020-11-12' },
  { code: 'ZNR', name: 'Zendikar Rising', category: 'eternal', releaseYear: 2020, releaseDate: '2020-09-25' },
  { code: 'AKR', name: 'Amonkhet Remastered', category: 'remastered', releaseYear: 2020, releaseDate: '2020-08-13' },
  { code: 'ANB', name: 'Arena Beginner Set', category: 'eternal', releaseYear: 2020, releaseDate: '2020-08-13' },
  { code: 'JMP', name: 'Jumpstart', category: 'eternal', releaseYear: 2020, releaseDate: '2020-07-17' },
  { code: 'M21', name: 'Core Set 2021', category: 'eternal', releaseYear: 2020, releaseDate: '2020-07-03' },
  { code: 'HA3', name: 'Historic Anthology 3', category: 'anthology', releaseYear: 2020, releaseDate: '2020-05-21' },
  { code: 'IKO', name: 'Ikoria: Lair of Behemoths', category: 'eternal', releaseYear: 2020, releaseDate: '2020-04-24' },
  { code: 'HA2', name: 'Historic Anthology 2', category: 'anthology', releaseYear: 2020, releaseDate: '2020-03-12' },
  { code: 'THB', name: 'Theros Beyond Death', category: 'eternal', releaseYear: 2020, releaseDate: '2020-01-24' },

  // --- 2019 ---
  { code: 'HA1', name: 'Historic Anthology 1', category: 'anthology', releaseYear: 2019, releaseDate: '2019-11-21' },
  { code: 'ELD', name: 'Throne of Eldraine', category: 'eternal', releaseYear: 2019, releaseDate: '2019-10-04' },
  { code: 'M20', name: 'Core Set 2020', category: 'eternal', releaseYear: 2019, releaseDate: '2019-07-12' },
  { code: 'WAR', name: 'War of the Spark', category: 'eternal', releaseYear: 2019, releaseDate: '2019-05-03' },
  { code: 'RNA', name: 'Ravnica Allegiance', category: 'eternal', releaseYear: 2019, releaseDate: '2019-01-25' },

  // --- 2018 ---
  { code: 'GRN', name: 'Guilds of Ravnica', category: 'eternal', releaseYear: 2018, releaseDate: '2018-10-05' },
  { code: 'M19', name: 'Core Set 2019', category: 'eternal', releaseYear: 2018, releaseDate: '2018-07-13' },
  { code: 'ANA', name: 'Arena New Player Experience', category: 'eternal', releaseYear: 2018, releaseDate: '2018-07-14' },
  { code: 'DOM', name: 'Dominaria', category: 'eternal', releaseYear: 2018, releaseDate: '2018-04-27' },
  { code: 'RIX', name: 'Rivals of Ixalan', category: 'eternal', releaseYear: 2018, releaseDate: '2018-01-19' },

  // --- 2017 ---
  { code: 'XLN', name: 'Ixalan', category: 'eternal', releaseYear: 2017, releaseDate: '2017-09-29' }
];
