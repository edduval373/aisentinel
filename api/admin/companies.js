const { Pool } = require('pg');

// Create database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, Cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get authentication token
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'] || 
                        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

    if (!sessionToken) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    // Validate session token against database
    const sessionQuery = `
      SELECT us.*, u.role_level, u.id as user_id
      FROM user_sessions us 
      JOIN users u ON us.user_id = u.id 
      WHERE us.session_token = $1 
      AND us.expires_at > NOW()
      LIMIT 1
    `;
    
    const sessionResult = await pool.query(sessionQuery, [sessionToken]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired session token' });
    }

    const user = sessionResult.rows[0];

    // Check if user is super-user (role level 1000+)
    if (user.role_level < 1000) {
      console.log('Company access denied - insufficient permissions:', { 
        userId: user.user_id, 
        roleLevel: user.role_level 
      });
      return res.status(403).json({ message: 'Super-user access required' });
    }

    console.log('✅ [SECURE AUTH] Database-validated super-user authenticated for companies:', {
      userId: user.user_id,
      roleLevel: user.role_level
    });

    if (req.method === 'GET') {
      // Fetch all companies
      console.log('Fetching companies for super-user:', { userId: user.user_id, roleLevel: user.role_level });
      
      const companiesQuery = 'SELECT * FROM companies ORDER BY name';
      const companiesResult = await pool.query(companiesQuery);

      console.log('Found companies:', companiesResult.rows.length);
      return res.status(200).json(companiesResult.rows);
      
    } else if (req.method === 'POST') {
      // Create new company
      console.log('Creating company:', { userId: user.user_id, roleLevel: user.role_level });
      
      const companyData = req.body;
      
      const insertQuery = `
        INSERT INTO companies (name, domain, primary_admin_name, primary_admin_email, primary_admin_title, logo, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        companyData.name,
        companyData.domain,
        companyData.primaryAdminName,
        companyData.primaryAdminEmail,
        companyData.primaryAdminTitle,
        companyData.logo,
        companyData.isActive !== undefined ? companyData.isActive : true
      ];
      
      const result = await pool.query(insertQuery, values);
      const newCompany = result.rows[0];

      console.log('Company created successfully:', newCompany);
      return res.status(201).json(newCompany);
      
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};