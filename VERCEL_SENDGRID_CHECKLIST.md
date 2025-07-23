# 🔧 Vercel + SendGrid Configuration Checklist

## STEP 1: Check Current Production Status

First, let's see what's currently configured in production:

```bash
# Test these URLs in your browser or terminal:
curl https://aisentinel.app/api/auth/debug/environment
curl https://aisentinel.app/api/auth/debug/sendgrid
```

**Expected Results:**
- Environment endpoint should show `SENDGRID_API_KEY_CONFIGURED: true`
- SendGrid endpoint should show connection test results

---

## STEP 2: Vercel Environment Variables Setup

### 2.1 Access Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your `aisentinel` project
3. Click on the project name
4. Go to **Settings** tab
5. Click **Environment Variables** in the left sidebar

### 2.2 Check Required Variables
Verify these environment variables exist:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `SENDGRID_API_KEY` | Your SendGrid API key (starts with `SG.`) | Production |
| `APP_URL` | `https://aisentinel.app` | Production |
| `NODE_ENV` | `production` | Production |
| `DATABASE_URL` | Your PostgreSQL connection string | Production |

### 2.3 Add Missing Variables
If any are missing, click **Add New** and enter:
- **Name**: `SENDGRID_API_KEY`
- **Value**: Your SendGrid API key
- **Environments**: Check ✅ **Production**

⚠️ **After adding variables, you MUST redeploy your project!**

---

## STEP 3: SendGrid Sender Authentication

### 3.1 Access SendGrid Dashboard
1. Go to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Login with your SendGrid account

### 3.2 Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Look for **Single Sender Verification** section
3. Verify that `ed.duval@duvalsolutions.net` is listed and **Verified**

### 3.3 If Email Not Verified:
1. Click **Create New Sender**
2. Fill in the form:
   - **From Name**: AI Sentinel
   - **From Email**: ed.duval@duvalsolutions.net
   - **Reply To**: ed.duval@duvalsolutions.net
   - **Company Address**: Your company details
3. Click **Create**
4. Check your email for verification link
5. Click the verification link in the email

---

## STEP 4: API Key Permissions Check

### 4.1 Check API Key
1. In SendGrid, go to **Settings** → **API Keys**
2. Find your API key (should be 69 characters, starts with `SG.`)
3. Click the **Action** menu → **Edit**

### 4.2 Verify Permissions
Ensure your API key has **Mail Send** permissions:
- Either **Full Access** (recommended for testing)
- Or **Restricted Access** with **Mail Send** enabled

### 4.3 If Key is Missing/Invalid:
1. Click **Create API Key**
2. Choose **Restricted Access**
3. Under **Mail Send**, toggle **ON**
4. Click **Create & View**
5. **COPY THE KEY IMMEDIATELY** (you won't see it again)
6. Update the key in Vercel environment variables

---

## STEP 5: Test the Configuration

### 5.1 After Updating Vercel Variables
1. Go to your Vercel project dashboard
2. Go to **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Wait for deployment to complete

### 5.2 Test Environment Variables
```bash
curl https://aisentinel.app/api/auth/debug/environment
```
**Expected Output:**
```json
{
  "success": true,
  "environment": {
    "NODE_ENV": "production",
    "APP_URL": "https://aisentinel.app",
    "SENDGRID_API_KEY_CONFIGURED": true,
    "SENDGRID_API_KEY_LENGTH": 69,
    "DATABASE_URL_CONFIGURED": true
  }
}
```

### 5.3 Test SendGrid Connection
```bash
curl https://aisentinel.app/api/auth/debug/sendgrid
```
**Expected Output:**
```json
{
  "success": true,
  "config": {
    "environment": "production",
    "apiKeyConfigured": true,
    "fromEmail": "ed.duval@duvalsolutions.net",
    "appUrl": "https://aisentinel.app"
  },
  "connectionTest": {
    "isConfigured": true,
    "fromEmailVerified": true,
    "canConnect": true,
    "errors": []
  }
}
```

### 5.4 Test Email Sending
```bash
curl -X POST https://aisentinel.app/api/auth/request-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@domain.com"}'
```

---

## STEP 6: Troubleshooting Common Issues

### Issue 1: "SENDGRID_API_KEY_CONFIGURED: false"
**Solution:** API key not set in Vercel
- Add the environment variable in Vercel dashboard
- Redeploy the project

### Issue 2: "fromEmailVerified: false"
**Solution:** Sender email not verified in SendGrid
- Complete Single Sender Verification in SendGrid
- Verify the email address

### Issue 3: "401 Unauthorized"
**Solution:** Invalid API key
- Check API key format (must start with `SG.`)
- Regenerate API key in SendGrid
- Update Vercel environment variable

### Issue 4: "403 Forbidden"
**Solution:** Insufficient permissions
- Update API key permissions to include Mail Send
- Or create new API key with Full Access

---

## STEP 7: Final Verification

Once everything is configured:

1. ✅ Environment variables set in Vercel
2. ✅ Sender email verified in SendGrid
3. ✅ API key has Mail Send permissions
4. ✅ Project redeployed after changes
5. ✅ Debug endpoints return success
6. ✅ Test email sends successfully

**Your SendGrid email verification should now work perfectly in production!**

---

## Quick Reference

**Vercel Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard)
**SendGrid Dashboard:** [app.sendgrid.com](https://app.sendgrid.com/)
**Debug URLs:**
- Environment: `https://aisentinel.app/api/auth/debug/environment`
- SendGrid: `https://aisentinel.app/api/auth/debug/sendgrid`