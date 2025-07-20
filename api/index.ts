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

    // Chat session creation (authentication required)
    if (path.includes('chat/session') && req.method === 'POST') {
      console.log('Creating chat session...');
      try {
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        
        if (!sessionToken) {
          return res.status(401).json({ message: "Authentication required" });
        }

        const { storage } = await import('../server/storage');
        const userSession = await storage.getUserSession(sessionToken);
        
        if (!userSession) {
          return res.status(401).json({ message: "Invalid session" });
        }

        const user = await storage.getUser(userSession.userId);
        if (!user || !user.companyId) {
          return res.status(401).json({ message: "User not found or no company assigned" });
        }
        
        const session = await storage.createChatSession({
          companyId: user.companyId,
          userId: user.id
        });
        
        console.log('Session created for company:', user.companyId, 'session:', session.id);
        return res.json(session);
      } catch (error) {
        console.error("Error creating chat session:", error);
        return res.status(500).json({ 
          message: "Failed to create chat session", 
          error: error.message
        });
      }
    }

    // Authentication verification endpoint
    if (path.includes('auth/verify') && req.method === 'GET') {
      try {
        const { authService } = await import('../server/services/authService');
        const { storage } = await import('../server/storage');
        
        const token = req.query.token as string;
        
        if (!token) {
          return res.status(400).json({ success: false, message: "No verification token provided" });
        }

        const session = await authService.verifyEmailToken(token);
        
        if (!session) {
          return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
        }

        // Set session cookie
        res.setHeader('Set-Cookie', [
          `sessionToken=${session.sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}; Path=/`
        ]);

        // Redirect to frontend verification success page
        return res.redirect('/verify?success=true');
      } catch (error: any) {
        console.error("Verification error:", error);
        return res.status(500).json({ success: false, message: "An error occurred during verification" });
      }
    }

    // Email verification request endpoint
    if (path.includes('auth/request-verification') && req.method === 'POST') {
      try {
        const { authService } = await import('../server/services/authService');
        const { email } = req.body;

        if (!email) {
          return res.status(400).json({ success: false, message: "Email is required" });
        }

        const success = await authService.initiateEmailVerification(email);
        
        if (success) {
          return res.json({ success: true, message: "Verification email sent" });
        } else {
          return res.status(500).json({ success: false, message: "Failed to send verification email" });
        }
      } catch (error: any) {
        console.error("Request verification error:", error);
        return res.status(500).json({ success: false, message: "An error occurred" });
      }
    }

    // User current endpoint (authentication required)
    if (path.includes('user/current') && req.method === 'GET') {
      try {
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        
        if (!sessionToken) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        const { storage } = await import('../server/storage');
        const session = await storage.getUserSession(sessionToken);
        
        if (!session) {
          return res.status(401).json({ message: "Invalid session" });
        }

        const user = await storage.getUser(session.userId);
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        let companyName = null;
        if (user.companyId) {
          const company = await storage.getCompanyById(user.companyId);
          companyName = company?.name;
        }

        return res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyId: user.companyId,
          companyName,
          role: user.role,
          roleLevel: user.roleLevel
        });
      } catch (error) {
        console.error("Current user error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }



    // AI Models endpoint (authentication required)
    if (path.includes('ai-models') && req.method === 'GET') {
      try {
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        
        if (!sessionToken) {
          return res.status(401).json({ message: "Authentication required" });
        }

        const { storage } = await import('../server/storage');
        const userSession = await storage.getUserSession(sessionToken);
        
        if (!userSession) {
          return res.status(401).json({ message: "Invalid session" });
        }

        const user = await storage.getUser(userSession.userId);
        if (!user || !user.companyId) {
          return res.status(401).json({ message: "User not found or no company assigned" });
        }
        
        const models = await storage.getAIModels(user.companyId);
        console.log(`Fetched ${models.length} AI models for company ${user.companyId}`);
        return res.json(models);
      } catch (error) {
        console.error('Error fetching AI models:', error);
        return res.status(500).json({ 
          message: "Failed to fetch AI models", 
          error: error.message 
        });
      }
    }

    // Activity Types endpoint (authentication required)
    if (path.includes('activity-types') && req.method === 'GET') {
      try {
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        
        if (!sessionToken) {
          return res.status(401).json({ message: "Authentication required" });
        }

        const { storage } = await import('../server/storage');
        const userSession = await storage.getUserSession(sessionToken);
        
        if (!userSession) {
          return res.status(401).json({ message: "Invalid session" });
        }

        const user = await storage.getUser(userSession.userId);
        if (!user || !user.companyId) {
          return res.status(401).json({ message: "User not found or no company assigned" });
        }
        
        const activityTypes = await storage.getActivityTypes(user.companyId);
        console.log(`Fetched ${activityTypes.length} activity types for company ${user.companyId}`);
        return res.json(activityTypes);
      } catch (error) {
        console.error('Error fetching activity types:', error);
        return res.status(500).json({ 
          message: "Failed to fetch activity types", 
          error: error.message 
        });
      }
    }

    // Companies list (super-user only)
    if (path.includes('companies') && req.method === 'GET') {
      try {
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        
        if (!sessionToken) {
          return res.status(401).json({ message: "Authentication required" });
        }

        const { storage } = await import('../server/storage');
        const userSession = await storage.getUserSession(sessionToken);
        
        if (!userSession) {
          return res.status(401).json({ message: "Invalid session" });
        }

        const user = await storage.getUser(userSession.userId);
        if (!user || user.roleLevel < 100) {
          return res.status(403).json({ message: "Super-user access required" });
        }
        
        const companies = await storage.getCompanies();
        return res.json(companies);
      } catch (error) {
        return res.status(500).json({ message: "Database error", error: error.message });
      }
    }

    // Add API endpoints for super-user API key management
    if (path.includes('admin/update-api-key') && req.method === 'POST') {
      try {
        const { provider, apiKey } = req.body;
        const { storage } = await import('../server/storage');
        
        // Update all models for this provider with the new API key
        const companies = await storage.getCompanies();
        const companyId = companies[0]?.id || 1;
        const models = await storage.getAIModels(companyId);
        
        const providerModels = models.filter(m => m.provider === provider);
        
        for (const model of providerModels) {
          await storage.updateAIModel(model.id, { apiKey });
        }
        
        return res.json({ success: true, updated: providerModels.length });
      } catch (error) {
        console.error('Error updating API key:', error);
        return res.status(500).json({ message: 'Failed to update API key', error: error.message });
      }
    }

    if (path.includes('admin/test-api-key') && req.method === 'POST') {
      try {
        const { provider, apiKey } = req.body;
        
        // Simple validation for now
        if (!apiKey || apiKey.startsWith('placeholder-')) {
          throw new Error('Invalid API key');
        }
        
        // Basic format validation
        if (provider === 'openai' && !apiKey.startsWith('sk-')) {
          throw new Error('OpenAI API keys should start with sk-');
        }
        if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
          throw new Error('Anthropic API keys should start with sk-ant-');
        }
        if (provider === 'perplexity' && !apiKey.startsWith('pplx-')) {
          throw new Error('Perplexity API keys should start with pplx-');
        }
        
        return res.json({ success: true, message: 'API key format is valid' });
      } catch (error) {
        console.error('Error testing API key:', error);
        return res.status(400).json({ message: error.message });
      }
    }

    // Default 404
    return res.status(404).json({ message: 'API endpoint not found' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
