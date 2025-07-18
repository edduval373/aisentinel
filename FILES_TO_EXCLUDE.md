# Files to Exclude from Upload

## Skip These Folders/Files
**DO NOT upload these to GitHub:**
- `attached_assets/` folder (contains user-uploaded images, not needed for deployment)
- `node_modules/` folder (if it exists)
- `dist/` folder (if it exists)
- `.git/` folder (if it exists)
- `.replit` file
- Any `.log` files

## Keep These Essential Files
**DO upload these to GitHub:**
- `package.json` ✅
- `vercel.json` ✅
- `api/` folder (with all contents) ✅
- `client/` folder (with all contents) ✅
- `server/` folder (with all contents) ✅
- `shared/` folder (with all contents) ✅
- `tsconfig.json` ✅
- `tailwind.config.ts` ✅
- `vite.config.ts` ✅
- `drizzle.config.ts` ✅
- `postcss.config.js` ✅
- `components.json` ✅
- `build.js` ✅
- `README.md` (if exists) ✅
- `.env.example` (if exists) ✅
- `.gitignore` (if exists) ✅

## Why Skip attached_assets?
- Contains user-uploaded images from conversations
- Not needed for application functionality
- Makes upload slower and larger
- These are just reference images, not part of your app

## Application Images
Your app uses these images (which are in the client folder):
- AI Sentinel logo (in client/src/assets or similar)
- Any icons or images actually used by your application

Just upload the essential files and skip the `attached_assets` folder entirely. This will make your upload much faster and cleaner.