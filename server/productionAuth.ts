// Production-only authentication using database sessions without cookies
import { storage } from './storage';

export interface ProductionSession {
  sessionId: string;
  email: string;
  userId: string;
  roleLevel: number;
  companyId: number;
  expiresAt: Date;
  lastAccessed: Date;
}

// In-memory session cache for production (cleared on server restart)
const productionSessionCache = new Map<string, ProductionSession>();

export async function createProductionSession(email: string, userId: string): Promise<string> {
  const sessionId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  // Create in database
  await storage.createUserSession({
    userId,
    sessionToken: sessionId,
    email,
    companyId: 1,
    roleLevel: 1000,
    expiresAt
  });
  
  // Cache in memory for fast access
  productionSessionCache.set(sessionId, {
    sessionId,
    email,
    userId,
    roleLevel: 1000,
    companyId: 1,
    expiresAt,
    lastAccessed: new Date()
  });
  
  console.log('✅ Production session created:', sessionId.substring(0, 20) + '...');
  return sessionId;
}

export async function verifyProductionSession(sessionId: string): Promise<ProductionSession | null> {
  if (!sessionId || (!sessionId.startsWith('prod-') && !sessionId.startsWith('prod-session-'))) {
    return null;
  }
  
  // Check memory cache first
  const cached = productionSessionCache.get(sessionId);
  if (cached && cached.expiresAt > new Date()) {
    cached.lastAccessed = new Date();
    return cached;
  }
  
  // Fallback to database
  try {
    const dbSession = await storage.getUserSession(sessionId);
    if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
      const session: ProductionSession = {
        sessionId: dbSession.sessionToken,
        email: dbSession.email,
        userId: dbSession.userId,
        roleLevel: dbSession.roleLevel,
        companyId: dbSession.companyId,
        expiresAt: new Date(dbSession.expiresAt),
        lastAccessed: new Date()
      };
      
      // Update cache
      productionSessionCache.set(sessionId, session);
      return session;
    }
  } catch (error) {
    console.error('Database session verification failed:', error);
  }
  
  return null;
}

export function getActiveSessionFromHeaders(req: any): string | null {
  // Check multiple sources for session ID
  
  // 1. Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && (authHeader.startsWith('Bearer prod-') || authHeader.startsWith('Bearer prod-session-'))) {
    return authHeader.substring(7);
  }
  
  // 2. Custom session header
  const sessionHeader = req.headers['x-session-token'];
  if (sessionHeader && (sessionHeader.startsWith('prod-') || sessionHeader.startsWith('prod-session-'))) {
    return sessionHeader;
  }
  
  // 3. Query parameter (for initial setup)
  const sessionQuery = req.query?.sessionToken || req.query?.session;
  if (sessionQuery && (sessionQuery.startsWith('prod-') || sessionQuery.startsWith('prod-session-'))) {
    return sessionQuery;
  }
  
  // 4. Cookie fallback (if working)
  const sessionCookie = req.cookies?.sessionToken;
  if (sessionCookie && (sessionCookie.startsWith('prod-') || sessionCookie.startsWith('prod-session-'))) {
    return sessionCookie;
  }
  
  return null;
}

export async function authenticateProductionRequest(req: any): Promise<ProductionSession | null> {
  const sessionId = getActiveSessionFromHeaders(req);
  if (!sessionId) {
    return null;
  }
  
  return await verifyProductionSession(sessionId);
}