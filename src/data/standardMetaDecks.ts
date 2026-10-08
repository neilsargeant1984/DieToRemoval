import { ManaColor } from '../types/card';

export interface StandardMetaDeckMeta {
  id: string;
  name: string;
  tier: 'Tier 1' | 'Tier 2' | 'Fringe';
  winrate: string;
  metaShare: string;
  archetype: 'Aggro' | 'Midrange' | 'Control' | 'Ramp' | 'Combo';
  colors: ManaColor[];
  description: string;
  keyCards: string[];
  arenaExportText: string;
}

export const STANDARD_META_DECKS: StandardMetaDeckMeta[] = [
  {
    id: 'gruul-prowess',
    name: 'Gruul Prowess',
    tier: 'Tier 1',
    winrate: '58.8%',
    metaShare: '14.5%',
    archetype: 'Aggro',
    colors: ['R', 'G'],
    description: 'Blistering fast red-green aggro fueled by Slickshot Show-Off, Heartfire Hero, and Monstrous Rage.',
    keyCards: ['Slickshot Show-Off', 'Heartfire Hero', 'Monstrous Rage', 'Emberheart Challenger'],
    arenaExportText: `Deck
4 Slickshot Show-Off (OTJ) 145
4 Heartfire Hero (BLB) 138
4 Monastery Swiftspear (BRO) 144
4 Emberheart Challenger (BLB) 133
4 Questing Druid (WOE) 234
4 Monstrous Rage (WOE) 142
4 Turn Inside Out (DSK) 160
4 Shock (MKM) 144
3 Snakeskin Veil (OTJ) 181
4 Copperline Gorge (ONE) 249
4 Karplusan Forest (DMU) 250
2 Rockface Village (BLB) 259
9 Mountain (DMU) 280
6 Forest (DMU) 281

Sideboard
2 Obliterating Bolt (BRO) 145
2 Torch the Tower (WOE) 153
2 Pawpatch Formation (BLB) 186
2 Brotherhood's End (BRO) 128
2 Urabrask's Forge (ONE) 153
2 Pick Your Poison (MKM) 170
3 Magebane Lizard (OTJ) 134`
  },
  {
    id: 'dimir-midrange',
    name: 'Dimir Midrange',
    tier: 'Tier 1',
    winrate: '57.5%',
    metaShare: '13.0%',
    archetype: 'Midrange',
    colors: ['U', 'B'],
    description: 'Ruthless tempo disruption combining Deep-Cavern Bat, efficient spot removal, and Kaito/Sheoldred closers.',
    keyCards: ['Deep-Cavern Bat', 'Sheoldred, the Apocalypse', 'Kaito, Bane of Nightmares', 'Cut Down'],
    arenaExportText: `Deck
4 Deep-Cavern Bat (LCI) 102
4 Faerie Mastermind (MOM) 58
3 Preacher of the Schism (LCI) 113
2 Gix, Yawgmoth Praetor (BRO) 95
2 Sheoldred, the Apocalypse (DMU) 107
4 Cut Down (DMU) 89
4 Go for the Throat (BRO) 102
2 Bitter Triumph (LCI) 91
3 Make Disappear (SNC) 49
3 Phantom Interference (OTJ) 61
3 Kaito, Bane of Nightmares (DSK) 220
4 Darkslick Shores (ONE) 250
4 Underground River (BRO) 267
2 Restless Anchorage (LCI) 280
2 Demolition Field (BRO) 260
7 Swamp (DMU) 279
7 Island (DMU) 278

Sideboard
3 Duress (ONE) 92
2 Negate (MOM) 68
2 Tishana's Tidebinder (LCI) 81
2 Disdainful Stroke (WOE) 47
2 Gix's Command (BRO) 97
2 Malicious Eclipse (LCI) 111
2 Spell Pierce (NEO) 80`
  },
  {
    id: 'golgari-midrange',
    name: 'Golgari Midrange',
    tier: 'Tier 1',
    winrate: '56.9%',
    metaShare: '11.2%',
    archetype: 'Midrange',
    colors: ['B', 'G'],
    description: 'Resilient attrition archetype packing Mosswood Dreadknight, Glissa Sunslayer, and devastating removal.',
    keyCards: ['Mosswood Dreadknight', 'Glissa Sunslayer', 'Preacher of the Schism', 'Restless Cottage'],
    arenaExportText: `Deck
4 Mosswood Dreadknight (WOE) 231
4 Deep-Cavern Bat (LCI) 102
3 Glissa Sunslayer (ONE) 202
3 Preacher of the Schism (LCI) 113
2 Sheoldred, the Apocalypse (DMU) 107
4 Cut Down (DMU) 89
4 Go for the Throat (BRO) 102
2 Tear Asunder (DMU) 183
2 Liliana of the Veil (DMU) 97
3 Sentinel of the Nameless City (LCI) 211
3 Restless Cottage (WOE) 258
4 Llanowar Wastes (BRO) 264
4 Overgrown Tomb (GRN) 253
2 Cavern of Souls (LCI) 269
7 Swamp (DMU) 279
6 Forest (DMU) 281

Sideboard
3 Duress (ONE) 92
2 Tranquil Frillback (MAT) 24
2 Malicious Eclipse (LCI) 111
2 Gix's Command (BRO) 97
2 Tear Asunder (DMU) 183
2 Obstinate Baloth (BRO) 187
2 Tishana's Tidebinder (LCI) 81`
  },
  {
    id: 'mono-red-aggro',
    name: 'Mono-Red Aggro',
    tier: 'Tier 1',
    winrate: '58.2%',
    metaShare: '15.1%',
    archetype: 'Aggro',
    colors: ['R'],
    description: 'Uncompromising tournament powerhouse delivering turn 3 lethal burst with Slickshot Show-Off and Felonious Rage.',
    keyCards: ['Slickshot Show-Off', 'Heartfire Hero', 'Monstrous Rage', 'Rockface Village'],
    arenaExportText: `Deck
4 Heartfire Hero (BLB) 138
4 Slickshot Show-Off (OTJ) 145
4 Monastery Swiftspear (BRO) 144
4 Emberheart Challenger (BLB) 133
4 Monstrous Rage (WOE) 142
4 Turn Inside Out (DSK) 160
4 Shock (MKM) 144
4 Witchstalker Frenzy (WOE) 159
4 Demonic Ruckus (OTJ) 120
4 Felonious Rage (MKM) 125
4 Rockface Village (BLB) 259
16 Mountain (DMU) 280

Sideboard
3 Lithomantic Barrage (MOM) 152
2 Urabrask's Forge (ONE) 153
2 Brotherhood's End (BRO) 128
2 Torch the Tower (WOE) 153
3 Obliterating Bolt (BRO) 145
3 Sunspine Lynx (BLB) 155`
  },
  {
    id: 'boros-convoke',
    name: 'Boros Convoke',
    tier: 'Tier 1',
    winrate: '57.0%',
    metaShare: '9.8%',
    archetype: 'Aggro',
    colors: ['W', 'R'],
    description: 'Explosive swarm deck flooding the battlefield with artifact tokens and convoking Knight-Errant of Eos.',
    keyCards: ['Knight-Errant of Eos', 'Gleeful Demolition', 'Imodane\'s Recruiter', 'Warden of the Inner Sky'],
    arenaExportText: `Deck
4 Novice Inspector (MKM) 29
4 Yotian Frontliner (BRO) 42
4 Warden of the Inner Sky (LCI) 43
4 Resolute Reinforcements (DMU) 29
4 Knight-Errant of Eos (MOM) 26
4 Imodane's Recruiter (WOE) 229
4 Gleeful Demolition (ONE) 134
4 Case of the Gateway Express (MKM) 8
4 Sanguine Evangelist (LCI) 34
4 Inspiring Vantage (OTJ) 269
4 Battlefield Forge (BRO) 257
2 Mirrex (ONE) 254
8 Plains (DMU) 277
7 Mountain (DMU) 280

Sideboard
3 Get Lost (LCI) 14
2 Rest in Peace (BIG) 4
2 Destroy Evil (DMU) 17
2 Torch the Tower (WOE) 153
2 Urabrask's Forge (ONE) 153
2 Invasion of Gobakhan (MOM) 22
2 Loran of the Third Path (BRO) 12`
  },
  {
    id: 'domain-ramp',
    name: 'Domain Overlords Ramp',
    tier: 'Tier 1',
    winrate: '56.4%',
    metaShare: '8.5%',
    archetype: 'Ramp',
    colors: ['W', 'U', 'B', 'R', 'G'],
    description: 'Overwhelms the board with Overlord of the Hauntwoods, Leyline Binding, Sunfall sweepers, and Atraxa.',
    keyCards: ['Overlord of the Hauntwoods', 'Leyline Binding', 'Atraxa, Grand Unifier', 'Sunfall'],
    arenaExportText: `Deck
4 Overlord of the Hauntwoods (DSK) 194
4 Leyline Binding (DMU) 24
4 Up the Beanstalk (WOE) 195
3 Sunfall (MOM) 40
3 Archangel of Wrath (DMU) 3
2 Herd Migration (DMU) 165
4 Atraxa, Grand Unifier (ONE) 196
4 Heaped Harvest (BLB) 175
2 Temporary Lockdown (DMU) 36
4 Cavern of Souls (LCI) 269
4 Spirebluff Canal (OTJ) 270
4 Razorverge Thicket (ONE) 257
4 Restless Anchorage (LCI) 280
4 Lush Portico (MKM) 263
2 Forest (DMU) 281
4 Plains (DMU) 277

Sideboard
2 Negate (MOM) 68
2 Knockout Blow (SNC) 20
2 Obstinate Baloth (BRO) 187
2 Tranquil Frillback (MAT) 24
2 Chrome Host Seedshark (MOM) 51
2 Disdainful Stroke (WOE) 47
3 Tishana's Tidebinder (LCI) 81`
  },
  {
    id: 'azorius-control',
    name: 'Azorius Control',
    tier: 'Tier 2',
    winrate: '55.1%',
    metaShare: '7.2%',
    archetype: 'Control',
    colors: ['W', 'U'],
    description: 'Classic permission control packing No More Lies, Sunfall, Beza stabilizer, and card-draw engines.',
    keyCards: ['No More Lies', 'Sunfall', 'Beza, the Bounding Spring', 'Three Steps Ahead'],
    arenaExportText: `Deck
4 No More Lies (MKM) 221
3 Three Steps Ahead (OTJ) 75
4 Sunfall (MOM) 40
4 Get Lost (LCI) 14
3 Temporary Lockdown (DMU) 36
4 Deduce (MKM) 52
2 Beza, the Bounding Spring (BLB) 2
2 Jace, the Perfected Mind (ONE) 57
3 Horned Loch-Whale (WOE) 53
4 Seachrome Coast (ONE) 258
4 Adarkar Wastes (DMU) 243
4 Restless Anchorage (LCI) 280
4 Meticulous Archive (MKM) 264
2 Demolition Field (BRO) 260
5 Plains (DMU) 277
4 Island (DMU) 278

Sideboard
3 Negate (MOM) 68
2 Tishana's Tidebinder (LCI) 81
2 Destroy Evil (DMU) 17
2 Rest in Peace (BIG) 4
2 Knockout Blow (SNC) 20
2 Disdainful Stroke (WOE) 47
2 Chrome Host Seedshark (MOM) 51`
  },
  {
    id: 'jeskai-oculus',
    name: 'Jeskai Oculus Reanimator',
    tier: 'Tier 2',
    winrate: '55.8%',
    metaShare: '6.8%',
    archetype: 'Midrange',
    colors: ['W', 'U', 'R'],
    description: 'Discards Abhorrent Oculus and reanimates it for 1 mana with Helping Hand, generating manifest armies.',
    keyCards: ['Abhorrent Oculus', 'Helping Hand', 'Chart a Course', 'Lightning Helix'],
    arenaExportText: `Deck
4 Abhorrent Oculus (DSK) 42
4 Helping Hand (LCI) 17
4 Chart a Course (LCI) 48
4 Bitter Triumph (LCI) 91
4 Lightning Helix (MKM) 218
4 Torch the Tower (WOE) 153
4 Picklock Prankster (WOE) 64
4 Monastery Swiftspear (BRO) 144
4 Inspiring Vantage (OTJ) 269
4 Spirebluff Canal (OTJ) 270
4 Seachrome Coast (ONE) 258
4 Shivan Reef (DMU) 255
4 Adarkar Wastes (DMU) 243
4 Battlefield Forge (BRO) 257
2 Island (DMU) 278

Sideboard
3 Duress (ONE) 92
2 Negate (MOM) 68
2 Temporary Lockdown (DMU) 36
2 Sunfall (MOM) 40
2 Tishana's Tidebinder (LCI) 81
2 Disdainful Stroke (WOE) 47
2 Rest in Peace (BIG) 4`
  }
];
