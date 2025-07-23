# Create Super-User Session for Testing

## Quick Setup Instructions

### Method 1: Browser-Based Session Creation
1. **Navigate to**: `http://localhost:5173/test_session.html`
2. **Click**: "Create Session for Ed Duval (Super-User)"
3. **Result**: Session cookie created with super-user privileges
4. **Test**: Navigate to `/chat` to access full interface

### Method 2: Manual Cookie Creation
If you have browser dev tools open:
```javascript
// Execute in browser console:
fetch('/api/auth/create-test-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'ed.duval15@gmail.com',
        name: 'Ed Duval',
        roleLevel: 100,
        companyId: 1
    }),
    credentials: 'include'
}).then(r => r.json()).then(console.log);
```

### What This Creates
- **User**: ed.duval15@gmail.com
- **Role Level**: 100 (Super-User)
- **Company**: Horizon Edge Enterprises (ID: 1)
- **Permissions**: Full access to all features
- **Session**: Persistent cookie-based authentication

### Testing Capabilities
With super-user status you can test:
- ✅ Full sidebar access (all admin panels)
- ✅ Company management features
- ✅ AI model configuration
- ✅ User role management
- ✅ All authentication flows
- ✅ Chat interface with full history

### Session Verification
After creating session, check authentication:
```bash
curl -b test_session_cookies.txt http://localhost:5000/api/auth/me
```

Expected response:
```json
{
  "authenticated": true,
  "user": {
    "email": "ed.duval15@gmail.com",
    "roleLevel": 100,
    "companyId": 1
  }
}
```