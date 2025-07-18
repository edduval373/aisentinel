# Deployment Workaround - Runtime Version Fix

## Current Error
```
Error: Function Runtimes must have a valid version, for example `now-php@1.0.0`.
```

## Root Cause
The `@vercel/node@3` runtime version format is invalid or not supported.

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

## Key Changes
1. **Removed invalid runtime version**: `@vercel/node@3` → `@vercel/node`
2. **Used builds instead of functions**: This is the more reliable approach
3. **Proper routing configuration**: Routes all requests to the serverless function

## Alternative Minimal Version
If the above doesn't work, try this ultra-minimal version:

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

## Expected Result
After updating `vercel.json`:
1. Build will complete without runtime errors
2. Application will be accessible
3. Both frontend and API routes will work

## The Issue
Vercel rejected the `@vercel/node@3` runtime version format. Using the standard `@vercel/node` without version should resolve this.