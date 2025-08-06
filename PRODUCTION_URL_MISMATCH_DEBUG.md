# Production URL Mismatch Issue - August 6, 2025

## Problem Identified
The application is accessing the wrong production URL:

**Current logs show**: `aisentinel-i2sssbjjq-ed-duvals-projects.vercel.app`
**Correct URL provided**: `aisentinel-66zmjlvwj-ed-duvals-projects.vercel.app`

## Errors Observed
1. `/api/version/current - Status: 500`
2. `AI Models loaded: 0 models`
3. `Activity Types loaded: 0 types`
4. Form fields showing "Not set" instead of populated values

## Root Cause
The frontend is making API calls to the wrong Vercel deployment, which either:
1. Doesn't have the updated API routes
2. Has authentication protection preventing access
3. Is an older deployment without the snake_case to camelCase conversion fixes

## Next Steps
1. Verify API endpoints work on correct URL
2. Check if deployment needs refresh
3. Add URL debugging to frontend to trace which endpoint is being called