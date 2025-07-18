# Immediate Fix: Custom Build Script Solution

## Problem
The Vite configuration is still causing build failures even after removing Replit plugins. The `"Could not resolve entry module 'index.html'"` error persists.

## Root Cause
The build script `vite build` is trying to use `vite.config.ts` which may have compatibility issues with Vercel's build environment.

## Solution: Custom Build Script
Instead of relying on `vite.config.ts`, create a custom build script that programmatically builds the project.

## Files to Update in GitHub

### 1. Create `vercel-build.js`:
```javascript
#!/usr/bin/env node
import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');

async function buildForVercel() {
  try {
    console.log('Building client with Vite...');
    
    // Build the client
    await build({
      root: resolve(__dirname, 'client'),
      build: {
        outDir: resolve(__dirname, 'dist/public'),
        emptyOutDir: true,
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, 'client/src'),
          '@shared': resolve(__dirname, 'shared'),
          '@assets': resolve(__dirname, 'attached_assets'),
        },
      },
    });
    
    console.log('Building server with esbuild...');
    
    // Build the server
    execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname,
    });
    
    console.log('Build completed successfully!');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildForVercel();
```

### 2. Update `package.json` build script:
Change:
```json
"build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

To:
```json
"build": "node vercel-build.js"
```

### 3. Keep these files as they are:
- `vercel.json` (the simple version that works)
- `api/index.ts` (updated to serve static files)

## Why This Will Work
1. **Bypasses vite.config.ts**: The custom build script doesn't rely on the problematic config file
2. **Programmatic build**: Uses Vite's build API directly with inline configuration
3. **No plugin conflicts**: Avoids all Replit-specific plugin issues
4. **Same output**: Produces the same build artifacts in the correct locations

## Expected Result
- ✅ Build process completes successfully
- ✅ Client builds to `dist/public`
- ✅ Server builds to `dist`
- ✅ Vercel deployment succeeds
- ✅ Application loads without 404 errors

## Implementation
1. Create `vercel-build.js` in the root directory
2. Update `package.json` to use the new build script
3. Commit and push to GitHub
4. Vercel will automatically trigger a new build

This approach completely sidesteps the Vite configuration issues and should result in a successful deployment.