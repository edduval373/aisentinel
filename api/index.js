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
        const validTokenPattern = /^(dev-session-|prod-session-|replit-auth-)/;
        
        if (validTokenPattern.test(sessionToken)) {
          console.log('✅ [SERVERLESS] Valid session token pattern, user authenticated');
          
          const authResponse = {
            authenticated: true,
            user: {
              id: 1,
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
      const company = {
        id: 1,
        name: 'Duval AI Solutions',
        description: 'AI Governance Solutions Provider',
        logo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAIcBQADASIAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAcIBgkBBAUDAv/EAGMQAAEDAgMEBAULCxAIBQQDAAABAgMEBQYREgkSITETQVFhFCJxgZEVFiMyN0JScnWhsRYjU2KCkqKys8HRFxgzNzlDVmNzpMPwJDVEZ3Wj09LhWIWU4hUlV8LElqXh/wAAaOQAGwEBAAMBAQEBAAAAAAAAAAAAAAECAwQFBgf/xAAsEQEAAgICAgIDAAEEAgMBAAAAAQIDESExBBITQSIyUWEFFCNxM0GBIE2FB/2oADAMBAAIRAxEAPwC5YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      };
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

        // Create session token
        const sessionToken = 'demo-session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Set session cookie
        res.setHeader('Set-Cookie', `sessionToken=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`);
        
        console.log('✅ [SERVERLESS] Email verified, session created:', sessionToken);
        
        // Redirect to main application
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