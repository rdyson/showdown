// Deploy val.ts to Val Town
// Uses @valtown/sdk — requires VAL_TOWN_API_KEY env var (val:read + val:write scopes)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import ValTown from '@valtown/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(join(__dirname, '../val.ts'), 'utf8');

const VAL_NAME = 'showdown';
const USERNAME = 'rdyson';

const client = new ValTown(); // reads VAL_TOWN_API_KEY from env

console.log(`Looking up @${USERNAME}/${VAL_NAME}...`);
const val = await client.alias.username.valName.retrieve(VAL_NAME, { username: USERNAME });
console.log(`Found val: ${val.id}`);

console.log('Updating val.ts...');
await client.vals.files.update(val.id, {
  path: 'val.ts',
  content: code,
});

console.log(`✓ Deployed to Val Town: https://www.val.town/v/${USERNAME}/${VAL_NAME}`);
