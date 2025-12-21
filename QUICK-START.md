# 🚀 Quick Start - Vercel KV Setup

Your app has been updated to use Vercel KV storage. Follow these steps to get it working:

## ✅ What's Already Done

- ✅ Installed `@vercel/kv` package
- ✅ Updated API routes to use KV storage
- ✅ Created migration script
- ✅ Created setup documentation

## 📋 What You Need To Do

### Option A: Deploy to Vercel First (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your `booky` project

2. **Create KV Database (via Marketplace)**
   - Click **Storage** tab
   - Click **Browse Marketplace** or **Create Database**
   - Look for **Vercel KV** or **Serverless Redis** (same thing!)
   - Click **Create**
   - Name it: `booky-storage`
   - Select your preferred region
   - Click **Create Database**

3. **Connect to Project**
   - Click **Projects** tab or **Connect Project** button
   - Select `booky`
   - Click **Connect** or **Link Project**

4. **Deploy Your Code**
   ```bash
   git add .
   git commit -m "Migrate to Vercel KV storage"
   git push
   ```

5. **Migrate Your Data** (if you have existing books)
   - After deployment, copy your KV environment variables from Vercel
   - Create `.env.local` file (copy from `.env.local.example`)
   - Paste the values
   - Run: `npm run migrate`

**Done! Your app now works on Vercel!** 🎉

---

### Option B: Test Locally First

1. **Set up Vercel KV** (steps 1-3 from Option A)

2. **Get Local Environment Variables**
   - In Vercel KV dashboard, click **`.env.local`** tab
   - Copy the variables shown

3. **Create Local Config**
   ```bash
   cp .env.local.example .env.local
   ```
   - Paste the KV variables into `.env.local`

4. **Migrate Existing Data**
   ```bash
   npm run migrate
   ```

5. **Test Locally**
   ```bash
   npm run dev
   ```
   - Open http://localhost:3000
   - Try creating, updating, and deleting books

6. **Deploy**
   ```bash
   git add .
   git commit -m "Migrate to Vercel KV storage"
   git push
   ```

**Done!** 🎉

---

## 🧪 Testing

After setup, test these features:

### On Vercel
- ✅ Create a new book
- ✅ Click stars to update rating
- ✅ Edit a book
- ✅ Delete a book
- ✅ Filter and sort books

### Locally (if using .env.local)
Same tests as above!

---

## 📚 More Information

- See [VERCEL-KV-SETUP.md](./VERCEL-KV-SETUP.md) for detailed documentation
- Troubleshooting tips included in that file

## ❓ Common Issues

### "KV is not configured"
**Fix:** Make sure you connected the KV database to your project in Vercel dashboard

### Local dev not working
**Fix:**
1. Create `.env.local` from `.env.local.example`
2. Get values from Vercel KV dashboard → `.env.local` tab
3. Restart dev server

### Data missing after migration
**Fix:** Run `npm run migrate` again with proper `.env.local` setup

---

## 🎯 Why This Change?

**Before:** App used `data/books.json` file
- ✅ Works locally
- ❌ Fails on Vercel (read-only filesystem)

**After:** App uses Vercel KV (Redis)
- ✅ Works locally
- ✅ Works on Vercel
- ✅ Fast and reliable
- ✅ Free tier available

---

Ready to deploy? Just follow Option A above! 🚀
