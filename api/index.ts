// Vercel serverless function entry point
import { storage } from '../server/storage';

// Simple health check function
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log(`${req.method} ${req.url}`);

    // Health check
    if (req.url === '/api/health' && req.method === 'GET') {
      return res.json({ status: 'OK', timestamp: new Date().toISOString() });
    }

    // Chat session creation
    if (req.url === '/api/chat/session' && req.method === 'POST') {
      try {
        // Use default company and user for unauthenticated access
        const companies = await storage.getCompanies();
        if (companies.length === 0) {
          return res.status(400).json({ message: "No companies available" });
        }
        
        const session = await storage.createChatSession({ 
          companyId: companies[0].id, 
          userId: '42450602' 
        });
        
        return res.json(session);
      } catch (error) {
        console.error("Error creating chat session:", error);
        return res.status(500).json({ message: "Failed to create chat session" });
      }
    }

    // Companies list
    if (req.url === '/api/companies' && req.method === 'GET') {
      const companies = await storage.getCompanies();
      return res.json(companies);
    }

    // AI models list
    if (req.url === '/api/ai-models' && req.method === 'GET') {
      const aiModels = await storage.getAiModels(1);
      return res.json(aiModels);
    }

    // Activity types list
    if (req.url === '/api/activity-types' && req.method === 'GET') {
      const activityTypes = await storage.getActivityTypes(1);
      return res.json(activityTypes);
    }

    // Default 404
    return res.status(404).json({ message: 'API endpoint not found' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
