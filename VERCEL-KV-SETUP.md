# Vercel KV Setup Guide

This guide will help you set up Vercel KV storage for your Book Tracker app.

## Why Vercel KV?

Your app previously used filesystem storage (`data/books.json`), which works locally but **fails on Vercel** because serverless functions have read-only filesystems. Vercel KV (Redis) provides persistent storage that works both locally and in production.

## Setup Steps

### 1. Create a Vercel KV Database (via Marketplace)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (booky)
3. Click on the **Storage** tab
4. You'll see a message about the Marketplace - click **Browse Marketplace** or **Create Database**
5. Look for **Vercel KV** or **Serverless Redis** (they're the same thing)
6. Click on it and then click **Create**
7. Choose a name (e.g., "booky-storage")
8. Select a region closest to your users
9. Click **Create** or **Create Database**

### 2. Connect KV to Your Project

After creating the database:

1. You'll be shown the database details page
2. Click on the **Projects** tab or look for **Connect Project** button
3. Select your `booky` project from the list
4. Click **Connect** or **Link Project**

This automatically adds the required environment variables to your project:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

> **Note:** The interface may show "Serverless Redis" - this is Vercel KV. They're the same product.

### 3. Set Up Local Development (Optional)

To test KV storage locally:

1. In your Vercel KV dashboard, click **`.env.local` tab**
2. Copy the environment variables shown
3. Create a `.env.local` file in your project root:
   ```bash
   cp .env.local.example .env.local
   ```
4. Paste the values from Vercel into `.env.local`

> **Note:** `.env.local` is gitignored - never commit these values!

### 4. Migrate Existing Data (If you have data in books.json)

If you have existing books in `data/books.json`, migrate them to KV:

1. Make sure your `.env.local` is set up (from step 3)
2. Install tsx (for running TypeScript):
   ```bash
   npm install -D tsx
   ```
3. Run the migration script:
   ```bash
   npx tsx scripts/migrate-to-kv.ts
   ```

This will copy all books from `data/books.json` to Vercel KV.

### 5. Deploy to Vercel

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Migrate to Vercel KV storage"
   git push
   ```

2. Vercel will automatically deploy

3. The environment variables are already configured, so it will work immediately!

## Testing

### Test Locally
```bash
npm run dev
```

Open http://localhost:3000 and try:
- ✅ Creating a book
- ✅ Updating a book (including rating stars)
- ✅ Deleting a book

### Test on Vercel

After deployment:
1. Visit your production URL
2. Try the same operations
3. Everything should work perfectly!

## Troubleshooting

### "KV_REST_API_URL is not defined"

**Solution:** Make sure you've connected the KV database to your project in the Vercel dashboard (Step 2).

### Local development not working

**Solution:**
1. Check that `.env.local` exists and has the correct values
2. Restart your dev server: `npm run dev`

### Data not showing up

**Solution:**
1. Check Vercel KV dashboard to see if data is stored
2. Run the migration script if you have existing data
3. Check browser console and terminal for errors

## How It Works

### Before (Filesystem)
```typescript
// ❌ Doesn't work on Vercel
const books = JSON.parse(fs.readFileSync('data/books.json'))
fs.writeFileSync('data/books.json', JSON.stringify(books))
```

### After (Vercel KV)
```typescript
// ✅ Works everywhere!
const books = await kv.get('books') || []
await kv.set('books', books)
```

## What Changed

- ✅ `src/app/api/books/route.ts` - Updated to use KV
- ✅ `src/app/api/books/[id]/route.ts` - Updated to use KV
- ✅ All CRUD operations now work on Vercel
- ✅ Instant rating updates now work in production

## Free Tier Limits

Vercel KV Free Tier includes:
- 256 MB storage
- 30,000 commands per month
- More than enough for a personal book tracker!

## Need Help?

If you run into issues:
1. Check the Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables in Vercel dashboard
