// Vercel serverless function for AI model template management with Railway PostgreSQL
// Using raw SQL for maximum Vercel compatibility

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication check
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');
  const sessionToken = req.headers['x-session-token'];
  const authToken = bearerToken || sessionToken;
  
  if (authToken !== 'prod-1754052835575-289kvxqgl42h') {
    console.log('❌ [VERCEL TEMPLATES] Authentication failed - token:', authToken?.substring(0, 10));
    return res.status(401).json({ 
      message: 'Authentication required',
      details: 'Production token required for template access'
    });
  }
  
  console.log('✅ [VERCEL TEMPLATES] Production token authenticated');

  try {
    if (req.method === 'GET') {
      // Connect directly to Railway PostgreSQL using raw queries
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      const { Client } = await import('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

      await client.connect();
      console.log('🔍 [VERCEL TEMPLATES] Fetching templates from Railway database...');
      
      const result = await client.query('SELECT * FROM ai_model_templates ORDER BY id');
      const templates = result.rows;
      
      await client.end();
      
      // Transform snake_case database fields to camelCase for frontend
      const transformedTemplates = templates.map(template => ({
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
      }));
      
      console.log(`✅ [VERCEL TEMPLATES] Retrieved ${templates.length} templates from database`);
      console.log('🔍 [VERCEL TEMPLATES] Sample raw data (snake_case):', templates[0]);
      console.log('🔍 [VERCEL TEMPLATES] Sample transformed data (camelCase):', transformedTemplates[0]);
      return res.json(transformedTemplates);
    }

    if (req.method === 'POST') {
      // Handle AI model template creation
      const { name, provider, modelId, description, contextWindow, capabilities, isEnabled } = req.body;
      
      if (!name || !provider || !modelId) {
        return res.status(400).json({ message: 'Missing required fields: name, provider, modelId' });
      }

      // Connect directly to Railway PostgreSQL using raw queries
      const { Client } = await import('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

      await client.connect();
      console.log('🔍 [VERCEL TEMPLATES] Creating new template in Railway database...');
      
      const insertQuery = `
        INSERT INTO ai_model_templates (name, provider, model_id, description, context_window, capabilities, is_enabled, api_endpoint, auth_method, request_headers, max_tokens, temperature, max_retries, timeout, rate_limit)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;
      
      const values = [
        name,
        provider,
        modelId,
        description || '',
        contextWindow || 4096,
        capabilities ? JSON.stringify(capabilities) : null,
        isEnabled !== undefined ? isEnabled : true,
        `https://api.${provider}.com/v1/completions`,
        'bearer',
        JSON.stringify({ 'Content-Type': 'application/json' }),
        1000,
        0.7,
        3,
        30000,
        100
      ];

      const result = await client.query(insertQuery, values);
      const newTemplate = result.rows[0];
      
      await client.end();

      // Transform snake_case response back to camelCase for frontend consistency
      const transformedNewTemplate = {
        id: newTemplate.id,
        name: newTemplate.name,
        provider: newTemplate.provider,
        modelId: newTemplate.model_id,
        description: newTemplate.description,
        contextWindow: newTemplate.context_window,
        isEnabled: newTemplate.is_enabled,
        capabilities: newTemplate.capabilities,
        apiEndpoint: newTemplate.api_endpoint,
        authMethod: newTemplate.auth_method,
        requestHeaders: newTemplate.request_headers,
        maxTokens: newTemplate.max_tokens,
        temperature: newTemplate.temperature,
        maxRetries: newTemplate.max_retries,
        timeout: newTemplate.timeout,
        rateLimit: newTemplate.rate_limit,
        createdAt: newTemplate.created_at
      };

      console.log('✅ [VERCEL TEMPLATES] Created new template:', transformedNewTemplate.id);
      console.log('🔍 [VERCEL TEMPLATES] Transformed response:', transformedNewTemplate);
      return res.status(201).json(transformedNewTemplate);
    }

    // PUT and DELETE not supported at this endpoint - use /api/admin/ai-model-templates/[id] instead
    if (req.method === 'PUT') {
      return res.status(405).json({ message: 'Use /api/admin/ai-model-templates/[id] for updates' });
    }

    if (req.method === 'DELETE') {
      return res.status(405).json({ message: 'Use /api/admin/ai-model-templates/[id] for deletion' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error("Error in AI model templates API:", error);
    res.status(500).json({ message: "Failed to process AI model templates", error: error.message });
  }
}