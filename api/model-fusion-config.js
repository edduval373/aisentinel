// Simple fallback for model fusion configuration
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    
    let companyId = 1; // Default to company 1 for demo users

    // Check for header-based authentication first
    const bearerToken = req.headers.authorization?.replace('Bearer ', '');
    const sessionToken = req.headers['x-session-token'];
    const authToken = bearerToken || sessionToken;

    if (authToken && authToken.startsWith('prod-session-')) {
      try {
        const { authService } = await import('../server/services/authService.js');
        const session = await authService.verifySession(authToken);
        if (session) {
          companyId = session.companyId;
          console.log(`✅ Header auth for model fusion config: companyId=${companyId}`);
        }
      } catch (error) {
        console.error('Auth service error:', error);
      }
    }

    // Provide demo fallback for model fusion config
    const config = {
      id: 1,
      companyId,
      isEnabled: false,
      summaryModelId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("Returning model fusion config for company", companyId + ":", config);
    return res.json(config);
  } catch (error) {
    console.error("Error fetching model fusion config:", error);
    res.status(500).json({ message: "Failed to fetch model fusion config", error: error.message });
  }
}