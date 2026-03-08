// Deploy val.ts to Val Town
// Uses @valtown/sdk — requires VAL_TOWN_API_KEY env var (val:read + val:write scopes)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import ValTown from '@valtown/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(join(__dirname, '../val.ts'), 'utf8');

const VAL_NAME = 'showdown';

const client = new ValTown(); // reads VAL_TOWN_API_KEY from env

console.log(`Looking up val named "${VAL_NAME}"...`);
let val;
for await (const v of client.me.vals.list({})) {
  if (v.name === VAL_NAME) { val = v; break; }
}
if (!val) throw new Error(`Could not find a val named "${VAL_NAME}" in your account`);
console.log(`Found val: ${val.id}`);

console.log('Updating val.ts...');
await client.vals.files.update(val.id, {
  path: 'val.ts',
  content: code,
});

console.log(`✓ Deployed to Val Town: https://www.val.town/v/rdyson/${VAL_NAME}`);
