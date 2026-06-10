# PWA Icons Setup

The PWA manifest (`manifest.json`) references icon files that don't exist yet.
You need to generate them from your existing logo.

## Logo source
- `/images/logo.JPEG` – the main logo

## Required icon files

| File                    | Size      | Notes                        |
|-------------------------|-----------|------------------------------|
| `/images/icon-192x192.png` | 192×192   | Used for splash screens, task switcher, etc. |
| `/images/icon-512x512.png` | 512×512   | Used for install prompt, splash on larger devices |

## How to generate them (quick options)

### Option A: PWABuilder (recommended — fastest)
1. Go to https://www.pwabuilder.com/
2. Enter your site URL: `https://90minutesormore.com`
3. Click "Start" → it will generate all icons automatically
4. Download the generated `icons.zip` and extract to the `/images/` directory

### Option B: Favicon Generator
1. Go to https://realfavicongenerator.net/
2. Upload your logo at `/images/logo.JPEG`
3. Download the generated package

### Option C: Manual (with ImageMagick or similar)
```bash
# Convert the JPEG to PNG at the right sizes
convert /images/logo.JPEG -resize 192x192 /images/icon-192x192.png
convert /images/logo.JPEG -resize 512x512 /images/icon-512x512.png
```

### Option D: Online converter
- https://convertio.co/jpg-png/ — convert logo.JPEG to PNG
- https://resizeimage.net/ — resize to 192×192 and 512×512
- Place both files as `/images/icon-192x192.png` and `/images/icon-512x512.png`

## iOS-specific icons (optional but recommended)
For better iOS appearance, also generate:
- `/images/apple-touch-icon.png` — 180×180 PNG
- `/images/apple-splash-2048x2732.png` — various splash sizes

PWABuilder handles all of these automatically.
