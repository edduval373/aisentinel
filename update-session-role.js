
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function updateSessionRoleLevel() {
  try {
    const sessionToken = 'alhGXAXICFWpV0kScb_CbBDvGJlVdGRpV3QJxSDy9KSJPDr5JnrOi7sjW4YEix7B';
    
    console.log('🔍 BEFORE UPDATE - Checking current values...');
    
    // Check current session
    const currentSession = await pool.query(
      'SELECT * FROM user_sessions WHERE session_token = $1',
      [sessionToken]
    );
    console.log('Current session:', currentSession.rows[0]);
    
    // Check current user
    const currentUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['ed.duval15@gmail.com']
    );
    console.log('Current user:', currentUser.rows[0]);
    
    console.log('🔄 UPDATING - Setting role level to 1000...');
    
    // Update the session role level to 1000 (super-user)
    await pool.query(
      'UPDATE user_sessions SET role_level = $1 WHERE session_token = $2',
      [1000, sessionToken]
    );
    
    // Also update the user record to 1000 (super-user)
    await pool.query(
      'UPDATE users SET role_level = $1, role = $2 WHERE email = $3',
      [1000, 'super-user', 'ed.duval15@gmail.com']
    );
    
    console.log('✅ AFTER UPDATE - Verifying changes...');
    
    // Verify the update
    const updatedSession = await pool.query(
      'SELECT * FROM user_sessions WHERE session_token = $1',
      [sessionToken]
    );
    
    const updatedUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['ed.duval15@gmail.com']
    );
    
    console.log('Updated session role_level:', updatedSession.rows[0]?.role_level);
    console.log('Updated user role_level:', updatedUser.rows[0]?.role_level);
    console.log('Updated user role:', updatedUser.rows[0]?.role);
    
    console.log('🎉 Database updated successfully! Role level is now 1000.');
    
  } catch (error) {
    console.error('❌ Error updating session:', error);
  } finally {
    await pool.end();
  }
}

updateSessionRoleLevel();
