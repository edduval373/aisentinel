# Fix Vite Config for Vercel Deployment

## Problem
The current `vite.config.ts` imports Replit-specific plugins that don't exist in Vercel:
- `@replit/vite-plugin-runtime-error-modal`
- `@replit/vite-plugin-cartographer`

## Solution
Replace your `vite.config.ts` file in GitHub with this production-ready version:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "client", "src", "assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
```

## What Changed
- ✅ Removed Replit-specific plugins
- ✅ Kept essential React plugin
- ✅ Maintained all path aliases
- ✅ Preserved build configuration

## Steps
1. Edit `vite.config.ts` in your GitHub repository
2. Replace the entire file with the code above
3. Commit the changes
4. Vercel will automatically redeploy

This will fix the "Cannot find package" error and allow your build to complete successfully.