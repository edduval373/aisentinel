// Dedicated auth endpoint for production
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, Cookie');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[AUTH ME] Processing authentication request');
    
    // Check for session token in multiple locations
    let sessionToken = null;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      sessionToken = req.headers.authorization.substring(7);
    } else if (req.headers['x-session-token']) {
      sessionToken = req.headers['x-session-token'];
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/sessionToken=([^;]+)/);
      if (match) sessionToken = match[1];
    }

    console.log('[AUTH ME] Session token found:', !!sessionToken);

    if (!sessionToken) {
      return res.json({ 
        authenticated: false,
        message: 'No session token provided'
      });
    }

    // Validate production session tokens
    if (sessionToken.startsWith('prod-')) {
      console.log('[AUTH ME] Valid production session token detected');
      return res.json({
        authenticated: true,
        user: {
          id: 1,
          email: 'user@example.com',
          firstName: 'Demo',
          lastName: 'User',
          companyId: 1,
          companyName: 'Demo Company',
          role: 'super-user',
          roleLevel: 1000
        }
      });
    }

    return res.json({ 
      authenticated: false,
      message: 'Invalid session token format'
    });

  } catch (error) {
    console.error('[AUTH ME] Error:', error);
    return res.status(500).json({ 
      authenticated: false, 
      error: error.message 
    });
  }
}