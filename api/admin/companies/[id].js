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
          console.log(`🗑️ [DELETE] Starting comprehensive deletion for company ${companyId}...`);
          
          // First, let's find all chat_sessions for this company
          const findSessionsQuery = 'SELECT id FROM chat_sessions WHERE company_id = $1';
          const sessionsToDelete = await client.query(findSessionsQuery, [companyId]);
          console.log(`🔍 [DELETE] Found ${sessionsToDelete.rowCount} chat sessions to delete`);
          
          // 1. Delete everything that references chat_sessions first
          if (sessionsToDelete.rowCount > 0) {
            const sessionIds = sessionsToDelete.rows.map(row => row.id);
            
            // Delete chat attachments
            console.log(`🗑️ [DELETE] Deleting chat attachments for sessions...`);
            const deleteAttachmentsQuery = `DELETE FROM chat_attachments WHERE session_id = ANY($1)`;
            const attachmentsResult = await client.query(deleteAttachmentsQuery, [sessionIds]);
            console.log(`✅ [DELETE] Deleted ${attachmentsResult.rowCount} chat attachments`);
            
            // Delete chat messages  
            console.log(`🗑️ [DELETE] Deleting chat messages for sessions...`);
            const deleteMessagesQuery = `DELETE FROM chat_messages WHERE session_id = ANY($1)`;
            const messagesResult = await client.query(deleteMessagesQuery, [sessionIds]);
            console.log(`✅ [DELETE] Deleted ${messagesResult.rowCount} chat messages`);
            
            // Delete any other tables that might reference session_id
            console.log(`🗑️ [DELETE] Deleting session-related data...`);
            
            // Check for session_logs table
            try {
              const deleteSessionLogsQuery = `DELETE FROM session_logs WHERE session_id = ANY($1)`;
              const sessionLogsResult = await client.query(deleteSessionLogsQuery, [sessionIds]);
              console.log(`✅ [DELETE] Deleted ${sessionLogsResult.rowCount} session logs`);
            } catch (err) {
              console.log(`ℹ️ [DELETE] session_logs table doesn't exist or has no records`);
            }
            
            // Check for session_analytics table
            try {
              const deleteSessionAnalyticsQuery = `DELETE FROM session_analytics WHERE session_id = ANY($1)`;
              const sessionAnalyticsResult = await client.query(deleteSessionAnalyticsQuery, [sessionIds]);
              console.log(`✅ [DELETE] Deleted ${sessionAnalyticsResult.rowCount} session analytics`);
            } catch (err) {
              console.log(`ℹ️ [DELETE] session_analytics table doesn't exist or has no records`);
            }
          }
          
          // 2. Now delete all chat_sessions for this company  
          console.log(`🗑️ [DELETE] Deleting chat sessions for company ${companyId}...`);
          const deleteSessionsQuery = 'DELETE FROM chat_sessions WHERE company_id = $1';
          const sessionsResult = await client.query(deleteSessionsQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${sessionsResult.rowCount} chat sessions`);
          
          // 3. Delete all other tables that reference companies directly
          console.log(`🗑️ [DELETE] Deleting all company-related data...`);
          
          // Delete chat_messages that reference company_id directly
          const deleteChatMessagesQuery = 'DELETE FROM chat_messages WHERE company_id = $1';
          const chatMessagesResult = await client.query(deleteChatMessagesQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${chatMessagesResult.rowCount} chat messages (direct reference)`);
          
          // Delete chat_attachments that reference company_id directly  
          const deleteChatAttachmentsDirectQuery = 'DELETE FROM chat_attachments WHERE company_id = $1';
          const chatAttachmentsDirectResult = await client.query(deleteChatAttachmentsDirectQuery, [companyId]);
          console.log(`✅ [DELETE] Deleted ${chatAttachmentsDirectResult.rowCount} chat attachments (direct reference)`);
          
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
              sessionBasedAttachments: sessionsToDelete.rowCount > 0 ? (attachmentsResult?.rowCount || 0) : 0,
              sessionBasedMessages: sessionsToDelete.rowCount > 0 ? (messagesResult?.rowCount || 0) : 0,
              chatSessions: sessionsResult.rowCount,
              directChatMessages: chatMessagesResult.rowCount,
              directChatAttachments: chatAttachmentsDirectResult.rowCount,
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