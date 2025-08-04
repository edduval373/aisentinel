// Vercel serverless function for dev-login endpoint
export default async function handler(req, res) {
  // Import storage dynamically for Vercel compatibility
  let storage;
  try {
    const storageModule = await import('../../server/storage.js');
    storage = storageModule.storage;
  } catch (error) {
    console.error('Failed to import storage:', error);
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Define test accounts with their properties
    const testAccounts = {
      'ed.duval15@gmail.com': { 
        roleLevel: 1000, 
        role: 'super-user', 
        firstName: 'Ed', 
        lastName: 'Duval',
        companyId: 1 
      },
      'ed.duval+test3@gmail.com': { 
        roleLevel: 99, 
        role: 'owner', 
        firstName: 'Ed', 
        lastName: 'Duval (Owner)',
        companyId: 1 
      },
      'ed.duval+test4@gmail.com': { 
        roleLevel: 98, 
        role: 'administrator', 
        firstName: 'Ed', 
        lastName: 'Duval (Admin)',
        companyId: 1 
      },
      'ed.duval+test2@gmail.com': { 
        roleLevel: 2, 
        role: 'admin', 
        firstName: 'Ed', 
        lastName: 'Duval (Admin)',
        companyId: 1 
      },
      'ed.duval+test1@gmail.com': { 
        roleLevel: 1, 
        role: 'user', 
        firstName: 'Ed', 
        lastName: 'Duval (User)',
        companyId: 1 
      }
    };

    if (!testAccounts[email]) {
      return res.status(403).json({ success: false, message: "Development login only available for test accounts" });
    }

    console.log("🔧 [VERCEL] Development login for:", email);

    // Get or create the user in the database
    let user = await storage.getUserByEmail(email);

    if (!user) {
      // Create the test user if it doesn't exist
      const testAccount = testAccounts[email];

      // Generate a unique ID for the test user
      const testUserId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      user = await storage.upsertUser({
        id: testUserId,
        email,
        firstName: testAccount.firstName,
        lastName: testAccount.lastName,
        role: testAccount.role,
        roleLevel: testAccount.roleLevel,
        companyId: testAccount.companyId,
        isActive: true
      });
      console.log("✅ [VERCEL] Created test user:", email, "with role level:", testAccount.roleLevel);
    } else {
      console.log("✅ [VERCEL] User found:", user.email, "role level:", user.roleLevel, "company:", user.companyId);
    }

    // Create a development session
    const sessionToken = `dev-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await storage.createUserSession({
      userId: user.id.toString(),
      sessionToken,
      email: user.email,
      companyId: user.companyId,
      roleLevel: user.roleLevel,
      expiresAt,
    });

    console.log("✅ [VERCEL] Development session created:", sessionToken.substring(0, 20) + "...");

    // Set session cookie with production-compatible settings
    res.setHeader('Set-Cookie', `sessionToken=${sessionToken}; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax; Secure`);

    res.json({
      success: true,
      message: "Development login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleLevel: user.roleLevel,
        companyId: user.companyId,
        role: user.role
      }
    });

  } catch (error) {
    console.error("🚨 [VERCEL] Development login error:", error);
    res.status(500).json({ success: false, message: "Authentication failed" });
  }
}