# How to Get Your Convex Public URL

## 🎯 Quick Answer

**The URL is automatically generated when you run `npx convex dev`**

---

## 📋 Step-by-Step Guide

### Step 1: Run Convex Dev Command

Open your terminal in the `ai-image-editor` folder and run:

```bash
cd ai-image-editor
npx convex dev
```

### Step 2: What Happens

When you run `npx convex dev`, it will:

1. **Ask you to login** (if not already logged in)
   - Opens browser for authentication
   - Or asks you to paste a code

2. **Ask which project to use** (if you have multiple)
   - Select the project you just created

3. **Generate the URL automatically**
   - Creates `.env.local` file
   - Adds `NEXT_PUBLIC_CONVEX_URL=https://xxxxx.convex.cloud`
   - Shows the URL in the terminal output

### Step 3: Find the URL

The URL will appear in **3 places**:

#### ✅ Option A: Terminal Output
After running `npx convex dev`, you'll see:
```
✓ Convex functions ready!
  Deployment URL: https://xxxxx.convex.cloud
```

#### ✅ Option B: `.env.local` File
After running the command, check:
```
ai-image-editor/.env.local
```

It will contain:
```env
NEXT_PUBLIC_CONVEX_URL=https://xxxxx.convex.cloud
```

#### ✅ Option C: Convex Dashboard
1. Go to https://dashboard.convex.dev
2. Select your project
3. Click **Settings** → **Environment Variables**
4. You'll see your deployment URL there

---

## 🔍 Example URL Format

Your Convex URL will look like:
```
https://happy-animal-123.convex.cloud
```

Or:
```
https://your-project-name.convex.cloud
```

---

## ⚠️ Important Notes

1. **Don't create the URL manually** - Let Convex generate it
2. **Keep `.env.local` in `.gitignore`** - It contains your project URL
3. **The URL is unique to your project** - Each Convex project has its own URL
4. **Development vs Production** - You might have different URLs for dev/prod

---

## 🚀 Quick Start

Just run this:

```bash
cd ai-image-editor
npx convex dev
```

Then:
- ✅ Copy the URL from terminal output
- ✅ Or check `.env.local` file
- ✅ Restart your Next.js dev server: `npm run dev`

---

## ❓ Troubleshooting

### "I don't see the URL"
- Make sure you're logged in: `npx convex login`
- Check if `.env.local` was created
- Look at the terminal output carefully

### "URL not working"
- Make sure `.env.local` is in the `ai-image-editor` folder (not parent folder)
- Restart Next.js dev server after creating `.env.local`
- Check that the URL starts with `https://` and ends with `.convex.cloud`

### "I already have a Convex project"
- Run `npx convex dev` in your project folder
- It will detect your existing project
- Use the URL it shows

---

## 📝 Summary

**You don't need to find the URL manually!**

Just run:
```bash
npx convex dev
```

And Convex will:
- ✅ Generate the URL automatically
- ✅ Save it to `.env.local`
- ✅ Show it in the terminal
- ✅ Push your schema

That's it! 🎉

