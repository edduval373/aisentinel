# Vercel Framework Settings - Correct Configuration

## Framework Detection
- ✅ Vercel detected **Vite** - this is correct
- Your project uses Vite for the React frontend
- Keep it as **Vite** framework

## Override These Settings
Even though it detected Vite, override these settings:

### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### Root Directory
- **Root Directory**: `.` (leave as default)

## Why These Settings
- Your `package.json` has `"build": "vite build && esbuild..."`
- This builds both frontend (Vite) and backend (esbuild)
- Output goes to `dist/public/` for static files
- API routes handled by `/api/index.ts`

## Environment Variables
Add these before deploying:
```
DATABASE_URL=your_postgresql_connection_string
SENDGRID_API_KEY=your_new_sendgrid_api_key
NODE_ENV=production
```

## Expected Build Process
1. Vite builds React app → `dist/public/`
2. esbuild builds Express server → `dist/`
3. Vercel deploys static files and serverless functions

Keep **Vite** as the framework and use the custom build settings above.