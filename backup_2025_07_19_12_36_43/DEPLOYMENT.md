# Vercel Deployment Guide for AI Sentinel

## Quick Setup

1. **Fork this repository** to your GitHub account

2. **Connect to Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select "AI Sentinel" repository

3. **Configure Environment Variables** in Vercel Dashboard:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SENDGRID_API_KEY=your_sendgrid_api_key
   APP_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

4. **Deploy** - Vercel will automatically build and deploy

## Required Environment Variables

### DATABASE_URL
- PostgreSQL connection string
- Format: `postgresql://username:password@host:port/database`
- Recommended: Use Railway, Supabase, or Neon for managed PostgreSQL

### SENDGRID_API_KEY
- SendGrid API key for email verification
- Must start with 'SG.'
- Get from: https://app.sendgrid.com/settings/api_keys

### APP_URL
- Your deployed application URL
- Example: `https://ai-sentinel.vercel.app`
- Used for email verification links

## Database Setup

1. **Create PostgreSQL Database**:
   - Railway: https://railway.app/
   - Supabase: https://supabase.com/
   - Neon: https://neon.tech/

2. **Run Database Migrations**:
   ```bash
   npm run db:push
   ```

## Email Configuration

1. **Create SendGrid Account**:
   - Go to https://sendgrid.com/
   - Sign up for free account (100 emails/day)

2. **Create API Key**:
   - Settings > API Keys > Create API Key
   - Choose "Full Access" permissions
   - Copy the key (starts with 'SG.')

3. **Verify Sender Identity**:
   - Go to Settings > Sender Authentication
   - Verify your email address or domain

## Build Configuration

The application uses a custom build process:
- Client: Built with Vite
- Server: Built with esbuild for Node.js
- Static files served from `/dist`
- API routes handled by `/server/index.ts`

## Troubleshooting

### Build Errors
- Check all environment variables are set
- Ensure DATABASE_URL is accessible from Vercel
- Verify SendGrid API key format

### Database Connection
- Whitelist Vercel IP addresses if using IP restrictions
- Use connection pooling for better performance
- Check database URL format

### Email Issues
- Verify SendGrid API key
- Check sender identity verification
- Ensure APP_URL matches your deployment URL

## Post-Deployment

1. **Test Authentication**:
   - Try logging in with email verification
   - Check email delivery

2. **Setup Admin User**:
   - First user automatically gets super-user privileges
   - Create companies and manage users

3. **Configure AI Models**:
   - Add OpenAI, Anthropic, or Perplexity API keys
   - Set up custom AI models and activity types

## Support

For deployment issues:
- Check Vercel build logs
- Review environment variables
- Test database connectivity
- Verify email configuration