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

      // Set session cookie
      res.cookie('sessionToken', session.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Get user details for response
      const user = await storage.getUser(session.userId);
      let companyName = null;
      
      if (session.companyId) {
        const company = await storage.getCompanyById(session.companyId);
        companyName = company?.name;
      }

      // For development, redirect to the development environment instead of production
      if (process.env.NODE_ENV === 'development') {
        const devUrl = `https://8b45f032-3543-41c9-9d7b-a06e3bbab484-00-2a5ekmx4eqmb5.worf.replit.dev/?verified=true&email=${encodeURIComponent(session.email)}`;
        console.log("🔧 Development mode - redirecting to:", devUrl);
        res.redirect(devUrl);
      } else {
        // Production redirect
        res.redirect(`/?verified=true&email=${encodeURIComponent(session.email)}`);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      res.status(500).json({ success: false, message: "An error occurred during verification" });
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
            role: 'super-user',
            roleLevel: 100,
            companyId: 1,
            companyName: 'Horizon Edge Enterprises'
          };
          
          return res.json({
            authenticated: true,
            user: devUser
          });
        }
        
        return res.json({ authenticated: false });
      }

      const user = await storage.getUser(req.user.userId);
      let companyName = null;
      
      if (req.user.companyId) {
        const company = await storage.getCompanyById(req.user.companyId);
        companyName = company?.name;
      }

      res.json({
        authenticated: true,
        user: {
          id: req.user.userId,
          email: req.user.email,
          companyId: req.user.companyId,
          companyName,
          role: user?.role || 'user',
          roleLevel: req.user.roleLevel,
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

  // Development manual authentication endpoint (since verification was successful)
  app.post('/api/auth/dev-login', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || email !== 'ed.duval15@gmail.com') {
        return res.status(400).json({ success: false, message: "Invalid email" });
      }

      console.log(`🔧 DEV LOGIN: Creating session for ${email}`);

      // Create development session AND store it in database
      const sessionToken = `dev-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the session in database so authentication middleware can find it
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      await storage.createUserSession({
        userId: "42450602",
        sessionToken,
        email,
        companyId: 1,
        roleLevel: 100,
        expiresAt,
      });
      
      console.log(`✅ DEV LOGIN: Created and stored development session in database`);
      
      // Set session cookie
      res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      console.log(`✅ DEV LOGIN: Session created successfully`);

      res.json({
        success: true,
        message: "Development authentication successful",
        user: {
          id: "42450602",
          email: email,
          firstName: 'Ed',
          lastName: 'Duval',
          role: 'super-user',
          roleLevel: 100,
          companyId: 1,
          companyName: 'Horizon Edge Enterprises'
        }
      });
    } catch (error: any) {
      console.error("Dev login error:", error);
      res.status(500).json({ success: false, message: "Development authentication failed" });
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
      (req as any).session.roleLevel = roleLevel || 100;
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
          roleLevel: roleLevel || 100,
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