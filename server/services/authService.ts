import { nanoid } from 'nanoid';
import { storage } from '../storage';
import { emailService } from './emailService';

// Developer email list - maintained on backend only
const DEVELOPER_EMAILS = [
  'ed.duval15@gmail.com',
  'developer@duvalsolutions.net',
  'test@developer.local'
];

export interface AuthSession {
  userId: string;
  email: string;
  companyId: number | null;
  roleLevel: number;
  sessionToken: string;
  isDeveloper?: boolean;
  testRole?: string;
}

export class AuthService {
  // Check if email is in developer list
  isDeveloperEmail(email: string): boolean {
    return DEVELOPER_EMAILS.includes(email.toLowerCase());
  }

  // Generate secure session token
  generateSessionToken(): string {
    return nanoid(64);
  }

  // Set developer test role in session
  async setDeveloperTestRole(sessionToken: string, testRole: string): Promise<boolean> {
    try {
      const session = await storage.getUserSession(sessionToken);
      if (!session || !this.isDeveloperEmail(session.email)) {
        return false;
      }

      // Update session with test role
      await storage.updateUserSession(sessionToken, { testRole });
      return true;
    } catch (error) {
      console.error('Error setting developer test role:', error);
      return false;
    }
  }

  // Get effective role level for developers (considering test role)
  getEffectiveRoleLevel(session: AuthSession): number {
    console.log('🔍 CHECKPOINT 1 - getEffectiveRoleLevel called with:', {
      userId: session.userId,
      email: session.email,
      isDeveloper: session.isDeveloper,
      testRole: session.testRole,
      originalRoleLevel: session.roleLevel,
      timestamp: new Date().toISOString()
    });

    if (session.isDeveloper && session.testRole) {
      let effectiveLevel: number;
      console.log('🔍 CHECKPOINT 2 - Developer with test role detected');
      
      switch (session.testRole) {
        case 'demo': 
          effectiveLevel = 0;
          console.log('🔍 CHECKPOINT 3a - Test role "demo" -> level 0');
          break;
        case 'user': 
          effectiveLevel = 1;
          console.log('🔍 CHECKPOINT 3b - Test role "user" -> level 1');
          break;
        case 'administrator': 
          effectiveLevel = 998;
          console.log('🔍 CHECKPOINT 3c - Test role "administrator" -> level 998');
          break;
        case 'owner': 
          effectiveLevel = 999;
          console.log('🔍 CHECKPOINT 3d - Test role "owner" -> level 999');
          break;
        case 'super-user': 
          effectiveLevel = 1000;
          console.log('🔍 CHECKPOINT 3e - Test role "super-user" -> level 1000');
          break;
        default: 
          // Handle custom roles (custom-X format)
          if (session.testRole.startsWith('custom-')) {
            const level = parseInt(session.testRole.replace('custom-', ''));
            effectiveLevel = isNaN(level) ? session.roleLevel : level;
            console.log('🔍 CHECKPOINT 3f - Custom role parsed:', session.testRole, '-> level', effectiveLevel);
          } else {
            effectiveLevel = session.roleLevel;
            console.log('🔍 CHECKPOINT 3g - Unknown test role, using original level:', effectiveLevel);
          }
      }
      
      console.log('🔍 CHECKPOINT 4 - Final effective role level calculated:', effectiveLevel, 'for test role:', session.testRole);
      return effectiveLevel;
    }
    
    console.log('🔍 CHECKPOINT 5 - Not a developer or no test role, returning original level:', session.roleLevel);
    return session.roleLevel;
  }

  // Create verification token and send email
  async initiateEmailVerification(email: string): Promise<boolean> {
    try {
      const token = emailService.generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.createEmailVerificationToken({
        email,
        token,
        expiresAt,
        isUsed: false,
      });

      return await emailService.sendVerificationEmail(email, token);
    } catch (error) {
      console.error('Error initiating email verification:', error);
      return false;
    }
  }

  // Verify email token and create session with trial system
  async verifyEmailToken(token: string, ipAddress?: string, deviceFingerprint?: string): Promise<AuthSession | null> {
    try {
      const verificationToken = await storage.getEmailVerificationToken(token);

      if (!verificationToken || verificationToken.isUsed || verificationToken.expiresAt < new Date()) {
        return null;
      }

      // Mark token as used
      await storage.markEmailVerificationTokenAsUsed(verificationToken.id);

      const email = verificationToken.email;

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      let companyId: number | null = null;
      let roleLevel = 0; // Default to guest level
      let isTrialUser = true;

      if (!user) {
        // Try to match email to existing company employee for role assignment
        const company = await storage.getCompanyByEmailDomain(email);
        if (company) {
          const employee = await storage.getCompanyEmployeeByEmail(email);
          if (employee && employee.isActive) {
            companyId = company.id;
            roleLevel = this.getRoleLevelFromEmployeeRole(employee.role || 'employee');
            isTrialUser = false; // Company users get full access
          }
        }

        // For demo users (role level 0), always assign to company ID 1
        if (roleLevel === 0) {
          companyId = 1;
        }

        // Create new user
        const userId = nanoid(12);
        user = await storage.upsertUser({
          id: userId,
          email,
          companyId,
          roleLevel,
          firstName: null,
          lastName: null,
          role: this.getRoleFromLevel(roleLevel),
          isTrialUser,
          lastLoginAt: new Date(),
        });

        // Create trial usage record for new users (including company users for tracking)
        await storage.createTrialUsage({
          userId: user.id,
          companyId,
          email,
          ipAddress,
          deviceFingerprint,
          actionsUsed: 0,
          maxActions: companyId ? 100 : 10, // Company users get more trial actions
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        });
      } else {
        // Existing user - use existing information
        companyId = user.companyId;
        roleLevel = user.roleLevel || 0;
        isTrialUser = user.isTrialUser !== false; // Default to true unless explicitly false

        // Super-users and existing company users should not be trial users
        if (roleLevel >= 999 || user.companyId) {
          isTrialUser = false;
        }

        // For users without company association, try to match to a company
        if (!user.companyId) {
          const company = await storage.getCompanyByEmailDomain(email);
          if (company) {
            const employee = await storage.getCompanyEmployeeByEmail(email);
            if (employee && employee.isActive) {
              companyId = company.id;
              roleLevel = this.getRoleLevelFromEmployeeRole(employee.role || 'employee');
              isTrialUser = false;

              // Update user with company information
              await storage.updateUser(user.id, {
                companyId,
                roleLevel,
                role: this.getRoleFromLevel(roleLevel),
                isTrialUser,
                lastLoginAt: new Date(),
              });

              user.companyId = companyId;
              user.roleLevel = roleLevel;
              user.isTrialUser = isTrialUser;
            }
          }
        }

        // Update last login
        await storage.updateUser(user.id, { lastLoginAt: new Date() });
      }

      // Create session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await storage.createUserSession({
        userId: user.id,
        sessionToken,
        email,
        companyId,
        roleLevel,
        expiresAt,
      });

      return {
        userId: user.id,
        email,
        companyId,
        roleLevel,
        sessionToken,
      };
    } catch (error) {
      console.error('Error verifying email token:', error);
      return null;
    }
  }

  // External authentication flow - matches users to existing roles from cookies/external auth
  async authenticateExternalUser(email: string, externalUserId: string, ipAddress?: string, deviceFingerprint?: string): Promise<AuthSession | null> {
    try {
      // Get or create user with automatic role matching
      let user = await storage.getUserByEmail(email);
      let companyId: number | null = null;
      let roleLevel = 0; // Default to guest level
      let isTrialUser = true;

      if (!user) {
        // Try to match email to existing company for automatic role assignment
        const company = await storage.getCompanyByEmailDomain(email);
        if (company) {
          const employee = await storage.getCompanyEmployeeByEmail(email);
          if (employee && employee.isActive) {
            companyId = company.id;
            roleLevel = this.getRoleLevelFromEmployeeRole(employee.role || 'employee');
            isTrialUser = false; // Company users get full access
          }
        }

        // Create new user
        user = await storage.upsertUser({
          id: externalUserId,
          email,
          companyId,
          roleLevel,
          firstName: null,
          lastName: null,
          role: this.getRoleFromLevel(roleLevel),
          isTrialUser,
          lastLoginAt: new Date(),
        });

        // Create trial usage record
        await storage.createTrialUsage({
          userId: user.id,
          companyId,
          email,
          ipAddress,
          deviceFingerprint,
          actionsUsed: 0,
          maxActions: companyId ? 100 : 10, // Company users get more trial actions
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        });
      } else {
        // Existing user - check if they should be upgraded to company access
        if (!user.companyId || user.roleLevel === 0) {
          const company = await storage.getCompanyByEmailDomain(email);
          if (company) {
            const employee = await storage.getCompanyEmployeeByEmail(email);
            if (employee && employee.isActive) {
              companyId = company.id;
              roleLevel = this.getRoleLevelFromEmployeeRole(employee.role || 'employee');
              isTrialUser = false;

              // Update user with company information
              await storage.updateUser(user.id, {
                companyId,
                roleLevel,
                role: this.getRoleFromLevel(roleLevel),
                isTrialUser,
                lastLoginAt: new Date(),
              });

              user.companyId = companyId;
              user.roleLevel = roleLevel;
              user.isTrialUser = isTrialUser;
            }
          }
        } else {
          companyId = user.companyId;
          roleLevel = user.roleLevel;
          isTrialUser = user.isTrialUser || false;
        }

        // Update last login
        await storage.updateUser(user.id, { lastLoginAt: new Date() });
      }

      // Create session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await storage.createUserSession({
        userId: user.id,
        sessionToken,
        email,
        companyId,
        roleLevel,
        expiresAt,
      });

      return {
        userId: user.id,
        email,
        companyId,
        roleLevel,
        sessionToken,
      };
    } catch (error) {
      console.error('Error authenticating external user:', error);
      return null;
    }
  }

  // Verify session token with connection management
  async verifySession(sessionToken: string): Promise<AuthSession | null> {
    try {
      console.log('🔍 CHECKPOINT A - AuthService: verifying session token:', sessionToken.substring(0, 20) + '...');
      
      // Handle demo sessions without database
      if (sessionToken.startsWith('demo-session-')) {
        console.log('🔍 CHECKPOINT B - Demo session detected, returning demo user');
        return {
          userId: 'demo-user',
          email: 'demo@aisentinel.com',
          companyId: 1,
          roleLevel: 0,
          sessionToken: sessionToken,
          isDeveloper: false,
          testRole: undefined
        };
      }

      // Try database session verification with timeout protection
      let session = null;
      try {
        // Set a timeout for database operations to prevent hanging
        const dbOperation = Promise.race([
          storage.getUserSession(sessionToken),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 5000)
          )
        ]);
        
        session = await dbOperation;
        console.log('🔍 CHECKPOINT B - AuthService: found session:', !!session);
      } catch (dbError) {
        console.warn('🔍 CHECKPOINT ERROR - Database session verification failed:', dbError instanceof Error ? dbError.message : String(dbError));
        
        // Database unavailable, cannot verify session - authentication fails
        return null;
      }

      if (!session || (session as any).expiresAt < new Date()) {
        console.log('🔍 CHECKPOINT C - AuthService: session invalid or expired');
        return null;
      }

      const typedSession = session as any;
      console.log('🔍 CHECKPOINT D - Raw session from database:', {
        userId: typedSession.userId,
        email: typedSession.email,
        roleLevel: typedSession.roleLevel,
        testRole: typedSession.testRole,
        timestamp: new Date().toISOString()
      });

      // Try to update last accessed time, but don't fail if database is unavailable
      try {
        await storage.updateUserSessionLastAccessed(typedSession.id);
      } catch (updateError) {
        console.warn('Failed to update session last accessed time:', updateError instanceof Error ? updateError.message : String(updateError));
      }

      // Check if this is a developer email
      const isDeveloper = this.isDeveloperEmail(typedSession.email);
      console.log('🔍 CHECKPOINT E - Developer check result:', isDeveloper, 'for email:', typedSession.email);

      const result = {
        userId: typedSession.userId,
        email: typedSession.email,
        companyId: typedSession.companyId,
        roleLevel: typedSession.roleLevel || 0,
        sessionToken: typedSession.sessionToken,
        isDeveloper,
        testRole: typedSession.testRole || undefined,
      };
      
      console.log('🔍 CHECKPOINT F - Final session result before return:', {
        email: result.email,
        roleLevel: result.roleLevel,
        isDeveloper: result.isDeveloper,
        testRole: result.testRole,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('🔍 CHECKPOINT ERROR - Error verifying session:', error);
      return null;
    }
  }

  // Logout - invalidate session
  async logout(sessionToken: string): Promise<boolean> {
    try {
      await storage.deleteUserSession(sessionToken);
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }

  // Helper methods
  private getRoleLevelFromEmployeeRole(role: string): number {
    switch (role) {
      case 'super-user':
        return 1000;
      case 'owner':
        return 999;
      case 'administrator':
        return 998;
      case 'admin':
        return 2;
      case 'employee':
      default:
        return 1;
    }
  }

  private getRoleFromLevel(level: number): string {
    if (level >= 1000) return 'super-user';
    if (level >= 999) return 'owner';
    if (level >= 998) return 'admin';
    if (level >= 2) return 'admin';
    if (level >= 1) return 'user';
    return 'guest';
  }

  // Check if user has trial actions remaining
  async checkTrialUsage(userId: string): Promise<{ hasActionsRemaining: boolean; actionsUsed: number; maxActions: number; isTrialExpired: boolean } | null> {
    try {
      const trialUsage = await storage.getTrialUsageByUserId(userId);
      if (!trialUsage) {
        return null;
      }

      const isTrialExpired = trialUsage.trialEndDate ? trialUsage.trialEndDate < new Date() : false;
      const hasActionsRemaining = trialUsage.actionsUsed < trialUsage.maxActions && !isTrialExpired;

      return {
        hasActionsRemaining,
        actionsUsed: trialUsage.actionsUsed,
        maxActions: trialUsage.maxActions,
        isTrialExpired,
      };
    } catch (error) {
      console.error('Error checking trial usage:', error);
      return null;
    }
  }

  // Increment trial usage when user performs an action
  async incrementTrialUsage(userId: string): Promise<boolean> {
    try {
      return await storage.incrementTrialUsage(userId);
    } catch (error) {
      console.error('Error incrementing trial usage:', error);
      return false;
    }
  }

  // Extract email domain
  getEmailDomain(email: string): string {
    return email.split('@')[1].toLowerCase();
  }

  private getBaseUrl(): string {
    // Always use production URL for consistency
    return process.env.APP_URL || 'https://aisentinel.app';
  }
}

export const authService = new AuthService();