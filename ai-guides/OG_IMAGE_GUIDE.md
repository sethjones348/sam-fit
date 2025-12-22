# Open Graph Image Guide

## Current Setup

I've added Open Graph meta tags to `index.html` that will create rich link previews when sharing SamFit links. The meta tags reference `og-image.png` which needs to be created.

## Creating the OG Image

You have a few options:

### Option 1: Use the HTML Generator (Recommended)

1. Open `public/og-image.html` in a browser
2. Take a screenshot at 1200x630 pixels
3. Save it as `public/og-image.png`
4. The image will be automatically included in the build

### Option 2: Use an Online Tool

1. Go to a tool like:
   - [og-image.vercel.app](https://og-image.vercel.app/)
   - [Canva](https://www.canva.com/) - Create a 1200x630px design
   - [Figma](https://www.figma.com/) - Design and export
2. Use the SamFit branding:
   - Background: Black gradient (#000000 to #1a1a1a)
   - Logo: "SAM" in white, "FIT" in CrossFit red (#E11931)
   - Font: Oswald (bold, large)
   - Tagline: "Workout Tracker" or "AI-Powered CrossFit Logging"
3. Export as PNG at 1200x630px
4. Save to `public/og-image.png`

### Option 3: Use a Design Tool

Create a 1200x630px image with:
- **Background**: Black or dark gray gradient
- **Logo**: "SAMFIT" with "SAM" in white and "FIT" in red (#E11931)
- **Text**: "Workout Tracker" or similar tagline
- **Style**: Clean, bold, CrossFit-inspired

## Image Specifications

- **Dimensions**: 1200x630 pixels (1.91:1 aspect ratio)
- **Format**: PNG or JPG
- **File size**: Under 1MB (recommended)
- **Location**: `public/og-image.png`

## Testing

After adding the image:

1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
   - Enter your URL
   - Click "Scrape Again" to refresh the cache

2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Enter your URL to preview

3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
   - Enter your URL to preview

4. **iMessage**: Share the link in iMessage to see the preview

## Dynamic OG Images (Future Enhancement)

For individual workout pages, you could create dynamic OG images that show:
- Workout name
- Date
- Key movements
- Time/reps

This would require server-side rendering or a service like Vercel's OG Image Generation.

## Current Meta Tags

The following meta tags are already configured in `index.html`:

- Open Graph tags (Facebook, LinkedIn, iMessage)
- Twitter Card tags
- Basic meta description
- Theme color

All that's needed is the `og-image.png` file in the `public/` folder!

