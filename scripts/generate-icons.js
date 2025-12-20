const sharp = require('sharp');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const sourceImage = path.join(publicDir, 'aegis-tracker.png');

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 192, name: 'icon-maskable-192.png' },
  { size: 512, name: 'icon-maskable-512.png' },
  { size: 32, name: 'favicon.ico' },
];

async function generateIcons() {
  try {
    console.log('🎨 Generating PWA icons from aegis-tracker.png...\n');

    for (const { size, name } of sizes) {
      const outputPath = path.join(publicDir, name);
      
      // Create icon with dark background and image covering the full space
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: false,
        })
        .toFile(outputPath);
      
      console.log(`✅ Created ${name} (${size}x${size})`);
    }

    console.log('\n✨ All icons generated successfully!');
    console.log('\n📁 Generated files in public/:');
    console.log('  • icon-192.png (mobile home screen)');
    console.log('  • icon-512.png (splash screen)');
    console.log('  • icon-maskable-192.png (adaptive icon - mobile)');
    console.log('  • icon-maskable-512.png (adaptive icon - desktop)');
    console.log('  • favicon.ico (browser tab)');
    console.log('\n✨ Icons optimized for mobile and desktop!');
    console.log('\n🚀 Your PWA is ready to deploy!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
