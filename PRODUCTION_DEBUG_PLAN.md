# Production API Debug Plan

## Enhanced Logging Added

### Client-Side Logging
✅ **API Request Function (`apiRequest`)**
- Request start time and full URL
- HTTP method and request data
- Response status and headers 
- Content-Type validation
- Response duration tracking
- Detailed error logging with response previews

✅ **Query Function (`getQueryFn`)**
- Query start time and URL logging
- Response headers and status tracking
- Content-Type validation for JSON responses
- Unauthorized request handling
- Response preview for non-JSON responses

### What We'll See In Console
1. **Request Initiation**: `🔄 [API GET] /api/auth/me - Start`
2. **URL Details**: Full URL with domain
3. **Response Status**: HTTP status codes and timing
4. **Content Analysis**: Content-Type headers
5. **Error Details**: Response previews when APIs fail

## Testing Strategy

### Step 1: Load Landing Page
Expected logs when opening https://aisentinel.app:
- Authentication check (`/api/auth/me`)
- Should see if API returns HTML vs JSON

### Step 2: Click "Get Started"
Expected logs for email verification flow:
- Email verification request (`/api/auth/request-verification`)
- Response content type analysis

### Step 3: Navigate to Demo
Expected logs for demo mode:
- AI models fetch (`/api/ai-models`)
- Activity types fetch (`/api/activity-types`)
- Company info fetch (`/api/user/current-company`)

## Expected Issues to Identify
1. **HTML Instead of JSON**: APIs returning Vercel default HTML pages
2. **404 Routing**: Serverless functions not properly routed
3. **Content-Type Mismatches**: APIs not setting proper JSON headers
4. **CORS Issues**: Cross-origin request failures

## Production URLs to Test
- `https://aisentinel.app/api/health` (should return JSON)
- `https://aisentinel.app/api/ai-models` (critical for demo)
- `https://aisentinel.app/api/auth/me` (authentication check)

The enhanced logging will show us exactly which API call fails and why!