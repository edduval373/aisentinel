# Fix File Location Issue

## Problem
The `landing.tsx` file is in the wrong location:
- **Current location**: `client/src/pages/admin/landing.tsx` ❌
- **Expected location**: `client/src/pages/landing.tsx` ✅

## Solution
In your GitHub repository:

### Option 1: Move the File
1. Go to `client/src/pages/admin/landing.tsx`
2. Move it to `client/src/pages/landing.tsx`

### Option 2: Update the Import
In `client/src/App.tsx`, change line 8 from:
```typescript
import Landing from "@/pages/landing";
```
To:
```typescript
import Landing from "@/pages/admin/landing";
```

## Recommendation: Option 1 (Move the File)
Move `landing.tsx` from the admin folder to the main pages folder since:
- It's not an admin-specific page
- It's the public landing page for unauthenticated users
- The current import expects it in `@/pages/landing`

## Steps
1. In GitHub, navigate to `client/src/pages/admin/`
2. Open `landing.tsx`
3. Copy the contents
4. Create new file: `client/src/pages/landing.tsx`
5. Paste the contents
6. Delete the old file from admin folder
7. Commit changes

This will fix the import error and allow your build to complete successfully!