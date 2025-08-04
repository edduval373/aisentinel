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
        // Delete company with proper cascade handling
        console.log(`🗑️ [DELETE] Starting deletion for company ID: ${companyId}`);
        
        // Check if company exists
        const existingQuery = 'SELECT id, name FROM companies WHERE id = $1';
        const existingResult = await client.query(existingQuery, [companyId]);
        
        if (existingResult.rows.length === 0) {
          return res.status(404).json({ error: 'Company not found' });
        }
        
        const companyName = existingResult.rows[0].name;
        console.log(`🗑️ [DELETE] Found company: "${companyName}" (ID: ${companyId})`);
        
        // Begin transaction for safe deletion
        await client.query('BEGIN');
        
        try {
          console.log(`🗑️ [DELETE] Starting comprehensive deletion for company "${companyName}" (ID: ${companyId})...`);
          
          // STEP 1: Delete all session-dependent data first
          console.log(`🗑️ [DELETE] STEP 1: Cleaning session-dependent data...`);
          
          // Delete chat messages that reference both session_id AND company_id
          const deleteMessagesByCompanyQuery = 'DELETE FROM chat_messages WHERE company_id = $1';
          const messagesByCompanyResult = await client.query(deleteMessagesByCompanyQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${messagesByCompanyResult.rowCount} chat messages by company`);
          
          // Delete chat attachments that reference both session_id AND company_id
          const deleteAttachmentsByCompanyQuery = 'DELETE FROM chat_attachments WHERE company_id = $1';
          const attachmentsByCompanyResult = await client.query(deleteAttachmentsByCompanyQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${attachmentsByCompanyResult.rowCount} chat attachments by company`);
          
          // STEP 2: Delete chat_sessions now that dependents are gone
          console.log(`🗑️ [DELETE] STEP 2: Deleting chat sessions...`);
          const deleteSessionsQuery = 'DELETE FROM chat_sessions WHERE company_id = $1';
          const sessionsResult = await client.query(deleteSessionsQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${sessionsResult.rowCount} chat sessions`);
          
          // STEP 3: Delete all other company-related data
          console.log(`🗑️ [DELETE] STEP 3: Deleting all other company-related data...`);
          
          // Delete user_activities
          const deleteActivitiesQuery = 'DELETE FROM user_activities WHERE company_id = $1';
          const activitiesResult = await client.query(deleteActivitiesQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${activitiesResult.rowCount} user activities`);
          
          // Delete user_sessions  
          const deleteUserSessionsQuery = 'DELETE FROM user_sessions WHERE company_id = $1';
          const userSessionsResult = await client.query(deleteUserSessionsQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${userSessionsResult.rowCount} user sessions`);
          
          // Delete trial_usage
          const deleteTrialUsageQuery = 'DELETE FROM trial_usage WHERE company_id = $1';
          const trialUsageResult = await client.query(deleteTrialUsageQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${trialUsageResult.rowCount} trial usage records`);
          
          // Delete permissions
          const deletePermissionsQuery = 'DELETE FROM permissions WHERE company_id = $1';
          const permissionsResult = await client.query(deletePermissionsQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${permissionsResult.rowCount} permissions`);
          
          // Delete company_api_keys
          const deleteApiKeysQuery = 'DELETE FROM company_api_keys WHERE company_id = $1';
          const apiKeysResult = await client.query(deleteApiKeysQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${apiKeysResult.rowCount} company API keys`);
          
          // Delete ai_models
          const deleteModelsQuery = 'DELETE FROM ai_models WHERE company_id = $1';
          const modelsResult = await client.query(deleteModelsQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${modelsResult.rowCount} AI models`);
          
          // Delete activity_types
          const deleteTypesQuery = 'DELETE FROM activity_types WHERE company_id = $1';
          const typesResult = await client.query(deleteTypesQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${typesResult.rowCount} activity types`);
          
          // Delete model_fusion_configs
          const deleteFusionQuery = 'DELETE FROM model_fusion_configs WHERE company_id = $1';
          const fusionResult = await client.query(deleteFusionQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${fusionResult.rowCount} model fusion configs`);
          
          // Delete company_employees
          const deleteEmployeesQuery = 'DELETE FROM company_employees WHERE company_id = $1';
          const employeesResult = await client.query(deleteEmployeesQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${employeesResult.rowCount} company employees`);
          
          // Delete company_roles
          const deleteRolesQuery = 'DELETE FROM company_roles WHERE company_id = $1';
          const rolesResult = await client.query(deleteRolesQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${rolesResult.rowCount} company roles`);
          
          // 4. Finally delete the company itself
          console.log(`🗑️ [DELETE] Deleting company "${companyName}" (ID: ${companyId})...`);
          const deleteCompanyQuery = 'DELETE FROM companies WHERE id = $1';
          const companyResult = await client.query(deleteCompanyQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted company: ${companyResult.rowCount} record`);
          
          // Commit transaction
          await client.query('COMMIT');
          console.log(`✅ [DELETE] Company "${companyName}" and all related data deleted successfully`);
          
          res.json({ 
            message: 'Company deleted successfully', 
            id: companyId, 
            name: companyName,
            deletedRecords: {
              chatMessages: messagesByCompanyResult.rowCount,
              chatAttachments: attachmentsByCompanyResult.rowCount,
              chatSessions: sessionsResult.rowCount,
              userActivities: activitiesResult.rowCount,
              userSessions: userSessionsResult.rowCount,
              trialUsage: trialUsageResult.rowCount,
              permissions: permissionsResult.rowCount,
              companyApiKeys: apiKeysResult.rowCount,
              aiModels: modelsResult.rowCount,
              activityTypes: typesResult.rowCount,
              modelFusionConfigs: fusionResult.rowCount,
              companyEmployees: employeesResult.rowCount,
              companyRoles: rolesResult.rowCount,
              company: companyResult.rowCount
            }
          });
          
        } catch (deleteError) {
          // Rollback transaction on error
          await client.query('ROLLBACK');
          console.error(`❌ [DELETE] Transaction rolled back due to error:`, deleteError);
          throw deleteError;
        }
        
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