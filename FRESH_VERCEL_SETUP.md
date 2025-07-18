# Fresh Vercel Setup - Final Configuration

## Current Status
✅ All React source files exist in GitHub  
✅ `client/src/App.tsx` exists and is updated  
❌ Build still failing with "Could not resolve entry module 'index.html'"

## Root Cause
The `vite.config.ts` in your GitHub repository likely still contains Replit-specific plugins that don't work in Vercel's environment.

## Solution: Replace vite.config.ts in GitHub

Replace your `vite.config.ts` file in GitHub with this clean production version:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
```

## Also Update These Files in GitHub:

### 1. Update `.vercelignore` (if not already done):
```
node_modules
.git
.next
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.tsbuildinfo

# Development files
.replit
cookies.txt
drizzle.config.ts
tsconfig.json
vite.config.ts
postcss.config.js
tailwind.config.ts
components.json

# Documentation and guides - ALL .md files
*.md

# Vercel configs
vercel-*.json

# Attached assets
attached_assets/

# Backup files
BACKUP_APP_NO_LANDING.tsx
App-fixed.tsx
package-fixed.json
```

### 2. Verify `client/index.html` contains:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>AI Sentinel - Enterprise AI Governance</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## Expected Result
After updating these files, your Vercel build should complete successfully.

## Build Process Check
The build should proceed as:
1. ✅ Dependencies install
2. ✅ Vite finds index.html in client folder
3. ✅ Vite builds React application
4. ✅ ESBuild compiles server
5. ✅ Deployment completes with live URL