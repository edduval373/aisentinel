import type { Express } from "express";
import { z } from "zod";
import { authService } from "./services/authService";
import { storage } from "./storage";
import { cookieAuth, optionalAuth, AuthenticatedRequest } from "./cookieAuth";
import { db } from "./db";

const requestVerificationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export function setupAuthRoutes(app: Express) {
  // Request email verification
  app.post('/api/auth/request-verification', async (req, res) => {
    try {
      const { email } = requestVerificationSchema.parse(req.body);

      const success = await authService.initiateEmailVerification(email);

      if (success) {
        res.json({ success: true, message: "Verification email sent successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send verification email" });
      }
    } catch (error: any) {
      console.error("Request verification error:", error);
      if (error?.errors) {
        res.status(400).json({ success: false, message: error.errors[0].message });
      } else {
        res.status(500).json({ success: false, message: "An error occurred" });
      }
    }
  });

  // Verify email token
  app.get('/api/auth/verify', async (req, res) => {
    try {
      const token = req.query.token as string;

      if (!token) {
        return res.status(400).json({ success: false, message: "No verification token provided" });
      }

      console.log("🔐 Email verification attempt for token:", token.substring(0, 10) + "...");

      const session = await authService.verifyEmailToken(token);

      if (!session) {
        console.log("❌ Invalid or expired verification token");
        return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
      }

      console.log("✅ Valid session found:", session.email, "- Setting cookie and redirecting");

      // Set session cookie with Vercel-compatible settings
      res.cookie('sessionToken', session.sessionToken, {
        httpOnly: true,
        secure: true, // Always secure in production
        sameSite: 'lax', // More permissive for cross-page navigation
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
        // Don't set domain explicitly - let Vercel handle it
      });

      // Get user details for response
      const user = await storage.getUser(session.userId);
      let companyName = null;

      if (session.companyId) {
        const company = await storage.getCompanyById(session.companyId);
        companyName = company?.name;
      }

      // Get the current host from the request to redirect back to the same environment
      const protocol = req.secure ? 'https' : 'http';
      const host = req.get('host');
      const redirectUrl = `${protocol}://${host}/?verified=true&email=${encodeURIComponent(session.email)}`;
      
      console.log("✅ Email verified successfully - redirecting to:", redirectUrl);
      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error("Verification error:", error);
      res.status(500).json({ success: false, message: "An error occurred during verification" });
    }
  });

  // Test verification endpoint for Railway logging
  app.get('/api/auth/test-verify', async (req, res) => {
    try {
      console.log('🧪 [DEV TEST] Test verification endpoint accessed');
      console.log('🧪 [DEV TEST] This simulates the production verification flow');
      
      // Generate test token and email
      const testToken = 'test-token-' + Math.random().toString(36).substring(2, 15);
      const testEmail = 'ed.duval15@gmail.com';
      
      console.log('🧪 [DEV TEST] Generated test parameters:');
      console.log(`🧪 [DEV TEST] - Token: ${testToken}`);
      console.log(`🧪 [DEV TEST] - Email: ${testEmail}`);
      
      // Generate session token (same as production)
      const sessionToken = 'test-session-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      console.log('🧪 [DEV TEST] Generated session token:', sessionToken.substring(0, 20) + '...');
      
      // Set cookie (simulating production process)
      const cookieString = `sessionToken=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`;
      console.log('🧪 [DEV TEST] Cookie string prepared:', cookieString.substring(0, 50) + '...');
      
      try {
        res.cookie('sessionToken', sessionToken, {
          httpOnly: true,
          secure: false, // Not secure for development
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        console.log('✅ [DEV TEST] Cookie set successfully in development');
        
        // Get the current host from the request to redirect back to the same environment
        const protocol = req.secure ? 'https' : 'http';
        const host = req.get('host');
        const redirectUrl = `${protocol}://${host}/?verified=true&test=true&email=${encodeURIComponent(testEmail)}`;
        
        console.log('🧪 [DEV TEST] Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
        
      } catch (cookieError) {
        console.error('❌ [DEV TEST] Failed to set cookie:', cookieError);
        throw new Error(`Cookie setting failed: ${cookieError.message}`);
      }
      
    } catch (error) {
      console.error('💥 [DEV TEST] Test verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Test verification failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Development bypass for email verification
  app.get('/api/auth/dev-verify', async (req, res) => {
    try {
      const token = req.query.token as string;

      if (!token) {
        return res.status(400).json({ success: false, message: "No verification token provided" });
      }

      console.log("🔧 Development verification bypass for token:", token.substring(0, 10) + "...");

      // Check if the token exists in the database
      const verificationToken = await storage.getEmailVerificationToken(token);

      if (!verificationToken || verificationToken.isUsed || verificationToken.expiresAt < new Date()) {
        console.log("❌ Invalid or expired verification token");
        return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
      }

      // Mark token as used
      await storage.markEmailVerificationTokenAsUsed(verificationToken.id);

      console.log("✅ Valid token found for:", verificationToken.email, "- Creating session with correct role level");

      // Create session using the authentication service
      const session = await authService.verifyEmailToken(token);

      if (!session) {
        console.log("❌ Failed to create session");
        return res.status(400).json({ success: false, message: "Failed to create session" });
      }

      console.log("✅ Session created:", session.email, "role level:", session.roleLevel, "company:", session.companyId);

      // Set session cookie for development
      res.cookie('sessionToken', session.sessionToken, {
        httpOnly: true,
        secure: false, // Not secure for development
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Redirect to current environment (dynamic URL detection)
      const currentHost = req.get('host') || 'localhost:5000';
      const protocol = req.secure ? 'https' : 'http';
      const redirectUrl = `${protocol}://${currentHost}/?verified=true&email=${encodeURIComponent(session.email)}`;
      console.log("🔧 Redirecting to current environment:", redirectUrl);
      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error("Development verification error:", error);
      res.status(500).json({ success: false, message: "An error occurred during verification" });
    }
  });

  // Development login endpoint for bypassing email verification issues
  app.post('/api/auth/dev-login', async (req, res) => {
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

      console.log("🔧 Development login for:", email);

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
        console.log("✅ Created test user:", email, "with role level:", testAccount.roleLevel);
      } else {
        console.log("✅ User found:", user.email, "role level:", user.roleLevel, "company:", user.companyId);
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

      console.log("✅ Development session created:", sessionToken.substring(0, 20) + "...");

      // Set session cookie
      res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: false, // Not secure for development
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({ success: true, message: "Development login successful", user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleLevel: user.roleLevel,
        companyId: user.companyId,
        role: user.role
      }});
    } catch (error: any) {
      console.error("Development login error:", error);
      res.status(500).json({ success: false, message: "An error occurred during development login" });
    }
  });

  // Super-user endpoint to get all users for role management
  app.get('/api/admin/all-users', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || req.user.roleLevel < 1000) {
        return res.status(403).json({ message: "Super-user access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Super-user endpoint to update user roles
  app.patch('/api/admin/users/:userId/role', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || req.user.roleLevel < 1000) {
        return res.status(403).json({ message: "Super-user access required" });
      }

      const { userId } = req.params;
      const { roleLevel } = req.body;

      if (typeof roleLevel !== 'number' || roleLevel < 0 || roleLevel > 1000) {
        return res.status(400).json({ message: "Invalid role level" });
      }

      const roleMap: { [key: number]: string } = {
        1: 'user',
        2: 'admin',
        998: 'administrator',
        999: 'owner',
        1000: 'super-user'
      };

      const role = roleMap[roleLevel] || 'user';

      await storage.updateUser(userId, { roleLevel, role });

      res.json({ success: true, message: "User role updated successfully" });
    } catch (error: any) {
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Get current user (with optional auth)
  app.get('/api/auth/me', optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        // Check for development session tokens that start with 'dev-session-'
        const sessionToken = req.cookies?.sessionToken;
        if (sessionToken && sessionToken.startsWith('dev-session-')) {
          console.log(`🔧 Development session detected: ${sessionToken.substring(0, 20)}...`);

          // For development sessions, create a mock authenticated user
          const devUser = {
            id: 1,
            email: 'ed.duval15@gmail.com',
            firstName: 'Ed',
            lastName: 'Duval',
            role: 'user',
            roleLevel: 1,
            companyId: 1,
            companyName: 'Duval AI Solutions'
          };

          return res.json({
            authenticated: true,
            user: devUser
          });
        }

        // NO COOKIES - Return not authenticated (should show landing page)
        console.log('🔒 No session token found, user not authenticated');
        return res.json({ authenticated: false });
      }

      const user = await storage.getUser(req.user.userId);
      let companyName = null;

      if (req.user.companyId) {
        const company = await storage.getCompanyById(req.user.companyId);
        companyName = company?.name;
      }

      // Get effective role level for developers (considering test role)
      const sessionForRoleCheck = {
        userId: req.user.userId,
        email: req.user.email,
        companyId: req.user.companyId,
        roleLevel: req.user.roleLevel,
        sessionToken: 'temp', // Not needed for role calculation
        isDeveloper: req.user.isDeveloper,
        testRole: req.user.testRole
      };
      const effectiveRoleLevel = authService.getEffectiveRoleLevel(sessionForRoleCheck);

      res.json({
        authenticated: true,
        user: {
          id: req.user.userId,
          email: req.user.email,
          companyId: req.user.companyId,
          companyName,
          role: user?.role || 'user',
          roleLevel: effectiveRoleLevel,
          firstName: user?.firstName,
          lastName: user?.lastName,
        },
      });
    } catch (error: any) {
      console.error("Get current user error:", error);
      res.status(500).json({ authenticated: false, message: "An error occurred" });
    }
  });

  // Logout
  app.post('/api/auth/logout', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const sessionToken = req.cookies?.sessionToken;

      if (sessionToken) {
        await authService.logout(sessionToken);
      }

      res.clearCookie('sessionToken');
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.clearCookie('sessionToken');
      res.status(500).json({ success: false, message: "An error occurred during logout" });
    }
  });

  // Check authentication status
  app.get('/api/auth/status', optionalAuth, async (req: AuthenticatedRequest, res) => {
    res.json({
      authenticated: !!req.user,
      requiresAuth: !req.user,
    });
  });

  // Debug route for SendGrid connectivity testing
  app.get('/api/auth/debug/sendgrid', async (req, res) => {
    try {
      // Direct access to emailService using existing import
      const { emailService } = await import('./services/emailService');

      const configInfo = emailService.getConfigInfo();
      const connectionTest = await emailService.testSendGridConnection();

      res.json({
        success: true,
        config: configInfo,
        connectionTest,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Debug SendGrid error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test SendGrid connectivity',
        error: error.message
      });
    }
  });

  // Debug route for environment variables
  app.get('/api/auth/debug/environment', async (req, res) => {
    try {
      res.json({
        success: true,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          APP_URL: process.env.APP_URL,
          SENDGRID_API_KEY_CONFIGURED: !!process.env.SENDGRID_API_KEY,
          SENDGRID_API_KEY_LENGTH: process.env.SENDGRID_API_KEY?.length || 0,
          DATABASE_URL_CONFIGURED: !!process.env.DATABASE_URL
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Debug environment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get environment info',
        error: error.message
      });
    }
  });

  // Development verification endpoint (handles email verification tokens in dev environment)
  app.get('/api/dev/auth/verify', async (req, res) => {
    try {
      const token = req.query.token as string;

      if (!token) {
        return res.status(400).json({ success: false, message: "No verification token provided" });
      }

      console.log("🔧 Development email verification attempt for token:", token.substring(0, 10) + "...");

      const session = await authService.verifyEmailToken(token);

      if (!session) {
        console.log("❌ Invalid or expired verification token");
        return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
      }

      console.log("✅ Valid session found:", session.email, "- Creating development session");

      // Create development session token
      const devSessionToken = `dev-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store the session in database
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await storage.createUserSession({
        userId: session.userId.toString(),
        sessionToken: devSessionToken,
        email: session.email,
        companyId: session.companyId,
        roleLevel: session.roleLevel,
        expiresAt,
      });

      // Set session cookie for development
      res.cookie('sessionToken', devSessionToken, {
        httpOnly: true,
        secure: false, // Development doesn't use HTTPS
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      console.log("✅ Development verification successful, redirecting to chat");

      // Redirect to chat interface
      res.redirect('/chat');
    } catch (error: any) {
      console.error("Development verification error:", error);
      res.status(500).json({ success: false, message: "An error occurred during verification" });
    }
  });

  // Demo signup endpoint - creates demo account with question limits
  app.post('/api/auth/demo-signup', async (req, res) => {
    try {
      const { email, ipAddress, userAgent } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }

      console.log(`🎯 DEMO SIGNUP: Creating demo account for ${email}`);

      // Create demo session token
      const sessionToken = `demo-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Set expiration to 24 hours for demo accounts
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Check if demo user already exists
      let demoUser = await storage.getDemoUserByEmail(email);

      if (demoUser) {
        // Update existing demo user with new session
        demoUser = await storage.updateDemoUserSession(email, sessionToken, expiresAt);
        console.log(`✅ DEMO SIGNUP: Updated existing demo user ID ${demoUser.id} with new session`);
      } else {
        // Create new demo user record
        demoUser = await storage.createDemoUser({
          email,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          questionsUsed: 0,
          maxQuestions: 3,
          sessionToken,
          expiresAt,
        });
        console.log(`✅ DEMO SIGNUP: Created new demo user with ID ${demoUser.id}`);
      }

      // Set session cookie with Vercel-compatible settings
      res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Allow cross-page navigation
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });

      // Set demo return cookie for automatic redirect on future visits
      res.cookie('demoUser', email, {
        httpOnly: false, // Allow client-side access for redirect logic
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        success: true,
        message: "Demo account created successfully",
        demoUser: {
          id: demoUser.id,
          email: demoUser.email,
          questionsRemaining: demoUser.maxQuestions - demoUser.questionsUsed,
          expiresAt: demoUser.expiresAt
        }
      });
    } catch (error: any) {
      console.error("Demo signup error:", error);
      res.status(500).json({ success: false, message: "Failed to create demo account" });
    }
  });



  // Development-only test session creation endpoint
  app.post('/api/auth/create-test-session', async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Test sessions not allowed in production' });
      }

      const { email, name, roleLevel, companyId } = req.body;

      // Create a test session with the provided user data
      const testUserId = `test-${email}`;

      // Store user data in session
      (req as any).session.userId = testUserId;
      (req as any).session.email = email;
      (req as any).session.name = name;
      (req as any).session.roleLevel = roleLevel || 1000;
      (req as any).session.companyId = companyId || 1;
      (req as any).session.authenticated = true;

      console.log(`Created test session for ${email} with role level ${roleLevel}`);

      res.json({
        success: true,
        message: 'Test session created',
        user: {
          id: testUserId,
          email,
          name,
          roleLevel: roleLevel || 1000,
          companyId: companyId || 1
        }
      });
    } catch (error: any) {
      console.error('Test session creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test session',
        error: error.message
      });
    }
  });
}