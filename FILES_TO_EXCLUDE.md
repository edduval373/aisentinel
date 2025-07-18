# Critical Files to Update for Successful Deployment

## Current Issue
Build failing with: "Could not resolve entry module 'index.html'"

## Root Cause
The `vite.config.ts` file contains Replit-specific plugins that don't work in Vercel's build environment.

## Files to Update in GitHub Repository

### 1. Replace `vite.config.ts` with:
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

### 2. Keep `vercel.json` as the simple version:
```json
{
  "version": 2,
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.ts"
    }
  ]
}
```

### 3. Update `api/index.ts` to serve static files:
```typescript
// Vercel serverless function entry point
import express from 'express';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from '../server/routes';

const app = express();

// Configure Express middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  abortOnLimit: true,
  responseOnLimit: "File size limit exceeded",
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

// Initialize routes and static serving
let routesInitialized = false;
const initializeRoutes = async () => {
  if (!routesInitialized) {
    await registerRoutes(app);
    
    // Serve static files from dist/public
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const publicPath = path.join(__dirname, '../dist/public');
    app.use(express.static(publicPath));
    
    // Catch-all handler for React routing
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(publicPath, 'index.html'));
      }
    });
    
    routesInitialized = true;
  }
};

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Export the handler for Vercel
export default async (req: any, res: any) => {
  await initializeRoutes();
  return app(req, res);
};
```

## Priority Order
1. **Update `vite.config.ts` first** - This will fix the build failure
2. **Update `api/index.ts`** - This will fix the 404 error
3. **Keep the simple `vercel.json`** - This works for routing

## Expected Result
- ✅ Build completes successfully
- ✅ React app loads properly
- ✅ API routes work
- ✅ No 404 errors

## Critical Point
The `vite.config.ts` must be updated to remove Replit-specific plugins, or the build will continue to fail with "Could not resolve entry module 'index.html'".