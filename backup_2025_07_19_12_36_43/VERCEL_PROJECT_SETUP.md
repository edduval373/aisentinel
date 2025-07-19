# Vercel Project Setup - Correct Configuration

## Progress Update
✅ Build is now proceeding (no more Landing page errors)
✅ `.vercelignore` is working (removed 56 files)
✅ Repository cloned successfully
❌ `vercel.json` configuration error

## Current Error
```
Build "src" is "client/index.html" but expected "package.json" or "build.sh"
```

## Root Cause
The `vercel.json` build configuration is pointing to the wrong source. Vercel expects a `package.json` at the build root.

## Solution: Update vercel.json

Replace your `vercel.json` in GitHub with this corrected version:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
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

## Alternative Simplified Version

If the above doesn't work, try this minimal version:

```json
{
  "version": 2,
  "functions": {
    "api/index.ts": {
      "runtime": "@vercel/node@3"
    }
  },
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

## Expected Result
After updating `vercel.json`, the build should:
1. ✅ Find package.json as the build source
2. ✅ Run `npm run build` command
3. ✅ Complete Vite frontend build
4. ✅ Complete ESBuild server build  
5. ✅ Generate deployment URL

The key fix is changing the build source from `client/index.html` to `package.json`.