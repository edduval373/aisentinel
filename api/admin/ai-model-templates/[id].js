// Vercel serverless function for AI template CRUD operations - matches companies pattern
import { Pool } from 'pg';

// Database connection using Railway PostgreSQL - same as companies.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateTemplateInDB(id, updates) {
  const client = await pool.connect();
  try {
    const setClause = Object.keys(updates)
      .map((key, index) => `"${key}" = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];
    
    const query = `
      UPDATE ai_model_templates 
      SET ${setClause}, "updatedAt" = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Template not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function deleteTemplateFromDB(id) {
  const client = await pool.connect();
  try {
    const result = await client.query('DELETE FROM ai_model_templates WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Template not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Database delete error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication check - same as companies
  const authHeader = req.headers.authorization;
  const sessionToken = req.headers['x-session-token'] || 
                      (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

  if (!sessionToken || sessionToken !== 'prod-1754052835575-289kvxqgl42h') {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const { id } = req.query;
  const templateId = parseInt(id);

  if (isNaN(templateId)) {
    return res.status(400).json({ message: 'Invalid template ID' });
  }

  try {
    if (req.method === 'PUT') {
      console.log('✅ [TEMPLATE UPDATE] Authenticated user updating template:', templateId);
      
      const updates = req.body;
      console.log('✅ [TEMPLATE UPDATE] Update data:', updates);
      
      // Update template in Railway PostgreSQL database
      const updatedTemplate = await updateTemplateInDB(templateId, updates);
      
      console.log('✅ [TEMPLATE UPDATE] Template successfully updated in database:', updatedTemplate);
      return res.status(200).json(updatedTemplate);
    }

    if (req.method === 'DELETE') {
      console.log('✅ [TEMPLATE DELETE] Authenticated user deleting template:', templateId);
      
      // Delete template from Railway PostgreSQL database
      const deletedTemplate = await deleteTemplateFromDB(templateId);
      console.log('✅ [TEMPLATE DELETE] Template deleted from database:', deletedTemplate);
      return res.status(200).json({ message: 'Template deleted successfully', deletedTemplate });
    }

    if (req.method === 'GET') {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM ai_model_templates WHERE id = $1', [templateId]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        return res.json(result.rows[0]);
      } finally {
        client.release();
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in template API:', error);
    return res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
}