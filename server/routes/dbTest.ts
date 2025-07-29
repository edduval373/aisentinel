
import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

// Test database connectivity and show real data
router.get('/api/db-test', async (req, res) => {
  try {
    console.log('=== DATABASE CONNECTION TEST ===');
    
    // Test 1: Basic connectivity
    const connectTest = await db.execute(sql`SELECT NOW() as current_time, version() as postgres_version`);
    console.log('✅ Database connected:', connectTest[0]);
    
    // Test 2: Show actual data counts
    const companiesCount = await db.execute(sql`SELECT COUNT(*) as count FROM companies`);
    const usersCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const sessionsCount = await db.execute(sql`SELECT COUNT(*) as count FROM chat_sessions`);
    const modelsCount = await db.execute(sql`SELECT COUNT(*) as count FROM ai_models`);
    
    // Test 3: Show recent activity
    const recentSessions = await db.execute(sql`
      SELECT id, user_id, company_id, created_at 
      FROM chat_sessions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    const response = {
      success: true,
      connection: {
        database_url_configured: !!process.env.DATABASE_URL,
        database_url_preview: process.env.DATABASE_URL?.substring(0, 50) + '...',
        connected_at: connectTest[0]?.current_time,
        postgres_version: connectTest[0]?.postgres_version
      },
      data_counts: {
        companies: parseInt(companiesCount[0]?.count as string),
        users: parseInt(usersCount[0]?.count as string),
        chat_sessions: parseInt(sessionsCount[0]?.count as string),
        ai_models: parseInt(modelsCount[0]?.count as string)
      },
      recent_sessions: recentSessions,
      verification: 'This is REAL data from Railway PostgreSQL - not fallback!'
    };
    
    console.log('Database test results:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      verification: 'Database connection failed - this would show fallback data'
    });
  }
});

export default router;
