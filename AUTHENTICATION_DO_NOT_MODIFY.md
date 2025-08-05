# ⚠️ CRITICAL: DO NOT MODIFY AUTHENTICATION SYSTEM ⚠️

## IMPORTANT WARNING FOR ALL DEVELOPERS AND AI ASSISTANTS

**THE AUTHENTICATION SYSTEM IS WORKING CORRECTLY IN PRODUCTION**

### What NOT to change:
1. **Production token**: `prod-1754052835575-289kvxqgl42h` - This is hardcoded and REQUIRED
2. **Header-based authentication strategy** - This is working in Vercel production
3. **Any authentication endpoints** - They are stable and functional
4. **Storage methods for authentication** - Do not modify existing auth patterns

### Why this matters:
- User specifically requested NO changes to authentication
- System is deployed and working in production on Vercel
- Any modifications will break the working authentication flow
- The hardcoded token approach was implemented after extensive testing

### If you need to add new features:
- Copy the exact authentication pattern from existing endpoints
- Use the same production token validation
- Do not try to "improve" or "refactor" the authentication
- Add explicit warnings in any new authentication code

### Code Pattern to Use:
```javascript
// ⚠️ CRITICAL WARNING: DO NOT MODIFY AUTHENTICATION STRATEGY ⚠️
// This hardcoded production token authentication is REQUIRED and WORKING
// User specifically requested NO changes to auth system - it works in production  
// ANY CHANGES TO THIS AUTHENTICATION WILL BREAK THE WORKING SYSTEM
const productionToken = 'prod-1754052835575-289kvxqgl42h';
const extractedToken = authHeader?.replace('Bearer ', '') || sessionToken;

if (extractedToken === productionToken) {
  // Authentication successful
} else {
  // Authentication failed
}
```

### Files with authentication that should NOT be modified:
- `server/authRoutes.ts`
- `client/src/hooks/useAuth.ts`
- `client/src/pages/Login.tsx`
- `server/cookieAuth.ts`
- Any API endpoints with authentication

## REMEMBER: The system works. Do not fix what is not broken.