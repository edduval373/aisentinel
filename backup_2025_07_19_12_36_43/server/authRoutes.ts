import type { Express } from "express";
import { z } from "zod";
import { authService } from "./services/authService";
import { storage } from "./storage";
import { cookieAuth, optionalAuth, AuthenticatedRequest } from "./cookieAuth";

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
      if (error.errors) {
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

      const session = await authService.verifyEmailToken(token);
      
      if (!session) {
        return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
      }

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

      // Redirect to frontend verification success page
      res.redirect(`/verify?token=${token}&success=true`);
    } catch (error: any) {
      console.error("Verification error:", error);
      res.status(500).json({ success: false, message: "An error occurred during verification" });
    }
  });

  // Get current user (with optional auth)
  app.get('/api/auth/me', optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
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
}