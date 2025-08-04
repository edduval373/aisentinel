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
          // Delete related records in proper order to avoid foreign key violations
          
          // 1. Delete chat attachments first (they may reference chat_sessions)
          console.log(`🗑️ [DELETE] Deleting chat attachments for company ${companyId}...`);
          const deleteAttachmentsQuery = `
            DELETE FROM chat_attachments 
            WHERE session_id IN (
              SELECT id FROM chat_sessions WHERE company_id = $1
            )
          `;
          const attachmentsResult = await client.query(deleteAttachmentsQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${attachmentsResult.rowCount} chat attachments`);
          
          // 2. Delete chat messages (they reference chat_sessions)
          console.log(`🗑️ [DELETE] Deleting chat messages for company ${companyId}...`);
          const deleteMessagesQuery = `
            DELETE FROM chat_messages 
            WHERE session_id IN (
              SELECT id FROM chat_sessions WHERE company_id = $1
            )
          `;
          const messagesResult = await client.query(deleteMessagesQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${messagesResult.rowCount} chat messages`);
          
          // 3. Delete chat sessions
          console.log(`🗑️ [DELETE] Deleting chat sessions for company ${companyId}...`);
          const deleteSessionsQuery = 'DELETE FROM chat_sessions WHERE company_id = $1';
          const sessionsResult = await client.query(deleteSessionsQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${sessionsResult.rowCount} chat sessions`);
          
          // 4. Delete user activities
          console.log(`🗑️ [DELETE] Deleting user activities for company ${companyId}...`);
          const deleteActivitiesQuery = 'DELETE FROM user_activities WHERE company_id = $1';
          const activitiesResult = await client.query(deleteActivitiesQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${activitiesResult.rowCount} user activities`);
          
          // 5. Delete company API keys
          console.log(`🗑️ [DELETE] Deleting company API keys for company ${companyId}...`);
          const deleteApiKeysQuery = 'DELETE FROM company_api_keys WHERE company_id = $1';
          const apiKeysResult = await client.query(deleteApiKeysQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${apiKeysResult.rowCount} company API keys`);
          
          // 6. Delete AI models
          console.log(`🗑️ [DELETE] Deleting AI models for company ${companyId}...`);
          const deleteModelsQuery = 'DELETE FROM ai_models WHERE company_id = $1';
          const modelsResult = await client.query(deleteModelsQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${modelsResult.rowCount} AI models`);
          
          // 7. Delete activity types
          console.log(`🗑️ [DELETE] Deleting activity types for company ${companyId}...`);
          const deleteTypesQuery = 'DELETE FROM activity_types WHERE company_id = $1';
          const typesResult = await client.query(deleteTypesQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${typesResult.rowCount} activity types`);
          
          // 8. Delete model fusion configs
          console.log(`🗑️ [DELETE] Deleting model fusion configs for company ${companyId}...`);
          const deleteFusionQuery = 'DELETE FROM model_fusion_configs WHERE company_id = $1';
          const fusionResult = await client.query(deleteFusionQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${fusionResult.rowCount} model fusion configs`);
          
          // 9. Delete company employees
          console.log(`🗑️ [DELETE] Deleting company employees for company ${companyId}...`);
          const deleteEmployeesQuery = 'DELETE FROM company_employees WHERE company_id = $1';
          const employeesResult = await client.query(deleteEmployeesQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${employeesResult.rowCount} company employees`);
          
          // 10. Delete company roles
          console.log(`🗑️ [DELETE] Deleting company roles for company ${companyId}...`);
          const deleteRolesQuery = 'DELETE FROM company_roles WHERE company_id = $1';
          const rolesResult = await client.query(deleteRolesQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${rolesResult.rowCount} company roles`);
          
          // 11. Finally delete the company itself
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
              chatAttachments: attachmentsResult.rowCount,
              chatMessages: messagesResult.rowCount,
              chatSessions: sessionsResult.rowCount,
              userActivities: activitiesResult.rowCount,
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