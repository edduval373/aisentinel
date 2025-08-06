// Vercel API entry point - handles all API routes
// This file is the main entry point for all API requests in production

// Import all necessary dependencies
import express from 'express';
import { Pool } from 'pg';
import { createHash } from 'crypto';

// Initialize Express app for Vercel serverless functions
const app = express();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Authentication helper function
function authenticateToken(req) {
  const authHeader = req.headers.authorization;
  const sessionTokenHeader = req.headers['x-session-token'];
  
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (sessionTokenHeader) {
    token = sessionTokenHeader;
  }
  
  // Validate against production token
  if (token === 'prod-1754052835575-289kvxqgl42h') {
    return {
      authenticated: true,
      user: {
        id: '42450602',
        email: 'ed.duval15@gmail.com',
        firstName: 'Edward',
        lastName: 'Duval',
        role: 'super-user',
        roleLevel: 1000,
        companyId: 1,
        companyName: 'Duval Solutions'
      }
    };
  }
  
  return { authenticated: false };
}

// AI Providers Routes
app.get('/api/admin/ai-providers', async (req, res) => {
  try {
    console.log('🌐 [AI-PROVIDERS] GET request received');
    
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query('SELECT * FROM ai_providers ORDER BY id ASC');
    const providers = result.rows.map(provider => ({
      id: provider.id,
      name: provider.name,
      displayName: provider.display_name,
      description: provider.description,
      website: provider.website,
      apiDocUrl: provider.api_doc_url,
      isEnabled: provider.is_enabled,
      createdAt: provider.created_at,
      updatedAt: provider.updated_at
    }));
    
    console.log(`✅ [AI-PROVIDERS] Returning ${providers.length} providers`);
    res.json(providers);
  } catch (error) {
    console.error('❌ [AI-PROVIDERS] Error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

app.post('/api/admin/ai-providers', async (req, res) => {
  try {
    console.log('🌐 [AI-PROVIDERS] POST request received');
    
    const auth = authenticateToken(req);
    if (!auth.authenticated || auth.user.roleLevel < 1000) {
      return res.status(401).json({ error: 'Super-user access required' });
    }

    const { name, displayName, description, website, apiDocUrl, isEnabled } = req.body;
    
    const result = await pool.query(
      `INSERT INTO ai_providers (name, display_name, description, website, api_doc_url, is_enabled, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
       RETURNING *`,
      [name, displayName, description, website, apiDocUrl, isEnabled !== false]
    );
    
    const provider = result.rows[0];
    const formattedProvider = {
      id: provider.id,
      name: provider.name,
      displayName: provider.display_name,
      description: provider.description,
      website: provider.website,
      apiDocUrl: provider.api_doc_url,
      isEnabled: provider.is_enabled,
      createdAt: provider.created_at,
      updatedAt: provider.updated_at
    };
    
    console.log(`✅ [AI-PROVIDERS] Created provider: ${provider.name}`);
    res.status(201).json(formattedProvider);
  } catch (error) {
    console.error('❌ [AI-PROVIDERS] Create error:', error);
    res.status(500).json({ error: 'Failed to create provider' });
  }
});

app.put('/api/admin/ai-providers/:id', async (req, res) => {
  try {
    console.log(`🌐 [AI-PROVIDERS] PUT request received for ID: ${req.params.id}`);
    
    const auth = authenticateToken(req);
    if (!auth.authenticated || auth.user.roleLevel < 1000) {
      return res.status(401).json({ error: 'Super-user access required' });
    }

    const providerId = parseInt(req.params.id);
    if (isNaN(providerId)) {
      return res.status(400).json({ error: 'Invalid provider ID' });
    }

    const { name, displayName, description, website, apiDocUrl, isEnabled } = req.body;
    
    const result = await pool.query(
      `UPDATE ai_providers 
       SET name = $1, display_name = $2, description = $3, website = $4, api_doc_url = $5, is_enabled = $6, updated_at = NOW()
       WHERE id = $7 
       RETURNING *`,
      [name, displayName, description, website, apiDocUrl, isEnabled !== false, providerId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const provider = result.rows[0];
    const formattedProvider = {
      id: provider.id,
      name: provider.name,
      displayName: provider.display_name,
      description: provider.description,
      website: provider.website,
      apiDocUrl: provider.api_doc_url,
      isEnabled: provider.is_enabled,
      createdAt: provider.created_at,
      updatedAt: provider.updated_at
    };
    
    console.log(`✅ [AI-PROVIDERS] Updated provider: ${provider.name}`);
    res.json(formattedProvider);
  } catch (error) {
    console.error('❌ [AI-PROVIDERS] Update error:', error);
    res.status(500).json({ error: 'Failed to update provider' });
  }
});

app.delete('/api/admin/ai-providers/:id', async (req, res) => {
  try {
    console.log(`🌐 [AI-PROVIDERS] DELETE request received for ID: ${req.params.id}`);
    
    const auth = authenticateToken(req);
    if (!auth.authenticated || auth.user.roleLevel < 1000) {
      return res.status(401).json({ error: 'Super-user access required' });
    }

    const providerId = parseInt(req.params.id);
    if (isNaN(providerId)) {
      return res.status(400).json({ error: 'Invalid provider ID' });
    }

    const result = await pool.query('DELETE FROM ai_providers WHERE id = $1 RETURNING *', [providerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    console.log(`✅ [AI-PROVIDERS] Deleted provider: ${result.rows[0].name}`);
    res.json({ success: true, message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('❌ [AI-PROVIDERS] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete provider' });
  }
});

// Companies routes
app.get('/api/admin/companies', async (req, res) => {
  try {
    console.log('🌐 [COMPANIES] GET request received');
    
    const auth = authenticateToken(req);
    if (!auth.authenticated || auth.user.roleLevel < 1000) {
      return res.status(401).json({ error: 'Super-user access required' });
    }

    const result = await pool.query('SELECT * FROM companies ORDER BY id ASC');
    const companies = result.rows.map(company => ({
      id: company.id,
      name: company.name,
      domain: company.domain,
      maxUsers: company.max_users,
      isActive: company.is_active,
      createdAt: company.created_at,
      updatedAt: company.updated_at
    }));
    
    console.log(`✅ [COMPANIES] Returning ${companies.length} companies`);
    res.json(companies);
  } catch (error) {
    console.error('❌ [COMPANIES] Error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Default export for Vercel
export default app;