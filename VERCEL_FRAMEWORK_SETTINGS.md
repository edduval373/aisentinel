# Vercel Framework Settings Fix

## Current Issue
Vite is transforming "0 modules" - it's not finding any files to build. This indicates a path resolution problem.

## Root Cause Analysis
The issue is likely in the `vite.config.ts` path resolution. The `__dirname` may not resolve correctly in Vercel's build environment.

## Solution: Update vite.config.ts in GitHub

Replace your `vite.config.ts` with this version that uses `import.meta.url` for better path resolution:

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

## Alternative Simple Version

If the above doesn't work, try this minimal version:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": "/client/src",
      "@shared": "/shared",
    },
  },
});
```

## Expected Result
After updating, Vite should find the index.html in the client folder and transform all React modules successfully.