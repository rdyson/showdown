import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourcePath = path.join(rootDir, 'index.html');
const targetPath = path.join(rootDir, 'val.ts');
const checkOnly = process.argv.includes('--check');

function escapeForTemplateLiteral(input) {
  return input.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

const html = fs.readFileSync(sourcePath, 'utf8');
const escaped = escapeForTemplateLiteral(html);

const generated = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.\n// Source: index.html\n\nexport default async function(_req: Request): Promise<Response> {\n  return new Response(\n\`${escaped}\`,\n    {\n      headers: { 'content-type': 'text/html; charset=utf-8' },\n    }\n  );\n}\n`;

if (checkOnly) {
  const current = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
  if (current !== generated) {
    console.error('val.ts is out of sync with index.html. Run: npm run build:val');
    process.exit(1);
  }
  console.log('val.ts is in sync with index.html.');
  process.exit(0);
}

fs.writeFileSync(targetPath, generated);
console.log('Generated val.ts from index.html');
