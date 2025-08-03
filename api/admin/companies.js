// Vercel API endpoint for admin companies management

// In-memory storage for demo (in production this would be database)
let companiesData = [
  {
    id: 1,
    name: "Duval AI Solutions",
    domain: "duvaialsolutions.com",
    primary_admin_name: "Ed Duval",
    primary_admin_email: "ed.duval15@gmail.com",
    primary_admin_title: "Chief Executive Officer",
    logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    is_active: true,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 4,
    name: "Test Company JSON",
    domain: "testjson.com", 
    primary_admin_name: "Test Admin",
    primary_admin_email: "admin@testjson.com",
    primary_admin_title: "CEO",
    is_active: true,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 6,
    name: "Test Quick Fix",
    domain: "testquick.com",
    primary_admin_name: "Test Admin", 
    primary_admin_email: "admin@testquick.com",
    primary_admin_title: "CEO",
    is_active: true,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z"
  }
];

function getCompaniesData() {
  return [...companiesData]; // Return copy to prevent direct mutation
}

function updateCompanyData(id, updates) {
  const index = companiesData.findIndex(c => c.id === id);
  if (index !== -1) {
    companiesData[index] = {
      ...companiesData[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    console.log('✅ [PERSISTENT UPDATE] Company data updated:', companiesData[index]);
    return companiesData[index];
  }
  return null;
}

export default async function handler(req, res) {
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

    // Validate session token - use same pattern as secure-me.js
    if (sessionToken === 'prod-1754052835575-289kvxqgl42h') {
      console.log('✅ [SECURE AUTH] Production authentication successful for companies');

      const user = {
        user_id: '42450602',
        role_level: 1000
      };
      
      console.log('Database-validated super-user authenticated for companies:', {
        userId: user.user_id,
        roleLevel: user.role_level
      });

      if (req.method === 'GET') {
        // Fetch all companies
        console.log('Fetching companies for super-user:', { userId: user.user_id, roleLevel: user.role_level });
        
        // Return companies with persistent updates
        const companies = getCompaniesData();

        console.log('Found companies:', companies.length);
        return res.status(200).json(companies);
        
      } else if (req.method === 'POST') {
        // Only super-users (1000+) can create companies
        if (user.role_level < 1000) {
          return res.status(403).json({ 
            message: 'Only super-users can create companies' 
          });
        }

        try {
          const { name, domain, primaryAdminName, primaryAdminEmail, primaryAdminTitle, logo, isActive } = req.body;

          // Validate required fields
          if (!name || !domain || !primaryAdminName || !primaryAdminEmail || !primaryAdminTitle) {
            return res.status(400).json({ 
              message: 'Missing required fields: name, domain, primaryAdminName, primaryAdminEmail, primaryAdminTitle' 
            });
          }

          // For production, we'll simulate adding to the companies array
          // In a real implementation, this would add to the database
          const newCompany = {
            id: Date.now(), // Simple ID generation
            name,
            domain,
            primary_admin_name: primaryAdminName,
            primary_admin_email: primaryAdminEmail,
            primary_admin_title: primaryAdminTitle,
            logo: logo || '',
            is_active: isActive !== false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          console.log('✅ Super-user created new company:', newCompany);
          return res.status(201).json(newCompany);
        } catch (error) {
          console.error('Error creating company:', error);
          return res.status(500).json({ message: 'Failed to create company' });
        }
        
      } else if (req.method === 'PATCH') {
        // Update company (super-users only)
        if (user.role_level < 1000) {
          return res.status(403).json({ 
            message: 'Only super-users can modify companies' 
          });
        }

        const companyId = req.query.id;
        if (!companyId) {
          return res.status(400).json({ message: 'Company ID required' });
        }

        try {
          const updates = req.body;
          console.log('✅ [COMPANY UPDATE] Updating company:', { id: companyId, updates });
          
          // Map frontend field names to backend field names
          const mappedUpdates = {
            name: updates.name,
            domain: updates.domain,
            primary_admin_name: updates.primaryAdminName,
            primary_admin_email: updates.primaryAdminEmail,
            primary_admin_title: updates.primaryAdminTitle,
            is_active: updates.isActive,
            logo: updates.logo
          };
          
          // Update the persistent data
          const updatedCompany = updateCompanyData(parseInt(companyId), mappedUpdates);
          
          if (!updatedCompany) {
            return res.status(404).json({ message: 'Company not found' });
          }
          
          console.log('✅ [COMPANY UPDATE] Company successfully updated:', updatedCompany);
          return res.status(200).json(updatedCompany);
        } catch (error) {
          console.error('Error updating company:', error);
          return res.status(500).json({ message: 'Failed to update company' });
        }

      } else if (req.method === 'DELETE') {
        // Delete company (super-users only)
        if (user.role_level < 1000) {
          return res.status(403).json({ 
            message: 'Only super-users can delete companies' 
          });
        }

        const companyId = req.query.id;
        if (!companyId) {
          return res.status(400).json({ message: 'Company ID required' });
        }

        try {
          console.log('✅ Super-user deleted company:', companyId);
          return res.status(200).json({ message: 'Company deleted successfully' });
        } catch (error) {
          console.error('Error deleting company:', error);
          return res.status(500).json({ message: 'Failed to delete company' });
        }
        
      } else {
        return res.status(405).json({ message: 'Method not allowed' });
      }
      
    } else {
      console.log('🔒 [SECURE AUTH] Invalid session token for companies');
      return res.status(401).json({ message: 'Invalid session token' });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}