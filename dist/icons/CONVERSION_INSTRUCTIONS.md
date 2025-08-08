# PWA Icon Conversion Instructions

The following SVG icons have been generated and need to be converted to PNG format:

## Main Icons (convert to PNG):
- icon-72x72.svg → icon-72x72.png
- icon-96x96.svg → icon-96x96.png
- icon-128x128.svg → icon-128x128.png
- icon-144x144.svg → icon-144x144.png
- icon-152x152.svg → icon-152x152.png
- icon-192x192.svg → icon-192x192.png
- icon-384x384.svg → icon-384x384.png
- icon-512x512.svg → icon-512x512.png

## Shortcut Icons (convert to PNG):
- quick-icon-96x96.svg → quick-icon-96x96.png
- samples-icon-96x96.svg → samples-icon-96x96.png
- visit-icon-96x96.svg → visit-icon-96x96.png

## Conversion Commands:

If you have ImageMagick installed, you can convert all icons with:

```bash
cd public/icons

# Convert main icons
convert icon-72x72.svg icon-72x72.png
convert icon-96x96.svg icon-96x96.png
convert icon-128x128.svg icon-128x128.png
convert icon-144x144.svg icon-144x144.png
convert icon-152x152.svg icon-152x152.png
convert icon-192x192.svg icon-192x192.png
convert icon-384x384.svg icon-384x384.png
convert icon-512x512.svg icon-512x512.png

# Convert shortcut icons
convert quick-icon-96x96.svg quick-icon-96x96.png
convert samples-icon-96x96.svg samples-icon-96x96.png
convert visit-icon-96x96.svg visit-icon-96x96.png
```

## Alternative: Online Conversion
1. Visit https://convertio.co/svg-png/ or similar
2. Upload each SVG file
3. Download the PNG version
4. Replace the SVG files with PNG files

## Design Notes:
- Main icon: Network/CRM representation with connected contacts
- Theme color: #2563eb (blue)
- Background: #ffffff (white)
- Shortcut icons use distinct colors and emoji representations
