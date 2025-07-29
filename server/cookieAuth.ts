import { Request, Response, NextFunction } from 'express';
import { authService } from './services/authService';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    companyId: number | null;
    roleLevel: number;
    actualRoleLevel?: number;
    isDeveloper?: boolean;
    testRole?: string | null;
  };
}

export const cookieAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionToken = req.cookies?.sessionToken;
    console.log('CookieAuth: cookies =', req.cookies);
    console.log('CookieAuth: sessionToken =', sessionToken ? sessionToken.substring(0, 30) + '...' : 'missing');
    console.log('CookieAuth: request path =', req.path);

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

    // Calculate effective role level for developers with test roles
    let effectiveRoleLevel = session.roleLevel;
    console.log('🔍 CHECKPOINT G - CookieAuth: Initial role level from session:', session.roleLevel);
    
    if (session.isDeveloper && session.testRole) {
      console.log('🔍 CHECKPOINT H - CookieAuth: Developer with test role, calculating effective level');
      effectiveRoleLevel = authService.getEffectiveRoleLevel({
        userId: session.userId,
        email: session.email,
        companyId: session.companyId,
        roleLevel: session.roleLevel,
        sessionToken: session.sessionToken,
        isDeveloper: session.isDeveloper,
        testRole: session.testRole
      });
      console.log('🔍 CHECKPOINT I - CookieAuth: Effective role level calculated:', effectiveRoleLevel);
    } else {
      console.log('🔍 CHECKPOINT J - CookieAuth: No test role, using original level:', effectiveRoleLevel);
    }

    req.user = {
      userId: session.userId,
      email: session.email,
      companyId: session.companyId,
      roleLevel: effectiveRoleLevel,
      actualRoleLevel: session.roleLevel,
      isDeveloper: session.isDeveloper || false,
      testRole: session.testRole || null,
    };

    console.log('🔍 CHECKPOINT K - CookieAuth: Final user object set on request:', {
      email: req.user?.email,
      roleLevel: req.user?.roleLevel,
      actualRoleLevel: req.user?.actualRoleLevel,
      isDeveloper: req.user?.isDeveloper,
      testRole: req.user?.testRole,
      timestamp: new Date().toISOString()
    });
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
        // Calculate effective role level for developers with test roles
        let effectiveRoleLevel = session.roleLevel;
        if (session.isDeveloper && session.testRole) {
          effectiveRoleLevel = authService.getEffectiveRoleLevel({
            userId: session.userId,
            email: session.email,
            companyId: session.companyId,
            roleLevel: session.roleLevel,
            sessionToken: session.sessionToken,
            isDeveloper: session.isDeveloper,
            testRole: session.testRole
          });
        }

        req.user = {
          userId: session.userId,
          email: session.email,
          companyId: session.companyId,
          roleLevel: effectiveRoleLevel,
          actualRoleLevel: session.roleLevel,
          isDeveloper: session.isDeveloper || false,
          testRole: session.testRole || null,
        };
        console.log('OptionalAuth: user set =', req.user?.email, 'role level:', req.user?.roleLevel);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};