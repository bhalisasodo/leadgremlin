import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public');
const DOCS_DIR = path.resolve('docs');

console.log('🔄 Syncing frontend assets from public/ -> docs/...');

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

const filesToCopy = fs.readdirSync(PUBLIC_DIR);

let count = 0;
for (const file of filesToCopy) {
  const srcFile = path.join(PUBLIC_DIR, file);
  const destFile = path.join(DOCS_DIR, file);

  const stat = fs.statSync(srcFile);
  if (stat.isFile()) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`  ✓ Copied ${file} -> docs/${file}`);
    count++;
  }
}

console.log(`✨ Successfully synchronized ${count} assets from public/ to docs/!\n`);
