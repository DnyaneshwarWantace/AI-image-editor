# ✅ Custom Background Upload with Auto-Recoloring!

## YES! You can now upload your OWN PNG and recolor it!

---

## What This Does:

### **Upload ANY background image (like your purple circles PNG)**
1. Upload the image
2. System detects ALL colors in it
3. Map those colors to YOUR accent/background colors
4. Apply the recolored image to canvas!

---

## How It Works:

### **Step 1: Upload Image**
```
Right Sidebar → Canvas Settings
↓
Scroll down to "Custom Background"
↓
Click "Upload Background Image"
↓
Choose your PNG/JPG
```

### **Step 2: Auto Color Detection**
```
System analyzes image
↓
Finds 5 main colors
↓
Shows them in a list
```

### **Step 3: Map Colors**
```
For each color found:
- Original color (from your image)
- Arrow →
- New color (what to replace it with)

Quick options:
- "Map to BG" - makes it your background color
- "Map to Accent" - makes it your accent color
- Or pick custom color for each
```

### **Step 4: Apply**
```
Click "Apply to Canvas"
↓
Image is recolored
↓
Applied to canvas background!
```

---

## Example: Your Purple Circles Image

### **Original Image:**
```
Purple circles (#8B5CF6)
Purple background (#7C3AED)
```

### **Your Theme:**
```
Background: Dark Green (#1a4d3e)
Accent: Orange (#f97316)
```

### **Process:**
```
1. Upload purple circles PNG
2. System detects:
   - Purple #8B5CF6 (circles)
   - Purple #7C3AED (background)

3. You map colors:
   - Purple #8B5CF6 → Orange #f97316 (your accent)
   - Purple #7C3AED → Dark Green #1a4d3e (your bg)

4. Click "Apply"
5. Result: Orange circles on green background!
```

---

## UI Overview:

### **Custom Background Panel:**
```
┌────────────────────────────────┐
│ Custom Background              │
├────────────────────────────────┤
│ [Upload Background Image]      │
│                                │
│ Or (after upload):             │
│                                │
│ ┌────────────────────────────┐ │
│ │ [Image Preview]            │ │
│ │ Your uploaded image        │ │
│ └────────────────────────────┘ │
│                                │
│ Found Colors:                  │
│ [Map to BG] [Map to Accent]    │
│                                │
│ ┌──────────────────────────┐   │
│ │ 🟣 #8B5CF6 → 🟠 #f97316  │   │
│ │ [BG] [Accent]            │   │
│ ├──────────────────────────┤   │
│ │ 🟣 #7C3AED → 🟢 #1a4d3e  │   │
│ │ [BG] [Accent]            │   │
│ └──────────────────────────┘   │
│                                │
│ [Apply to Canvas] [Clear]      │
│                                │
│ How it works:                  │
│ 1. Upload PNG/JPG              │
│ 2. Detect colors               │
│ 3. Map to your theme           │
│ 4. Apply recolored!            │
└────────────────────────────────┘
```

---

## Features:

### **1. Color Detection**
- Finds 5 most common colors in your image
- Ignores transparent areas
- Groups similar colors together

### **2. Color Mapping**
```
Each detected color shows:
- Original color swatch
- Hex code
- Arrow →
- New color picker
- Quick buttons (BG/Accent)
```

### **3. Quick Map Buttons**
```
"Map to BG":
- Maps first color → your background color
- For replacing image background

"Map to Accent":
- Maps all other colors → your accent color
- For replacing decorative elements (circles)
```

### **4. Manual Color Picking**
```
Click color picker next to each color
↓
Choose exact color you want
↓
Fine-tune the mapping
```

### **5. Preview & Apply**
```
See original image preview
↓
Adjust color mappings
↓
Click "Apply to Canvas"
↓
Recolored image appears as background!
```

---

## Use Cases:

### **Use Case 1: Purple Circles → Orange Circles**
```
1. Upload purple-circles.png
2. Detected: Purple circles, purple background
3. Map:
   - Circle purple → Orange accent
   - Background purple → Green background
4. Apply → Orange circles on green!
```

### **Use Case 2: Any Pattern Image**
```
1. Find pattern image online (dots, waves, blobs)
2. Upload it
3. Map colors to your brand colors
4. Apply → Branded background!
```

### **Use Case 3: Logo/Brand Graphics**
```
1. Upload your brand's pattern
2. Keep brand colors or change them
3. Apply as carousel background
4. Consistent branding!
```

---

## Technical Details:

### **Color Replacement Algorithm:**
```typescript
For each pixel in image:
1. Get RGB color
2. Check if similar to any "from" color (tolerance: 40)
3. If match, replace with "to" color
4. Keep transparency intact
```

### **Color Detection:**
```typescript
1. Scale image down 10x (faster processing)
2. Count color occurrences
3. Quantize colors (group similar ones)
4. Return top 5 most common
5. Convert to hex codes
```

### **Size Handling:**
```typescript
// Image scaled to fit canvas
scaleX: 1080 / imageWidth
scaleY: 1350 / imageHeight

// Always fills entire canvas
// No distortion (maintains aspect ratio option)
```

---

## Files Created:

### **1. `lib/carousel/image-color-replace.ts`**
- `recolorImage()` - Replace colors in image
- `tintImage()` - Apply color overlay (simpler)
- `extractColors()` - Detect colors in image
- Helper functions for color manipulation

### **2. `components/carousel/custom-background-upload.tsx`**
- Upload UI
- Color mapping interface
- Preview and apply functionality

### **3. `canvas-settings.tsx`** (modified)
- Added CustomBackgroundUpload component

---

## Testing:

### **Test with Your Purple Image:**
```bash
1. Open editor
2. Click canvas background
3. Right sidebar → Scroll to "Custom Background"
4. Click "Upload Background Image"
5. Choose your purple circles PNG
6. See colors detected
7. Click "Map to Accent" for circles
8. Click "Map to BG" for background
9. Click "Apply to Canvas"
10. See circles recolored to your accent color!
```

---

## Advanced: Manual Color Mapping

### **Scenario: Complex Image**
```
Image has:
- Main background: #7C3AED
- Circle 1: #8B5CF6
- Circle 2: #A78BFA
- Shadow: #6B21A8
- Highlight: #C4B5FD

You want:
- Background → Your bg color
- All circles → Your accent color
- Shadow → Darker accent
- Highlight → Lighter accent
```

### **Solution:**
```
1. System detects all 5 colors
2. Map manually:
   - #7C3AED → currentBackgroundColor
   - #8B5CF6 → currentAccentColor
   - #A78BFA → currentAccentColor
   - #6B21A8 → darken(currentAccentColor, 20%)
   - #C4B5FD → lighten(currentAccentColor, 20%)
3. Apply → Perfectly themed!
```

---

## Limitations:

### **What Works:**
✅ Solid colors
✅ Gradients (will be flattened)
✅ PNG with transparency
✅ Simple patterns
✅ Your purple circles example!

### **What Doesn't Work Well:**
❌ Photos (too many colors)
❌ Complex gradients (need many mappings)
❌ Anti-aliased edges (may have artifacts)

### **Best Results:**
- Simple color palette (2-5 colors)
- Flat design style
- Vector-like graphics
- Pattern images
- Your purple circles image = PERFECT! ✅

---

## Alternative: Tint Mode

### **If color replacement is too complex:**
```typescript
// Apply color overlay instead
tintImage(imageUrl, accentColor, 0.5)

// Simpler but less control
// Tints entire image with accent color
// Good for photos/complex images
```

---

## Summary:

✅ **Upload your own PNG background**
✅ **System detects colors automatically**
✅ **Map colors to your theme**
✅ **Quick buttons for BG/Accent**
✅ **Manual color picking available**
✅ **Apply recolored image to canvas**
✅ **Perfect for your purple circles example!**

---

## Location:

```
Right Sidebar → Canvas Settings
↓
Scroll past:
- Canvas Size
- Zoom
- Canvas Background
- Color Palette
- Background Effects
↓
See "Custom Background" ← HERE!
```

**Now you can upload ANY background and recolor it to match your theme!** 🎨✨
