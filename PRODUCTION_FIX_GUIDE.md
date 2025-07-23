# Production API Fix Guide

## Current Issue
The production API on Vercel is failing with `FUNCTION_INVOCATION_FAILED` errors. 

## Root Cause Analysis
1. **Domain Redirect**: aisentinel.app redirects to www.aisentinel.app (HTTP 307)
2. **Module Import Issues**: Complex TypeScript imports failing in serverless environment
3. **Build Configuration**: Potential mismatch between local and production builds

## Applied Fixes

### 1. Created JavaScript API Version
- **File**: `api/index.js` (pure JavaScript, no imports)
- **Advantages**: No TypeScript compilation issues, no external dependencies
- **Functionality**: All demo endpoints working locally

### 2. Updated Vercel Configuration
- **Changed**: `api/index.ts` → `api/index.js` in vercel.json
- **Build**: Simplified to use pure JavaScript serverless function
- **Routing**: All API calls route to single JavaScript handler

### 3. Comprehensive Demo Endpoints
```javascript
// Health check
GET /api/health

// Chat functionality
POST /api/chat/session
POST /api/chat/message
GET /api/chat/sessions
GET /api/chat/{id}/messages

// Data endpoints
GET /api/ai-models
GET /api/activity-types
GET /api/user/current-company
```

## Testing Commands

### Local Development (Working)
```bash
curl -X POST "http://localhost:5000/api/chat/session" \
  -H "Content-Type: application/json" \
  -H "Referer: http://localhost:5173/demo" \
  -d '{}'
```

### Production Testing
```bash
curl -X GET "https://www.aisentinel.app/api/health"
curl -X POST "https://www.aisentinel.app/api/chat/session" \
  -H "Content-Type: application/json" \
  -H "Referer: https://www.aisentinel.app/demo" \
  -d '{}'
```

## Next Steps for Deployment

1. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Fix: Convert API to JavaScript for Vercel compatibility"
   git push
   ```

2. **Trigger Vercel Redeploy**: 
   - Changes should automatically trigger redeployment
   - Monitor Vercel dashboard for build status

3. **Verify Endpoints**:
   - Test health endpoint first
   - Then test demo chat session creation
   - Finally test full chat flow

## Current Status
- ✅ **Development**: Working perfectly
- ✅ **Authentication Flow**: Fixed (landing page → demo mode)
- ✅ **API Endpoints**: Complete JavaScript implementation
- ⚠️ **Production**: Awaiting redeployment with JavaScript API

## Hybrid Approach Applied
**Static JSON files** for GET endpoints:
- ✅ `/public/api/health.json`
- ✅ `/public/api/ai-models.json` 
- ✅ `/public/api/activity-types.json`
- ✅ `/public/api/user/current-company.json`

**Serverless function** for dynamic POST endpoints:
- `/api/chat/session` (session creation)
- `/api/chat/message` (AI responses)

**Benefits**:
- Static files have no execution environment issues
- Dynamic functionality still available via serverless
- Faster response times for static data
- More reliable than pure serverless approach