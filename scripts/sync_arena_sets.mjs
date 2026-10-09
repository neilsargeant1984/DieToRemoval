/**
 * Automated MTG Arena Sets & Art Sync Script
 * Queries the Scryfall API, detects new expansions and Arena-playable sets,
 * resolves panoramic key artwork, and updates src/data/arenaSets.ts and src/data/arenaSetArt.ts.
 * 
 * Can be run locally or inside a GitHub Action cron schedule.
 */

import fs from 'node:fs';
import path from 'node:path';

const SCRYFALL_SETS_URL = 'https://api.scryfall.com/sets';
const SCRYFALL_HEADERS = {
  'User-Agent': 'DietoRemoval-SyncBot/1.0 (https://dietoremoval.com)',
  'Accept': 'application/json'
};

const arenaSetsFilePath = path.resolve('src/data/arenaSets.ts');
const arenaSetArtFilePath = path.resolve('src/data/arenaSetArt.ts');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: SCRYFALL_HEADERS });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed with HTTP ${res.status}`);
  }
  return res.json();
}

async function fetchTopArtCrop(setCode) {
  try {
    const query = `set:${setCode.toLowerCase()} (t:planeswalker or r:mythic or r:rare)`;
    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=edhrec`;
    const data = await fetchJson(url);
    if (data?.data?.[0]?.image_uris?.art_crop) {
      return {
        name: data.data[0].name,
        artCrop: data.data[0].image_uris.art_crop
      };
    }
  } catch (err) {
    console.warn(`Could not fetch top art crop for set ${setCode}:`, err.message);
  }
  return null;
}

async function main() {
  console.log('🔄 Fetching sets from Scryfall API...');
  const setsData = await fetchJson(SCRYFALL_SETS_URL);
  if (!setsData?.data) {
    throw new Error('Invalid Scryfall response');
  }

  // Filter relevant MTG Arena sets (exclude tokens, promos, memorabilia, and legacy paper-only sets)
  const candidates = setsData.data.filter(s => {
    if (['token', 'promo', 'memorabilia', 'funny', 'minigame'].includes(s.set_type)) return false;
    // Must be either an explicit Arena set (has arena_code or digital alchemy)
    // or a premier expansion/core set from recent/upcoming years (2025+)
    const isArenaSpecific = Boolean(s.arena_code || s.digital || s.set_type === 'alchemy');
    const isModernPremier = ['expansion', 'core'].includes(s.set_type) && s.released_at && s.released_at >= '2025-01-01';
    return (isArenaSpecific || isModernPremier) && s.code && s.name && s.released_at;
  });

  console.log(`Found ${candidates.length} candidate sets from Scryfall.`);

  // Read current arenaSets.ts
  const currentSetsContent = fs.readFileSync(arenaSetsFilePath, 'utf-8');
  const existingSetCodes = new Set();
  const codeRegex = /code:\s*['"]([A-Za-z0-9_]+)['"]/g;
  let match;
  while ((match = codeRegex.exec(currentSetsContent)) !== null) {
    existingSetCodes.add(match[1].toUpperCase());
  }

  console.log(`Currently tracking ${existingSetCodes.size} sets in arenaSets.ts.`);

  // Find newly released or upcoming sets that aren't tracked yet
  const newSets = [];
  for (const s of candidates) {
    const codeUpper = s.code.toUpperCase();
    if (!existingSetCodes.has(codeUpper)) {
      let category = 'standard';
      if (s.set_type === 'alchemy') category = 'alchemy';
      else if (s.set_type === 'masters' || s.name.toLowerCase().includes('remastered')) category = 'remastered';

      const releaseYear = s.released_at ? parseInt(s.released_at.slice(0, 4), 10) : new Date().getFullYear();

      newSets.push({
        code: codeUpper,
        name: s.name,
        category,
        releaseYear,
        releaseDate: s.released_at
      });
    }
  }

  if (newSets.length === 0) {
    console.log('✅ All sets are up to date! No new sets detected.');
    return;
  }

  // Sort newly detected sets descending by release date
  newSets.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  console.log(`✨ Found ${newSets.length} new set(s) to add:`, newSets.map(s => `${s.code} (${s.name})`).join(', '));

  // Fetch art for new sets (with polite rate limiting)
  const newSetArts = {};
  for (const s of newSets) {
    console.log(`🎨 Fetching key banner artwork for ${s.code}...`);
    await wait(120); // Respect Scryfall 100ms rate limit
    const art = await fetchTopArtCrop(s.code);
    if (art) {
      newSetArts[s.code] = art;
      console.log(`  -> Found art: "${art.name}"`);
    }
  }

  // Update arenaSets.ts
  let updatedSetsContent = currentSetsContent;
  const insertMarker = 'export const ARENA_SETS: ArenaSet[] = [\n';
  const insertIndex = updatedSetsContent.indexOf(insertMarker);

  if (insertIndex !== -1) {
    const setEntries = newSets.map(s => 
      `  { code: '${s.code}', name: ${JSON.stringify(s.name)}, category: '${s.category}', releaseYear: ${s.releaseYear}, releaseDate: '${s.releaseDate}' },`
    ).join('\n');

    updatedSetsContent = 
      updatedSetsContent.slice(0, insertIndex + insertMarker.length) +
      setEntries + '\n' +
      updatedSetsContent.slice(insertIndex + insertMarker.length);

    fs.writeFileSync(arenaSetsFilePath, updatedSetsContent, 'utf-8');
    console.log(`💾 Successfully updated ${arenaSetsFilePath}`);
  }

  // Update arenaSetArt.ts
  if (Object.keys(newSetArts).length > 0) {
    let currentArtContent = fs.readFileSync(arenaSetArtFilePath, 'utf-8');
    const artMarker = 'export const ARENA_SET_ART: Record<string, { name: string; artCrop: string }> = {\n';
    const artIndex = currentArtContent.indexOf(artMarker);

    if (artIndex !== -1) {
      const artEntries = Object.entries(newSetArts).map(([code, item]) => 
        `  "${code}": {\n    "name": ${JSON.stringify(item.name)},\n    "artCrop": ${JSON.stringify(item.artCrop)}\n  },`
      ).join('\n');

      currentArtContent = 
        currentArtContent.slice(0, artIndex + artMarker.length) +
        artEntries + '\n' +
        currentArtContent.slice(artIndex + artMarker.length);

      fs.writeFileSync(arenaSetArtFilePath, currentArtContent, 'utf-8');
      console.log(`💾 Successfully updated ${arenaSetArtFilePath}`);
    }
  }

  console.log('🎉 Sync completed successfully!');
}

main().catch(err => {
  console.error('❌ Error during set sync:', err);
  process.exit(1);
});
