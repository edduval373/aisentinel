import { nanoid } from 'nanoid';
import { storage } from '../storage';
import { emailService } from './emailService';

export interface AuthSession {
  userId: string;
  email: string;
  companyId: number | null;
  roleLevel: number;
  sessionToken: string;
}

export class AuthService {
  // Generate secure session token
  generateSessionToken(): string {
    return nanoid(64);
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

  // Verify email token and create session
  async verifyEmailToken(token: string): Promise<AuthSession | null> {
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
      let roleLevel = 1; // Default to user level

      if (!user) {
        // Check if email belongs to a company
        const company = await storage.getCompanyByEmailDomain(email);
        if (company) {
          const employee = await storage.getCompanyEmployeeByEmail(email);
          if (employee) {
            companyId = company.id;
            roleLevel = this.getRoleLevelFromEmployeeRole(employee.role);
          }
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
        });
      } else {
        companyId = user.companyId;
        roleLevel = user.roleLevel || 1;
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

  // Verify session token
  async verifySession(sessionToken: string): Promise<AuthSession | null> {
    try {
      const session = await storage.getUserSession(sessionToken);
      
      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      // Update last accessed time
      await storage.updateUserSessionLastAccessed(session.id);

      return {
        userId: session.userId,
        email: session.email,
        companyId: session.companyId,
        roleLevel: session.roleLevel,
        sessionToken: session.sessionToken,
      };
    } catch (error) {
      console.error('Error verifying session:', error);
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
      case 'owner':
        return 99;
      case 'admin':
        return 2;
      case 'employee':
      default:
        return 1;
    }
  }

  private getRoleFromLevel(level: number): string {
    if (level >= 100) return 'super-user';
    if (level >= 99) return 'owner';
    if (level >= 2) return 'admin';
    return 'user';
  }

  // Extract email domain
  getEmailDomain(email: string): string {
    return email.split('@')[1].toLowerCase();
  }
}

export const authService = new AuthService();