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