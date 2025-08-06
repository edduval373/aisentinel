// Vercel API endpoint for AI providers by ID management
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

  const { id } = req.query;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Valid provider ID required' });
  }

  // Header-based authentication for super-users (1000+ level)
  const authHeader = req.headers.authorization;
  const sessionToken = req.headers['x-session-token'];
  
  let isAuthenticated = false;
  let userId = null;
  let roleLevel = 0;

  // Production token authentication
  const productionToken = 'prod-1754052835575-289kvxqgl42h';
  const extractedToken = authHeader?.replace('Bearer ', '') || sessionToken;
  
  if (extractedToken === productionToken) {
    console.log('✅ [AI-PROVIDERS] Production token authenticated for provider ' + id);
    isAuthenticated = true;
    userId = 42450602;
    roleLevel = 1000;
  } else {
    console.log('❌ [AI-PROVIDERS] Authentication failed for provider ' + id);
    return res.status(401).json({ 
      error: 'Authentication failed',
      details: {
        hasToken: !!extractedToken,
        requiredRole: '1000+ (Super-user)'
      }
    });
  }

  // Super-user access required (1000+)
  if (roleLevel < 1000) {
    return res.status(403).json({ 
      error: 'Super-user access required',
      currentRole: roleLevel,
      requiredRole: 1000
    });
  }

  console.log('✅ [AI-PROVIDERS] Header auth successful for provider ' + id + ': userId=' + userId + ', roleLevel=' + roleLevel);

  try {
    switch (req.method) {
      case 'PUT':
        console.log('✅ [AI-PROVIDERS] Updating provider ' + id + '...');
        const updateData = req.body;
        console.log('📝 [AI-PROVIDERS] Update data:', updateData);
        
        const updateClient = await pool.connect();
        try {
          const { name, displayName, description, website, apiDocUrl, isEnabled } = updateData;
          
          const query = `
            UPDATE ai_providers 
            SET name = $1, display_name = $2, description = $3, website = $4, api_doc_url = $5, is_enabled = $6, updated_at = NOW()
            WHERE id = $7 
            RETURNING *
          `;
          
          const values = [name, displayName, description, website, apiDocUrl, isEnabled, parseInt(id)];
          const result = await updateClient.query(query, values);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
          }
          
          console.log('✅ [AI-PROVIDERS] Updated provider:', result.rows[0].display_name);
          return res.json(result.rows[0]);
        } finally {
          updateClient.release();
        }

      case 'DELETE':
        console.log('✅ [AI-PROVIDERS] Deleting provider ' + id + '...');
        
        const deleteClient = await pool.connect();
        try {
          const query = 'DELETE FROM ai_providers WHERE id = $1 RETURNING *';
          const result = await deleteClient.query(query, [parseInt(id)]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
          }
          
          console.log('✅ [AI-PROVIDERS] Deleted provider:', result.rows[0].display_name);
          return res.json({ message: 'Provider deleted successfully', provider: result.rows[0] });
        } finally {
          deleteClient.release();
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ [AI-PROVIDERS] Database error for provider ' + id + ':', error);
    return res.status(500).json({ 
      error: 'Database operation failed', 
      details: error.message 
    });
  }
}