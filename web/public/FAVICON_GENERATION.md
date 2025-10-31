# Favicon & Meta Image Generation

The following assets need to be generated from `/public/branding/cryptoflash-logo.png`:

1. `/public/favicon-32.png` (32x32)
2. `/public/favicon-64.png` (64x64)
3. `/public/apple-touch-icon.png` (180x180)
4. `/public/icon-512.png` (512x512)
5. `/public/og.jpg` (1200x630) - Open Graph image with dark background + centered logo + "CryptoFlash" caption (optional)

## Tools

You can use:
- ImageMagick: `convert cryptoflash-logo.png -resize 32x32 favicon-32.png`
- Online tools: https://realfavicongenerator.net/
- Design tools: Figma, Photoshop, etc.

## OG Image

For `/public/og.jpg`, create a 1200x630 image with:
- Dark background (matching site theme)
- Centered logo
- Optional: "CryptoFlash" text below logo

The layout.tsx is already configured to use these assets once generated.
