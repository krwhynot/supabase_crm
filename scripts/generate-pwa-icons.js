#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * Creates all required PWA icons for the CRM application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon configuration based on manifest.json requirements
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SHORTCUT_ICONS = [
  { name: 'quick-icon', size: 96, color: '#2563eb', icon: '⚡' },
  { name: 'samples-icon', size: 96, color: '#10b981', icon: '📦' },
  { name: 'visit-icon', size: 96, color: '#f59e0b', icon: '📍' }
];

const THEME_COLOR = '#2563eb';
const BACKGROUND_COLOR = '#ffffff';

/**
 * Generate SVG icon content
 */
function generateSVG(size, content, bgColor = BACKGROUND_COLOR, _iconColor = THEME_COLOR) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${bgColor}" rx="${size * 0.15}"/>
  ${content}
</svg>`;
}

/**
 * Generate main CRM icon content
 */
function generateMainIconContent(size) {
  const center = size / 2;
  const radius = size * 0.3;
  const strokeWidth = size * 0.05;
  
  return `
  <!-- Main CRM Icon - Contact/Network representation -->
  <g fill="none" stroke="${THEME_COLOR}" stroke-width="${strokeWidth}">
    <!-- Central contact -->
    <circle cx="${center}" cy="${center}" r="${radius * 0.4}" fill="${THEME_COLOR}"/>
    
    <!-- Connected contacts -->
    <circle cx="${center - radius * 0.8}" cy="${center - radius * 0.6}" r="${radius * 0.25}" fill="${BACKGROUND_COLOR}"/>
    <circle cx="${center + radius * 0.8}" cy="${center - radius * 0.6}" r="${radius * 0.25}" fill="${BACKGROUND_COLOR}"/>
    <circle cx="${center - radius * 0.8}" cy="${center + radius * 0.6}" r="${radius * 0.25}" fill="${BACKGROUND_COLOR}"/>
    <circle cx="${center + radius * 0.8}" cy="${center + radius * 0.6}" r="${radius * 0.25}" fill="${BACKGROUND_COLOR}"/>
    
    <!-- Connection lines -->
    <line x1="${center}" y1="${center}" x2="${center - radius * 0.6}" y2="${center - radius * 0.4}"/>
    <line x1="${center}" y1="${center}" x2="${center + radius * 0.6}" y2="${center - radius * 0.4}"/>
    <line x1="${center}" y1="${center}" x2="${center - radius * 0.6}" y2="${center + radius * 0.4}"/>
    <line x1="${center}" y1="${center}" x2="${center + radius * 0.6}" y2="${center + radius * 0.4}"/>
  </g>
  
  <!-- CRM label for larger icons -->
  ${size >= 128 ? `<text x="${center}" y="${size * 0.85}" text-anchor="middle" fill="${THEME_COLOR}" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold">CRM</text>` : ''}
`;
}

/**
 * Generate shortcut icon content
 */
function generateShortcutIconContent(size, emoji, color) {
  const center = size / 2;
  const fontSize = size * 0.4;
  
  return `
  <!-- Shortcut icon background -->
  <circle cx="${center}" cy="${center}" r="${size * 0.4}" fill="${color}" opacity="0.1"/>
  
  <!-- Emoji icon -->
  <text x="${center}" y="${center + fontSize * 0.15}" text-anchor="middle" font-size="${fontSize}" fill="${color}">${emoji}</text>
`;
}

/**
 * Create directories if they don't exist
 */
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

/**
 * Generate all main PWA icons
 */
function generateMainIcons() {
  console.log('🎨 Generating main PWA icons...');
  
  ICON_SIZES.forEach(size => {
    const iconContent = generateMainIconContent(size);
    const svgContent = generateSVG(size, iconContent);
    const filePath = path.resolve(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.svg`);
    
    ensureDirectoryExists(filePath);
    fs.writeFileSync(filePath, svgContent);
    console.log(`✅ Created icon-${size}x${size}.svg`);
  });
}

/**
 * Generate shortcut icons
 */
function generateShortcutIcons() {
  console.log('🔗 Generating shortcut icons...');
  
  SHORTCUT_ICONS.forEach(({ name, size, color, icon }) => {
    const iconContent = generateShortcutIconContent(size, icon, color);
    const svgContent = generateSVG(size, iconContent);
    const filePath = path.resolve(__dirname, '..', 'public', 'icons', `${name}-${size}x${size}.svg`);
    
    ensureDirectoryExists(filePath);
    fs.writeFileSync(filePath, svgContent);
    console.log(`✅ Created ${name}-${size}x${size}.svg`);
  });
}

/**
 * Generate PNG conversion instructions
 */
function generateConversionInstructions() {
  const instructions = `# PWA Icon Conversion Instructions

The following SVG icons have been generated and need to be converted to PNG format:

## Main Icons (convert to PNG):
${ICON_SIZES.map(size => `- icon-${size}x${size}.svg → icon-${size}x${size}.png`).join('\n')}

## Shortcut Icons (convert to PNG):
${SHORTCUT_ICONS.map(({ name, size }) => `- ${name}-${size}x${size}.svg → ${name}-${size}x${size}.png`).join('\n')}

## Conversion Commands:

If you have ImageMagick installed, you can convert all icons with:

\`\`\`bash
cd public/icons

# Convert main icons
${ICON_SIZES.map(size => `convert icon-${size}x${size}.svg icon-${size}x${size}.png`).join('\n')}

# Convert shortcut icons
${SHORTCUT_ICONS.map(({ name, size }) => `convert ${name}-${size}x${size}.svg ${name}-${size}x${size}.png`).join('\n')}
\`\`\`

## Alternative: Online Conversion
1. Visit https://convertio.co/svg-png/ or similar
2. Upload each SVG file
3. Download the PNG version
4. Replace the SVG files with PNG files

## Design Notes:
- Main icon: Network/CRM representation with connected contacts
- Theme color: ${THEME_COLOR} (blue)
- Background: ${BACKGROUND_COLOR} (white)
- Shortcut icons use distinct colors and emoji representations
`;

  const instructionsPath = path.resolve(__dirname, '..', 'public', 'icons', 'CONVERSION_INSTRUCTIONS.md');
  fs.writeFileSync(instructionsPath, instructions);
  console.log('📋 Created conversion instructions at public/icons/CONVERSION_INSTRUCTIONS.md');
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting PWA icon generation...\n');
  
  try {
    generateMainIcons();
    console.log('');
    generateShortcutIcons();
    console.log('');
    generateConversionInstructions();
    
    console.log('\n✨ PWA icon generation completed successfully!');
    console.log('📝 Next step: Convert SVG files to PNG format using the instructions in CONVERSION_INSTRUCTIONS.md');
    
  } catch (error) {
    console.error('❌ Error generating PWA icons:', error);
    process.exit(1);
  }
}

// Run the script
main();