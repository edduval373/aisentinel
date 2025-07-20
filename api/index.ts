// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const path = req.url || '';
    console.log(`API Request: ${req.method} ${path}`);

    // Health check - no dependencies
    if (path.includes('health') && req.method === 'GET') {
      return res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        hasDatabase: !!process.env.DATABASE_URL
      });
    }

    // Chat session creation  
    if (path.includes('chat/session') && req.method === 'POST') {
      console.log('Creating chat session...');
      try {
        const { storage } = await import('../server/storage');
        const companies = await storage.getCompanies();
        const companyId = companies[0]?.id || 1;
        
        const session = await storage.createChatSession({
          companyId: companyId,
          userId: 'demo-user'
        });
        
        console.log('Session created for company:', companyId, 'session:', session.id);
        return res.json(session);
      } catch (error) {
        console.error("Error creating chat session:", error);
        return res.status(500).json({ 
          message: "Failed to create chat session", 
          error: error.message
        });
      }
    }

    // User current endpoint (for authentication bypass)
    if (path.includes('user/current') && req.method === 'GET') {
      try {
        const { storage } = await import('../server/storage');
        const companies = await storage.getCompanies();
        const company = companies[0]; // Get first company
        
        return res.json({
          id: 'demo-user',
          email: 'demo@aisentinel.app',
          firstName: 'Demo',
          lastName: 'User',
          companyId: company?.id || 1,
          companyName: company?.name || 'Horizon Edge Enterprises',
          role: 'user',
          roleLevel: 1
        });
      } catch (error) {
        return res.json({
          id: 'demo-user',
          email: 'demo@aisentinel.app',
          firstName: 'Demo',
          lastName: 'User',
          companyId: 1,
          companyName: 'Horizon Edge Enterprises',
          role: 'user',
          roleLevel: 1
        });
      }
    }

    // AI Models endpoint
    if (path.includes('ai-models') && req.method === 'GET') {
      try {
        const { storage } = await import('../server/storage');
        const companies = await storage.getCompanies();
        const companyId = companies[0]?.id || 1;
        
        const models = await storage.getAIModels(companyId);
        console.log(`Fetched ${models.length} AI models for company ${companyId}`);
        return res.json(models);
      } catch (error) {
        console.error('Error fetching AI models:', error);
        return res.status(500).json({ 
          message: "Failed to fetch AI models", 
          error: error.message 
        });
      }
    }

    // Activity Types endpoint
    if (path.includes('activity-types') && req.method === 'GET') {
      try {
        const { storage } = await import('../server/storage');
        const companies = await storage.getCompanies();
        const companyId = companies[0]?.id || 1;
        
        const activityTypes = await storage.getActivityTypes(companyId);
        console.log(`Fetched ${activityTypes.length} activity types for company ${companyId}`);
        return res.json(activityTypes);
      } catch (error) {
        console.error('Error fetching activity types:', error);
        return res.status(500).json({ 
          message: "Failed to fetch activity types", 
          error: error.message 
        });
      }
    }

    // Companies list
    if (path.includes('companies') && req.method === 'GET') {
      try {
        const { storage } = await import('../server/storage');
        const companies = await storage.getCompanies();
        return res.json(companies);
      } catch (error) {
        return res.status(500).json({ message: "Database error", error: error.message });
      }
    }

    // AI models list  
    if (path.includes('ai-models') && req.method === 'GET') {
      try {
        const { storage } = await import('../server/storage');
        const aiModels = await storage.getAiModels(1);
        return res.json(aiModels);
      } catch (error) {
        return res.status(500).json({ message: "Database error", error: error.message });
      }
    }

    // Activity types list
    if (path.includes('activity-types') && req.method === 'GET') {
      try {
        const { storage } = await import('../server/storage');
        const activityTypes = await storage.getActivityTypes(1);
        return res.json(activityTypes);
      } catch (error) {
        return res.status(500).json({ message: "Database error", error: error.message });
      }
    }

    // Default 404
    return res.status(404).json({ message: 'API endpoint not found' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
