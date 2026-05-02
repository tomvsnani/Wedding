#!/usr/bin/env node
/**
 * Converts HEIC/HEIF images to JPG using ffmpeg.
 *
 * Usage:
 *   node convert-photos.js              # converts in server/public/photos/
 *   node convert-photos.js ../client     # converts in client/public/photos/
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseArg = process.argv[2];
const photosRoot = baseArg
  ? path.resolve(baseArg, 'public', 'photos')
  : path.join(__dirname, 'public', 'photos');

const CONVERTIBLE = new Set(['.heic', '.heif']);

function convertFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!CONVERTIBLE.has(ext)) return false;

  const outPath = filePath.replace(/\.\w+$/, '.jpg');
  if (fs.existsSync(outPath)) {
    console.log(`  ⏭  ${path.basename(outPath)} already exists, skipping`);
    return false;
  }

  try {
    execSync(`ffmpeg -i "${filePath}" -q:v 2 "${outPath}" -y`, {
      stdio: 'pipe',
      timeout: 30000,
    });
    console.log(`  ✅ ${path.basename(filePath)} → ${path.basename(outPath)}`);
    return true;
  } catch (err) {
    console.error(`  ❌ ${path.basename(filePath)}: ${err.stderr?.toString().split('\n').pop() || err.message}`);
    return false;
  }
}

function processFolder(folder) {
  if (!fs.existsSync(folder)) return;
  const files = fs.readdirSync(folder);
  const heicFiles = files.filter(f => CONVERTIBLE.has(path.extname(f).toLowerCase()));

  if (heicFiles.length === 0) return;
  console.log(`\n📂 ${path.relative(process.cwd(), folder)} (${heicFiles.length} HEIC files)`);

  let converted = 0;
  for (const file of heicFiles) {
    const ok = convertFile(path.join(folder, file));
    if (ok) converted++;
  }
  console.log(`   ${converted} converted\n`);
}

function main() {
  // Check ffmpeg is available
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
  } catch {
    console.error('❌ ffmpeg not found. Install it first: choco install ffmpeg');
    process.exit(1);
  }

  console.log(`\n🔄 Converting HEIC → JPG in: ${photosRoot}\n`);

  if (!fs.existsSync(photosRoot)) {
    console.log('No photos folder found.');
    return;
  }

  // Process root and all subfolders
  const subfolders = fs.readdirSync(photosRoot, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(photosRoot, d.name));

  subfolders.unshift(photosRoot);

  for (const folder of subfolders) {
    processFolder(folder);
  }

  console.log('✨ Done!\n');
}

main();
