import sharp from 'sharp';
import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import path from 'path';

const SRC = 'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/images/board/sora_raw';
const DEST = 'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/images/board/sora_webp';
const R2_BUCKET = 'kfund-r2';

// File → R2 key mapping
const FILE_MAP = {
  '01-ax-sprint-semiconductor.webp': 'board/2026-ax-sprint-track.webp',
  '02-hope-return-package.webp': 'board/2026-hope-return-package.webp',
  '03-non-capital-region.webp': 'board/2026-non-capital-region.webp',
  '04-policy-fund-overview.webp': 'board/2026-policy-fund-overview.webp',
  '05-small-business-voucher.webp': 'board/2026-small-business-voucher.webp',
  '06-startup-support.webp': 'board/2026-startup-support.webp',
};

const MAX_KB = 300;
const MIN_KB = 100;

async function compressImage(srcPath, destPath) {
  const stats = statSync(srcPath);
  const sizeKB = Math.round(stats.size / 1024);

  let img = sharp(srcPath);
  const meta = await img.metadata();

  // If already within range, just copy with slight optimization
  if (sizeKB <= MAX_KB && sizeKB >= MIN_KB) {
    await sharp(srcPath)
      .webp({ quality: 82 })
      .toFile(destPath);
  } else if (sizeKB > MAX_KB) {
    // Resize down and compress more aggressively
    const scale = Math.sqrt(MAX_KB / sizeKB) * 0.9;
    const newWidth = Math.round(meta.width * scale);
    await sharp(srcPath)
      .resize(newWidth)
      .webp({ quality: 75 })
      .toFile(destPath);

    // Check if still too large
    const newSize = statSync(destPath).size / 1024;
    if (newSize > MAX_KB) {
      await sharp(srcPath)
        .resize(Math.round(newWidth * 0.85))
        .webp({ quality: 70 })
        .toFile(destPath);
    }
  } else {
    // Too small - just copy as-is
    await sharp(srcPath).webp({ quality: 85 }).toFile(destPath);
  }

  const finalSize = Math.round(statSync(destPath).size / 1024);
  console.log(`  ${path.basename(srcPath)}: ${sizeKB}KB → ${finalSize}KB`);
  return destPath;
}

async function main() {
  // Create dest dir
  execSync(`mkdir -p "${DEST}"`);

  console.log('=== Step 1: Compress to WebP (100-300KB) ===');
  const files = readdirSync(SRC).filter(f => f.endsWith('.webp'));

  for (const file of files) {
    const srcPath = path.join(SRC, file);
    const destPath = path.join(DEST, file);
    await compressImage(srcPath, destPath);
  }

  console.log('\n=== Step 2: Upload to R2 ===');
  const wranglerDir = 'F:/pola_homepage/15.26_1th_kimeunhee_kmoney/scripts';

  for (const file of files) {
    const destPath = path.join(DEST, file);
    const r2Key = FILE_MAP[file];
    if (!r2Key) {
      console.log(`  Skipping ${file} - no R2 key mapping`);
      continue;
    }

    try {
      const cmd = `cd "${wranglerDir}" && npx wrangler r2 object put "${R2_BUCKET}/${r2Key}" --file="${destPath}" --content-type="image/webp"`;
      console.log(`  Uploading: ${r2Key}`);
      execSync(cmd, { stdio: 'pipe' });
      console.log(`  ✓ Done`);
    } catch (e) {
      console.error(`  ✗ Failed: ${e.message}`);
    }
  }

  console.log('\n=== Step 3: Public URLs ===');
  const R2_PUBLIC = 'https://pub-d4f7fa5a4cb648d48f34274fcba1d283.r2.dev';
  for (const file of files) {
    const r2Key = FILE_MAP[file];
    if (r2Key) {
      console.log(`  ${file} → ${R2_PUBLIC}/${r2Key}`);
    }
  }
}

main().catch(console.error);
