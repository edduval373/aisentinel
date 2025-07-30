
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function clearProductionSession() {
  try {
    // Get session token from environment or command line args for security
    const sessionToken = process.env.SESSION_TOKEN || process.argv[2];
    
    if (!sessionToken) {
      console.error('❌ No session token provided. Use: node clear-session.js <session_token>');
      return;
    }
    
    console.log('🗑️ CLEARING PRODUCTION SESSION');
    console.log('Session token:', sessionToken.substring(0, 20) + '...');
    
    // Delete the session
    const deleteResult = await pool.query(
      'DELETE FROM user_sessions WHERE session_token = $1 RETURNING *',
      [sessionToken]
    );
    
    if (deleteResult.rows.length > 0) {
      console.log('✅ Session deleted successfully:', deleteResult.rows[0]);
    } else {
      console.log('⚠️ No session found with that token');
    }
    
    // Show current user state
    const user = await pool.query(
      'SELECT id, email, role_level, role, company_id FROM users WHERE email = $1',
      ['ed.duval15@gmail.com']
    );
    
    console.log('📊 Current user state:', user.rows[0]);
    
    // Show all sessions for this user
    const userSessions = await pool.query(
      'SELECT session_token, role_level, created_at, expires_at FROM user_sessions WHERE email = $1',
      ['ed.duval15@gmail.com']
    );
    
    console.log('📋 Remaining sessions for user:', userSessions.rows);
    
  } catch (error) {
    console.error('❌ Error clearing session:', error);
  } finally {
    await pool.end();
  }
}

clearProductionSession();
