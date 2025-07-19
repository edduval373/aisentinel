# VERCEL FRAMEWORK SETTINGS FIX

## Problem: Invalid Runtime Version
Error: `Function Runtimes must have a valid version, for example 'now-php@1.0.0'`

## Solution: Corrected Runtime Configuration

### Updated vercel.json
```json
{
  "version": 2,
  "functions": {
    "api/index.ts": {
      "runtime": "@vercel/node@20.x"
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

### Key Changes
- **Runtime**: Changed from `@vercel/node@3` to `@vercel/node@20.x`
- **Valid Version**: Uses proper Vercel runtime versioning format
- **Node 20**: Latest stable version for serverless functions

### Expected Result
- ✅ Build will proceed without runtime errors
- ✅ Serverless function compiles correctly
- ✅ Deployment completes successfully
- ✅ AI Sentinel landing page loads

## Upload Updated vercel.json File