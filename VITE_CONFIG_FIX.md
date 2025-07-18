# Vite Configuration Fix

## Problem
Build failing with: `Could not resolve entry module "index.html"`

## Root Cause
The current vite.config.ts has Replit-specific plugins that may not work in Vercel's build environment.

## Solution
Create a clean production Vite configuration without Replit-specific plugins.

## Files to Update

### 1. Replace vite.config.ts with:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
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

### 2. Verify client/index.html exists and is valid

## Expected Result
Build should find index.html and complete successfully without Replit-specific plugin errors.