// Vercel serverless function entry point
export default async function handler(req: any, res: any) {
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
        // Test basic functionality first
        if (!process.env.DATABASE_URL) {
          return res.status(500).json({ message: "DATABASE_URL not configured" });
        }
        
        // Try to import and use storage
        const storageModule = await import('../server/storage');
        const { storage } = storageModule;
        
        const companies = await storage.getCompanies();
        console.log('Companies found:', companies.length);
        
        if (companies.length === 0) {
          return res.status(400).json({ message: "No companies available" });
        }
        
        const session = await storage.createChatSession({ 
          companyId: companies[0].id, 
          userId: '42450602' 
        });
        
        console.log('Session created:', session.id);
        return res.json(session);
      } catch (error) {
        console.error("Error creating chat session:", error);
        return res.status(500).json({ 
          message: "Failed to create chat session", 
          error: error.message,
          stack: error.stack?.substring(0, 500),
          databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
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
