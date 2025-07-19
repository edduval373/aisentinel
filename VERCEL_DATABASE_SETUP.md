# URGENT: API Function Fix for Vercel Deployment

## Issue: "Failed to create chat session" Error  

Your AI Sentinel app is deployed with correct environment variables, but the serverless function wasn't properly configured.

## Solution: Add Database Environment Variable

### Step 1: Get Your Database URL
You need a PostgreSQL database. If you don't have one:
- **Railway**: Create a PostgreSQL database (recommended)
- **Supabase**: Create a new project
- **Aiven**: Free PostgreSQL tier

### Step 2: Add to Vercel Environment Variables
1. Go to your Vercel dashboard
2. Click on your AI Sentinel project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:

```
Name: DATABASE_URL
Value: postgresql://username:password@host:port/database
```

### Step 3: Redeploy
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Your app will now work correctly

## Required Environment Variables

For full functionality, add these to Vercel:

```
DATABASE_URL=postgresql://username:password@host:port/database
SENDGRID_API_KEY=your_sendgrid_api_key (optional, for emails)
APP_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

## Test After Setup

Once DATABASE_URL is added and redeployed:
- ✅ Chat interface will load properly
- ✅ No more "Failed to create chat session" error  
- ✅ Full AI chat functionality working

Your build was successful - you just need the database connection!