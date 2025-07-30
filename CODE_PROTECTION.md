# Code Protection System

## Protected Sections Registry

### Landing Page Authentication Flow
**Status**: ✅ PROTECTED - Testing Complete  
**Date Protected**: July 30, 2025  
**Files**: 
- `client/src/pages/landing.tsx` (lines 1-697)
- Email verification system
- Cookie authentication flow

**Protection Rules**:
- No developer shortcuts or fallback authentication
- Only proper email verification system allowed
- No mock, dummy, or placeholder data
- Clean production-ready code only

**Changes Require**: Explicit developer commission

### Authentication System Core
**Status**: ✅ PROTECTED - Production Ready  
**Date Protected**: July 30, 2025  
**Files**:
- `server/services/authService.ts`
- `server/cookieAuth.ts` 
- `api/index.js` (production serverless function)

**Protection Rules**:
- Database-only authentication (Railway PostgreSQL)
- No fallback authentication mechanisms
- Proper session validation required
- Company-based authorization enforced

**Changes Require**: Explicit developer commission

## Protection Implementation

### Code Markers
Protected sections are marked with:
```
// PROTECTED SECTION START - [Section Name] - [Date]
// Changes require explicit developer permission
[protected code]
// PROTECTED SECTION END - [Section Name]
```

### Validation Process
Before making changes to any file:
1. Check CODE_PROTECTION.md for protected sections
2. If section is protected, require explicit developer approval
3. Document any approved changes with date and reason
4. Update protection status if needed

## Request Format for Changes
To request changes to protected sections:
```
PROTECTED CODE CHANGE REQUEST
Section: [Protected Section Name]
Reason: [Detailed justification]
Files Affected: [List of files]
Approval: [Developer signature/confirmation]
```