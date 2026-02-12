# Google Cloud Vision API Setup

## Why Google Vision API?

Google Cloud Vision API provides **the best text detection** for your AI image editor:

- ✅ **1,000 free requests/month** - Perfect for portfolio projects and demos
- ✅ **Exact bounding boxes** - Text placed at EXACT same position
- ✅ **Better than Tesseract** - Handles complex layouts, rotated text, stylized fonts
- ✅ **Professional quality** - Enterprise-grade accuracy
- ✅ **Great for interviews** - Shows you can integrate real AI APIs

## How to Get Your API Key

### Step 1: Create Google Cloud Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Accept terms of service

### Step 2: Create a New Project

1. Click the project dropdown at the top
2. Click **"New Project"**
3. Enter project name: `ai-image-editor` (or any name)
4. Click **"Create"**

### Step 3: Enable Vision API

1. In the search bar, search for **"Vision API"**
2. Click **"Cloud Vision API"**
3. Click **"Enable"** button
4. Wait a few seconds for it to enable

### Step 4: Create API Key

1. Go to **"Credentials"** (left sidebar or search for it)
2. Click **"Create Credentials"** → **"API Key"**
3. Your API key will be generated and displayed
4. **Copy the API key** - you'll need it for `.env`

### Step 5: Restrict the API Key (Optional but Recommended)

For security, restrict your API key:

1. Click the **Edit** icon next to your API key
2. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check **"Cloud Vision API"**
3. Under **"Application restrictions"** (optional for local dev):
   - For localhost: Select **"None"**
   - For production: Select **"HTTP referrers"** and add your domain
4. Click **"Save"**

### Step 6: Add to Your Project

1. Open `.env` file in your project root
2. Add your API key:

```env
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...your_actual_key_here
```

3. Restart your development server

## Pricing

### Free Tier (Forever)

- **1,000 images/month**: FREE ✅
- Perfect for:
  - Development and testing
  - Portfolio projects
  - Interview demos
  - Low-traffic personal sites

### After Free Tier

- **1,001 - 5,000,000 images**: $1.50 per 1,000
- **5M+ images**: $0.60 per 1,000

**For your use case (portfolio/interviews):** You'll stay completely free!

## Testing the Integration

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open the AI Extract panel

3. Upload an image with text

4. Check browser console for:
   ```
   📸 Calling Google Vision API for text detection...
   ✓ Google Vision API detected X text elements
   ```

5. Text should appear at **exact same position** as in the image

## Troubleshooting

### Error: "API key not configured"

- Make sure you added `GOOGLE_CLOUD_VISION_API_KEY` to `.env`
- Restart your dev server after adding env variables

### Error: "Vision API not available"

- Check that Vision API is **enabled** in Google Cloud Console
- Verify your API key is copied correctly (no extra spaces)

### Error: "Permission denied"

- Your API key might not have Vision API enabled
- Go to Credentials → Edit Key → Check "Cloud Vision API" is selected

### Fallback to Tesseract

If Vision API fails, the app automatically falls back to Tesseract:

```
⚠️  Vision API not available: [error]
Vision API returned no text, falling back to Tesseract...
```

This ensures the app always works, even without the API key.

## What Happens After Integration

### Before (Tesseract Only):
- ❌ Misses some text
- ❌ Wrong bounding boxes on complex layouts
- ❌ Struggles with rotated/stylized text

### After (Google Vision API):
- ✅ Detects all text accurately
- ✅ Exact bounding boxes → text in EXACT same place
- ✅ Handles complex layouts, multiple fonts
- ✅ Works with rotated and stylized text
- ✅ Professional quality for demo/portfolio

## Next Steps

After Vision API is working:

1. **Test with complex images** - Try posters with multiple text styles
2. **Add SAM segmentation** - Phase 2 for pixel-perfect object cutouts
3. **Showcase to companies** - "I integrated Google Vision API for enterprise-grade text detection"

Perfect for showing technical skills in interviews! 🚀
