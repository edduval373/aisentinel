# Fix Tailwind Config for Production Build

## Problem
The build fails because `@tailwindcss/typography` is referenced in tailwind.config.ts but it's in devDependencies and not available during production build.

## Solution Options

### Option 1: Move to Dependencies (Recommended)
Move `@tailwindcss/typography` from devDependencies to dependencies in package.json:

```json
"dependencies": {
  // ... existing dependencies
  "@tailwindcss/typography": "^0.5.15"
}
```

### Option 2: Remove Typography Plugin
If you don't need the typography plugin, remove it from tailwind.config.ts:

```typescript
// Remove this line from plugins array:
require('@tailwindcss/typography')
```

### Option 3: Conditional Plugin Loading
Make the plugin optional:

```typescript
plugins: [
  // ... other plugins
  ...(process.env.NODE_ENV !== 'production' ? [require('@tailwindcss/typography')] : [])
]
```

## Quick Fix
The fastest fix is to move `@tailwindcss/typography` to dependencies in your package.json file on GitHub, then commit and redeploy.

## Progress
✅ Vite config fixed (no more Replit plugin errors)
✅ Dependencies available (699 packages installed)
🔄 Tailwind config needs this typography plugin fix