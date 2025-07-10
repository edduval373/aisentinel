# How to Get Railway PostgreSQL Connection String

## Current Issue
The DATABASE_URL is showing a Railway dashboard URL instead of a PostgreSQL connection string.

## Steps to Get the Correct Connection String:

### Method 1: Railway Dashboard
1. Go to your Railway dashboard
2. Click on your **PostgreSQL service** (not the project)
3. Click on the **"Connect"** tab
4. Look for **"External Connection"** or **"Public Connection"**
5. Copy the connection string that looks like:
   ```
   postgresql://postgres:password@monorail.proxy.rlwy.net:12345/railway
   ```

### Method 2: Railway CLI
If you have Railway CLI installed:
```bash
railway connect postgres
```

### Method 3: Environment Variables
In your Railway PostgreSQL service, look for these variables:
- `PGHOST` (should be like `monorail.proxy.rlwy.net`)
- `PGPORT` (should be a number like `12345`)
- `PGUSER` (usually `postgres`)
- `PGPASSWORD` (your password)
- `PGDATABASE` (usually `railway`)

Then construct: `postgresql://PGUSER:PGPASSWORD@PGHOST:PGPORT/PGDATABASE`

## What You Need:
A connection string starting with `postgresql://` or `postgres://` that includes:
- Username and password
- External hostname (like `monorail.proxy.rlwy.net`)
- Port number
- Database name

## What NOT to Use:
- Railway dashboard URLs (`https://railway.com/project/...`)
- Internal hostnames (`postgres.railway.internal`)
- Variable references (`${{ ... }}`)