// Increment version for AI Sentinel before deployment
import { Pool } from 'pg';

async function incrementVersion() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Get current version
    const currentResult = await pool.query('SELECT * FROM app_versions WHERE is_current_version = true ORDER BY id DESC LIMIT 1');
    
    if (currentResult.rows.length === 0) {
      console.log('❌ No current version found');
      return;
    }
    
    const current = currentResult.rows[0];
    console.log(`📋 Current version: v${current.version} - ${current.title}`);
    
    // Calculate next version (increment patch by default)
    const nextMajor = current.major_version;
    const nextMinor = current.minor_version;
    const nextPatch = current.patch_version + 1;
    const nextVersion = `${nextMajor}.${nextMinor}.${nextPatch}`;
    
    console.log(`🔄 Creating new version: v${nextVersion}`);
    
    // Unset current version flag
    await pool.query('UPDATE app_versions SET is_current_version = false WHERE is_current_version = true');
    
    // Create new version
    await pool.query(`
      INSERT INTO app_versions (major_version, minor_version, patch_version, version, title, is_current_version, release_date)
      VALUES ($1, $2, $3, $4, $5, true, NOW())
    `, [nextMajor, nextMinor, nextPatch, nextVersion, 'Version Display Enhancement']);
    
    console.log(`✅ Successfully incremented version to v${nextVersion}`);
    
  } catch (error) {
    console.error('❌ Error incrementing version:', error);
  } finally {
    await pool.end();
  }
}

incrementVersion();