// Vercel API endpoint for chat sessions
import { Pool } from 'pg';

// Database connection using Railway PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function getUserChatSessionsFromDB(userId, companyId) {
  const client = await pool.connect();
  try {
    // Get chat sessions for the user
    const sessionsQuery = `
      SELECT * FROM chat_sessions 
      WHERE user_id = $1 AND company_id = $2 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    const sessionsResult = await client.query(sessionsQuery, [userId, companyId]);
    
    // Get message count and last message for each session
    const sessionsWithDetails = await Promise.all(sessionsResult.rows.map(async (session) => {
      const messagesQuery = `
        SELECT message, timestamp FROM chat_messages 
        WHERE session_id = $1 AND company_id = $2 
        ORDER BY timestamp DESC
      `;
      const messagesResult = await client.query(messagesQuery, [session.id, companyId]);
      
      const messageCount = messagesResult.rows.length;
      const lastMessage = messagesResult.rows.length > 0 
        ? messagesResult.rows[0].message.substring(0, 50) + (messagesResult.rows[0].message.length > 50 ? '...' : '')
        : undefined;
      
      return {
        ...session,
        messageCount,
        lastMessage
      };
    }));
    
    return sessionsWithDetails;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication using Bearer token from localStorage
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    console.log('❌ No authorization token provided');
    return res.status(401).json({ error: 'Authentication required' });
  }

  console.log('🔍 GET /api/chat/sessions - Processing request with token:', token.substring(0, 20) + '...');

  try {
    // Verify token and get user info from user sessions table
    const client = await pool.connect();
    
    try {
      const sessionQuery = `
        SELECT user_id, company_id, email, role_level 
        FROM user_sessions 
        WHERE session_token = $1 AND expires_at > NOW()
      `;
      const sessionResult = await client.query(sessionQuery, [token]);
      
      if (sessionResult.rows.length === 0) {
        console.log('❌ Invalid or expired session token');
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      
      const user = sessionResult.rows[0];
      console.log('✅ Authenticated user:', user.user_id, user.email);
      
      // Fetch chat sessions from Railway PostgreSQL database
      const sessions = await getUserChatSessionsFromDB(user.user_id, user.company_id);
      console.log('📊 Retrieved chat sessions from database:', sessions.length);
      
      res.json(sessions);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error fetching chat sessions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chat sessions',
      message: error.message 
    });
  }
}