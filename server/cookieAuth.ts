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
    console.log('CookieAuth: sessionToken =', sessionToken ? sessionToken.substring(0, 30) + '...' : 'missing');
    
    if (!sessionToken) {
      console.log('CookieAuth: No session token - returning 401');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const session = await authService.verifySession(sessionToken);
    console.log('CookieAuth: session verification result =', !!session, session ? `roleLevel: ${session.roleLevel}` : 'null');
    
    if (!session) {
      console.log('CookieAuth: Invalid/expired session - clearing cookie and returning 401');
      res.clearCookie('sessionToken');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = {
      userId: session.userId,
      email: session.email,
      companyId: session.companyId,
      roleLevel: session.roleLevel,
    };

    console.log('CookieAuth: Authentication successful -', req.user.email, 'roleLevel:', req.user.roleLevel);
    next();
  } catch (error) {
    console.error('CookieAuth: Authentication error:', error);
    res.clearCookie('sessionToken');
    return res.status(401).json({ message: 'Unauthorized' });
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