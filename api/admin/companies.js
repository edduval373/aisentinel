// Vercel API endpoint for admin companies management
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Helper function to validate super-user authentication
async function validateSuperUser(req) {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'] || 
                        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

    if (!sessionToken) {
      return { error: 'No authentication token provided', status: 401 };
    }

    // Query the database to validate the session
    const [session] = await db
      .select()
      .from(schema.userSessions)
      .where(eq(schema.userSessions.sessionToken, sessionToken))
      .limit(1);

    if (!session) {
      return { error: 'Invalid session token', status: 401 };
    }

    // Get user details
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    // Check if user is super-user (role level 1000)
    if (user.roleLevel < 1000) {
      return { error: 'Super-user access required', status: 403 };
    }

    return { user, session };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, Cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Validate authentication for all methods
    const authResult = await validateSuperUser(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ message: authResult.error });
    }

    const { user } = authResult;

    if (req.method === 'GET') {
      // Fetch all companies
      console.log('Fetching companies for super-user:', { userId: user.id, roleLevel: user.roleLevel });
      
      const companies = await db
        .select()
        .from(schema.companies)
        .orderBy(schema.companies.name);

      console.log('Found companies:', companies.length);
      return res.status(200).json(companies);
      
    } else if (req.method === 'POST') {
      // Create new company
      console.log('Creating company:', { userId: user.id, roleLevel: user.roleLevel });
      
      const companyData = req.body;
      
      const [newCompany] = await db
        .insert(schema.companies)
        .values(companyData)
        .returning();

      console.log('Company created successfully:', newCompany);
      return res.status(201).json(newCompany);
      
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}