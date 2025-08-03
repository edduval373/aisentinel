const { Pool } = require('pg');

// Create database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, Cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get authentication token (optional for this endpoint)
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'] || 
                        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

    let user = null;
    if (sessionToken) {
      try {
        // Validate session token against database
        const sessionQuery = `
          SELECT us.*, u.company_id, u.id as user_id
          FROM user_sessions us 
          JOIN users u ON us.user_id = u.id 
          WHERE us.session_token = $1 
          AND us.expires_at > NOW()
          LIMIT 1
        `;
        
        const result = await pool.query(sessionQuery, [sessionToken]);
        
        if (result.rows.length > 0) {
          user = result.rows[0];
          console.log('✅ [SECURE AUTH] Database-validated user requesting current company:', user.user_id);
        }
      } catch (authError) {
        console.log('Optional auth failed, proceeding with demo mode:', authError.message);
      }
    }

    // If authenticated user with company
    if (user && user.company_id) {
      const companyQuery = 'SELECT * FROM companies WHERE id = $1 LIMIT 1';
      const companyResult = await pool.query(companyQuery, [user.company_id]);

      if (companyResult.rows.length > 0) {
        const company = companyResult.rows[0];
        console.log('Returning user company:', company.name, 'ID:', company.id);
        return res.status(200).json(company);
      }
    }

    // Default to demo company (ID 1)
    console.log('Demo mode: Returning company ID 1');
    const demoQuery = 'SELECT * FROM companies WHERE id = 1 LIMIT 1';
    const demoResult = await pool.query(demoQuery);

    if (demoResult.rows.length > 0) {
      const demoCompany = demoResult.rows[0];
      console.log('Returning demo company:', demoCompany.name, 'ID:', demoCompany.id);
      return res.status(200).json(demoCompany);
    }

    console.log('No companies found in database');
    return res.status(404).json({ message: 'No company found' });
    
  } catch (error) {
    console.error('Error fetching current company:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch company',
      error: error.message 
    });
  }
};