# File Storage Guide - Where Imported Files Are Saved

## Current Behavior (How It Works Now)

### 📍 **Where Imported Images Are Saved**

When you import an image into the editor:

1. **Immediate Storage**: 
   - Images are converted to **base64 data URLs** (e.g., `data:image/png;base64,iVBORw0KG...`)
   - These base64 strings are **embedded directly in the Fabric.js canvas JSON**
   - **Location**: Stored in your project's `canvasState` in the Convex database

2. **No Separate File Storage**:
   - Images are **NOT** saved as separate files on a server
   - They are **embedded in the project JSON**
   - When you save a project, the entire canvas (including all images as base64) is saved

### 📊 **Storage Details**

```
Project Structure:
├── projects table (Convex)
│   └── canvasState: {
│       └── objects: [
│           └── { type: "image", src: "data:image/png;base64,..." }
│       ]
│   }
```

### ✅ **Pros of Current Approach**
- ✅ Simple - no file upload needed
- ✅ Works offline
- ✅ All data in one place
- ✅ Easy to export/import projects

### ⚠️ **Cons of Current Approach**
- ⚠️ Large file sizes (base64 is ~33% larger than binary)
- ⚠️ Slower loading for large images
- ⚠️ Database storage can get expensive with many images
- ⚠️ Not ideal for sharing images across projects

---

## Option 1: Keep Current Approach (Base64 in JSON)

**Best for**: Small projects, prototypes, offline use

**How it works**:
- Images are converted to base64 when imported
- Stored directly in `canvasState` JSON
- No additional setup needed

**Current code location**:
- `import-menu.tsx` - Converts files to base64
- `AddBaseTypePlugin.ts` - Adds images to canvas
- Projects saved to Convex `projects` table

---

## Option 2: Upload to Convex File Storage (Recommended for Production)

**Best for**: Production apps, large images, sharing across projects

### How It Works

1. **Import Image** → Convert to File
2. **Upload to Convex** → Get storage ID
3. **Save Storage ID** → Store in canvas JSON
4. **Load Image** → Get URL from storage ID

### Implementation Steps

#### Step 1: Update Import Function

```typescript
// In import-menu.tsx
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const generateUploadUrl = useMutation(api.files.generateUploadUrl);
const createFile = useMutation(api.files.createFile);

const handleImportImage = async (files: File[]) => {
  for (const file of files) {
    // 1. Get upload URL from Convex
    const uploadUrl = await generateUploadUrl();
    
    // 2. Upload file to Convex
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    
    // 3. Save file metadata (optional)
    await createFile({ storageId, name: file.name });
    
    // 4. Get file URL
    const fileUrl = await ctx.storage.getUrl(storageId);
    
    // 5. Add to canvas using URL instead of base64
    await editor.addImage(fileUrl);
  }
};
```

#### Step 2: Update Canvas Save

Instead of saving base64 in canvas JSON, save storage IDs:

```typescript
// When saving project
const canvasState = {
  objects: canvas.getObjects().map(obj => {
    if (obj.type === 'image' && obj.src?.startsWith('data:')) {
      // If base64, upload and replace with storage ID
      const storageId = await uploadImageToConvex(obj.src);
      return { ...obj, src: storageId, srcType: 'storage' };
    }
    return obj;
  })
};
```

#### Step 3: Update Canvas Load

When loading project, convert storage IDs back to URLs:

```typescript
// When loading project
const objects = canvasState.objects.map(obj => {
  if (obj.srcType === 'storage') {
    const url = await ctx.storage.getUrl(obj.src);
    return { ...obj, src: url };
  }
  return obj;
});
```

---

## Option 3: Upload to External CDN (ImageKit, Cloudinary, etc.)

**Best for**: High performance, CDN benefits, existing infrastructure

### Example: ImageKit Integration

```typescript
// In import-menu.tsx
const uploadToImageKit = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name);
  
  const response = await fetch('/api/imagekit/upload', {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  return data.url; // CDN URL
};

// Use in import
const imageUrl = await uploadToImageKit(file);
await editor.addImage(imageUrl);
```

---

## Comparison Table

| Approach | Setup | Storage | Performance | Cost |
|----------|-------|---------|-------------|------|
| **Base64 (Current)** | ✅ None | Database | ⚠️ Slower | 💰 Higher DB cost |
| **Convex Storage** | ✅ Easy | Convex | ✅ Fast | 💰 Included in Convex |
| **External CDN** | ⚠️ Medium | External | ✅✅ Fastest | 💰 CDN costs |

---

## Recommendation

### For Development/Testing:
✅ **Keep current base64 approach** - Simple and works

### For Production:
✅ **Use Convex File Storage** - Already set up, integrated, and included in your Convex plan

### Migration Path:

1. **Phase 1**: Keep base64 for now (current)
2. **Phase 2**: Add Convex upload option (optional)
3. **Phase 3**: Migrate existing projects (optional)

---

## Current File Locations

### Imported Images:
- **Format**: Base64 data URLs
- **Location**: `projects.canvasState.objects[].src`
- **Example**: `data:image/png;base64,iVBORw0KGgoAAAANS...`

### Project Files:
- **Database**: Convex `projects` table
- **Field**: `canvasState` (JSON)
- **Size**: Varies (larger with more images)

### Template/Material Images:
- **Current**: External Strapi API
- **Future**: Convex `templates` and `materials` tables
- **Storage**: Convex file storage (when migrated)

---

## Next Steps

1. ✅ **Current**: Images saved as base64 in project JSON
2. ⏭️ **Optional**: Add Convex file upload for new imports
3. ⏭️ **Optional**: Migrate existing base64 images to Convex storage
4. ⏭️ **Optional**: Add image optimization/compression

---

## Questions?

- **Convex File Storage Docs**: https://docs.convex.dev/file-storage
- **Current Implementation**: `convex/files.ts`
- **Import Code**: `app/(main)/editor/[projectId]/_components/top-bar-actions/import-menu.tsx`

