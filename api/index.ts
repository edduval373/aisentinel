// Production-safe Vercel serverless function entry point
// Enhanced with proper error handling and import safety
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
        version: '2025-07-23-PRODUCTION-SAFE-AUTHENTICATION',
        fixedIssues: 'Production-safe serverless function with proper error handling and session creation',
        buildSuccess: true
      });
    }

    // Chat session creation (supports both authenticated and demo mode)
    if (path.includes('chat/session') && req.method === 'POST') {
      console.log('Creating chat session...');
      try {
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        const referrer = req.headers.referer || '';
        const isDemoMode = referrer.includes('/demo') || req.headers['x-demo-mode'] === 'true';
        
        // Handle demo mode - check both demo path and absence of session token
        if (isDemoMode || !sessionToken || path.includes('/demo')) {
          console.log('Demo mode chat session creation - referrer:', referrer, 'isDemoMode:', isDemoMode, 'sessionToken:', !!sessionToken);
          
          // Create a demo session with demo company ID
          const demoSession = {
            id: Date.now(), // Simple demo session ID
            companyId: 1, // Demo company ID
            userId: 'demo-user', // Demo user ID
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          console.log('Demo session created:', demoSession.id);
          return res.json(demoSession);
        }

        // Handle authenticated mode
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
        
        console.log('Authenticated session created for company:', user.companyId, 'session:', session.id);
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

    // Authentication verification endpoint with enhanced error handling
    if (path.includes('auth/verify') && req.method === 'GET') {
      console.log('Processing verification request...');
      
      try {
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

        console.log('Token received, attempting verification with imports...');
        
        // Try to import required services with error handling
        let storage, authService;
        try {
          const storageModule = await import('../server/storage');
          storage = storageModule.storage;
          
          const authServiceModule = await import('../server/services/authService');
          authService = authServiceModule.authService;
          
          console.log('Services imported successfully');
        } catch (importError: any) {
          console.error('Import error:', importError.message);
          return res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Service Error</title></head>
            <body>
              <h1>Service Temporarily Unavailable</h1>
              <p>The authentication service is temporarily unavailable. Please try again in a few minutes.</p>
              <p>Error: ${importError.message}</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }
        
        // Get and validate verification token
        let verificationToken;
        try {
          verificationToken = await storage.getEmailVerificationToken(token);
        } catch (dbError: any) {
          console.error('Database error:', dbError.message);
          return res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Database Error</title></head>
            <body>
              <h1>Database Connection Issue</h1>
              <p>Unable to connect to the database. Please try again later.</p>
              <p>Error: ${dbError.message}</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }
        
        if (!verificationToken || verificationToken.isUsed) {
          console.log('Token not found or already used');
          return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Verification Error</title></head>
            <body>
              <h1>Verification Failed</h1>
              <p>Invalid or expired verification token. Please request a new verification email.</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }

        // Check if token expired (1 hour)
        const tokenAge = Date.now() - new Date(verificationToken.createdAt).getTime();
        if (tokenAge > 60 * 60 * 1000) {
          console.log('Token expired, age:', tokenAge);
          return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Verification Error</title></head>
            <body>
              <h1>Verification Expired</h1>
              <p>Verification token has expired. Please request a new verification email.</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }

        // Mark token as used and verify email
        try {
          await storage.markEmailVerificationTokenUsed(token);
          await storage.updateUserEmailVerified(verificationToken.email, true);
          console.log('Token marked as used and email verified');
        } catch (updateError: any) {
          console.error('Update error:', updateError.message);
          return res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Update Error</title></head>
            <body>
              <h1>Verification Update Failed</h1>
              <p>Could not complete email verification. Please try again.</p>
              <p>Error: ${updateError.message}</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }
        
        // Get user and create session
        try {
          const user = await storage.getUserByEmail(verificationToken.email);
          if (user) {
            const session = await authService.createSession(user);
            
            // Set session cookie with production-safe settings
            const cookieOptions = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
            res.setHeader('Set-Cookie', [
              `sessionToken=${session.sessionToken}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax; ${cookieOptions}`
            ]);
            
            console.log('Session created and cookie set for verified user:', verificationToken.email);
            
            // Redirect to frontend with success parameter
            const redirectUrl = `/?verified=true&email=${encodeURIComponent(verificationToken.email)}`;
            res.writeHead(302, { 'Location': redirectUrl });
            return res.end();
          }
        } catch (sessionError: any) {
          console.error('Session creation error:', sessionError.message);
          // Still show success to user even if session creation fails
          console.log('Email verified successfully for:', verificationToken.email);
        }
        
        // Success response if session creation fails but verification succeeded
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Email Verified</title></head>
          <body>
            <h1>Verification Successful!</h1>
            <p>Your email has been verified successfully. Redirecting to dashboard...</p>
            <script>
              setTimeout(() => {
                window.location.href = '/?verified=true&email=${encodeURIComponent(verificationToken.email)}';
              }, 2000);
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
            <p>An unexpected error occurred during verification: ${error.message}</p>
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

    // Auth me endpoint - matches frontend expectation
    if (path.includes('auth/me') && req.method === 'GET') {
      try {
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        
        if (!sessionToken) {
          return res.json({ authenticated: false });
        }

        // Try to import storage with error handling
        let storage;
        try {
          const storageModule = await import('../server/storage');
          storage = storageModule.storage;
        } catch (importError: any) {
          console.error('Storage import error:', importError.message);
          return res.json({ authenticated: false, error: 'Service unavailable' });
        }

        const session = await storage.getUserSession(sessionToken);
        
        if (!session) {
          return res.json({ authenticated: false });
        }

        const user = await storage.getUser(session.userId);
        
        if (!user) {
          return res.json({ authenticated: false });
        }

        let companyName = null;
        if (user.companyId) {
          try {
            const company = await storage.getCompanyById(user.companyId);
            companyName = company?.name;
          } catch (companyError) {
            console.error('Company lookup error:', companyError);
            // Continue without company name
          }
        }

        return res.json({
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            companyId: user.companyId,
            companyName,
            role: user.role,
            roleLevel: user.roleLevel
          }
        });
      } catch (error: any) {
        console.error("Auth me error:", error);
        return res.json({ authenticated: false, error: error.message });
      }
    }

    // User current endpoint (authentication required) - legacy support
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



    // AI Models endpoint (supports demo mode)
    if (path.includes('ai-models') && req.method === 'GET') {
      try {
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        const referrer = req.headers.referer || '';
        const isDemoMode = referrer.includes('/demo') || req.headers['x-demo-mode'] === 'true';
        
        // Handle demo mode - improved detection
        if (isDemoMode || !sessionToken || path.includes('/demo')) {
          console.log('Demo mode AI models request - referrer:', referrer);
          
          // Return demo AI models
          const demoModels = [
            {
              id: 1,
              name: "GPT-4o",
              provider: "OpenAI",
              modelId: "gpt-4o",
              isEnabled: true,
              capabilities: ["text", "analysis"],
              contextWindow: 128000,
              temperature: 0.7,
              maxTokens: 4096,
              companyId: 1
            },
            {
              id: 2,
              name: "Claude Sonnet 4",
              provider: "Anthropic", 
              modelId: "claude-3-5-sonnet-20241022",
              isEnabled: true,
              capabilities: ["text", "analysis", "coding"],
              contextWindow: 200000,
              temperature: 0.7,
              maxTokens: 8192,
              companyId: 1
            }
          ];
          
          return res.json(demoModels);
        }
        
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

    // Activity Types endpoint (supports demo mode)
    if (path.includes('activity-types') && req.method === 'GET') {
      try {
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        const referrer = req.headers.referer || '';
        const isDemoMode = referrer.includes('/demo') || req.headers['x-demo-mode'] === 'true';
        
        // Handle demo mode - improved detection
        if (isDemoMode || !sessionToken || path.includes('/demo')) {
          console.log('Demo mode activity types request - referrer:', referrer);
          
          // Return demo activity types
          const demoActivityTypes = [
            {
              id: 1,
              name: "General Chat",
              description: "General conversation and assistance",
              prePrompt: "You are a helpful AI assistant. Please provide accurate and helpful responses.",
              riskLevel: "low",
              isEnabled: true,
              companyId: 1
            },
            {
              id: 2, 
              name: "Code Review",
              description: "Code analysis and review assistance",
              prePrompt: "You are an expert code reviewer. Please analyze the code for best practices, security issues, and improvement opportunities.",
              riskLevel: "medium",
              isEnabled: true,
              companyId: 1
            }
          ];
          
          return res.json(demoActivityTypes);
        }
        
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

    // Current company endpoint (supports demo mode)
    if (path.includes('user/current-company') && req.method === 'GET') {
      try {
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        const referrer = req.headers.referer || '';
        const isDemoMode = referrer.includes('/demo') || req.headers['x-demo-mode'] === 'true' || !sessionToken;
        
        if (isDemoMode) {
          console.log('Demo mode current company request');
          
          // Return demo company data matching development version
          const demoCompany = {
            id: 1,
            name: 'Horizon Edge Enterprises',
            logo: null // Use default building icon
          };
          
          return res.json(demoCompany);
        }

        // Handle authenticated mode
        const { storage } = await import('../server/storage');
        const userSession = await storage.getUserSession(sessionToken);
        
        if (!userSession) {
          return res.status(401).json({ message: "Invalid session" });
        }

        const user = await storage.getUser(userSession.userId);
        if (!user || !user.companyId) {
          return res.status(401).json({ message: "User not found or no company assigned" });
        }
        
        const company = await storage.getCompany(user.companyId);
        return res.json(company);
      } catch (error) {
        console.error("Error fetching current company:", error);
        return res.status(500).json({ 
          message: "Failed to fetch company information", 
          error: error.message
        });
      }
    }

    // Default 404
    return res.status(404).json({ message: 'API endpoint not found' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
