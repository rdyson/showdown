// Deploy val.ts to Val Town via REST API
// Requires VAL_TOWN_API_KEY env var (val:read + val:write scopes)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(join(__dirname, '../val.ts'), 'utf8');

const VAL_NAME = 'showdown';
const API = 'https://api.val.town/v2';
const token = process.env.VAL_TOWN_API_KEY;
if (!token) throw new Error('VAL_TOWN_API_KEY not set');

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};

// Find the val by name
console.log(`Looking up val "${VAL_NAME}"...`);
const listRes = await fetch(`${API}/me/vals?limit=100`, { headers });
if (!listRes.ok) throw new Error(`Failed to list vals: ${listRes.status} ${await listRes.text()}`);
const { data: vals } = await listRes.json();
const val = vals.find(v => v.name === VAL_NAME);
if (!val) throw new Error(`Could not find a val named "${VAL_NAME}". Available: ${vals.map(v => v.name).join(', ')}`);
console.log(`Found val: ${val.id}`);

// Update val.ts
console.log('Updating val.ts...');
const updateRes = await fetch(`${API}/vals/${val.id}/files?path=val.ts`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({ content: code }),
});
if (!updateRes.ok) throw new Error(`Failed to update file: ${updateRes.status} ${await updateRes.text()}`);

console.log(`✓ Deployed to Val Town: https://www.val.town/v/rdyson/${VAL_NAME}`);
