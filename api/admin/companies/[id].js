// Vercel API endpoint for individual company operations (PUT, DELETE)
import { Pool } from 'pg';

// Database connection using Railway PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication using Bearer token
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Extract company ID from URL path
  const { id } = req.query;
  const companyId = parseInt(id);

  if (!companyId || isNaN(companyId)) {
    return res.status(400).json({ error: 'Invalid company ID' });
  }

  try {
    const client = await pool.connect();
    
    try {
      // Verify session token
      const sessionQuery = `
        SELECT user_id, company_id, email, role_level 
        FROM user_sessions 
        WHERE session_token = $1 AND expires_at > NOW()
      `;
      const sessionResult = await client.query(sessionQuery, [token]);
      
      if (sessionResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      
      const user = sessionResult.rows[0];
      
      // Check if user has super-user permissions (1000+)
      if (user.role_level < 1000) {
        return res.status(403).json({ error: 'Insufficient permissions - Super-user access required' });
      }

      if (req.method === 'PUT') {
        // Update company
        const { name, domain, primaryAdminName, primaryAdminEmail, primaryAdminTitle, logo, isActive } = req.body;
        
        console.log(`🔄 PUT /api/admin/companies/${companyId} - Updating company with data:`, req.body);
        
        // Check if company exists
        const existingQuery = 'SELECT id FROM companies WHERE id = $1';
        const existingResult = await client.query(existingQuery, [companyId]);
        
        if (existingResult.rows.length === 0) {
          return res.status(404).json({ error: 'Company not found' });
        }
        
        // Update company
        const updateQuery = `
          UPDATE companies 
          SET name = $1, domain = $2, primary_admin_name = $3, primary_admin_email = $4, 
              primary_admin_title = $5, logo = $6, is_active = $7, updated_at = NOW()
          WHERE id = $8
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
          name, domain, primaryAdminName, primaryAdminEmail, 
          primaryAdminTitle, logo, isActive, companyId
        ]);
        
        console.log('✅ Company updated successfully:', updateResult.rows[0]);
        res.json(updateResult.rows[0]);
        
      } else if (req.method === 'DELETE') {
        // Delete company
        console.log(`🗑️ DELETE /api/admin/companies/${companyId} - Deleting company`);
        
        // Check if company exists
        const existingQuery = 'SELECT id, name FROM companies WHERE id = $1';
        const existingResult = await client.query(existingQuery, [companyId]);
        
        if (existingResult.rows.length === 0) {
          return res.status(404).json({ error: 'Company not found' });
        }
        
        const companyName = existingResult.rows[0].name;
        
        // Delete company (cascading will handle related records)
        const deleteQuery = 'DELETE FROM companies WHERE id = $1';
        await client.query(deleteQuery, [companyId]);
        
        console.log(`✅ Company "${companyName}" deleted successfully`);
        res.json({ message: 'Company deleted successfully', id: companyId, name: companyName });
        
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Company operation error:', error);
    res.status(500).json({ 
      error: 'Database operation failed',
      message: error.message 
    });
  }
}