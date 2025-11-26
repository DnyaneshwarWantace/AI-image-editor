# Convex Setup Guide

## ✅ Step 1: Initialize Convex (if not done)

Since you've created a Convex project, run this in your terminal:

```bash
cd ai-image-editor
npx convex dev
```

This will:
- ✅ Connect to your Convex project
- ✅ Generate `convex.json` config file
- ✅ Create `.env.local` with `NEXT_PUBLIC_CONVEX_URL`
- ✅ Push your schema to Convex
- ✅ Watch for changes and auto-deploy

**Note:** Keep `npx convex dev` running in a separate terminal while developing.

---

## ✅ Step 2: Verify Setup

After running `npx convex dev`, check:

1. **`convex.json`** file should exist in your project root
2. **`.env.local`** should have `NEXT_PUBLIC_CONVEX_URL`
3. **Convex dashboard** should show your tables:
   - `users`
   - `projects`
   - `folders`
   - `templateTypes` ✨ NEW
   - `templates` ✨ NEW
   - `materialTypes` ✨ NEW
   - `materials` ✨ NEW

---

## ✅ Step 3: Test Connection

1. Start your Next.js app:
   ```bash
   npm run dev
   ```

2. Check browser console - should see no Convex errors

3. Visit Convex dashboard: https://dashboard.convex.dev
   - Your project should be visible
   - Tables should be created

---

## ✅ Step 4: Migrate Data from Strapi

Once Convex is set up, you can migrate your templates and materials from Strapi.

### Option A: Manual Migration (Small Data)
1. Export data from Strapi API
2. Use Convex dashboard to import

### Option B: Automated Migration Script
I can create a migration script that:
- Fetches all templates from Strapi
- Fetches all materials from Strapi
- Uploads images to Convex storage
- Creates records in Convex database

**Would you like me to create the migration script?**

---

## 📋 Current Status

✅ **Completed:**
- Schema defined (`convex/schema.ts`)
- API functions created:
  - `convex/templates.ts` - Template CRUD
  - `convex/materials.ts` - Material CRUD
  - `convex/files.ts` - File storage
- ConvexProvider added to app layout

⏳ **Next Steps:**
1. Run `npx convex dev` to initialize
2. Verify connection
3. Migrate data from Strapi (optional)

---

## 🔧 Troubleshooting

### Error: "NEXT_PUBLIC_CONVEX_URL is not defined"
- Make sure `.env.local` exists
- Run `npx convex dev` to generate it
- Restart Next.js dev server

### Error: "Cannot find module '@/convex/_generated/api'"
- Run `npx convex dev` to generate types
- Make sure `convex/_generated/` folder exists

### Schema not updating
- Make sure `npx convex dev` is running
- Check Convex dashboard for errors
- Verify `convex/schema.ts` syntax

---

## 📚 Resources

- [Convex Docs](https://docs.convex.dev)
- [Convex Dashboard](https://dashboard.convex.dev)
- [Next.js + Convex Guide](https://docs.convex.dev/quickstart/nextjs)

