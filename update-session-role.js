
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function updateSessionRoleLevel() {
  try {
    const sessionToken = 'alhGXAXICFWpV0kScb_CbBDvGJlVdGRpV3QJxSDy9KSJPDr5JnrOi7sjW4YEix7B';
    
    // Update the session role level
    await pool.query(
      'UPDATE user_sessions SET role_level = $1 WHERE session_token = $2',
      [1000, sessionToken]
    );
    
    // Also update the user record
    await pool.query(
      'UPDATE users SET role_level = $1, role = $2 WHERE email = $3',
      [1000, 'super-user', 'ed.duval15@gmail.com']
    );
    
    console.log('✅ Session and user role level updated to 1000');
    
    // Verify the update
    const session = await pool.query(
      'SELECT * FROM user_sessions WHERE session_token = $1',
      [sessionToken]
    );
    
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['ed.duval15@gmail.com']
    );
    
    console.log('Updated session:', session.rows[0]);
    console.log('Updated user:', user.rows[0]);
    
  } catch (error) {
    console.error('Error updating session:', error);
  } finally {
    await pool.end();
  }
}

updateSessionRoleLevel();
