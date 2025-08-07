# Render Deployment - Environment Variables Setup

## NEVER PUSH SECRETS TO GIT ❌
Your secrets should only be configured in Render's dashboard, not in your code.

## Required Environment Variables for Render

Set these in your Render service dashboard (not in code):

### Database (Auto-configured by render.yaml)
```
DATABASE_URL=postgresql://aisentinel_user:lfFsIDc68FRFsUEwejbjMg577KblSSHV@dpg-d2aimqeuk2gs73a4luvg-a.ohio-postgres.render.com/aisentinel
```

### Email Service
```
SENDGRID_API_KEY=SG.your_actual_sendgrid_key_here
```

### Application Settings
```
NODE_ENV=production
APP_URL=https://your-app-name.onrender.com
SESSION_SECRET=auto_generated_by_render
```

### Optional (leave empty to disable)
```
ENABLE_REPLIT_AUTH=false
```

## How to Set Environment Variables in Render

1. **Go to your Render service dashboard**
2. **Click "Environment" tab**
3. **Add each variable above**
4. **Do NOT include these in your Git repository**

## Safe to Push to Git ✅
- Application code
- Configuration files (render.yaml, package.json)
- Database schema files
- Documentation

## NEVER Push to Git ❌
- .env files with real secrets
- API keys
- Database passwords
- Session secrets

## Your .gitignore Protection
Your .gitignore already protects:
- .env files
- node_modules
- dist/
- Any files with secrets

## Deployment Process
1. Push code to GitHub (without secrets)
2. Connect GitHub repo to Render
3. Set environment variables in Render dashboard
4. Deploy automatically