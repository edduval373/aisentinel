// Vercel serverless function for AI model template management with Railway PostgreSQL
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Dynamic import to avoid module loading issues in serverless
let aiModelTemplates;

const initDb = async () => {
  if (!aiModelTemplates) {
    const { aiModelTemplates: schema } = await import('@shared/schema');
    aiModelTemplates = schema;
  }
};

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
    await initDb();

    if (req.method === 'GET') {
      // Connect to Railway PostgreSQL database
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      const client = postgres(process.env.DATABASE_URL);
      const db = drizzle(client);

      console.log('🔍 [VERCEL TEMPLATES] Fetching templates from Railway database...');
      const templates = await db.select().from(aiModelTemplates);
      
      await client.end();
      
      console.log(`✅ [VERCEL TEMPLATES] Retrieved ${templates.length} templates from database`);
      return res.json(templates);
    }

    if (req.method === 'POST') {
      // Handle AI model template creation
      const { name, provider, modelId, description, contextWindow, capabilities, isEnabled } = req.body;
      
      if (!name || !provider || !modelId) {
        return res.status(400).json({ message: 'Missing required fields: name, provider, modelId' });
      }

      // Connect to Railway PostgreSQL database
      const client = postgres(process.env.DATABASE_URL);
      const db = drizzle(client);

      console.log('🔍 [VERCEL TEMPLATES] Creating new template in Railway database...');
      const newTemplateData = {
        name,
        provider,
        modelId,
        description: description || '',
        contextWindow: contextWindow || 4096,
        capabilities: capabilities || null,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        apiEndpoint: `https://api.${provider}.com/v1/completions`,
        authMethod: 'bearer',
        requestHeaders: { 'Content-Type': 'application/json' },
        maxTokens: 1000,
        temperature: 0.7,
        maxRetries: 3,
        timeout: 30000,
        rateLimit: 100
      };

      const [newTemplate] = await db.insert(aiModelTemplates).values(newTemplateData).returning();
      await client.end();

      console.log('✅ [VERCEL TEMPLATES] Created new template:', newTemplate.id);
      return res.status(201).json(newTemplate);
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