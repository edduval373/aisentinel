# Production API Debug Plan - AI Sentinel

## Issue: Demo Mode Not Loading Company/Models in Production

### Problem Summary
In production (aisentinel.app/demo), the demo mode shows:
- Company: "Demo Company" (not loading actual company data)
- AI Models: Empty dropdown (not loading demo models)
- Activity Types: Empty dropdown (not loading demo activity types)

This works perfectly in development but fails in production.

### Root Cause Analysis
1. **API Endpoint Redirection**: All API calls to `/api/*` routes are returning "Redirecting..." instead of actual data
2. **Serverless Function Routing**: The Vercel function at `api/index.ts` may not be receiving requests properly
3. **Demo Mode Detection**: Production demo mode detection might be failing

### Current API Status (Production)
```bash
curl "https://aisentinel.app/api/health" → "Redirecting..."
curl "https://aisentinel.app/api/ai-models" → "Redirecting..."  
curl "https://aisentinel.app/api/activity-types" → "Redirecting..."
curl "https://aisentinel.app/api/user/current-company" → "Redirecting..."
```

### Debug Steps Implemented

#### 1. Enhanced Error Handling in api/index.ts
- Added comprehensive logging for demo mode endpoints
- Added fallback logic to create demo data if none exists
- Added detailed error reporting with stack traces

#### 2. Auto-Initialization Logic
- If no companies exist in database, create "Horizon Edge Enterprises" as demo company
- If no AI models exist for company 1, initialize default models
- If no activity types exist for company 1, initialize default types

#### 3. Enhanced Logging
- Added request header logging for debugging
- Added database availability checks
- Added detailed error messages with context

### Next Steps for Resolution

#### Option 1: Direct Vercel Function Testing
Test the serverless function directly via Vercel's function URL pattern:
```bash
curl "https://aisentinel.app/api/index.ts?path=/health"
curl "https://aisentinel.app/api/index.ts?path=/ai-models"
```

#### Option 2: Vercel Routing Fix
The issue might be in `vercel.json` routing configuration:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    }
  ]
}
```

#### Option 3: Database Connectivity
Verify the production database has:
- At least one company record (ID: 1)
- AI models for company 1
- Activity types for company 1

### Expected Resolution
Once the API endpoints work properly, demo mode should show:
- Company: "Horizon Edge Enterprises (1)"
- AI Models: 6+ working models (OpenAI, Anthropic, Perplexity, etc.)
- Activity Types: 4+ types (General Chat, Code Review, etc.)

### Testing Commands
```bash
# Test production endpoints directly
curl -v "https://aisentinel.app/api/health"
curl -v "https://aisentinel.app/api/ai-models"
curl -v "https://aisentinel.app/api/activity-types"
curl -v "https://aisentinel.app/api/user/current-company"

# Test with demo mode headers
curl -H "x-demo-mode: true" "https://aisentinel.app/api/ai-models"
curl -H "referer: https://aisentinel.app/demo" "https://aisentinel.app/api/ai-models"
```

## Status: READY FOR DEPLOYMENT
The serverless function has been enhanced with comprehensive demo mode support and auto-initialization. Deploy to test the fixes.