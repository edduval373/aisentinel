// Vercel API endpoint for current company
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, Cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Try to get authentication info (optional for this endpoint)
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'] || 
                        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

    let user = null;
    if (sessionToken) {
      try {
        // Query the database to validate the session
        const [session] = await db
          .select()
          .from(schema.userSessions)
          .where(eq(schema.userSessions.sessionToken, sessionToken))
          .limit(1);

        if (session) {
          // Get user details
          const [userData] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, session.userId))
            .limit(1);

          if (userData) {
            user = userData;
            console.log('Authenticated user requesting current company:', user.id);
          }
        }
      } catch (authError) {
        console.log('Optional auth failed, proceeding with demo mode:', authError.message);
      }
    }

    // If authenticated user with company
    if (user && user.companyId) {
      const [company] = await db
        .select()
        .from(schema.companies)
        .where(eq(schema.companies.id, user.companyId))
        .limit(1);

      if (company) {
        console.log('Returning user company:', company.name, 'ID:', company.id);
        return res.status(200).json(company);
      }
    }

    // Default to demo company (ID 1)
    console.log('Demo mode: Returning company ID 1');
    const [demoCompany] = await db
      .select()
      .from(schema.companies)
      .where(eq(schema.companies.id, 1))
      .limit(1);

    if (demoCompany) {
      console.log('Returning demo company:', demoCompany.name, 'ID:', demoCompany.id);
      return res.status(200).json(demoCompany);
    }

    console.log('No companies found in database');
    return res.status(404).json({ message: 'No company found' });
    
  } catch (error) {
    console.error('Error fetching current company:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch company',
      error: error.message 
    });
  }
}