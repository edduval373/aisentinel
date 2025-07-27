import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    companyId: number | null;
    roleLevel: number;
    role: string;
  };
}

// Unified authentication middleware that supports both cookie and Replit Auth
export const unifiedAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let user = null;
    let companyId = null;
    let roleLevel = 1;
    let email = '';
    let userId = '';
    let role = 'user';

    // Try cookie auth first
    if (req.cookies?.sessionToken) {
      // Check if it's a demo session token
      if (req.cookies.sessionToken.startsWith('demo-session-')) {
        const demoUser = await storage.getDemoUser(req.cookies.sessionToken);
        if (demoUser && demoUser.expiresAt > new Date()) {
          userId = `demo_${demoUser.id}`;
          email = demoUser.email;
          companyId = 1; // Demo users use company ID 1
          roleLevel = 0; // Demo role level
          role = 'demo';
          user = {
            id: userId,
            email: demoUser.email,
            firstName: 'Demo',
            lastName: 'User',
            profileImageUrl: null,
            role: 'demo',
            roleLevel: 0,
            companyRoleId: null,
            companyId: 1,
            department: null,
            isTrialUser: false,
            lastLoginAt: null,
            createdAt: demoUser.createdAt,
            updatedAt: demoUser.createdAt,
          };
        }
      } else {
        // Regular session token
        const session = await authService.verifySession(req.cookies.sessionToken);
        if (session) {
          const dbUser = await storage.getUser(session.userId);
          if (dbUser) {
            userId = session.userId;
            email = session.email;
            companyId = session.companyId;
            roleLevel = session.roleLevel;
            role = dbUser.role || 'user';
            user = dbUser;
          }
        }
      }
    }

    // Fallback to Replit Auth
    if (!user && (req as any).user?.claims?.sub) {
      const dbUser = await storage.getUser((req as any).user.claims.sub);
      if (dbUser) {
        userId = dbUser.id;
        email = dbUser.email || '';
        companyId = dbUser.companyId;
        roleLevel = dbUser.roleLevel || 1;
        role = dbUser.role || 'user';
        user = dbUser;
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Authentication required", requiresAuth: true });
    }

    req.user = {
      userId,
      email,
      companyId,
      roleLevel,
      role,
    };

    next();
  } catch (error) {
    console.error('Unified authentication error:', error);
    return res.status(401).json({ message: "Authentication failed", requiresAuth: true });
  }
};

// Optional authentication - doesn't fail if no auth
export const optionalUnifiedAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let user = null;
    let companyId = null;
    let roleLevel = 1;
    let email = '';
    let userId = '';
    let role = 'user';

    // Try cookie auth first
    if (req.cookies?.sessionToken) {
      const session = await authService.verifySession(req.cookies.sessionToken);
      if (session) {
        const dbUser = await storage.getUser(session.userId);
        if (dbUser) {
          userId = session.userId;
          email = session.email;
          companyId = session.companyId;
          roleLevel = session.roleLevel;
          role = dbUser.role || 'user';
          user = dbUser;
        }
      }
    }

    // Fallback to Replit Auth
    if (!user && (req as any).user?.claims?.sub) {
      const dbUser = await storage.getUser((req as any).user.claims.sub);
      if (dbUser) {
        userId = dbUser.id;
        email = dbUser.email || '';
        companyId = dbUser.companyId;
        roleLevel = dbUser.roleLevel || 1;
        role = dbUser.role || 'user';
        user = dbUser;
      }
    }

    if (user) {
      req.user = {
        userId,
        email,
        companyId,
        roleLevel,
        role,
      };
    }

    next();
  } catch (error) {
    console.error('Optional unified authentication error:', error);
    next();
  }
};