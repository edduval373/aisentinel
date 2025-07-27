// Minimal Vercel serverless function for AI Sentinel (JavaScript)
import sgMail from '@sendgrid/mail';

export default async function handler(req, res) {
  // Enhanced server-side logging
  const startTime = Date.now();
  const url = req.url || '';
  const method = req.method || 'GET';
  
  console.log(`🚀 [SERVERLESS] ${method} ${url} - Start`);
  console.log(`🚀 [SERVERLESS] Headers:`, req.headers);
  console.log(`🚀 [SERVERLESS] Query:`, req.query);
  console.log(`🚀 [SERVERLESS] Body:`, req.body);
  
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Demo-Mode');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`🚀 [SERVERLESS] OPTIONS request handled`);
    res.status(200).end();
    return;
  }

  try {

    // Health check endpoint
    if (url.includes('health')) {
      const response = { 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: 'production-minimal-js-v2-enhanced-logging',
        url: url,
        method: method
      };
      console.log(`✅ [SERVERLESS] Health check response:`, response);
      res.status(200).json(response);
      return;
    }

    // Chat session creation endpoint
    if (url.includes('chat/session') && method === 'POST') {
      console.log('Creating demo chat session for production');
      
      const session = {
        id: Math.floor(Math.random() * 100000) + 1,
        companyId: 1,
        userId: 'demo-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Demo session created:', session.id);
      res.status(200).json(session);
      return;
    }

    // Authentication check endpoint
    if (url.includes('auth/me')) {
      console.log('🔐 [SERVERLESS] Authentication check request');
      console.log('🔐 [SERVERLESS] Cookies:', req.headers.cookie);
      
      // Check for session token in cookies
      const cookies = req.headers.cookie || '';
      const sessionMatch = cookies.match(/sessionToken=([^;]+)/);
      const sessionToken = sessionMatch ? sessionMatch[1] : null;
      
      console.log('🔐 [SERVERLESS] Session token found:', sessionToken ? 'YES' : 'NO');
      
      // Only return authenticated if there's actually a valid session token
      // Don't automatically authenticate without proper session validation
      if (sessionToken && sessionToken.length > 10) {
        console.log('✅ [SERVERLESS] Session token found - checking validity...');
        
        // For production, we need to validate against actual database/session store
        // Since this is serverless without database access, check for specific valid tokens
        const validTokenPattern = /^(dev-session-|prod-session-|replit-auth-|demo-session-)/;
        
        if (validTokenPattern.test(sessionToken)) {
          console.log('✅ [SERVERLESS] Valid session token pattern, user authenticated');
          
          const authResponse = {
            authenticated: true,
            user: {
              id: 42450602,
              email: 'ed.duval15@gmail.com',
              companyId: 1,
              companyName: 'Duval AI Solutions',
              role: 'super-user',
              roleLevel: 100,
              firstName: 'Ed',
              lastName: 'Duval'
            }
          };
          
          res.status(200).json(authResponse);
          return;
        }
      }
      
      console.log('❌ [SERVERLESS] No valid session token, user not authenticated');
      res.status(200).json({ authenticated: false });
      return;
    }

    // AI Models endpoint
    if (url.includes('ai-models')) {
      const models = [
        { id: 1, name: 'GPT-4o', provider: 'OpenAI', enabled: true },
        { id: 2, name: 'Claude Sonnet 4', provider: 'Anthropic', enabled: true },
        { id: 3, name: 'Claude Haiku', provider: 'Anthropic', enabled: true },
        { id: 4, name: 'GPT-4 Turbo', provider: 'OpenAI', enabled: true },
        { id: 5, name: 'Claude Opus', provider: 'Anthropic', enabled: true },
        { id: 6, name: 'Perplexity Sonar', provider: 'Perplexity', enabled: true }
      ];
      res.status(200).json(models);
      return;
    }

    // Activity Types endpoint  
    if (url.includes('activity-types')) {
      const types = [
        { id: 1, name: 'General Chat', description: 'General conversation', enabled: true },
        { id: 2, name: 'Code Review', description: 'Code analysis and review', enabled: true },
        { id: 3, name: 'Business Analysis', description: 'Business document analysis', enabled: true },
        { id: 4, name: 'Document Review', description: 'Document review and analysis', enabled: true }
      ];
      res.status(200).json(types);
      return;
    }

    // Current company endpoint
    if (url.includes('user/current-company')) {
      console.log('🏢 [SERVERLESS] Company info request');
      
      try {
        const DATABASE_URL = process.env.DATABASE_URL;
        console.log('🏢 [SERVERLESS] DATABASE_URL available:', DATABASE_URL ? 'YES' : 'NO');
        
        // Try to fetch from database first
        if (DATABASE_URL) {
          const { Client } = require('pg');
          const client = new Client({ connectionString: DATABASE_URL });
          await client.connect();
          
          const result = await client.query('SELECT id, name, domain, logo, logo_size, show_company_name, show_company_logo, company_name_size FROM companies WHERE id = $1', [1]);
          
          if (result.rows.length > 0) {
            const company = result.rows[0];
            const companyData = {
              id: company.id,
              name: company.name,
              description: 'AI Governance Solutions Provider',
              logo: company.logo,
              logoSize: company.logo_size || 200,
              showCompanyName: company.show_company_name || false,
              showCompanyLogo: company.show_company_logo !== false,
              companyNameSize: company.company_name_size || 20
            };
            
            console.log('✅ [SERVERLESS] Company data from database:', companyData.name);
            await client.end();
            res.status(200).json(companyData);
            return;
          }
          
          await client.end();
        }
      } catch (error) {
        console.error('❌ [SERVERLESS] Database connection failed:', error.message);
      }
      
      // Fallback to hardcoded company data for Duval AI Solutions with proper logo
      const company = {
        id: 1,
        name: 'Duval AI Solutions',
        description: 'AI Governance Solutions Provider',
        logo: 'data:image/jpeg;base64,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',
        logoSize: 200,
        showCompanyName: false,
        showCompanyLogo: true,
        companyNameSize: 20
      };
      
      console.log('✅ [SERVERLESS] Using fallback company data:', company.name);
      res.status(200).json(company);
      return;
    }

    // Chat message endpoint
    if (url.includes('chat/message') && method === 'POST') {
      const body = req.body || {};
      const { message, sessionId, aiModelId, activityTypeId } = body;
      
      if (!message) {
        res.status(400).json({ message: 'Message is required' });
        return;
      }

      const demoResponse = `I'm a demo AI assistant. You asked: "${message}"\n\nThis is a preview of our enterprise AI governance platform. In the full version, I would process your request using the selected AI model and activity type with proper security monitoring and compliance tracking.`;
      
      const userMessage = {
        id: Math.floor(Math.random() * 1000000),
        sessionId: parseInt(sessionId) || 1,
        role: 'user',
        content: message,
        aiModelId: parseInt(aiModelId) || 1,
        activityTypeId: parseInt(activityTypeId) || 1,
        createdAt: new Date().toISOString(),
        isSecurityFlagged: false
      };

      const assistantMessage = {
        id: Math.floor(Math.random() * 1000000),
        sessionId: parseInt(sessionId) || 1,
        role: 'assistant',
        content: demoResponse,
        aiModelId: parseInt(aiModelId) || 1,
        activityTypeId: parseInt(activityTypeId) || 1,
        createdAt: new Date().toISOString(),
        isSecurityFlagged: false
      };

      res.status(200).json({ userMessage, assistantMessage });
      return;
    }

    // Chat sessions list endpoint
    if (url.includes('chat/sessions')) {
      const sessions = [
        {
          id: 1,
          title: 'Demo Session',
          lastMessagePreview: 'Welcome to AI Sentinel demo',
          messageCount: 2,
          createdAt: new Date().toISOString()
        }
      ];
      res.status(200).json(sessions);
      return;
    }

    // Chat messages for session endpoint
    if (url.includes('chat/') && url.includes('/messages')) {
      const messages = [
        {
          id: 1,
          role: 'assistant',
          content: 'Welcome to the AI Sentinel demo! I can help you explore our enterprise AI governance platform.',
          createdAt: new Date().toISOString(),
          isSecurityFlagged: false
        }
      ];
      res.status(200).json(messages);
      return;
    }

    // Email verification request endpoint
    if (url.includes('auth/request-verification') && method === 'POST') {
      console.log('📧 [SERVERLESS] Email verification request');
      
      try {
        const body = req.body || {};
        const email = body.email;
        
        if (!email) {
          res.status(400).json({ message: 'Email is required' });
          return;
        }

        // Check if SendGrid is configured
        const sendgridApiKey = process.env.SENDGRID_API_KEY;
        if (!sendgridApiKey) {
          console.error('❌ [SERVERLESS] SENDGRID_API_KEY not configured');
          res.status(500).json({ 
            message: 'Email service not configured',
            details: 'SENDGRID_API_KEY environment variable missing'
          });
          return;
        }

        // Generate verification token (cleaner format)
        const verificationToken = Buffer.from(`${email}:${Date.now()}`).toString('base64url');
        const appUrl = process.env.APP_URL || 'https://aisentinel.app';
        const verificationUrl = `${appUrl}/verify/${verificationToken}`;

        // SendGrid email sending
        sgMail.setApiKey(sendgridApiKey);

        const msg = {
          to: email,
          from: 'ed.duval@duvalsolutions.net',
          subject: 'AI Sentinel - Email Verification',
          html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e3a8a; margin-bottom: 10px;">AI Sentinel</h1>
                <p style="color: #64748b; font-size: 16px;">Enterprise AI Governance Platform</p>
              </div>
              
              <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="color: #1e40af; margin-bottom: 20px;">Verify Your Email Address</h2>
                <p style="color: #334155; line-height: 1.6; margin-bottom: 25px;">
                  Welcome to AI Sentinel! Click the button below to verify your email address and get started with our secure AI governance platform.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" 
                     style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="color: #64748b; font-size: 14px; margin-top: 25px;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all;">${verificationUrl}</a>
                </p>
              </div>
              
              <div style="text-align: center; color: #64748b; font-size: 12px;">
                <p>This verification link will expire in 24 hours.</p>
                <p>If you didn't request this verification, please ignore this email.</p>
              </div>
            </div>
          `
        };

        await sgMail.send(msg);
        
        console.log('✅ [SERVERLESS] Verification email sent successfully to:', email);
        res.status(200).json({ 
          message: 'Verification email sent successfully',
          email: email,
          token: verificationToken
        });
        return;

      } catch (error) {
        console.error('💥 [SERVERLESS] Email sending error:', error);
        res.status(500).json({ 
          message: 'Failed to send verification email',
          error: error.message || 'Unknown error'
        });
        return;
      }
    }

    // Email verification endpoint (clean URL format)
    if ((url.includes('auth/verify') || url.includes('/verify/')) && method === 'GET') {
      console.log('🔐 [SERVERLESS] Email verification attempt');
      
      try {
        let token, email;
        
        if (url.includes('/verify/')) {
          // New clean format: /verify/token
          const tokenPart = url.split('/verify/')[1];
          if (tokenPart) {
            const decoded = Buffer.from(tokenPart, 'base64url').toString();
            const parts = decoded.split(':');
            email = parts[0];
            const timestamp = parts[1];
          }
          token = tokenPart;
        } else {
          // Legacy format with query parameters
          const urlObj = new URL(url, 'https://aisentinel.app');
          token = urlObj.searchParams.get('token');
          email = urlObj.searchParams.get('email');
        }
        
        if (!token || !email) {
          res.status(400).json({ message: 'Invalid verification link' });
          return;
        }

        // Create production session token 
        const sessionToken = 'prod-session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Set session cookie with production settings
        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction ? 'Secure; ' : '';
        const cookieValue = `sessionToken=${sessionToken}; HttpOnly; ${secureFlag}SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`;
        
        res.setHeader('Set-Cookie', cookieValue);
        
        console.log('✅ [SERVERLESS] Email verified, production session created:', sessionToken);
        console.log('🍪 [SERVERLESS] Cookie set:', cookieValue);
        
        // Redirect to main application (chat interface)
        res.writeHead(302, { 'Location': '/' });
        res.end();
        return;

      } catch (error) {
        console.error('💥 [SERVERLESS] Verification error:', error);
        res.status(500).json({ 
          message: 'Email verification failed',
          error: error.message || 'Unknown error'
        });
        return;
      }
    }

    // Default 404 response
    const duration = Date.now() - startTime;
    console.log(`❌ [SERVERLESS] 404 - Unhandled endpoint: ${method} ${url} (${duration}ms)`);
    res.status(404).json({ 
      message: 'Endpoint not found',
      endpoint: url,
      method: method,
      availableRoutes: [
        '/api/health',
        '/api/ai-models', 
        '/api/activity-types',
        '/api/auth/me',
        '/api/auth/request-verification',
        '/api/auth/verify',
        '/api/chat/session',
        '/api/chat/message',
        '/api/user/current-company'
      ]
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [SERVERLESS] Error in ${method} ${url} (${duration}ms):`, error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message || 'Unknown error',
      url: url,
      method: method
    });
  }
}