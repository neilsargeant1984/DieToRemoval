import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = 'C:/Program Files/Wizards of the Coast/MTGA/MTGA_Data/Downloads/Raw/Raw_CardDatabase_8d9a18c7ea752803bb93e190da54707e.mtga';
const outputPath = path.resolve('src/data/arenaDatabase.json');

console.log('Extracting MTGA card database from:', dbPath);

try {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  
  // Extract all cards and map TitleId to English localization
  const rows = db.prepare(`
    SELECT 
      c.GrpId as id,
      c.ExpansionCode as s,
      c.CollectorNumber as n,
      l.Loc as name
    FROM Cards c
    JOIN Localizations_enUS l ON c.TitleId = l.LocId
    WHERE c.IsToken = 0
  `).all();

  console.log(`Extracted ${rows.length} cards from SQLite database.`);

  // Build compact lookup table: id -> [name, setCode, collectorNumber]
  const lookup = {};
  for (const row of rows) {
    lookup[row.id] = [row.name, row.s, row.n];
  }

  fs.writeFileSync(outputPath, JSON.stringify(lookup));
  const fileSizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  console.log(`Successfully wrote ${outputPath} (${fileSizeKB} KB).`);
} catch (err) {
  console.error('Extraction failed:', err);
  process.exit(1);
}
