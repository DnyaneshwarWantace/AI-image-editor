# Database Guide for Image Editor

## Current Setup

Your project uses **Convex** as the primary database for:
- ✅ User projects
- ✅ Templates (newly added)
- ✅ Materials (newly added)
- ✅ Template types/categories
- ✅ Material types/categories

## Why Convex?

### ✅ Advantages
1. **Already Integrated** - You're already using it for projects
2. **Real-time Updates** - Automatic UI updates when data changes
3. **Type-Safe** - Full TypeScript support
4. **File Storage** - Built-in image storage
5. **No Backend Code** - Functions run serverless
6. **Free Tier** - Generous free tier for development
7. **Easy Queries** - Simple query syntax
8. **Next.js Integration** - Works seamlessly with Next.js

### 📊 Database Structure

```
Convex Database
├── users (existing)
├── projects (existing)
├── folders (existing)
├── templateTypes (NEW)
│   └── Categories: "LinkedIn", "Ads", "Social Media", etc.
├── templates (NEW)
│   ├── name, desc, json (Fabric.js), imageUrl
│   ├── templateTypeId (category)
│   └── isPublic, userId
├── materialTypes (NEW)
│   └── Categories: "Icons", "Backgrounds", "Shapes", etc.
└── materials (NEW)
    ├── name, desc, imageUrl, thumbnailUrl
    ├── materialTypeId (category)
    └── isPublic, userId
```

## How to Use

### 1. Setup Convex (if not already done)

```bash
# Install Convex CLI
npm install -g convex

# Login to Convex
npx convex dev

# This will:
# - Create a Convex account (if needed)
# - Generate API keys
# - Push your schema
```

### 2. Upload Images to Convex

Convex has built-in file storage. Use it like this:

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Upload image
const generateUploadUrl = useMutation(api.files.generateUploadUrl);
const saveStorageId = useMutation(api.files.saveStorageId);

const uploadImage = async (file: File) => {
  // Get upload URL
  const uploadUrl = await generateUploadUrl();
  
  // Upload file
  const result = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  
  const { storageId } = await result.json();
  
  // Save storage ID
  await saveStorageId({ storageId });
  
  return storageId;
};
```

### 3. Create Templates

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const createTemplate = useMutation(api.templates.createTemplate);

// Save a template
await createTemplate({
  name: "LinkedIn Post Template",
  desc: "Professional LinkedIn post design",
  json: canvasJson, // Fabric.js JSON
  imageUrl: previewImageUrl,
  templateTypeId: linkedInTypeId,
  width: 1200,
  height: 1200,
  isPublic: true,
});
```

### 4. Fetch Templates

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Get all public templates
const templates = useQuery(api.templates.getTemplates, {
  isPublic: true,
});

// Get templates by category
const linkedInTemplates = useQuery(api.templates.getTemplates, {
  templateTypeId: linkedInTypeId,
  isPublic: true,
});

// Search templates
const searchResults = useQuery(api.templates.getTemplates, {
  searchKeyword: "ad",
  isPublic: true,
});
```

## Alternative Database Options

If you prefer a different database, here are alternatives:

### Option 2: PostgreSQL + Prisma (Traditional)

**Best for:** Full control, complex queries, existing PostgreSQL knowledge

```bash
npm install @prisma/client prisma
npx prisma init
```

**Pros:**
- Industry standard
- Powerful queries
- Full control
- Many hosting options

**Cons:**
- Need to set up backend API
- More complex setup
- Need to handle file storage separately (S3, Cloudinary)

### Option 3: MongoDB + Mongoose

**Best for:** Flexible schema, JSON-like data

**Pros:**
- Flexible schema
- Good for JSON data
- Easy to use

**Cons:**
- Need backend API
- Need separate file storage
- More setup

### Option 4: Supabase (PostgreSQL + Storage)

**Best for:** PostgreSQL with built-in storage, similar to Convex

**Pros:**
- PostgreSQL database
- Built-in file storage
- Real-time subscriptions
- Free tier

**Cons:**
- More setup than Convex
- Need to write SQL queries

### Option 5: Firebase (Firestore + Storage)

**Best for:** Google ecosystem, real-time features

**Pros:**
- Real-time updates
- Built-in storage
- Good free tier

**Cons:**
- Vendor lock-in
- NoSQL (less structured)
- More complex queries

## Recommendation

**Stick with Convex** because:
1. ✅ Already set up in your project
2. ✅ Perfect for your use case (templates, materials, projects)
3. ✅ Type-safe and easy to use
4. ✅ Built-in file storage
5. ✅ Real-time updates
6. ✅ No backend code needed

## Migration from Strapi

If you want to migrate from the external Strapi API:

1. **Export data from Strapi:**
   ```bash
   # Use Strapi API to export templates/materials
   curl https://github.kuaitu.cc/api/templs?pagination[pageSize]=100
   ```

2. **Import to Convex:**
   - Create a migration script
   - Use `createTemplate` and `createMaterial` mutations
   - Upload images to Convex storage

3. **Update your code:**
   - Replace Strapi API calls with Convex queries
   - Update `MaterialPlugin.ts` to use Convex
   - Update `templates-panel.tsx` and `materials-panel.tsx`

## Next Steps

1. ✅ Schema created (`convex/schema.ts`)
2. ✅ Functions created (`convex/templates.ts`, `convex/materials.ts`)
3. ⏭️ Create file upload functions (`convex/files.ts`)
4. ⏭️ Update UI components to use Convex
5. ⏭️ Test template/material creation
6. ⏭️ Migrate from Strapi (optional)

## Questions?

- **Convex Docs:** https://docs.convex.dev
- **Convex Dashboard:** https://dashboard.convex.dev
- **File Storage:** https://docs.convex.dev/file-storage

