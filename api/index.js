// Minimal Vercel serverless function for AI Sentinel (JavaScript)
export default function handler(req, res) {
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
      
      if (sessionToken && sessionToken.startsWith('demo-')) {
        console.log('✅ [SERVERLESS] Valid demo session found, user authenticated');
        
        const authResponse = {
          authenticated: true,
          user: {
            id: 1,
            email: 'ed.duval15@gmail.com',
            companyId: 1,
            companyName: 'Horizon Edge Enterprises',
            role: 'super-user',
            roleLevel: 100,
            firstName: 'Ed',
            lastName: 'Duval'
          }
        };
        
        res.status(200).json(authResponse);
        return;
      } else {
        console.log('❌ [SERVERLESS] No valid session token, user not authenticated');
        res.status(200).json({ authenticated: false });
        return;
      }
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
        name: 'Horizon Edge Enterprises',
        description: 'Demo Company',
        logo: null
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
        '/api/chat/session',
        '/api/chat/message'
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