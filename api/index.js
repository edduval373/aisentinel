export default async function handler(req, res) {
  const { method, url } = req;
  const path = url.split('?')[0];

  // Health check endpoint
  if (path === '/api/health') {
    return res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: 'production'
    });
  }

  // Auth me endpoint - CRITICAL: Must properly validate session tokens
  if (path.includes('auth/me') && method === 'GET') {
    try {
      const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];

      console.log('[PRODUCTION AUTH] Checking session token:', sessionToken ? sessionToken.substring(0, 20) + '...' : 'none');

      // If no session token, user is not authenticated
      if (!sessionToken) {
        console.log('[PRODUCTION AUTH] No session token found - returning unauthenticated');
        return res.status(200).json({ authenticated: false });
      }

      // Validate session token format - must be from our system
      const validTokenPatterns = [
        /^[a-zA-Z0-9_-]{40,}$/,  // Minimum 40 character alphanumeric token
        /^replit-auth-/,         // Replit auth tokens
        /^prod-session-/,        // Production session tokens
        /^dev-session-/          // Development session tokens (for testing)
      ];

      const isValidToken = validTokenPatterns.some(pattern => pattern.test(sessionToken));

      if (!isValidToken) {
        console.log('[PRODUCTION AUTH] Invalid token format - returning unauthenticated');
        return res.status(200).json({ authenticated: false });
      }

      // Try to verify session with database
      try {
        const { storage } = await import('../server/storage');
        const session = await storage.getUserSession(sessionToken);

        if (!session || session.expiresAt < new Date()) {
          console.log('[PRODUCTION AUTH] Session not found or expired - returning unauthenticated');
          return res.status(200).json({ authenticated: false });
        }

        const user = await storage.getUser(session.userId);
        if (!user) {
          console.log('[PRODUCTION AUTH] User not found - returning unauthenticated');
          return res.status(200).json({ authenticated: false });
        }

        let companyName = null;
        if (user.companyId) {
          try {
            const company = await storage.getCompanyById(user.companyId);
            companyName = company?.name;
          } catch (companyError) {
            console.error('[PRODUCTION AUTH] Company lookup error:', companyError);
          }
        }

        console.log('[PRODUCTION AUTH] Valid session found for user:', user.email);

        return res.status(200).json({
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            companyId: user.companyId,
            companyName: companyName,
            role: user.role,
            roleLevel: user.roleLevel,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      } catch (storageError) {
        console.error('[PRODUCTION AUTH] Database error:', storageError);
        return res.status(200).json({ authenticated: false });
      }
    } catch (error) {
      console.error('[PRODUCTION AUTH] Auth check error:', error);
      return res.status(200).json({ authenticated: false });
    }
  }

  // Email verification request endpoint
  if (req.url.includes('/api/auth/request-verification') && req.method === 'POST') {
    try {
      console.log('📧 Email verification request received');

      // Better body parsing for serverless environments
      let body = '';
      
      // Handle different body parsing scenarios
      if (req.body) {
        // Body already parsed by Vercel
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      } else {
        // Manual parsing needed
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        await new Promise((resolve, reject) => {
          req.on('end', () => {
            body = Buffer.concat(chunks).toString();
            resolve();
          });
          req.on('error', reject);
        });
      }

      console.log('📧 Raw body received:', body);

      let email;
      try {
        const parsed = JSON.parse(body);
        email = parsed.email;
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        return res.status(400).json({ 
          success: false, 
          message: "Invalid JSON format" 
        });
      }

      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      console.log(`📧 Processing verification request for: ${email}`);

      // Import auth service and send verification email
      const { authService } = await import('../server/services/authService');
      const success = await authService.initiateEmailVerification(email);

      if (success) {
        console.log(`✅ Verification email sent successfully to ${email}`);
        return res.status(200).json({ 
          success: true, 
          message: "Verification email sent successfully" 
        });
      } else {
        console.log(`❌ Failed to send verification email to ${email}`);
        
        // Get detailed error information
        try {
          const { emailService } = await import('../server/services/emailService');
          const debugInfo = await emailService.testSendGridConnection();
          console.log('SendGrid debug info:', JSON.stringify(debugInfo, null, 2));
        } catch (debugError) {
          console.error('Failed to get debug info:', debugError);
        }
        
        return res.status(400).json({ 
          success: false, 
          message: "Failed to send verification email. Check console logs for details." 
        });
      }
    } catch (error) {
      console.error('❌ Email verification error:', error);
      return res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  }

  // Health check endpoint
  if (req.url === '/api/health' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: 'production'
    });
    return;
  }

  // Debug endpoint for environment check
  if (req.url === '/api/auth/debug/environment' && req.method === 'GET') {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        success: true,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          APP_URL: process.env.APP_URL,
          SENDGRID_API_KEY_CONFIGURED: !!process.env.SENDGRID_API_KEY,
          SENDGRID_API_KEY_LENGTH: process.env.SENDGRID_API_KEY?.length || 0,
          DATABASE_URL_CONFIGURED: !!process.env.DATABASE_URL
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Debug environment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get environment info',
        error: error.message
      });
    }
    return;
  }

  // SendGrid debug endpoint
  if (req.url === '/api/auth/debug/sendgrid' && req.method === 'GET') {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      const result = {
        success: true,
        config: {
          environment: process.env.NODE_ENV || 'development',
          apiKeyConfigured: !!process.env.SENDGRID_API_KEY,
          apiKeyLength: process.env.SENDGRID_API_KEY?.length || 0,
          fromEmail: 'ed.duval@duvalsolutions.net',
          appUrl: process.env.APP_URL || 'https://aisentinel.app'
        },
        timestamp: new Date().toISOString()
      };

      // Basic validation
      if (!process.env.SENDGRID_API_KEY) {
        result.config.error = 'SENDGRID_API_KEY not configured';
      } else if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
        result.config.error = 'Invalid API key format';
      } else if (process.env.SENDGRID_API_KEY.length !== 69) {
        result.config.error = `Invalid API key length: ${process.env.SENDGRID_API_KEY.length} (expected 69)`;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('SendGrid debug error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get SendGrid info',
        error: error.message
      });
    }
    return;
  }

  // All other endpoints require authentication or are company/static data
  if (path.includes('/api/')) {
    // Static/demo endpoints that don't require auth
    const publicEndpoints = ['/api/activity-types', '/api/ai-models'];
    if (publicEndpoints.includes(path)) {
      // Return demo data for public endpoints
      if (path === '/api/activity-types') {
        return res.status(200).json([
          { id: 1, name: 'Demo Activity', description: 'Demo activity type' }
        ]);
      }
      if (path === '/api/ai-models') {
        return res.status(200).json([
          { id: 1, name: 'Demo Model', provider: 'Demo' }
        ]);
      }
    }

    // All other API endpoints return unauthorized
    return res.status(401).json({ 
      message: 'Authentication required',
      requiresAuth: true 
    });
  }

  // Fallback for non-API requests
  return res.status(404).json({ message: 'Not found' });
}