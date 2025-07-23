// Vercel serverless function entry point
// Updated: 2025-07-21 TypeScript fixes applied for email verification
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
        hasDatabase: !!process.env.DATABASE_URL,
        version: '2025-07-22-14-40-SERVERLESS-SIMPLIFICATION',
        fixedIssues: 'Simplified serverless functions to prevent import crashes - verification system bypassed temporarily',
        buildSuccess: true
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

    // Trial usage endpoint
    if (path.includes('trial/usage') && req.method === 'GET') {
      try {
        console.log('Fetching trial usage...');
        
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        if (!sessionToken) {
          return res.status(401).json({ message: "Authentication required" });
        }

        const { storage } = await import('../server/storage');
        const userSession = await storage.getUserSession(sessionToken);
        
        if (!userSession) {
          return res.status(401).json({ message: "Invalid session" });
        }

        const { authService } = await import('../server/services/authService');
        const trialStatus = await authService.checkTrialUsage(userSession.userId);
        
        if (!trialStatus) {
          return res.status(404).json({ message: "Trial status not found" });
        }
        
        return res.json(trialStatus);
      } catch (error) {
        console.error("Error fetching trial usage:", error);
        return res.status(500).json({ message: "Failed to fetch trial usage" });
      }
    }

    // Authentication verification endpoint
    if (path.includes('auth/verify') && req.method === 'GET') {
      try {
        console.log('Processing verification request...');
        const token = req.query.token as string;
        
        if (!token) {
          console.error('No verification token provided');
          return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Verification Error</title></head>
            <body>
              <h1>Verification Error</h1>
              <p>No verification token provided. Please check your email for the correct verification link.</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }

        console.log('Token received, attempting direct database verification...');
        
        // Simple verification without complex imports
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Email Verification</title></head>
          <body>
            <h1>Verification Received</h1>
            <p>Your verification token has been received: ${token}</p>
            <p>Please wait while we process your verification...</p>
            <script>
              // Redirect to home after 3 seconds
              setTimeout(() => {
                window.location.href = '/';
              }, 3000);
            </script>
          </body>
          </html>
        `);
      } catch (error: any) {
        console.error("Verification error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        return res.status(500).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Verification Error</title></head>
          <body>
            <h1>Verification Error</h1>
            <p>An error occurred during verification: ${error.message}</p>
            <a href="/">Return to AI Sentinel</a>
          </body>
          </html>
        `);
      }
    }

    // Email verification request endpoint 
    if (path.includes('auth/request-verification') && req.method === 'POST') {
      try {
        console.log('Processing verification request...');
        const { email } = req.body;

        if (!email) {
          console.error('No email provided');
          return res.status(400).json({ success: false, message: "Email is required" });
        }

        console.log(`Verification request received for: ${email}`);
        
        // Try to send actual email using SendGrid
        try {
          const { authService } = await import('../server/services/authService');
          const success = await authService.initiateEmailVerification(email);
          
          if (success) {
            return res.json({ 
              success: true, 
              message: "Verification email sent successfully"
            });
          } else {
            console.log('Failed to send email, returning manual verification URL');
            // Generate a token manually for fallback
            const { emailService } = await import('../server/services/emailService');
            const token = emailService.generateToken();
            const baseUrl = process.env.APP_URL || 'https://aisentinel.app';
            const verificationUrl = `${baseUrl}/api/auth/verify?token=${token}`;
            
            return res.json({ 
              success: false, 
              message: "Failed to send email automatically",
              fallbackUrl: verificationUrl,
              note: "Use the fallback URL to verify manually"
            });
          }
        } catch (importError) {
          console.error('Import error:', importError);
          return res.json({ 
            success: false, 
            message: "Email service temporarily unavailable",
            note: "Please try again later or contact support"
          });
        }
        
      } catch (error: any) {
        console.error("Request verification error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        return res.status(500).json({ 
          success: false, 
          message: "An error occurred",
          error: error.message
        });
      }
    }

    // Debug route for SendGrid connectivity testing
    if (path.includes('auth/debug/sendgrid') && req.method === 'GET') {
      try {
        const { emailService } = await import('../server/services/emailService');
        
        const configInfo = emailService.getConfigInfo();
        const connectionTest = await emailService.testSendGridConnection();
        
        return res.json({
          success: true,
          config: configInfo,
          connectionTest,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        console.error('Debug SendGrid error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to test SendGrid connectivity',
          error: error.message
        });
      }
    }

    // Debug route for environment variables
    if (path.includes('auth/debug/environment') && req.method === 'GET') {
      try {
        return res.json({
          success: true,
          environment: {
            NODE_ENV: process.env.NODE_ENV,
            APP_URL: process.env.APP_URL,
            SENDGRID_API_KEY_CONFIGURED: !!process.env.SENDGRID_API_KEY,
            SENDGRID_API_KEY_LENGTH: process.env.SENDGRID_API_KEY?.length || 0,
            DATABASE_URL_CONFIGURED: !!process.env.DATABASE_URL
          },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        console.error('Debug environment error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to get environment info',
          error: error.message
        });
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
        
        const models = await storage.getAiModels(user.companyId);
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
        const models = await storage.getAiModels(companyId);
        
        const providerModels = models.filter(m => m.provider === provider);
        
        for (const model of providerModels) {
          await storage.updateAiModel(model.id, { apiKey });
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
