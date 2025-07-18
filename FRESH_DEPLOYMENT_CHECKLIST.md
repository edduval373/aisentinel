# Fresh Deployment Checklist - Complete Reset

## Step 1: Delete Current Projects
### Delete Vercel Project
- [ ] Go to Vercel dashboard
- [ ] Select your AI Sentinel project
- [ ] Go to Settings → General
- [ ] Scroll to "Delete Project"
- [ ] Type project name to confirm
- [ ] Click "Delete"

### Delete GitHub Repository
- [ ] Go to GitHub.com
- [ ] Navigate to your AiSentinel repository
- [ ] Go to Settings tab
- [ ] Scroll to "Danger Zone"
- [ ] Click "Delete this repository"
- [ ] Type repository name to confirm
- [ ] Click "I understand the consequences, delete this repository"

## Step 2: Prepare Fresh Files
### Download Project Files
- [ ] In Replit, right-click on root folder
- [ ] Select "Download as ZIP"
- [ ] Save to your computer
- [ ] Extract the ZIP file

### Clean Up Files (Optional)
Remove these files before upload:
- [ ] Delete `.git` folder (if visible)
- [ ] Delete `node_modules` folder
- [ ] Delete `dist` folder
- [ ] Keep: `package.json`, `api/`, `client/`, `server/`, `shared/`, `vercel.json`

## Step 3: Create New GitHub Repository
- [ ] Go to GitHub.com
- [ ] Click "New repository"
- [ ] Name: `ai-sentinel-fresh` (or similar)
- [ ] Set to Public
- [ ] Don't initialize with README
- [ ] Click "Create repository"

## Step 4: Upload Files to GitHub
### Method A: Web Upload
- [ ] Click "uploading an existing file"
- [ ] Drag your project files (not the ZIP)
- [ ] Add commit message: "Initial commit - AI Sentinel"
- [ ] Click "Commit changes"

### Method B: GitHub Desktop (if available)
- [ ] Clone the empty repository
- [ ] Copy your files into the folder
- [ ] Commit and push

## Step 5: Create New Vercel Project
- [ ] Go to https://vercel.com/new
- [ ] Click "Import Git Repository"
- [ ] Select your new GitHub repository
- [ ] Configure settings:
  - Framework Preset: **Other**
  - Build Command: `npm run build`
  - Output Directory: `dist/public`
  - Install Command: `npm install`

## Step 6: Add Environment Variables
Add these in Vercel before deploying:
- [ ] `DATABASE_URL` = your PostgreSQL connection string
- [ ] `SENDGRID_API_KEY` = your SendGrid API key
- [ ] `NODE_ENV` = production
- [ ] `APP_URL` = (leave empty, Vercel will auto-fill)

## Step 7: Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Test the live URL

## Step 8: Verify Everything Works
- [ ] Website loads correctly
- [ ] Login page appears
- [ ] API endpoints respond
- [ ] Database connection works
- [ ] Email verification works

## Backup Information
Your current working files are ready:
- ✅ Application builds successfully
- ✅ All dependencies installed
- ✅ Clean vercel.json configuration
- ✅ Database schema ready
- ✅ SendGrid integration working

## Tips for Success
1. **Don't rush** - take time with each step
2. **Test locally first** - run `npm run build` before deploying
3. **Keep it simple** - use default Vercel settings
4. **One step at a time** - complete each checklist item fully

This fresh start will eliminate all the corrupted state issues you've been experiencing.