# Complete Vercel Setup Guide for AI Sentinel

## Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-sentinel.git
   git push -u origin main
   ```

## Step 2: Create Vercel Project

1. **Go to Vercel**: https://vercel.com/new
2. **Import Git Repository**: Select your GitHub repository
3. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

## Step 3: Set Environment Variables

In your Vercel project dashboard, go to **Settings** > **Environment Variables** and add:

### Required Variables:
```
DATABASE_URL=postgresql://username:password@host:port/database
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
APP_URL=https://your-project.vercel.app
NODE_ENV=production
```

### Optional Variables:
```
ENABLE_REPLIT_AUTH=false
SESSION_SECRET=your-random-session-secret
```

## Step 4: Database Setup

### Option A: Railway (Recommended)
1. Go to https://railway.app/
2. Create new project > Deploy PostgreSQL
3. Copy connection string to `DATABASE_URL`

### Option B: Supabase
1. Go to https://supabase.com/
2. Create new project
3. Go to Settings > Database > Connection string
4. Copy to `DATABASE_URL`

### Option C: Neon
1. Go to https://neon.tech/
2. Create new project
3. Copy connection string to `DATABASE_URL`

## Step 5: SendGrid Setup

1. **Create SendGrid Account**: https://sendgrid.com/
2. **Create API Key**:
   - Go to Settings > API Keys
   - Create API Key with "Full Access"
   - Copy key (starts with 'SG.')
3. **Verify Sender Identity**:
   - Go to Settings > Sender Authentication
   - Add your domain or verify single sender email

## Step 6: Deploy

1. **Deploy**: Click "Deploy" in Vercel dashboard
2. **Wait for build**: Check build logs for any errors
3. **Test deployment**: Visit your deployed URL

## Step 7: Post-Deployment Setup

1. **Database Migration**:
   ```bash
   # Run this locally with production DATABASE_URL
   npm run db:push
   ```

2. **Test Authentication**:
   - Try logging in with email verification
   - Check email delivery
   - Verify cookie-based sessions work

3. **Setup First Admin User**:
   - First user automatically gets super-user privileges
   - Create companies and manage users through admin panel

## Build Configuration

The project uses these build commands:
- **Client**: `vite build` → builds React app to `dist/`
- **Server**: `esbuild` → builds Express server to `dist/`
- **API**: Vercel serverless function at `/api/index.ts`

## Troubleshooting

### Build Errors
- Check all environment variables are set correctly
- Verify DATABASE_URL format and accessibility
- Ensure SendGrid API key is valid (starts with 'SG.')

### Database Issues
- Test connection string locally first
- Check if database allows connections from Vercel IPs
- Verify database exists and is accessible

### Email Issues
- Verify SendGrid API key in environment variables
- Check sender identity is verified
- Ensure APP_URL matches your deployment URL

### Authentication Problems
- Clear browser cookies and try again
- Check that APP_URL environment variable is correct
- Verify verification email links point to correct domain

## File Structure for Vercel

```
ai-sentinel/
├── api/
│   └── index.ts          # Vercel serverless function
├── dist/                 # Built client files
├── server/               # Express server code
├── client/               # React client code
├── shared/               # Shared types and schemas
├── vercel.json           # Vercel configuration
├── .vercelignore         # Files to ignore in deployment
└── package.json          # Dependencies and scripts
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SENDGRID_API_KEY` | Yes | SendGrid API key for emails |
| `APP_URL` | Yes | Your deployed app URL |
| `NODE_ENV` | Yes | Set to 'production' |
| `ENABLE_REPLIT_AUTH` | No | Set to 'false' to disable Replit auth |
| `SESSION_SECRET` | No | Random string for session security |

## Success Checklist

- [ ] Repository pushed to GitHub
- [ ] Vercel project created and configured
- [ ] All environment variables set
- [ ] Database created and accessible
- [ ] SendGrid account setup with verified sender
- [ ] Deployment successful
- [ ] Email verification working
- [ ] Authentication flow complete
- [ ] Admin panel accessible

Your AI Sentinel application is now ready for production use on Vercel!