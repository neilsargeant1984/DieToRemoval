/**
 * News Service for DieToRemoval
 * Pulls and organizes live and curated Magic: The Gathering & MTG Arena news across:
 * - Official (Wizards of the Coast / DailyMTG announcements)
 * - Around the Web (Google News, MTGGoldfish, Draftsim, Dot Esports, IGN)
 * - Video & Streams (Top streamers like CovertGoBlue, LegenVD, The Professor, Amazonian, Crokeyz)
 * 
 * Automatically detects and tags "Arena Only" content.
 */

export type NewsCategory = 'official' | 'web' | 'video';

export interface StreamerProfile {
  id: string;
  name: string;
  handle: string;
  channelName: string;
  channelUrl: string;
  avatarUrl: string;
  verified?: boolean;
  role?: string;
  description?: string;
  keywords: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: NewsCategory;
  publishedAt: string;
  relativeTime: string;
  imageUrl: string;
  isArenaOnly: boolean;
  tags: string[];
  author?: string;
  // Video & Streamer specific properties
  channelName?: string;
  channelAvatarUrl?: string;
  channelUrl?: string;
  streamer?: StreamerProfile;
  duration?: string;
  videoId?: string;
  views?: string;
}

/**
 * Checks if article content specifically targets MTG Arena digital gameplay,
 * formats (Brawl, Timeless, Historic, Alchemy), or Arena client events.
 */
export function detectIsArenaOnly(title: string, description: string = '', source: string = ''): boolean {
  const text = `${title} ${description} ${source}`.toLowerCase();
  const arenaKeywords = [
    'arena',
    'mtga',
    'historic',
    'timeless',
    'brawl',
    'alchemy',
    'midweek magic',
    'arena open',
    'arena championship',
    'wildcard',
    'golden pack',
    'digital format',
    'arena zone',
    'arena direct',
    'arena cube',
    'jumpstart',
    'client update',
    'patch notes',
    'ranked season',
    'premier draft'
  ];
  return arenaKeywords.some(kw => text.includes(kw));
}

/**
 * Computes human-readable relative time string.
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const pub = new Date(dateString);
    if (isNaN(pub.getTime())) return 'Recently';

    const diffMs = Date.now() - pub.getTime();
    if (diffMs < 0) return 'Just now';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return pub.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

/**
 * Resolves authentic, high-resolution Magic: The Gathering card art from Scryfall
 * based on the article's topic, title, and keywords.
 * Eliminates generic stock photos, ensuring 100% MTG-relevant visuals.
 */
export function resolveTopicArt(title: string = '', description: string = '', tags: string[] = []): string {
  const text = `${title} ${description} ${tags.join(' ')}`.toLowerCase();

  // 1. Charity, Fundraising, Community Streams, Lifeline
  if (text.includes('fundrais') || text.includes('charity') || text.includes('trans lifeline') || text.includes('lifeline') || text.includes('extra life')) {
    return 'https://cards.scryfall.io/art_crop/front/1/b/1b19f82a-9724-41b1-934d-a8ec1493587b.jpg?1783904160'; // Together Forever
  }

  // 2. Secret Lair, Festival in a Box, Mystery Booster, Collector Edition
  if (text.includes('secret lair') || text.includes('festival in a box') || text.includes('mystery booster') || text.includes('drop series')) {
    return 'https://cards.scryfall.io/art_crop/front/8/e/8ee443cc-e17a-493b-9c93-1f9e141a30e4.jpg?1789644446'; // Sol Ring Masterpiece
  }

  // 3. Boosters, Packs, Collector Packs, Foundations, Opening
  if (text.includes('booster') || text.includes('pack') || text.includes('play booster') || text.includes('collector booster') || text.includes('foundations')) {
    return 'https://cards.scryfall.io/art_crop/front/0/a/0a5718db-e67d-468a-95ba-11a08fcf9fea.jpg?1783931339'; // Booster Tutor
  }

  // 4. Banned & Restricted, Format Health, Ban Announcements
  if (text.includes('banned') || text.includes('restricted') || text.includes('b&r') || text.includes('ban list')) {
    return 'https://cards.scryfall.io/art_crop/front/3/4/3462a3d0-5552-49fa-9eb7-100960c55891.jpg?1783932594'; // Oko, Thief of Crowns
  }

  // 5. Commander, EDH, Brawl, Game Knights
  if (text.includes('commander') || text.includes('edh') || text.includes('brawl') || text.includes('game knights')) {
    return 'https://cards.scryfall.io/art_crop/front/1/0/10d42b35-844f-4a64-9981-c6118d45e826.jpg?1783915607'; // The Ur-Dragon
  }

  // 6. Arena Announcements, State of the Game, Patch Notes, Client Updates
  if (text.includes('arena announcement') || text.includes('state of the game') || text.includes('patch notes') || text.includes('client update')) {
    return 'https://cards.scryfall.io/art_crop/front/c/8/c8817585-0d32-4d56-9142-0d29512e86a9.jpg?1783930196'; // Jace, the Mind Sculptor
  }

  // 7. Arena Midweek Magic, Events, WeeklyMTG
  if (text.includes('midweek magic') || text.includes('weeklymtg') || text.includes('schedule') || text.includes('event')) {
    return 'https://cards.scryfall.io/art_crop/front/c/5/c5408607-af8f-48fe-bc40-32828d1976de.jpg?1783913282'; // Nicol Bolas, Dragon-God
  }

  // 8. Arena Championship, Pro Tour, World Championship, Premier Play, Competitive
  if (text.includes('championship') || text.includes('pro tour') || text.includes('world championship') || text.includes('qualifier') || text.includes('top 16') || text.includes('tournament')) {
    return 'https://cards.scryfall.io/art_crop/front/f/a/fab2d8a9-ab4c-4225-a570-22636293c17d.jpg?1783923909'; // The Wandering Emperor
  }

  // 9. Standard Metagame, Standard Showdown
  if (text.includes('standard')) {
    return 'https://cards.scryfall.io/art_crop/front/d/6/d67be074-cdd4-41d9-ac89-0a0456c4e4b2.jpg?1783921327'; // Sheoldred, the Apocalypse
  }

  // 10. Draft, Limited, Prerelease, Sealed, Cube
  if (text.includes('draft') || text.includes('limited') || text.includes('prerelease') || text.includes('sealed') || text.includes('cube')) {
    return 'https://cards.scryfall.io/art_crop/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.jpg?1783903008'; // Lightning Bolt
  }

  // 11. Timeless, Historic, Alchemy
  if (text.includes('timeless') || text.includes('historic') || text.includes('alchemy')) {
    return 'https://cards.scryfall.io/art_crop/front/d/3/d33d91d0-1506-45e4-9def-975bf901815e.jpg?1783909079'; // Omniscience
  }

  // 12. Spells, Counterspells, Previews, Spoilers, Mechanics
  if (text.includes('preview') || text.includes('spoiler') || text.includes('rule') || text.includes('mechanic') || text.includes('combo')) {
    return 'https://cards.scryfall.io/art_crop/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.jpg?1783909630'; // Counterspell
  }

  // 13. Default Authentic MTG Artwork: The iconic Black Lotus
  return 'https://cards.scryfall.io/art_crop/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg?1783939332';
}

/**
 * Curated high-fidelity articles providing a rich, responsive baseline
 * even when offline or before live network responses complete.
 */
export const CURATED_OFFICIAL_NEWS: NewsArticle[] = [
  {
    id: 'off-1',
    title: 'MTG Arena Announcements – State of the Game & Schedule',
    description: 'Everything you need to know about current events, Draft queues, upcoming Midweek Magic formats, and client performance improvements.',
    url: 'https://magic.wizards.com/en/news/mtg-arena',
    source: 'Wizards of the Coast',
    category: 'official',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    relativeTime: '4h ago',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/c/8/c8817585-0d32-4d56-9142-0d29512e86a9.jpg?1783930196',
    isArenaOnly: true,
    tags: ['Arena Only', 'Announcement', 'Release Notes', 'Events'],
    author: 'MTG Arena Team'
  },
  {
    id: 'off-2',
    title: 'Banned & Restricted Announcement: Standard, Pioneer, and Brawl Health Check',
    description: 'An in-depth review of competitive metagames, tournament win-rates across Standard and Pioneer, and matchmaking balance for top-tier Brawl commanders.',
    url: 'https://magic.wizards.com/en/news/announcements',
    source: 'Wizards of the Coast',
    category: 'official',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    relativeTime: 'Yesterday',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/3/4/3462a3d0-5552-49fa-9eb7-100960c55891.jpg?1783932594',
    isArenaOnly: false,
    tags: ['B&R', 'Format Health', 'Standard', 'Brawl'],
    author: 'Play Design'
  },
  {
    id: 'off-3',
    title: 'Arena Championship: Top 16 Decklists & Metagame Breakdown',
    description: 'The world\'s best MTG Arena players battle for prizes and invitations to the Magic World Championship. Explore the breakout archetypes.',
    url: 'https://magic.wizards.com/en/events',
    source: 'Wizards of the Coast',
    category: 'official',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    relativeTime: '2d ago',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/f/a/fab2d8a9-ab4c-4225-a570-22636293c17d.jpg?1783923909',
    isArenaOnly: true,
    tags: ['Arena Only', 'Competitive', 'Decklists', 'Premier Play'],
    author: 'Coverage Team'
  },
  {
    id: 'off-4',
    title: 'Updating Our Boosters: Play Boosters, Foundations & Upcoming Secret Lairs',
    description: 'Blake Rasmussen previews upcoming mechanics, booster changes, artist showcase collaborations, and future set roadmaps coming to tabletop and MTG Arena.',
    url: 'https://magic.wizards.com/en/news',
    source: 'Wizards of the Coast',
    category: 'official',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    relativeTime: '3d ago',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/0/a/0a5718db-e67d-468a-95ba-11a08fcf9fea.jpg?1783931339',
    isArenaOnly: false,
    tags: ['Boosters', 'Previews', 'Secret Lair'],
    author: 'Blake Rasmussen'
  },
  {
    id: 'off-5',
    title: 'Midweek Magic Schedule: Historic Artisan, Momir Basic & Phantom Sealed',
    description: 'Free weekly MTG Arena events where you can test off-meta decklists and earn rare individual card rewards and cosmetic sleeves.',
    url: 'https://magic.wizards.com/en/news/mtg-arena',
    source: 'Wizards of the Coast',
    category: 'official',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    relativeTime: '4d ago',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/c/5/c5408607-af8f-48fe-bc40-32828d1976de.jpg?1783913282',
    isArenaOnly: true,
    tags: ['Arena Only', 'Midweek Magic', 'Casual', 'Rewards'],
    author: 'MTG Arena Team'
  }
];

export const CURATED_WEB_NEWS: NewsArticle[] = [
  {
    id: 'web-1',
    title: 'MTG Arena Zone: The Complete Guide to Standard Metagame & Tier List',
    description: 'Deep dive into tier rankings, win-rates, sideboard guides, and optimal wildcard craft priorities following the latest Arena set release.',
    url: 'https://mtgazone.com',
    source: 'MTG Arena Zone',
    category: 'web',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    relativeTime: '6h ago',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/d/6/d67be074-cdd4-41d9-ac89-0a0456c4e4b2.jpg?1783921327',
    isArenaOnly: true,
    tags: ['Arena Only', 'Metagame', 'Standard', 'Crafting Guide'],
    author: 'Altheriax'
  },
  {
    id: 'web-2',
    title: 'IGN: Wizards of the Coast Confirms Reprints for Popular Commander Decks',
    description: 'Wizards of the Coast officially announces additional print runs and secret drops for high-demand Commander collections.',
    url: 'https://ign.com/articles',
    source: 'IGN',
    category: 'web',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    relativeTime: '12h ago',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/8/e/8ee443cc-e17a-493b-9c93-1f9e141a30e4.jpg?1789644446',
    isArenaOnly: false,
    tags: ['Commander', 'Reprints', 'Secret Lair']
  },
  {
    id: 'web-3',
    title: 'Dot Esports: The Most Infamous Brawl Commanders on MTG Arena and Why They Rule the Hell-Queue',
    description: 'Why commanders like Kinnan, Golos, Rusko, and Atraxa get matched strictly into the Hell-Queue and how Arena\'s matchmaking weight algorithm really works.',
    url: 'https://dotesports.com/mtg',
    source: 'Dot Esports',
    category: 'web',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    relativeTime: '18h ago',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/1/0/10d42b35-844f-4a64-9981-c6118d45e826.jpg?1783915607',
    isArenaOnly: true,
    tags: ['Arena Only', 'Brawl', 'Hell-Queue', 'Matchmaking'],
    author: 'Cale Michael'
  },
  {
    id: 'web-4',
    title: 'Draftsim: Limited Tier List & Draft Archetype Pick Orders Guide',
    description: 'Full analysis of all 10 two-color archetypes, top commons in every color, and key combat tricks to prioritize for high-win Premier Draft runs.',
    url: 'https://draftsim.com',
    source: 'Draftsim',
    category: 'web',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    relativeTime: '1d ago',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.jpg?1783903008',
    isArenaOnly: false,
    tags: ['Draft', 'Limited', 'Tier List'],
    author: 'Bryan Hohns'
  },
  {
    id: 'web-5',
    title: 'MTGGoldfish: Historic Pauper & Artisan – Best Budget Decks for Arena Players',
    description: 'Competitive and high-synergy brews built exclusively with common and uncommon wildcards for budget-conscious MTG Arena grinders.',
    url: 'https://mtggoldfish.com',
    source: 'MTGGoldfish',
    category: 'web',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    relativeTime: '2d ago',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/c/3/c3f9b454-97e9-4c77-b37a-e974221ae385.jpg?1783903247',
    isArenaOnly: true,
    tags: ['Arena Only', 'Budget', 'Artisan', 'Pauper'],
    author: 'Tomer Abramovici'
  }
];

/**
 * Registry of top MTG & MTG Arena streamers and creators with their
 * verified official YouTube channel avatars, handles, and profile metadata.
 */
export const KNOWN_STREAMERS: StreamerProfile[] = [
  {
    id: 'covertgoblue',
    name: 'CovertGoBlue',
    handle: '@CovertGoBlue',
    channelName: 'CovertGoBlue',
    channelUrl: 'https://www.youtube.com/@CovertGoBlue',
    avatarUrl: 'https://yt3.googleusercontent.com/xyknadb1_VFmEmTgyVlewi5ouvx2GQNe-6wUmErlgGDKo6GejIMXAs7MCx4zV6f6YN0ggEhfDA=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'Mythic Ranked Standard Brewer',
    description: 'Premier MTG Arena competitor famous for Best-of-One meta mastery, Standard brews, and deep deck guides.',
    keywords: ['covertgoblue', 'cgb', '@covertgoblue', 'speed demon doom', 'mono-white midrange']
  },
  {
    id: 'legenvd',
    name: 'LegenVD',
    handle: '@LegenVD',
    channelName: 'LegenVD',
    channelUrl: 'https://www.youtube.com/@LegenVD',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_lKGjV19jGiHbZ6ZI-FfD6K1Qbcb7nt3a4vEtc5DqHhXzI=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'Historic Brawl & Synergy Specialist',
    description: 'Master of synergies, intricate combos, Historic Brawl Commander deck techs, and analytical gameplay commentary.',
    keywords: ['legenvd', 'lvd', '@legenvd', 'the new liliana', 'terra, magical adept']
  },
  {
    id: 'tolarian',
    name: 'Tolarian Community College',
    handle: '@TolarianCommunityCollege',
    channelName: 'Tolarian Community College',
    channelUrl: 'https://www.youtube.com/@TolarianCommunityCollege',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_k1S7f1C2weTXJyZZO-SykHaEoWeWblN_cu0szVe6cpPw=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'The Professor • Commander & Magic Hub',
    description: 'Magic\'s largest educational channel, host of Shuffle Up & Play, card reviews, and community advocacy.',
    keywords: ['tolarian', 'the professor', 'professor', 'shuffle up & play', 'shuffle up play', 'shuffle up', 'rhystic studies', '@tolariancommunitycollege']
  },
  {
    id: 'amazonian',
    name: 'Amy the Amazonian',
    handle: '@Amazonian',
    channelName: 'Amy the Amazonian',
    channelUrl: 'https://www.youtube.com/@Amazonian',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_n67jyJGkd6PZxxolx1MHbAelYOyULa0b1_PG_jxlFlFes=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'Brawl Queen & Arena Streamer',
    description: 'Top MTG Arena content creator known for high-power Historic Brawl, Hell-Queue clashes, and engaging live streams.',
    keywords: ['amazonian', 'amy the amazonian', '@amazonian']
  },
  {
    id: 'mtggoldfish',
    name: 'MTGGoldfish',
    handle: '@MTGGoldfish',
    channelName: 'MTGGoldfish',
    channelUrl: 'https://www.youtube.com/@MTGGoldfish',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_lPUFQn84lDHcw2D_BoZAOSi2YjEC1hJ4HaPue3JfYX0A=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'SaffronOlive • Against the Odds & Timeless',
    description: 'Hilarious rogue brews, Against the Odds, Commander Clash, and MTG metagame analysis.',
    keywords: ['mtggoldfish', 'saffronolive', '@mtggoldfish']
  },
  {
    id: 'crokeyz',
    name: 'Crokeyz',
    handle: '@Crokeyz',
    channelName: 'Crokeyz',
    channelUrl: 'https://www.youtube.com/@Crokeyz',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_maUXnZyNBT6iXdLUVDyyI0CjkufezAVLn8rAd_UVanF1E=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: '#1 Mythic Arena Grinder & Competitor',
    description: 'Elite competitive MTG Arena streamer dominating Mythic ladders with control decks, meta tuning, and pro insights.',
    keywords: ['crokeyz', '@crokeyz']
  },
  {
    id: 'jimdavis',
    name: 'Jim Davis',
    handle: '@JimDavisMTG',
    channelName: 'Jim Davis MTG',
    channelUrl: 'https://www.youtube.com/@JimDavisMTG',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kfkppHPotknDxkF3_31-ptvEFml7g9UptS_ptYL4t7NmE=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'Pro Tour Champion • Bronze to Mythic',
    description: 'Pro Tour champion and competitive educator, creator of the Bronze to Mythic series.',
    keywords: ['jim davis', 'jimdavis', '@jimdavismtg', 'bronze to mythic']
  },
  {
    id: 'numot',
    name: 'NumotTheNummy',
    handle: '@NumotTheNummy',
    channelName: 'NumotTheNummy',
    channelUrl: 'https://www.youtube.com/@NumotTheNummy',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kBjOQmOj1ipNP3HDXGIe6m3LlQ95rCGRbWFE8VrVETcM0=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'Kenji Egashira • Limited & Draft Master',
    description: 'MTG Arena Limited authority streaming daily Premier Draft 7-0 trophies and set tier reviews.',
    keywords: ['numot', 'numotthenummy', 'kenji egashira', '@numotthenummy']
  },
  {
    id: 'ashlizzlle',
    name: 'Ashlizzlle',
    handle: '@Ashlizzlle',
    channelName: 'Ashlizzlle',
    channelUrl: 'https://www.youtube.com/@Ashlizzlle',
    avatarUrl: 'https://yt3.googleusercontent.com/B5rPnYansimkWC_qcLJ4XJF1EbtZ8IiJUcpTjUixmd_PHNB2Kt_J091F1JJApqKuRsrz6rJ25g=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'Competitive Standard & Explorer Pro',
    description: 'Fast-paced MTG Arena competitive gameplay, tournament prep, and metagame breakdowns.',
    keywords: ['ashlizzlle', '@ashlizzlle', 'broke lifegain']
  },
  {
    id: 'monoblackmagic',
    name: 'Mono Black Magic',
    handle: '@monoblackmagic',
    channelName: 'Mono Black Magic',
    channelUrl: 'https://www.youtube.com/@monoblackmagic',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nsKxCbHTwOX-cqv5tqwAs78E2AKUbLgRVTBt4QXIYTkAk=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'Jank Combo Master & Arena Rogue Decks',
    description: 'Explosive combo finishes, hilarious rogue decks, and unpredictable MTG Arena gameplay.',
    keywords: ['mono black magic', 'monoblackmagic', '@monoblackmagic']
  },
  {
    id: 'commandzone',
    name: 'The Command Zone',
    handle: '@TheCommandZone',
    channelName: 'The Command Zone',
    channelUrl: 'https://www.youtube.com/@TheCommandZone',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kv4z-V6KwAGSn3SWfb4FJ7z7aqLz6p9-efd0xTy-0wiw=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'Game Knights & Commander Showcases',
    description: 'The definitive Commander video podcast and Game Knights production team.',
    keywords: ['command zone', 'the command zone', 'game knights', '@thecommandzone']
  },
  {
    id: 'hellogoodgame',
    name: 'Hello Good Game',
    handle: '@HelloGoodGame',
    channelName: 'Hello Good Game',
    channelUrl: 'https://www.youtube.com/@HelloGoodGame',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nFNvNuG7aMJHCjEoKdUU5B7ItqeipOb__mBieeBo536ko=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'Daily F2P Deck Guides & Budget Builds',
    description: 'Daily MTG Arena deck guides focusing on budget wildcards and F2P ladder progression.',
    keywords: ['hello good game', 'hellogoodgame', 'hgg', '@hellogoodgame']
  },
  {
    id: 'slothmtg',
    name: 'Sloth MTG',
    handle: '@SlothMtg',
    channelName: 'Sloth MTG',
    channelUrl: 'https://www.youtube.com/@SlothMtg',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nWiTPQV_b_kjwmRZ6b4uwViBHays2odCr3Ui2Jy4nbyw=s900-c-k-c0x00ffffff-no-rj',
    verified: true,
    role: 'Historic & Timeless Synergy Brewer',
    description: 'Clever non-meta interactions, intricate engines, and deep-dive MTG Arena deck techs.',
    keywords: ['sloth', 'slothmtg', '@slothmtg']
  }
];

/**
 * Searches and returns the matching streamer profile based on title, source,
 * channel name, author, or video URL. Strictly matches known MTG creators.
 */
export function findStreamerForArticle(
  title: string = '',
  source: string = '',
  channelName: string = '',
  author: string = '',
  url: string = ''
): StreamerProfile | undefined {
  const combined = `${title} ${source} ${channelName} ${author} ${url}`.toLowerCase();
  for (const streamer of KNOWN_STREAMERS) {
    if (streamer.keywords.some(kw => combined.includes(kw.toLowerCase()))) {
      return streamer;
    }
  }
  return undefined;
}

const getStreamerById = (id: string): StreamerProfile | undefined =>
  KNOWN_STREAMERS.find(s => s.id === id);

export const CURATED_VIDEO_NEWS: NewsArticle[] = [
  {
    id: 'vid-1',
    title: 'CovertGoBlue: REALITY FRACTURE BROKE STANDARD! Mono-White Midrange is UNSTOPPABLE',
    description: 'Testing the most explosive new spells in Mythic Ranked MTG Arena. See how the new interaction and token engines dominate the field.',
    url: 'https://www.youtube.com/watch?v=covertgoblue-latest',
    source: 'CovertGoBlue',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    relativeTime: '3h ago',
    imageUrl: 'https://yt3.googleusercontent.com/xyknadb1_VFmEmTgyVlewi5ouvx2GQNe-6wUmErlgGDKo6GejIMXAs7MCx4zV6f6YN0ggEhfDA=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: true,
    tags: ['Arena Only', 'Standard', 'Ranked', 'Mythic Gameplay', 'CovertGoBlue'],
    channelName: 'CovertGoBlue',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/xyknadb1_VFmEmTgyVlewi5ouvx2GQNe-6wUmErlgGDKo6GejIMXAs7MCx4zV6f6YN0ggEhfDA=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@CovertGoBlue',
    streamer: getStreamerById('covertgoblue'),
    duration: '32:15',
    views: '45K views'
  },
  {
    id: 'vid-2',
    title: 'LegenVD: Terra, Magical Adept Is PURE VALUE! | Historic Brawl Deck Guide',
    description: 'Detailed deck tech, mulligan strategies, and full gameplay matches featuring the new Commander synergy machine on MTG Arena.',
    url: 'https://www.youtube.com/watch?v=legenvd-brawl',
    source: 'LegenVD',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    relativeTime: '8h ago',
    imageUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_lKGjV19jGiHbZ6ZI-FfD6K1Qbcb7nt3a4vEtc5DqHhXzI=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: true,
    tags: ['Arena Only', 'Brawl', 'Deck Tech', 'Historic Brawl', 'LegenVD'],
    channelName: 'LegenVD',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_lKGjV19jGiHbZ6ZI-FfD6K1Qbcb7nt3a4vEtc5DqHhXzI=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@LegenVD',
    streamer: getStreamerById('legenvd'),
    duration: '28:40',
    views: '28K views'
  },
  {
    id: 'vid-3',
    title: 'Tolarian Community College: Shuffle Up & Play 111 – Planar Themed Commander Decks',
    description: 'The Professor is joined by Rhystic Studies for an epic game of paper Commander featuring wild board states and alternate win conditions.',
    url: 'https://www.youtube.com/watch?v=tolarian-shuffle-up',
    source: 'Tolarian Community College',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
    relativeTime: '16h ago',
    imageUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_k1S7f1C2weTXJyZZO-SykHaEoWeWblN_cu0szVe6cpPw=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: false,
    tags: ['Commander', 'Shuffle Up & Play', 'Tabletop', 'Tolarian Community College'],
    channelName: 'Tolarian Community College',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_k1S7f1C2weTXJyZZO-SykHaEoWeWblN_cu0szVe6cpPw=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@TolarianCommunityCollege',
    streamer: getStreamerById('tolarian'),
    duration: '52:10',
    views: '110K views'
  },
  {
    id: 'vid-4',
    title: 'Amy the Amazonian: Historic Brawl Hell-Queue Grudge Match – Kinnan vs Golos',
    description: 'High power Historic Brawl showdown testing format-defining Game Changers: The One Ring, Mana Drain, and explosive combo finishes.',
    url: 'https://www.youtube.com/watch?v=amazonian-hell-queue',
    source: 'Amy the Amazonian',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    relativeTime: '22h ago',
    imageUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_n67jyJGkd6PZxxolx1MHbAelYOyULa0b1_PG_jxlFlFes=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: true,
    tags: ['Arena Only', 'Brawl', 'Hell-Queue', 'Game Changers', 'Amy the Amazonian'],
    channelName: 'Amy the Amazonian',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_n67jyJGkd6PZxxolx1MHbAelYOyULa0b1_PG_jxlFlFes=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@Amazonian',
    streamer: getStreamerById('amazonian'),
    duration: '41:10',
    views: '22K views'
  },
  {
    id: 'vid-4b',
    title: 'Amy the Amazonian: Ranking EVERY Reality Fracture Commander For Historic Brawl!',
    description: 'Full tier list evaluation of all new commanders from Reality Fracture, complete with build paths, key synergy staples, and power ranking.',
    url: 'https://www.youtube.com/watch?v=amazonian-tier-list',
    source: 'Amy the Amazonian',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    relativeTime: '1d ago',
    imageUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_n67jyJGkd6PZxxolx1MHbAelYOyULa0b1_PG_jxlFlFes=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: true,
    tags: ['Arena Only', 'Brawl', 'Tier List', 'Commander', 'Amy the Amazonian'],
    channelName: 'Amy the Amazonian',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_n67jyJGkd6PZxxolx1MHbAelYOyULa0b1_PG_jxlFlFes=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@Amazonian',
    streamer: getStreamerById('amazonian'),
    duration: '48:30',
    views: '34K views'
  },
  {
    id: 'vid-5',
    title: 'MTGGoldfish: SaffronOlive "Against the Odds" – Turn 3 Infinite Combo in Timeless',
    description: 'Can we pull off a ridiculous combo in MTG Arena\'s most powerful format with 0 wildcards wasted? Watch the chaos unfold!',
    url: 'https://www.youtube.com/watch?v=saffronolive-timeless',
    source: 'MTGGoldfish',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    relativeTime: '1d ago',
    imageUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_lPUFQn84lDHcw2D_BoZAOSi2YjEC1hJ4HaPue3JfYX0A=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: true,
    tags: ['Arena Only', 'Timeless', 'Against the Odds', 'Combo', 'MTGGoldfish'],
    channelName: 'MTGGoldfish',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_lPUFQn84lDHcw2D_BoZAOSi2YjEC1hJ4HaPue3JfYX0A=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@MTGGoldfish',
    streamer: getStreamerById('mtggoldfish'),
    duration: '45:22',
    views: '65K views'
  },
  {
    id: 'vid-6',
    title: 'Crokeyz: Grinding To Mythic #1 with Reality Fracture Domain Control',
    description: 'Full competitive ladder session with in-depth commentary on sideboarding, curve priorities, and match-up lines in the current Arena metagame.',
    url: 'https://www.youtube.com/watch?v=crokeyz-stream',
    source: 'Crokeyz',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString(),
    relativeTime: '1d ago',
    imageUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_maUXnZyNBT6iXdLUVDyyI0CjkufezAVLn8rAd_UVanF1E=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: true,
    tags: ['Arena Only', 'Ranked', 'Standard', 'Pro Stream', 'Crokeyz'],
    channelName: 'Crokeyz',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_maUXnZyNBT6iXdLUVDyyI0CjkufezAVLn8rAd_UVanF1E=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@Crokeyz',
    streamer: getStreamerById('crokeyz'),
    duration: '1:12:00',
    views: '35K views'
  },
  {
    id: 'vid-7',
    title: 'Jim Davis: Bronze to Mythic – Climbing Ranked Ladder with Mono-Red Burn',
    description: 'Full draft-to-constructed ladder run with key mulligan tips, match evaluation, and optimal sequencing on MTG Arena.',
    url: 'https://www.youtube.com/watch?v=jimdavis-bronze-mythic',
    source: 'Jim Davis MTG',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
    relativeTime: '2d ago',
    imageUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kfkppHPotknDxkF3_31-ptvEFml7g9UptS_ptYL4t7NmE=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: true,
    tags: ['Arena Only', 'Bronze to Mythic', 'Standard', 'Jim Davis MTG'],
    channelName: 'Jim Davis MTG',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kfkppHPotknDxkF3_31-ptvEFml7g9UptS_ptYL4t7NmE=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@JimDavisMTG',
    streamer: getStreamerById('jimdavis'),
    duration: '38:45',
    views: '31K views'
  },
  {
    id: 'vid-8',
    title: 'NumotTheNummy: 7-0 TROPHY RUN! Reality Fracture Premier Draft Archetype Masterclass',
    description: 'Kenji drafts an undefeated Dimir tempo deck in Arena Premier Draft, demonstrating pick orders and combat math.',
    url: 'https://www.youtube.com/watch?v=numot-draft-trophy',
    source: 'NumotTheNummy',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    relativeTime: '2d ago',
    imageUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kBjOQmOj1ipNP3HDXGIe6m3LlQ95rCGRbWFE8VrVETcM0=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: true,
    tags: ['Arena Only', 'Limited', 'Draft', 'Trophy', 'NumotTheNummy'],
    channelName: 'NumotTheNummy',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kBjOQmOj1ipNP3HDXGIe6m3LlQ95rCGRbWFE8VrVETcM0=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@NumotTheNummy',
    streamer: getStreamerById('numot'),
    duration: '49:18',
    views: '25K views'
  },
  {
    id: 'vid-9',
    title: 'Mono Black Magic: "They NEVER Saw This Coming!" Infinite Combo in Historic MTG Arena',
    description: 'Cooking the most disrespectful rogue brew imaginable on MTG Arena and watching opponents explode.',
    url: 'https://www.youtube.com/watch?v=monoblack-infinite',
    source: 'Mono Black Magic',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
    relativeTime: '3d ago',
    imageUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nsKxCbHTwOX-cqv5tqwAs78E2AKUbLgRVTBt4QXIYTkAk=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: true,
    tags: ['Arena Only', 'Historic', 'Jank', 'Combo', 'Mono Black Magic'],
    channelName: 'Mono Black Magic',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nsKxCbHTwOX-cqv5tqwAs78E2AKUbLgRVTBt4QXIYTkAk=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@monoblackmagic',
    streamer: getStreamerById('monoblackmagic'),
    duration: '34:50',
    views: '42K views'
  },
  {
    id: 'vid-10',
    title: 'Ashlizzlle: Reality Fracture Lifegain Combo Broke Standard! Mythic Gameplay',
    description: 'Detailed sideboard strategy and rank climbing with the most resilient lifegain engine in the current Standard metagame.',
    url: 'https://www.youtube.com/watch?v=ashlizzlle-standard',
    source: 'Ashlizzlle',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
    relativeTime: '3d ago',
    imageUrl: 'https://yt3.googleusercontent.com/B5rPnYansimkWC_qcLJ4XJF1EbtZ8IiJUcpTjUixmd_PHNB2Kt_J091F1JJApqKuRsrz6rJ25g=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: true,
    tags: ['Arena Only', 'Standard', 'Ranked', 'Competitive', 'Ashlizzlle'],
    channelName: 'Ashlizzlle',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/B5rPnYansimkWC_qcLJ4XJF1EbtZ8IiJUcpTjUixmd_PHNB2Kt_J091F1JJApqKuRsrz6rJ25g=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@Ashlizzlle',
    streamer: getStreamerById('ashlizzlle'),
    duration: '36:12',
    views: '29K views'
  },
  {
    id: 'vid-11',
    title: 'The Command Zone: Game Knights 88 – Reality Fracture Commander Showdown',
    description: 'Josh Lee Kwai and Jimmy Wong battle with new commanders, insane board states, and epic turns in high-budget EDH gameplay.',
    url: 'https://www.youtube.com/watch?v=commandzone-gameknights',
    source: 'The Command Zone',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(),
    relativeTime: '4d ago',
    imageUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kv4z-V6KwAGSn3SWfb4FJ7z7aqLz6p9-efd0xTy-0wiw=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: false,
    tags: ['Commander', 'Game Knights', 'Tabletop', 'The Command Zone'],
    channelName: 'The Command Zone',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kv4z-V6KwAGSn3SWfb4FJ7z7aqLz6p9-efd0xTy-0wiw=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@TheCommandZone',
    streamer: getStreamerById('commandzone'),
    duration: '1:04:15',
    views: '185K views'
  },
  {
    id: 'vid-12',
    title: 'Hello Good Game: Complete F2P Guide To Reality Fracture – Best Budget Arena Decks',
    description: 'Zero Rare wildcards required! Grinding the Arena ladder with competitive Common and Uncommon budget brews.',
    url: 'https://www.youtube.com/watch?v=hellogoodgame-budget',
    source: 'Hello Good Game',
    category: 'video',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(),
    relativeTime: '4d ago',
    imageUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nFNvNuG7aMJHCjEoKdUU5B7ItqeipOb__mBieeBo536ko=s900-c-k-c0x00ffffff-no-rj',
    isArenaOnly: true,
    tags: ['Arena Only', 'Budget', 'F2P', 'Wildcards', 'Hello Good Game'],
    channelName: 'Hello Good Game',
    channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nFNvNuG7aMJHCjEoKdUU5B7ItqeipOb__mBieeBo536ko=s900-c-k-c0x00ffffff-no-rj',
    channelUrl: 'https://www.youtube.com/@HelloGoodGame',
    streamer: getStreamerById('hellogoodgame'),
    duration: '27:40',
    views: '19K views'
  }
];

// In-memory cache to prevent redundant network spam and allow instant loading
const newsCache = new Map<NewsCategory, { articles: NewsArticle[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes cache

/**
 * Strips HTML tags and decode basic entities from RSS description strings.
 */
function cleanHtmlSnippet(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Extracts publication source name from title format (e.g. "Headline - Source Name").
 */
function extractSourceFromTitle(fullTitle: string, defaultSource: string): { title: string; source: string } {
  const parts = fullTitle.split(/\s+[-|—]\s+/);
  if (parts.length >= 2) {
    const source = parts[parts.length - 1].trim();
    const title = parts.slice(0, parts.length - 1).join(' - ').trim();
    return { title, source: source || defaultSource };
  }
  return { title: fullTitle, source: defaultSource };
}

interface RawFeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  content: string;
  author?: string;
  thumbnail?: string;
}

/**
 * Robust multi-tier RSS fetcher with fallback.
 * Primary: feed2json.org (high capacity, supports Google News RSS cleanly)
 * Secondary: api.rss2json.com (fallback)
 */
async function fetchRawRssFeed(queryUrl: string): Promise<RawFeedItem[]> {
  // Strategy 1: feed2json.org
  try {
    const feed2JsonUrl = `https://feed2json.org/convert?url=${encodeURIComponent(queryUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(feed2JsonUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map((item: any) => ({
          title: item.title || '',
          link: item.url || item.guid || '',
          pubDate: item.date_published || item.date_modified || new Date().toISOString(),
          description: item.summary || item.content_html || '',
          content: item.content_html || item.summary || '',
          author: typeof item.author === 'string' ? item.author : item.author?.name || '',
          thumbnail: item.image || item.banner_image || ''
        }));
      }
    }
  } catch (err) {
    // continue to fallback
  }

  // Strategy 2: api.rss2json.com
  try {
    const rss2JsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(queryUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(rss2JsonUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map((item: any) => ({
          title: item.title || '',
          link: item.link || item.guid || '',
          pubDate: item.pubDate || new Date().toISOString(),
          description: item.description || '',
          content: item.content || item.description || '',
          author: item.author || '',
          thumbnail: item.thumbnail || item.enclosure?.link || ''
        }));
      }
    }
  } catch (err) {
    // continue to fallback
  }

  return [];
}

/**
 * Clears the news cache to force a fresh hourly or manual sync.
 */
export function clearNewsCache(category?: NewsCategory): void {
  if (category) {
    newsCache.delete(category);
  } else {
    newsCache.clear();
  }
}

/**
 * Fetches live news articles for a specific category.
 * Queries Google News RSS through public JSON parser, parses metadata,
 * detects Arena-only tags, and merges with curated baseline articles.
 */
export async function fetchNewsArticles(category: NewsCategory, forceRefresh: boolean = false): Promise<NewsArticle[]> {
  if (forceRefresh) {
    newsCache.delete(category);
  } else {
    const cached = newsCache.get(category);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.articles;
    }
  }

  // Determine query parameters based on category
  let queryUrl = '';
  let defaultSource = 'Magic News';
  let baseline = CURATED_OFFICIAL_NEWS;

  if (category === 'official') {
    // Official news query targeting Wizards of the Coast
    queryUrl = 'https://news.google.com/rss/search?q=(site%3Amagic.wizards.com+OR+%22Wizards+of+the+Coast%22+OR+%22MTG+Arena+Announcements%22)&hl=en-US';
    defaultSource = 'Wizards of the Coast';
    baseline = CURATED_OFFICIAL_NEWS;
  } else if (category === 'web') {
    // Around the web query for gaming outlets and MTG articles from the last 2-3 days
    queryUrl = 'https://news.google.com/rss/search?q=(%22Magic+The+Gathering%22+OR+%22MTG+Arena%22)+when%3A3d&hl=en-US';
    defaultSource = 'Web';
    baseline = CURATED_WEB_NEWS;
  } else if (category === 'video') {
    // Video query for YouTube streams and videos from the last 7 days
    queryUrl = 'https://news.google.com/rss/search?q=site%3Ayoutube.com+(%22Magic+The+Gathering%22+OR+%22MTG+Arena%22)+when%3A7d&hl=en-US';
    defaultSource = 'YouTube';
    baseline = CURATED_VIDEO_NEWS;
  }

  try {
    const rawItems = await fetchRawRssFeed(queryUrl);

    if (rawItems.length > 0) {
      const liveArticles: NewsArticle[] = rawItems
        .map((item: RawFeedItem, idx: number): NewsArticle | null => {
          const { title, source } = extractSourceFromTitle(item.title || '', defaultSource);
          const description = cleanHtmlSnippet(item.description || item.content || '');
          const pubDate = item.pubDate || new Date().toISOString();
          const isArenaOnly = detectIsArenaOnly(title, description, source);

          const detectedStreamer = category === 'video' || item.link?.includes('youtube.com')
            ? findStreamerForArticle(title, source, '', item.author, item.link)
            : undefined;

          // In the video hub, every video MUST belong to an identified streamer/channel
          if (category === 'video' && !detectedStreamer) {
            return null;
          }

          // Tags generation
          const tags: string[] = [];
          if (isArenaOnly) tags.push('Arena Only');
          if (title.toLowerCase().includes('brawl')) tags.push('Brawl');
          if (title.toLowerCase().includes('standard')) tags.push('Standard');
          if (title.toLowerCase().includes('timeless')) tags.push('Timeless');
          if (title.toLowerCase().includes('draft') || title.toLowerCase().includes('limited')) tags.push('Draft');
          if (title.toLowerCase().includes('announcement') || title.toLowerCase().includes('update')) tags.push('Announcement');
          if (title.toLowerCase().includes('commander')) tags.push('Commander');
          if (category === 'video') tags.push('Video');
          if (detectedStreamer) tags.push(detectedStreamer.name);

          // Extract image from article or fallback to authentic MTG topic art
          let imageUrl = item.thumbnail || '';

          // 1. Try to extract embedded <img> from description or content
          if (!imageUrl) {
            const rawHtml = `${item.description || ''} ${item.content || ''}`;
            const imgMatch = rawHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch && imgMatch[1] && !imgMatch[1].includes('pixel') && !imgMatch[1].includes('clear.gif') && !imgMatch[1].includes('favicon')) {
              imageUrl = imgMatch[1];
            }
          }

          // 2. Try to extract YouTube thumbnail if link points to YouTube
          if (!imageUrl && (item.link?.includes('youtube.com') || item.link?.includes('youtu.be'))) {
            const ytMatch = item.link.match(/(?:v=|youtu\.be\/|embed\/)([^&?\/]+)/);
            if (ytMatch && ytMatch[1]) {
              imageUrl = `https://i.ytimg.com/vi/${ytMatch[1]}/hqdefault.jpg`;
            }
          }

          // 3. For video articles, use detected streamer avatar
          if (category === 'video' && detectedStreamer && (!imageUrl || imageUrl.includes('unsplash') || imageUrl.includes('placeholder'))) {
            imageUrl = detectedStreamer.avatarUrl;
          }

          // 4. If still missing or generic, resolve authentic MTG card art based on the article's topic & title!
          if (!imageUrl || imageUrl.includes('unsplash') || imageUrl.includes('placeholder')) {
            imageUrl = resolveTopicArt(title, description, tags);
          }

          return {
            id: `live-${category}-${idx}-${encodeURIComponent(title.slice(0, 15))}`,
            title,
            description: description || `Latest coverage from ${detectedStreamer?.name || source}. Click to watch.`,
            url: item.link || '#',
            source: detectedStreamer ? detectedStreamer.name : (source || defaultSource),
            category,
            publishedAt: pubDate,
            relativeTime: formatRelativeTime(pubDate),
            imageUrl,
            isArenaOnly,
            tags: tags.length > 0 ? tags : [isArenaOnly ? 'Arena Only' : 'Magic'],
            author: item.author || detectedStreamer?.name || undefined,
            channelName: detectedStreamer ? detectedStreamer.name : (category === 'video' ? source : undefined),
            channelAvatarUrl: detectedStreamer?.avatarUrl,
            channelUrl: detectedStreamer?.channelUrl,
            streamer: detectedStreamer
          };
        })
        .filter((a): a is NewsArticle => a !== null);

      // Seamlessly combine live articles with curated baseline
      const combined = [...liveArticles];
      const seenTitles = new Set(liveArticles.map(a => a.title.toLowerCase().trim()));

      for (const cur of baseline) {
        if (!seenTitles.has(cur.title.toLowerCase().trim())) {
          combined.push(cur);
          seenTitles.add(cur.title.toLowerCase().trim());
        }
      }

      newsCache.set(category, { articles: combined, timestamp: Date.now() });
      return combined;
    }
  } catch (err) {
    console.warn(`Live news fetch failed for ${category}, falling back to curated feed:`, err);
  }

  // Graceful fallback to rich curated items
  newsCache.set(category, { articles: baseline, timestamp: Date.now() });
  return baseline;
}
