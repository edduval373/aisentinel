import { Request, Response, NextFunction } from 'express';
import { authService } from './services/authService';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    companyId: number | null;
    roleLevel: number;
  };
}

export const cookieAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionToken = req.cookies?.sessionToken;
    
    if (!sessionToken) {
      return res.status(401).json({ message: 'No session token provided', requiresAuth: true });
    }

    const session = await authService.verifySession(sessionToken);
    
    if (!session) {
      res.clearCookie('sessionToken');
      return res.status(401).json({ message: 'Invalid or expired session', requiresAuth: true });
    }

    req.user = {
      userId: session.userId,
      email: session.email,
      companyId: session.companyId,
      roleLevel: session.roleLevel,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.clearCookie('sessionToken');
    return res.status(401).json({ message: 'Authentication failed', requiresAuth: true });
  }
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionToken = req.cookies?.sessionToken;
    console.log('OptionalAuth: cookies =', req.cookies);
    console.log('OptionalAuth: sessionToken =', sessionToken ? 'exists (' + sessionToken.substring(0, 10) + '...)' : 'missing');
    
    if (sessionToken) {
      const session = await authService.verifySession(sessionToken);
      console.log('OptionalAuth: session verified =', !!session);
      
      if (session) {
        req.user = {
          userId: session.userId,
          email: session.email,
          companyId: session.companyId,
          roleLevel: session.roleLevel,
        };
        console.log('OptionalAuth: user set =', req.user.email, 'role level:', req.user.roleLevel);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};