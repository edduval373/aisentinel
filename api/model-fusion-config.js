// Vercel serverless function for model fusion configuration
import { storage } from '../server/storage.js';

export default async function handler(req, res) {
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

    let config = await storage.getModelFusionConfig(companyId);

    // If no config found, provide demo fallback
    if (!config) {
      console.log("No model fusion config found, providing demo fallback");
      config = {
        id: 1,
        companyId,
        isEnabled: false,
        summaryModelId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    console.log("Returning model fusion config for company", companyId + ":", config);
    return res.json(config);
  } catch (error) {
    console.error("Error fetching model fusion config:", error);
    res.status(500).json({ message: "Failed to fetch model fusion config" });
  }
}