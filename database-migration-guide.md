# Database Migration: Railway to Render

## Step 1: Create Railway Database Backup

### Option A: Using Railway's Backup Interface (Easiest)
1. **In Railway Dashboard** (as shown in your screenshot):
   - Go to your AI Sentinel project
   - Click "Backups" tab
   - Click "Create Backup" button
   - Wait for backup to complete
   - Download the backup file

### Option B: Using pg_dump Command (More Control)
```bash
# Run this command in your local terminal or in Replit shell
# Replace with your actual Railway DATABASE_URL
pg_dump "postgresql://postgres:password@host:port/database" > aisentinel_backup.sql
```

**To get your Railway DATABASE_URL:**
1. Go to Railway dashboard
2. Click on your PostgreSQL service
3. Go to "Variables" tab
4. Copy the `DATABASE_URL` value

### Option C: Using Replit Shell (Recommended)
```bash
# In Replit shell, your DATABASE_URL is already set
echo $DATABASE_URL
pg_dump $DATABASE_URL > aisentinel_backup.sql
```

## Step 2: Verify the Backup
```bash
# Check the backup file was created
ls -la aisentinel_backup.sql

# Check the file contains data (should show table creation and data)
head -50 aisentinel_backup.sql
```

## Step 3: Import to Render Database
Once you create your Render PostgreSQL database:

```bash
# Import the backup to your new Render database
psql "YOUR_RENDER_DATABASE_URL" < aisentinel_backup.sql
```

## Why pg_dump?
- **Complete data**: Captures all tables, relationships, and data
- **Schema included**: Table structures and indexes preserved
- **Portable**: Works between any PostgreSQL databases
- **Reliable**: Industry standard for database migrations

## What's Backed Up
Your backup will include:
- All user accounts and authentication data
- Company configurations and settings  
- AI model templates and providers
- Chat sessions and messages
- Activity types and permissions
- All relationships between tables

Would you like me to help you run the backup command in Replit's shell?