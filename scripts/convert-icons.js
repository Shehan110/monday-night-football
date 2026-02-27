import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const cwd = process.cwd();
const source = path.join(cwd, 'public', 'images', 'mnf-logo.jpeg');
const outDir = path.join(cwd, 'public');

console.log('CWD:', cwd);
console.log('Source exists:', fs.existsSync(source));

if (!fs.existsSync(source)) {
  // Try alternate known paths
  const alts = [
    path.join(cwd, 'public', 'icon-192x192.jpeg'),
    '/home/user/public/images/mnf-logo.jpeg',
  ];
  for (const alt of alts) {
    console.log(`Trying ${alt}: ${fs.existsSync(alt)}`);
  }
  throw new Error('Source image not found at: ' + source);
}

const sizes = [192, 512];

for (const size of sizes) {
  const outPath = path.join(outDir, `icon-${size}x${size}.png`);
  await sharp(source)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(outPath);
  console.log(`Created ${outPath}`);
}

console.log('Done!');
