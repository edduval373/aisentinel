# Final Build Fix - Direct Package.json Script

## Problem
`build.js` file doesn't exist in GitHub repository, causing "Cannot find module" error.

## Solution
Update `package.json` to use direct build commands instead of external file.

## Replace the build script in package.json:

Change from:
```json
"build": "node build.js"
```

To:
```json
"build": "vite build --config vite.config.production.ts && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

## Create `vite.config.production.ts` in GitHub root:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

## Why This Works
1. **Uses production-specific config** - Clean Vite config without Replit plugins
2. **No external build file needed** - Everything inline in package.json
3. **Same build output** - Builds to correct directories
4. **Vercel compatible** - Uses standard Vite build process

## Expected Result
- ✅ Vite builds React client successfully
- ✅ Esbuild builds Express server
- ✅ No module not found errors
- ✅ Complete Vercel deployment