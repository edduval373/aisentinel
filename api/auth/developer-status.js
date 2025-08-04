// Vercel serverless function for developer status
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check for header-based authentication first
    const bearerToken = req.headers.authorization?.replace('Bearer ', '');
    const sessionToken = req.headers['x-session-token'];
    const authToken = bearerToken || sessionToken;

    if (!authToken || !authToken.startsWith('prod-session-')) {
      return res.json({ isDeveloper: false });
    }

    try {
      const { authService } = await import('../../server/services/authService.js');
      const session = await authService.verifySession(authToken);
      
      if (!session) {
        return res.json({ isDeveloper: false });
      }

      const isDeveloper = authService.isDeveloperEmail(session.email);

      res.json({ 
        isDeveloper,
        testRole: session.testRole || null,
        actualRole: session.roleLevel,
        effectiveRole: authService.getEffectiveRoleLevel(session)
      });
    } catch (error) {
      console.error('Auth service error:', error);
      return res.json({ isDeveloper: false });
    }
  } catch (error) {
    console.error('Developer status error:', error);
    res.json({ isDeveloper: false });
  }
}