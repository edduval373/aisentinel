# SendGrid Email Verification Debug Guide

## Current Issue
SendGrid email verification works in development but fails in production.

## Key Areas to Investigate

### 1. Environment Variables
- ✅ `SENDGRID_API_KEY` - Check if properly configured in production
- ✅ `APP_URL` - Must be set to `https://aisentinel.app` for production
- ✅ `NODE_ENV` - Should be set to `production`

### 2. SendGrid Sender Authentication
**Critical:** The from email `ed.duval@duvalsolutions.net` must be:
- ✅ **Verified as a Single Sender** in SendGrid console
- ✅ **Domain authenticated** if using domain authentication
- ✅ **Not blocked or suspended** in SendGrid

### 3. API Key Permissions
The SendGrid API key must have:
- ✅ **Mail Send** permissions
- ✅ **Full Access** or **Restricted Access** with mail send enabled
- ✅ **Not expired** or regenerated

### 4. Production vs Development Differences
- **Development**: Uses localhost URLs, often more permissive
- **Production**: Uses HTTPS, stricter CORS, different environment

## Debug Endpoints Created

### 1. Environment Check
```
GET https://aisentinel.app/api/auth/debug/environment
```
Returns:
- Environment variables status
- API key configuration status
- Database connectivity

### 2. SendGrid Connection Test
```
GET https://aisentinel.app/api/auth/debug/sendgrid
```
Returns:
- SendGrid configuration
- Connection test results
- Sender verification status
- Detailed error messages

## Manual Testing Steps

### Step 1: Check Environment Variables
```bash
curl https://aisentinel.app/api/auth/debug/environment
```

### Step 2: Test SendGrid Connectivity
```bash
curl https://aisentinel.app/api/auth/debug/sendgrid
```

### Step 3: Test Email Sending
```bash
curl -X POST https://aisentinel.app/api/auth/request-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Common Issues & Solutions

### Issue 1: "Sender identity not verified"
**Solution:** 
1. Log into SendGrid console
2. Go to Settings > Sender Authentication
3. Verify `ed.duval@duvalsolutions.net` as a Single Sender
4. OR set up domain authentication for `duvalsolutions.net`

### Issue 2: "Invalid API key"
**Solution:**
1. Verify API key in SendGrid console
2. Check that key has Mail Send permissions
3. Regenerate key if necessary and update environment variables

### Issue 3: "403 Forbidden"
**Solution:**
1. Check API key permissions
2. Verify sender email is authenticated
3. Check if account has sufficient credits

### Issue 4: "Connection timeout"
**Solution:**
1. Check network connectivity from production server
2. Verify firewall rules allow outbound HTTPS to SendGrid
3. Check if using correct SendGrid API endpoint

## SendGrid Dashboard Checks

1. **Activity Feed**: Check for recent send attempts and failures
2. **Suppressions**: Ensure recipient emails aren't suppressed
3. **Stats**: Verify sends are being attempted
4. **Alerts**: Check for any account-level issues

## Production Deployment Checklist

- [ ] `SENDGRID_API_KEY` environment variable set in Vercel
- [ ] `APP_URL` set to `https://aisentinel.app`
- [ ] Sender email verified in SendGrid
- [ ] API key has Mail Send permissions
- [ ] No suppressions on recipient emails
- [ ] SendGrid account in good standing

## Debug Logs Location

Check these logs for detailed error information:
- Vercel Function logs (Functions tab in Vercel dashboard)
- SendGrid Activity Feed
- Browser Network tab when testing email verification

## Next Steps if Issue Persists

1. Test with a different verified sender email
2. Try sending to multiple different recipient domains
3. Check SendGrid webhook logs for delivery status
4. Consider implementing email queue for retry logic
5. Add more detailed logging to email service