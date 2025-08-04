// Vercel serverless function for AI models with template-based system
import { storage } from '../server/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    let companyId = 1; // Default to company 1 for demo users
    let user = null;

    // Check for header-based authentication first
    const bearerToken = req.headers.authorization?.replace('Bearer ', '');
    const sessionToken = req.headers['x-session-token'];
    const authToken = bearerToken || sessionToken;

    if (authToken && authToken.startsWith('prod-session-')) {
      try {
        const { authService } = await import('../server/services/authService.js');
        const session = await authService.verifySession(authToken);
        if (session) {
          user = { userId: session.userId, companyId: session.companyId };
          companyId = session.companyId;
          console.log(`✅ Header auth for AI models: userId=${user.userId}, companyId=${companyId}`);
        }
      } catch (error) {
        console.error('Auth service error:', error);
      }
    }

    if (!user) {
      console.log("Demo mode AI models request");
    }

    // Get AI models from new template-based system
    let models = await storage.getAiModelsWithApiKeys(companyId);
    
    console.log("Raw models from template database:", models.map(m => ({ 
      id: m.id, 
      name: m.name, 
      provider: m.provider,
      apiKey: m.apiKey ? `${m.apiKey.substring(0, 10)}...` : 'MISSING',
      hasValidApiKey: m.hasValidApiKey
    })));
    
    // Add warning for models without API keys
    models = models.map(model => ({
      ...model,
      warning: !model.hasValidApiKey ? "Demo mode - configure API keys to enable" : undefined
    }));

    console.log("Final processed template models:", models.map(m => ({ 
      id: m.id, 
      name: m.name, 
      provider: m.provider, 
      hasValidApiKey: m.hasValidApiKey
    })));

    console.log("Returning AI model templates for company", companyId + ":", models.length, "template models");
    return res.json(models);
  } catch (error) {
    console.error("Error fetching AI models:", error);
    res.status(500).json({ message: "Failed to fetch AI models" });
  }
}