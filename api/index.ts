import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Demo-Mode');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url || '';
  
  // Health check
  if (path.includes('health')) {
    return res.json({ status: 'OK', timestamp: new Date().toISOString() });
  }

  // Chat session - always return demo session for production
  if (path.includes('chat/session') && req.method === 'POST') {
    const demoSession = {
      id: Math.floor(Math.random() * 100000) + 1,
      companyId: 1,
      userId: 'demo-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return res.json(demoSession);
  }

  // AI models
  if (path.includes('ai-models')) {
    return res.json([
      { id: 1, name: 'GPT-4o', provider: 'OpenAI', enabled: true },
      { id: 2, name: 'Claude Sonnet 4', provider: 'Anthropic', enabled: true },
      { id: 3, name: 'Claude Haiku', provider: 'Anthropic', enabled: true },
      { id: 4, name: 'GPT-4 Turbo', provider: 'OpenAI', enabled: true },
      { id: 5, name: 'Claude Opus', provider: 'Anthropic', enabled: true },
      { id: 6, name: 'Perplexity Sonar', provider: 'Perplexity', enabled: true }
    ]);
  }

  // Activity types
  if (path.includes('activity-types')) {
    return res.json([
      { id: 1, name: 'General Chat', description: 'General conversation', enabled: true },
      { id: 2, name: 'Code Review', description: 'Code analysis and review', enabled: true },
      { id: 3, name: 'Business Analysis', description: 'Business document analysis', enabled: true },
      { id: 4, name: 'Document Review', description: 'Document review and analysis', enabled: true }
    ]);
  }

  // Company info
  if (path.includes('user/current-company')) {
    return res.json({
      id: 1,
      name: 'Horizon Edge Enterprises',
      description: 'Demo Company',
      logo: null
    });
  }

  // Chat messages
  if (path.includes('chat/message') && req.method === 'POST') {
    const { message, sessionId, aiModelId, activityTypeId } = req.body || {};
    
    if (!message) {
      return res.status(400).json({ message: "Message required" });
    }

    const demoResponse = `I'm a demo AI assistant. You asked: "${message}"\n\nThis is a preview of our enterprise AI governance platform.`;
    
    return res.json({
      userMessage: {
        id: Math.floor(Math.random() * 1000000),
        sessionId: parseInt(sessionId) || 1,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
        isSecurityFlagged: false
      },
      assistantMessage: {
        id: Math.floor(Math.random() * 1000000),
        sessionId: parseInt(sessionId) || 1,
        role: 'assistant', 
        content: demoResponse,
        createdAt: new Date().toISOString(),
        isSecurityFlagged: false
      }
    });
  }

  // Default response
  return res.status(404).json({ message: "Endpoint not found" });
}