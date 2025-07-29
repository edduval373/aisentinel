const { Client } = require('pg');

module.exports = async (req, res) => {
  const { method, url } = req;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log(`🚀 [SERVERLESS] ${method} ${url}`);

  try {
    // Health check endpoint
    if (url.includes('health')) {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: 'minimal-health-v2-debug'
      });
      return;
    }

    // Database test endpoint
    if (url.includes('db-test')) {
      console.log('🔍 [SERVERLESS] Database test request');
      
      const DATABASE_URL = process.env.DATABASE_URL;
      
      res.status(200).json({
        databaseConfigured: !!DATABASE_URL,
        databasePreview: DATABASE_URL ? DATABASE_URL.substring(0, 30) + '...' : 'NOT SET',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      });
      return;
    }

    // Activity types endpoint  
    if (url.includes('activity-types')) {
      console.log('📋 [SERVERLESS] Activity types request');
      
      const DATABASE_URL = process.env.DATABASE_URL;
      console.log('📋 [SERVERLESS] DATABASE_URL available:', DATABASE_URL ? 'YES' : 'NO');
      
      if (!DATABASE_URL) {
        console.error('❌ [SERVERLESS] DATABASE_URL environment variable missing');
        res.status(500).json({ 
          error: 'Database configuration error', 
          message: 'DATABASE_URL environment variable not configured' 
        });
        return;
      }

      try {
        const client = new Client({ connectionString: DATABASE_URL });
        await client.connect();
        
        const result = await client.query('SELECT id, name, description FROM activity_types WHERE company_id = 1 ORDER BY id');
        
        if (result.rows.length > 0) {
          const types = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            isEnabled: true
          }));
          
          console.log('✅ [SERVERLESS] Activity types from database:', types.length);
          await client.end();
          res.status(200).json(types);
          return;
        }
        
        await client.end();
      } catch (error) {
        console.error('❌ [SERVERLESS] Database connection failed:', error.message);
      }
      
      // No fallback data - return error so we can see what's wrong
      console.error('❌ [SERVERLESS] Database connection failed for activity types, no fallback data');
      res.status(500).json({ 
        error: 'Database connection failed', 
        message: 'Could not connect to database to fetch activity types',
        endpoint: 'activity-types'
      });
      return;
    }

    // Admin companies endpoint - for super-users
    if (url.includes('admin/companies') && method === 'GET') {
      console.log('🏢 [SERVERLESS] Admin companies request');
      
      const DATABASE_URL = process.env.DATABASE_URL;
      console.log('🏢 [SERVERLESS] DATABASE_URL available:', DATABASE_URL ? 'YES' : 'NO');
      console.log('🏢 [SERVERLESS] DATABASE_URL preview:', DATABASE_URL ? DATABASE_URL.substring(0, 30) + '...' : 'NOT SET');
      
      if (!DATABASE_URL) {
        console.error('❌ [SERVERLESS] DATABASE_URL environment variable missing');
        res.status(500).json({ 
          error: 'Database configuration error', 
          message: 'DATABASE_URL environment variable not configured' 
        });
        return;
      }
      
      try {
        console.log('🔌 [SERVERLESS] Attempting database connection...');
        const client = new Client({ 
          connectionString: DATABASE_URL,
          ssl: {
            rejectUnauthorized: false
          },
          connectionTimeoutMillis: 10000
        });
        
        console.log('🔌 [SERVERLESS] Client created, connecting...');
        await client.connect();
        console.log('✅ [SERVERLESS] Database connected successfully');
        
        console.log('📊 [SERVERLESS] Executing companies query...');
        const result = await client.query('SELECT id, name, domain, primary_admin_name, primary_admin_email, primary_admin_title, logo FROM companies ORDER BY id');
        console.log('📊 [SERVERLESS] Query completed, rows:', result.rows.length);
        
        if (result.rows.length > 0) {
          const companies = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            domain: row.domain || '',
            primaryAdminName: row.primary_admin_name || '',
            primaryAdminEmail: row.primary_admin_email || '',
            primaryAdminTitle: row.primary_admin_title || '',
            logo: row.logo || '',
            isActive: true // All companies are active by default
          }));
          
          console.log('✅ [SERVERLESS] Companies from database:', companies.length);
          await client.end();
          res.status(200).json(companies);
          return;
        }
        
        console.log('⚠️ [SERVERLESS] No companies found in database');
        await client.end();
        res.status(200).json([]);
        return;
        
      } catch (error) {
        console.error('❌ [SERVERLESS] Database error details:');
        console.error('   Error message:', error.message);
        console.error('   Error code:', error.code);
        console.error('   Error stack:', error.stack);
        
        res.status(500).json({ 
          error: 'Database connection failed', 
          message: `Database error: ${error.message}`,
          code: error.code,
          details: 'Check Vercel function logs for full error details'
        });
        return;
      }
    }

    // AI models endpoint
    if (url.includes('ai-models')) {
      console.log('🤖 [SERVERLESS] AI models request');
      
      const DATABASE_URL = process.env.DATABASE_URL;
      if (!DATABASE_URL) {
        console.error('❌ [SERVERLESS] DATABASE_URL environment variable missing');
        res.status(500).json({ 
          error: 'Database configuration error', 
          message: 'DATABASE_URL environment variable not configured' 
        });
        return;
      }

      try {
        const client = new Client({ connectionString: DATABASE_URL });
        await client.connect();
        
        const result = await client.query('SELECT id, name, provider, model_id, is_enabled FROM ai_models WHERE company_id = 1 ORDER BY id');
        
        if (result.rows.length > 0) {
          const models = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            provider: row.provider,
            modelId: row.model_id,
            isEnabled: row.is_enabled
          }));
          
          console.log('✅ [SERVERLESS] AI models from database:', models.length);
          await client.end();
          res.status(200).json(models);
          return;
        }
        
        await client.end();
      } catch (error) {
        console.error('❌ [SERVERLESS] Database connection failed:', error.message);
      }
      
      // No fallback data - return error
      console.error('❌ [SERVERLESS] Database connection failed for AI models, no fallback data');
      res.status(500).json({ 
        error: 'Database connection failed', 
        message: 'Could not connect to database to fetch AI models',
        endpoint: 'ai-models'
      });
      return;
    }

    // Default response for unhandled routes
    console.log('❓ [SERVERLESS] Unhandled route:', url);
    res.status(404).json({ 
      error: 'Route not found', 
      message: `Route ${url} not implemented in serverless function`,
      availableRoutes: ['/api/health', '/api/activity-types', '/api/admin/companies', '/api/ai-models']
    });

  } catch (error) {
    console.error('❌ [SERVERLESS] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};