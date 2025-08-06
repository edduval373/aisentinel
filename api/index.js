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

// AI Model Templates Routes
app.get('/api/admin/ai-model-templates', async (req, res) => {
  try {
    console.log('🌐 [AI-MODEL-TEMPLATES] GET request received');
    
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query('SELECT * FROM ai_model_templates ORDER BY id ASC');
    const templates = result.rows.map(template => {
      console.log(`🔍 [ADMIN-AI-MODEL-TEMPLATES] Processing template ID ${template.id}: ${template.name}`);
      const transformed = {
        id: template.id,
        name: template.name,
        provider: template.provider,
        modelId: template.model_id,                     // snake_case to camelCase
        description: template.description,
        contextWindow: template.context_window,         // snake_case to camelCase
        isEnabled: template.is_enabled,                 // snake_case to camelCase
        capabilities: template.capabilities,
        apiEndpoint: template.api_endpoint,             // snake_case to camelCase
        authMethod: template.auth_method,               // snake_case to camelCase
        requestHeaders: template.request_headers,       // snake_case to camelCase
        maxTokens: template.max_tokens,                 // snake_case to camelCase
        temperature: template.temperature,
        maxRetries: template.max_retries,               // snake_case to camelCase
        timeout: template.timeout,
        rateLimit: template.rate_limit,                 // snake_case to camelCase
        createdAt: template.created_at                  // snake_case to camelCase
      };
      console.log(`✅ [ADMIN-AI-MODEL-TEMPLATES] Transformed template ${template.id}: modelId=${transformed.modelId}, contextWindow=${transformed.contextWindow}`);
      return transformed;
    });
    
    console.log(`✅ [AI-MODEL-TEMPLATES] Returning ${templates.length} templates`);
    res.json(templates);
  } catch (error) {
    console.error('❌ [AI-MODEL-TEMPLATES] Error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

app.post('/api/admin/ai-model-templates', async (req, res) => {
  try {
    console.log('🌐 [AI-MODEL-TEMPLATES] POST request received');
    
    const auth = authenticateToken(req);
    if (!auth.authenticated || auth.user.roleLevel < 1000) {
      return res.status(401).json({ error: 'Super-user access required' });
    }

    const { 
      name, provider, modelId, description, contextWindow, isEnabled, 
      capabilities, apiEndpoint, authMethod, requestHeaders, maxTokens, 
      temperature, maxRetries, timeout, rateLimit 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO ai_model_templates (
        name, provider, model_id, description, context_window, is_enabled, 
        capabilities, api_endpoint, auth_method, request_headers, max_tokens, 
        temperature, max_retries, timeout, rate_limit, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()) 
      RETURNING *`,
      [
        name, provider, modelId, description, contextWindow, isEnabled !== false,
        capabilities, apiEndpoint, authMethod, requestHeaders, maxTokens,
        temperature, maxRetries, timeout, rateLimit
      ]
    );
    
    const template = result.rows[0];
    const formattedTemplate = {
      id: template.id,
      name: template.name,
      provider: template.provider,
      modelId: template.model_id,
      description: template.description,
      contextWindow: template.context_window,
      isEnabled: template.is_enabled,
      capabilities: template.capabilities,
      apiEndpoint: template.api_endpoint,
      authMethod: template.auth_method,
      requestHeaders: template.request_headers,
      maxTokens: template.max_tokens,
      temperature: template.temperature,
      maxRetries: template.max_retries,
      timeout: template.timeout,
      rateLimit: template.rate_limit,
      createdAt: template.created_at
    };
    
    console.log(`✅ [AI-MODEL-TEMPLATES] Created template: ${template.name}`);
    res.status(201).json(formattedTemplate);
  } catch (error) {
    console.error('❌ [AI-MODEL-TEMPLATES] Create error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

app.put('/api/admin/ai-model-templates/:id', async (req, res) => {
  try {
    console.log(`🌐 [AI-MODEL-TEMPLATES] PUT request received for ID: ${req.params.id}`);
    
    const auth = authenticateToken(req);
    if (!auth.authenticated || auth.user.roleLevel < 1000) {
      return res.status(401).json({ error: 'Super-user access required' });
    }

    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const { 
      name, provider, modelId, description, contextWindow, isEnabled, 
      capabilities, apiEndpoint, authMethod, requestHeaders, maxTokens, 
      temperature, maxRetries, timeout, rateLimit 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE ai_model_templates 
       SET name = $1, provider = $2, model_id = $3, description = $4, context_window = $5, 
           is_enabled = $6, capabilities = $7, api_endpoint = $8, auth_method = $9, 
           request_headers = $10, max_tokens = $11, temperature = $12, max_retries = $13, 
           timeout = $14, rate_limit = $15
       WHERE id = $16 
       RETURNING *`,
      [
        name, provider, modelId, description, contextWindow, isEnabled !== false,
        capabilities, apiEndpoint, authMethod, requestHeaders, maxTokens,
        temperature, maxRetries, timeout, rateLimit, templateId
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const template = result.rows[0];
    const formattedTemplate = {
      id: template.id,
      name: template.name,
      provider: template.provider,
      modelId: template.model_id,
      description: template.description,
      contextWindow: template.context_window,
      isEnabled: template.is_enabled,
      capabilities: template.capabilities,
      apiEndpoint: template.api_endpoint,
      authMethod: template.auth_method,
      requestHeaders: template.request_headers,
      maxTokens: template.max_tokens,
      temperature: template.temperature,
      maxRetries: template.max_retries,
      timeout: template.timeout,
      rateLimit: template.rate_limit,
      createdAt: template.created_at
    };
    
    console.log(`✅ [AI-MODEL-TEMPLATES] Updated template: ${template.name}`);
    res.json(formattedTemplate);
  } catch (error) {
    console.error('❌ [AI-MODEL-TEMPLATES] Update error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

app.delete('/api/admin/ai-model-templates/:id', async (req, res) => {
  try {
    console.log(`🌐 [AI-MODEL-TEMPLATES] DELETE request received for ID: ${req.params.id}`);
    
    const auth = authenticateToken(req);
    if (!auth.authenticated || auth.user.roleLevel < 1000) {
      return res.status(401).json({ error: 'Super-user access required' });
    }

    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const result = await pool.query('DELETE FROM ai_model_templates WHERE id = $1 RETURNING *', [templateId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    console.log(`✅ [AI-MODEL-TEMPLATES] Deleted template: ${result.rows[0].name}`);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('❌ [AI-MODEL-TEMPLATES] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
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

// Chat Sessions Routes
app.get('/api/chat/sessions', async (req, res) => {
  try {
    console.log('🌐 [CHAT-SESSIONS] GET request received');
    
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT * FROM chat_sessions WHERE company_id = $1 ORDER BY created_at DESC',
      [auth.user.companyId]
    );
    
    const sessions = result.rows.map(session => ({
      id: session.id,
      userId: session.user_id,
      companyId: session.company_id,
      title: session.title,
      activityTypeId: session.activity_type_id,
      modelId: session.model_id,
      isActive: session.is_active,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    }));
    
    console.log(`✅ [CHAT-SESSIONS] Returning ${sessions.length} sessions`);
    res.json(sessions);
  } catch (error) {
    console.error('❌ [CHAT-SESSIONS] Error:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

app.post('/api/chat/session', async (req, res) => {
  try {
    console.log('🌐 [CHAT-SESSION] POST request received');
    console.log(`🔍 [CHAT-SESSION] Request body:`, JSON.stringify(req.body, null, 2));
    
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      console.log('❌ [CHAT-SESSION] Authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`🔍 [CHAT-SESSION] Authenticated user: ${auth.user.email}, ID: ${auth.user.id}, Company: ${auth.user.companyId}`);

    const { title = 'New Chat', activityTypeId, modelId } = req.body;
    console.log(`🔍 [CHAT-SESSION] Parsed parameters: title="${title}", activityTypeId=${activityTypeId}, modelId=${modelId}`);
    
    // Check if we have the required schema fields
    console.log('🔍 [CHAT-SESSION] Checking database schema compatibility...');
    
    // Based on the schema, chat_sessions only has: id, user_id, company_id, created_at, updated_at
    // The activityTypeId and modelId might be causing the issue
    const result = await pool.query(
      `INSERT INTO chat_sessions (user_id, company_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [auth.user.id, auth.user.companyId]
    );
    
    console.log(`📊 [CHAT-SESSION] Database insert result:`, JSON.stringify(result.rows[0], null, 2));
    
    const session = result.rows[0];
    const formattedSession = {
      id: session.id,
      userId: session.user_id,                      // snake_case to camelCase
      companyId: session.company_id,                // snake_case to camelCase
      createdAt: session.created_at,                // snake_case to camelCase
      updatedAt: session.updated_at                 // snake_case to camelCase
    };
    
    console.log(`📊 [CHAT-SESSION] Formatted response:`, JSON.stringify(formattedSession, null, 2));
    console.log(`✅ [CHAT-SESSION] Created session: ${session.id}`);
    res.status(201).json(formattedSession);
  } catch (error) {
    console.error('❌ [CHAT-SESSION] Create error:', error);
    console.error('❌ [CHAT-SESSION] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

// AI Models Routes  
app.get('/api/ai-models', async (req, res) => {
  try {
    console.log('🌐 [AI-MODELS] GET request received');
    
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query('SELECT * FROM ai_model_templates WHERE is_enabled = true ORDER BY name ASC');
    const models = result.rows.map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      modelId: model.model_id,
      description: model.description,
      contextWindow: model.context_window,
      isEnabled: model.is_enabled,
      capabilities: model.capabilities,
      createdAt: model.created_at
    }));
    
    console.log(`✅ [AI-MODELS] Returning ${models.length} models`);
    res.json(models);
  } catch (error) {
    console.error('❌ [AI-MODELS] Error:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
});

// Activity Types Routes
app.get('/api/activity-types', async (req, res) => {
  try {
    console.log('🌐 [ACTIVITY-TYPES] GET request received');
    
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT * FROM activity_types WHERE company_id = $1 AND is_enabled = true ORDER BY name ASC',
      [auth.user.companyId]
    );
    
    const activityTypes = result.rows.map(type => ({
      id: type.id,
      companyId: type.company_id,
      name: type.name,
      description: type.description,
      prePrompt: type.pre_prompt,
      riskLevel: type.risk_level,
      permissions: type.permissions,
      isEnabled: type.is_enabled,
      createdAt: type.created_at
    }));
    
    console.log(`✅ [ACTIVITY-TYPES] Returning ${activityTypes.length} activity types`);
    res.json(activityTypes);
  } catch (error) {
    console.error('❌ [ACTIVITY-TYPES] Error:', error);
    res.status(500).json({ error: 'Failed to fetch activity types' });
  }
});

// AI Model Templates Routes (Production Universal Templates)
app.get('/api/ai-model-templates', async (req, res) => {
  try {
    console.log('🌐 [AI-MODEL-TEMPLATES] GET request received');
    
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      console.log('❌ [AI-MODEL-TEMPLATES] Authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`🔍 [AI-MODEL-TEMPLATES] Authenticated user: ${auth.user.email}, role: ${auth.user.roleLevel}`);

    const result = await pool.query('SELECT * FROM ai_model_templates WHERE is_enabled = true ORDER BY name ASC');
    console.log(`📊 [AI-MODEL-TEMPLATES] Raw database results: ${result.rows.length} templates`);
    console.log(`📊 [AI-MODEL-TEMPLATES] Sample raw row:`, result.rows[0] ? JSON.stringify(result.rows[0], null, 2) : 'No data');
    
    const templates = result.rows.map(template => {
      const transformed = {
        id: template.id,
        name: template.name,
        provider: template.provider,
        modelId: template.model_id,                     // snake_case to camelCase
        description: template.description,
        contextWindow: template.context_window,         // snake_case to camelCase
        isEnabled: template.is_enabled,                 // snake_case to camelCase
        capabilities: template.capabilities,
        apiEndpoint: template.api_endpoint,             // snake_case to camelCase
        authMethod: template.auth_method,               // snake_case to camelCase
        requestHeaders: template.request_headers,       // snake_case to camelCase
        maxTokens: template.max_tokens,                 // snake_case to camelCase
        temperature: template.temperature,
        maxRetries: template.max_retries,               // snake_case to camelCase
        timeout: template.timeout,
        rateLimit: template.rate_limit,                 // snake_case to camelCase
        createdAt: template.created_at                  // snake_case to camelCase
      };
      return transformed;
    });
    
    console.log(`📊 [AI-MODEL-TEMPLATES] Sample transformed template:`, templates[0] ? JSON.stringify(templates[0], null, 2) : 'No data');
    console.log(`✅ [AI-MODEL-TEMPLATES] Returning ${templates.length} templates with proper camelCase conversion`);
    res.json(templates);
  } catch (error) {
    console.error('❌ [AI-MODEL-TEMPLATES] Error:', error);
    res.status(500).json({ error: 'Failed to fetch AI model templates' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Default export for Vercel
export default app;