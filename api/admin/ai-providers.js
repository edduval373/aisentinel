import { db } from '../../server/db.js';
import { aiProviders } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`🌐 API Request: ${req.method} ${req.url} from ${req.headers['user-agent']?.substring(0, 50)}...`);

  // Header-based authentication for super-users (1000+ level)
  const authHeader = req.headers.authorization;
  const sessionToken = req.headers['x-session-token'];
  
  console.log('🔍 [AI-PROVIDERS] Authentication headers:', {
    authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : 'none',
    sessionToken: sessionToken ? `${sessionToken.substring(0, 20)}...` : 'none'
  });

  let isAuthenticated = false;
  let userId = null;
  let roleLevel = 0;

  // Production token authentication
  const productionToken = 'prod-1754052835575-289kvxqgl42h';
  const extractedToken = authHeader?.replace('Bearer ', '') || sessionToken;
  
  if (extractedToken === productionToken) {
    console.log('✅ [AI-PROVIDERS] Production token authenticated');
    isAuthenticated = true;
    userId = 42450602;
    roleLevel = 1000;
  } else {
    console.log('❌ [AI-PROVIDERS] Authentication failed:', {
      token: extractedToken ? `${extractedToken.substring(0, 10)}...` : 'none',
      expected: `${productionToken.substring(0, 10)}...`
    });
    return res.status(401).json({ 
      error: 'Authentication failed',
      details: {
        hasToken: !!extractedToken,
        tokenMatch: extractedToken === productionToken,
        requiredRole: '1000+ (Super-user)'
      }
    });
  }

  // Super-user access required (1000+)
  if (roleLevel < 1000) {
    console.log('❌ [AI-PROVIDERS] Insufficient role level:', roleLevel);
    return res.status(403).json({ 
      error: 'Super-user access required',
      details: {
        currentRole: roleLevel,
        requiredRole: 1000
      }
    });
  }

  console.log('✅ [AI-PROVIDERS] Header auth successful: userId=' + userId + ', roleLevel=' + roleLevel);

  try {
    switch (req.method) {
      case 'GET':
        console.log('✅ [AI-PROVIDERS] Fetching AI providers for super-user...');
        const providers = await db.select().from(aiProviders).orderBy(aiProviders.displayName);
        console.log('✅ [AI-PROVIDERS] Found ' + providers.length + ' providers');
        return res.json(providers);

      case 'POST':
        console.log('✅ [AI-PROVIDERS] Creating new AI provider...');
        const insertData = req.body;
        console.log('📝 [AI-PROVIDERS] Insert data:', insertData);
        
        const [newProvider] = await db.insert(aiProviders).values(insertData).returning();
        console.log('✅ [AI-PROVIDERS] Created provider:', newProvider.displayName);
        return res.status(201).json(newProvider);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ [AI-PROVIDERS] Database error:', error);
    return res.status(500).json({ 
      error: 'Database operation failed', 
      details: error.message 
    });
  }
}