// SECURE SESSION CREATION ENDPOINT
// Creates valid session tokens in Railway database for secure authentication
// Used to migrate from localStorage to secure cookie-based auth

const { db } = require('../../server/db.ts');
const { userSessions, users, companies } = require('../../shared/schema.ts');
const { eq } = require('drizzle-orm');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔐 [SESSION CREATE] Creating secure session...');
    
    const { email, sessionToken, roleLevel = 1000, companyName = 'Duval Solutions' } = req.body;
    
    if (!email || !sessionToken) {
      return res.status(400).json({ error: 'Email and session token required' });
    }

    console.log('🔐 [SESSION CREATE] Parameters:', { email, sessionToken: sessionToken.substring(0, 20) + '...', roleLevel });

    // Create or get user
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      console.log('🔐 [SESSION CREATE] Creating new user:', email);
      
      // Create company first if needed
      let company = await db
        .select()
        .from(companies)
        .where(eq(companies.name, companyName))
        .limit(1);

      let companyId;
      if (company.length === 0) {
        console.log('🔐 [SESSION CREATE] Creating new company:', companyName);
        const newCompany = await db
          .insert(companies)
          .values({
            name: companyName,
            primaryAdminEmail: email,
            isActive: true
          })
          .returning();
        companyId = newCompany[0].id;
      } else {
        companyId = company[0].id;
      }

      // Create user
      const newUser = await db
        .insert(users)
        .values({
          email: email,
          firstName: email.split('@')[0],
          lastName: 'User',
          role: roleLevel >= 1000 ? 'super-user' : roleLevel >= 999 ? 'owner' : 'admin',
          roleLevel: roleLevel,
          companyId: companyId,
          isActive: true,
          emailVerified: true
        })
        .returning();
      
      user = newUser;
      console.log('🔐 [SESSION CREATE] User created with ID:', user[0].id);
    } else {
      user = user[0];
      console.log('🔐 [SESSION CREATE] Existing user found with ID:', user.id);
    }

    // Check if session already exists
    const existingSession = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken))
      .limit(1);

    if (existingSession.length > 0) {
      console.log('🔐 [SESSION CREATE] Session already exists, updating...');
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const updatedSession = await db
        .update(userSessions)
        .set({
          lastAccessedAt: new Date(),
          expiresAt: expiresAt
        })
        .where(eq(userSessions.sessionToken, sessionToken))
        .returning();

      console.log('✅ [SESSION CREATE] Session updated successfully');
      
      return res.status(200).json({
        success: true,
        message: 'Session updated successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          roleLevel: user.roleLevel
        }
      });
    }

    // Create new session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const newSession = await db
      .insert(userSessions)
      .values({
        userId: user.id,
        sessionToken: sessionToken,
        email: email,
        companyId: user.companyId,
        roleLevel: user.roleLevel,
        expiresAt: expiresAt,
        lastAccessedAt: new Date()
      })
      .returning();

    console.log('✅ [SESSION CREATE] Session created successfully with ID:', newSession[0].id);

    // Set secure cookie
    const isProduction = req.headers.host?.includes('aisentinel.app');
    const cookieSettings = isProduction 
      ? `sessionToken=${sessionToken}; Path=/; Expires=${expiresAt.toUTCString()}; Secure; HttpOnly; SameSite=Strict`
      : `sessionToken=${sessionToken}; Path=/; Expires=${expiresAt.toUTCString()}; HttpOnly; SameSite=Lax`;
    
    res.setHeader('Set-Cookie', cookieSettings);
    console.log('🔐 [SESSION CREATE] Secure cookie set');

    return res.status(201).json({
      success: true,
      message: 'Secure session created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        roleLevel: user.roleLevel,
        companyId: user.companyId
      },
      session: {
        id: newSession[0].id,
        expiresAt: expiresAt
      }
    });

  } catch (error) {
    console.error('❌ [SESSION CREATE] Failed to create session:', error);
    return res.status(500).json({ 
      error: 'Failed to create session',
      details: error.message
    });
  }
}