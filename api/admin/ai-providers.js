// Vercel API endpoint for AI providers management
import { Pool } from 'pg';

// Database connection using Railway PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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
        const client = await pool.connect();
        try {
          const result = await client.query('SELECT * FROM ai_providers ORDER BY display_name');
          console.log('✅ [AI-PROVIDERS] Found ' + result.rows.length + ' providers');
          return res.json(result.rows);
        } finally {
          client.release();
        }

      case 'POST':
        console.log('✅ [AI-PROVIDERS] Creating new AI provider...');
        const insertData = req.body;
        console.log('📝 [AI-PROVIDERS] Insert data:', insertData);
        
        const createClient = await pool.connect();
        try {
          const { name, displayName, description, website, apiDocUrl, isEnabled } = insertData;
          
          const query = `
            INSERT INTO ai_providers (name, display_name, description, website, api_doc_url, is_enabled, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *
          `;
          
          const values = [name, displayName, description, website, apiDocUrl, isEnabled !== false];
          const result = await createClient.query(query, values);
          
          console.log('✅ [AI-PROVIDERS] Created provider:', result.rows[0].display_name);
          return res.status(201).json(result.rows[0]);
        } finally {
          createClient.release();
        }

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