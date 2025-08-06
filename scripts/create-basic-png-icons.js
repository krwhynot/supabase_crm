#!/usr/bin/env node

/**
 * Basic PNG Icon Creator
 * Creates simple PNG icons for PWA manifest requirements
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon configuration
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SHORTCUT_ICONS = [
  { name: 'quick-icon', size: 96 },
  { name: 'samples-icon', size: 96 },
  { name: 'visit-icon', size: 96 }
];

const THEME_COLOR = '#2563eb';
const BACKGROUND_COLOR = '#ffffff';

/**
 * Create a simple PNG data URL using canvas-like approach
 * This is a very basic implementation that creates a data URL
 */
function createBasicPNG(size, color = THEME_COLOR, bgColor = BACKGROUND_COLOR) {
  // Create a simple PNG header and data
  // This is a minimal PNG that browsers can understand
  const canvas = createSimpleCanvas(size, color, bgColor);
  return canvas;
}

/**
 * Create a simple canvas representation
 * Since we don't have access to node-canvas, we'll create basic PNG data
 */
function createSimpleCanvas(size, color, bgColor) {
  // Convert hex colors to RGB
  const bg = hexToRgb(bgColor);
  const fg = hexToRgb(color);
  
  // Create a very simple PNG structure
  // This is a simplified approach - in production, you'd use a proper image library
  const width = size;
  const height = size;
  
  // Create basic PNG data structure
  const data = createMinimalPNG(width, height, bg, fg);
  return data;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Create a minimal PNG buffer
 * This creates a very basic PNG with a solid color background and a simple icon
 */
function createMinimalPNG(width, height, bgColor, fgColor) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = createIHDRChunk(width, height);
  
  // IDAT chunk (image data) - simplified solid color
  const idat = createIDATChunk(width, height, bgColor, fgColor);
  
  // IEND chunk
  const iend = createIENDChunk();
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

/**
 * Create IHDR chunk
 */
function createIHDRChunk(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);   // Width
  data.writeUInt32BE(height, 4);  // Height
  data.writeUInt8(8, 8);          // Bit depth
  data.writeUInt8(2, 9);          // Color type (RGB)
  data.writeUInt8(0, 10);         // Compression method
  data.writeUInt8(0, 11);         // Filter method
  data.writeUInt8(0, 12);         // Interlace method
  
  return createChunk('IHDR', data);
}

/**
 * Create a simplified IDAT chunk
 * This creates a very basic image with a background color and simple icon shape
 */
function createIDATChunk(width, height, bgColor, fgColor) {
  // Create a simple image data array
  const pixelData = [];
  const center = { x: width / 2, y: height / 2 };
  const radius = Math.min(width, height) * 0.3;
  
  for (let y = 0; y < height; y++) {
    // Filter byte for each scanline
    pixelData.push(0);
    
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
      
      // Create a simple circle for the icon
      if (distance < radius) {
        pixelData.push(fgColor.r, fgColor.g, fgColor.b);
      } else {
        pixelData.push(bgColor.r, bgColor.g, bgColor.b);
      }
    }
  }
  
  // Compress the data (simplified - just use the raw data)
  const imageData = Buffer.from(pixelData);
  const compressed = zlib.deflateSync(imageData);
  
  return createChunk('IDAT', compressed);
}

/**
 * Create IEND chunk
 */
function createIENDChunk() {
  return createChunk('IEND', Buffer.alloc(0));
}

/**
 * Create a PNG chunk with proper CRC
 */
function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = data.length;
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(length, 0);
  
  // Calculate CRC
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = calculateCRC(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

/**
 * Calculate CRC32 for PNG chunk
 */
function calculateCRC(data) {
  const crcTable = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }
  
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Generate all missing PNG icons
 */
function generateMissingPNGs() {
  console.log('🖼️  Generating missing PNG icons...');
  
  const iconsDir = path.resolve(__dirname, '..', 'public', 'icons');
  
  // Check and create main icons
  ICON_SIZES.forEach(size => {
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    if (!fs.existsSync(pngPath)) {
      try {
        const pngData = createBasicPNG(size);
        fs.writeFileSync(pngPath, pngData);
        console.log(`✅ Created icon-${size}x${size}.png`);
      } catch (error) {
        console.error(`❌ Failed to create icon-${size}x${size}.png:`, error.message);
      }
    } else {
      console.log(`⏭️  Skipped icon-${size}x${size}.png (already exists)`);
    }
  });
  
  // Check and create shortcut icons
  SHORTCUT_ICONS.forEach(({ name, size }) => {
    const pngPath = path.join(iconsDir, `${name}-${size}x${size}.png`);
    
    if (!fs.existsSync(pngPath)) {
      try {
        // Use different colors for shortcut icons
        const colors = {
          'quick-icon': '#2563eb',
          'samples-icon': '#10b981',
          'visit-icon': '#f59e0b'
        };
        const pngData = createBasicPNG(size, colors[name] || '#2563eb');
        fs.writeFileSync(pngPath, pngData);
        console.log(`✅ Created ${name}-${size}x${size}.png`);
      } catch (error) {
        console.error(`❌ Failed to create ${name}-${size}x${size}.png:`, error.message);
      }
    } else {
      console.log(`⏭️  Skipped ${name}-${size}x${size}.png (already exists)`);
    }
  });
}

/**
 * Create a fallback solution using simple solid color PNGs
 */
function createFallbackPNGs() {
  console.log('🎨 Creating fallback PNG icons with basic Node.js...');
  
  const iconsDir = path.resolve(__dirname, '..', 'public', 'icons');
  
  // For each missing PNG, create a simple placeholder
  [...ICON_SIZES.map(s => `icon-${s}x${s}`), ...SHORTCUT_ICONS.map(i => `${i.name}-${i.size}x${i.size}`)].forEach(iconName => {
    const pngPath = path.join(iconsDir, `${iconName}.png`);
    
    if (!fs.existsSync(pngPath)) {
      // Create a simple placeholder file that indicates the icon is needed
      const placeholderContent = `# Placeholder for ${iconName}.png
This file serves as a placeholder for the PWA icon ${iconName}.png.

To create the actual PNG file:
1. Convert the corresponding SVG file using an online converter
2. Or use ImageMagick: convert ${iconName}.svg ${iconName}.png
3. Or use any image editing software to create a ${iconName.includes('x') ? iconName.split('-').pop() : '96x96'} PNG icon

The icon should match the CRM branding with:
- Primary color: #2563eb (blue)
- Background: #ffffff (white)
- Design: Network/connection theme for main icons, emoji for shortcuts
`;
      
      fs.writeFileSync(pngPath.replace('.png', '.placeholder.md'), placeholderContent);
      console.log(`📝 Created placeholder for ${iconName}.png`);
    }
  });
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting PNG icon creation...\n');
  
  try {
    // First try to create actual PNGs
    generateMissingPNGs();
    
    console.log('\n✨ PNG icon creation completed!');
    console.log('💡 Note: For production use, consider using proper image conversion tools');
    console.log('   or online converters to create high-quality PNG files from the SVG sources.');
    
  } catch (error) {
    console.error('❌ Error creating PNG icons:', error);
    console.log('\n🔄 Falling back to placeholder creation...');
    createFallbackPNGs();
  }
}

// Run the script
main();