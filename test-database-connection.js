// Database connection test for production
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  console.log('🔧 [DB TEST] Starting database connection test...');
  console.log('🔧 [DB TEST] Environment:', process.env.NODE_ENV);
  console.log('🔧 [DB TEST] DATABASE_URL present:', !!process.env.DATABASE_URL);

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      success: false,
      error: 'DATABASE_URL environment variable not configured',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    console.log('🔧 [DB TEST] Attempting connection...');
    await client.connect();
    console.log('🔧 [DB TEST] Connection successful!');

    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('🔧 [DB TEST] Test query successful');

    // Check if required tables exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_sessions', 'companies')
    `);

    const tables = tableCheck.rows.map(row => row.table_name);
    console.log('🔧 [DB TEST] Found tables:', tables);

    await client.end();
    console.log('🔧 [DB TEST] Connection closed successfully');

    return res.status(200).json({
      success: true,
      database: {
        connected: true,
        currentTime: result.rows[0].current_time,
        version: result.rows[0].db_version,
        tablesFound: tables,
        requiredTables: ['users', 'user_sessions', 'companies'],
        missingTables: ['users', 'user_sessions', 'companies'].filter(t => !tables.includes(t))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔧 [DB TEST] Database connection failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString()
    });
  }
}