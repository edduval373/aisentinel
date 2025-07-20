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
        
        const session = await storage.createChatSession({
          companyId: 1,
          userId: 'demo-user'
        });
        
        console.log('Session created:', session.id);
        return res.json(session);
      } catch (error) {
        console.error("Error creating chat session:", error);
        // Fallback to mock session if database fails
        const session = {
          id: `session_${Date.now()}`,
          companyId: 1,
          userId: 'demo-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return res.json(session);
      }
    }

    // User current endpoint (for authentication bypass)
    if (path.includes('user/current') && req.method === 'GET') {
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

    // AI Models endpoint
    if (path.includes('ai-models') && req.method === 'GET') {
      try {
        const { storage } = await import('../server/storage');
        const models = await storage.getAIModels(1); // Get models for company ID 1
        return res.json(models);
      } catch (error) {
        console.error('Error fetching AI models:', error);
        // Fallback to mock data if database fails
        return res.json([
          {
            id: 1,
            name: 'Claude 3',
            provider: 'anthropic',
            modelId: 'claude-3-sonnet-20240229',
            isEnabled: true,
            companyId: 1,
            apiKey: 'placeholder-key-1-anthropic'
          },
          {
            id: 2,
            name: 'GPT-4o',
            provider: 'openai',
            modelId: 'gpt-4o',
            isEnabled: true,
            companyId: 1,
            apiKey: 'placeholder-key-2-openai'
          }
        ]);
      }
    }

    // Activity Types endpoint
    if (path.includes('activity-types') && req.method === 'GET') {
      try {
        const { storage } = await import('../server/storage');
        const activityTypes = await storage.getActivityTypes(1); // Get activity types for company ID 1
        return res.json(activityTypes);
      } catch (error) {
        console.error('Error fetching activity types:', error);
        // Fallback to mock data if database fails
        return res.json([
          {
            id: 1,
            name: 'Brainstorming',
            description: 'Creative idea generation',
            isEnabled: true,
            companyId: 1
          },
          {
            id: 2,
            name: 'Analysis',
            description: 'Data analysis and insights',
            isEnabled: true,
            companyId: 1
          }
        ]);
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
