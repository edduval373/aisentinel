# Fresh Deployment Checklist

## Critical Files for GitHub Repository

### 1. Root Directory Files
- `package.json` ✓
- `vite.config.ts` (clean production version)
- `vercel.json` ✓
- `.vercelignore` (updated to exclude *.md files)

### 2. Client Directory Files
- `client/index.html` (clean version without Replit banner)
- `client/src/App.tsx` (without Landing page import)
- `client/src/main.tsx`
- All component files

### 3. Server Directory Files
- `server/index.ts`
- All server files

### 4. API Directory Files
- `api/index.ts` (Vercel serverless handler)

### 5. Shared Directory Files
- `shared/schema.ts`
- All shared type definitions

## Build Error Resolution Steps

### Current Issue: "Could not resolve entry module 'index.html'"
This suggests the `client/index.html` file is missing from GitHub or in wrong location.

### Solutions:
1. **Upload clean index.html** to `client/index.html` in GitHub
2. **Verify file structure** matches expected layout
3. **Check vite.config.ts** is using production configuration
4. **Ensure .vercelignore** excludes documentation files

## Expected File Structure in GitHub:
```
aisentinel/
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       └── ...
├── server/
├── api/
├── shared/
├── package.json
├── vite.config.ts
├── vercel.json
└── .vercelignore
```