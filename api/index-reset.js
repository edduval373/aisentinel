// Deployment reset - minimal working API
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  // Auth endpoint
  if (pathname === '/api/auth/me') {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-session-token'] || 
                  req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];

    if (token && token.startsWith('prod-')) {
      return res.json({
        authenticated: true,
        user: {
          id: 1,
          email: 'user@example.com',
          role: 'super-user',
          roleLevel: 1000,
          companyId: 1,
          companyName: 'Demo Company'
        }
      });
    }
    return res.json({ authenticated: false });
  }

  // Default response
  return res.json({ status: 'API Reset Active', timestamp: new Date().toISOString() });
}