// Initialize version data for AI Sentinel  
import { Pool } from 'pg';

async function initVersionData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Create app_versions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_versions (
        id SERIAL PRIMARY KEY,
        major_version INTEGER NOT NULL DEFAULT 1,
        minor_version INTEGER NOT NULL DEFAULT 0,
        patch_version INTEGER NOT NULL DEFAULT 0,
        version VARCHAR(20) NOT NULL,
        title VARCHAR(255),
        is_current_version BOOLEAN DEFAULT false,
        release_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Check if we have any versions
    const result = await pool.query('SELECT COUNT(*) FROM app_versions');
    const count = parseInt(result.rows[0].count);
    
    if (count === 0) {
      // Insert initial version
      await pool.query(`
        INSERT INTO app_versions (major_version, minor_version, patch_version, version, title, is_current_version, release_date)
        VALUES (1, 0, 0, '1.0.0', 'AI Sentinel Launch', true, NOW())
      `);
      console.log('✅ Initial version data created successfully');
    } else {
      console.log(`ℹ️  Version data already exists (${count} versions)`);
    }
    
  } catch (error) {
    console.error('❌ Error initializing version data:', error);
  } finally {
    await pool.end();
  }
}

initVersionData();