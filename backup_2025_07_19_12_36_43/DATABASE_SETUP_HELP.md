# Final Fix - Update Only api/index.ts

## Current Status
- ✅ Simple vercel.json builds successfully (commit 9C9pyMgTF - "Ready")
- ❌ Complex vercel.json fails (commit 5Ld6faSNe - "Error")
- ❌ Current deployment shows 404 because api/index.ts doesn't serve static files

## Solution: Only Update api/index.ts

Keep the working vercel.json and update only the serverless function to serve static files.

## Replace api/index.ts with:

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

## Expected Result
- ✅ Uses working vercel.json (simple version)
- ✅ Serverless function serves static React files
- ✅ API routes work properly
- ✅ React app loads on root URL
- ✅ No 404 errors

## Key Changes
1. Added static file serving from `dist/public`
2. Added catch-all route for React routing
3. Proper path resolution for Vercel environment
4. Keeps all existing API functionality