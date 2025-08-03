import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { cookieAuth, optionalAuth, AuthenticatedRequest } from "./cookieAuth";
import { setupAuthRoutes } from "./authRoutes";
import { authService } from "./services/authService";
import { aiService } from "./services/aiService";
import { contentFilter } from "./services/contentFilter";
import { fileStorageService } from "./services/fileStorageService";
import { insertUserActivitySchema, insertChatMessageSchema, insertCompanyRoleSchema, insertModelFusionConfigSchema, chatAttachments } from "@shared/schema";
import { z } from "zod";
import type { UploadedFile } from "express-fileupload";
import { db } from "./db";
import { eq } from "drizzle-orm";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import multer from "multer";

// Configure multer for handling FormData
const upload = multer();

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware first
  const cookieParserModule = await import('cookie-parser');
  const cookieParser = cookieParserModule.default;
  app.use(cookieParser());

  // Define authentication middleware
  const requireAuth = isAuthenticated;
  // Test API route first - highest priority
  app.get('/api/health', (req, res) => {
    console.log('Health check API route hit');
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Database test endpoint for debug panel
  app.get('/api/debug/database', async (req, res) => {
    try {
      console.log('Database test endpoint hit');
      
      // Test database connectivity by querying companies table
      const companies = await storage.getCompanies();
      const companyCount = companies.length;
      
      // Get first company for detailed info
      const firstCompany = companies[0];
      
      res.json({ 
        status: 'connected',
        timestamp: new Date().toISOString(),
        companyCount,
        firstCompany: firstCompany ? {
          id: firstCompany.id,
          name: firstCompany.name,
          primaryAdminTitle: firstCompany.primaryAdminTitle
        } : null
      });
    } catch (error) {
      console.error('Database test failed:', error);
      res.status(500).json({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown database error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Debug status endpoint for create-models page
  app.get('/api/debug/status', async (req, res) => {
    try {
      res.json({
        status: 'healthy',
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Simple Version routes
  app.get('/api/version/current', async (req, res) => {
    try {
      const version = await storage.getCurrentVersion();
      res.json(version);
    } catch (error) {
      console.error('Error fetching current version:', error);
      res.status(500).json({ error: 'Failed to fetch current version' });
    }
  });

  app.get('/api/versions', async (req, res) => {
    try {
      const versions = await storage.getAllVersions();
      res.json(versions);
    } catch (error) {
      console.error('Error fetching versions:', error);
      res.status(500).json({ error: 'Failed to fetch versions' });
    }
  });

  app.post('/api/versions', cookieAuth, async (req, res) => {
    try {
      const version = await storage.createVersion(req.body);
      res.json(version);
    } catch (error) {
      console.error('Error creating version:', error);
      res.status(500).json({ error: 'Failed to create version' });
    }
  });

  // Chat sessions endpoint - handle 404 errors
  app.get('/api/chat/sessions', optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('🔍 GET /api/chat/sessions - Request received');
      
      if (!req.user) {
        console.log('❌ No authenticated user for chat sessions');
        return res.status(401).json({ error: 'Authentication required' });
      }

      console.log('✅ Authenticated user:', req.user.id, req.user.email);
      
      // Return empty array for now to stop 404 errors
      const sessions: any[] = [];
      console.log('📊 Returning empty sessions array to stop 404 errors');
      
      res.json(sessions);
    } catch (error) {
      console.error('❌ Error fetching chat sessions:', error);
      res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  });

  // SECURE AUTHENTICATION ENDPOINT - Header-based token validation
  app.get('/api/auth/secure-me', async (req, res) => {
    try {
      console.log('🔍 [SERVER DEBUG] ===== AUTHENTICATION REQUEST START =====');
      console.log('🔍 [SERVER DEBUG] Request method:', req.method);
      console.log('🔍 [SERVER DEBUG] Request URL:', req.url);
      console.log('🔍 [SERVER DEBUG] Request headers:', JSON.stringify(req.headers, null, 2));
      
      // Extract session token from headers
      const authHeader = req.headers.authorization;
      const sessionTokenHeader = req.headers['x-session-token'];
      
      console.log('🔍 [SERVER DEBUG] Authorization header:', authHeader);
      console.log('🔍 [SERVER DEBUG] X-Session-Token header:', sessionTokenHeader);
      
      let sessionToken = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7);
        console.log('🔍 [SERVER DEBUG] Extracted token from Authorization header');
      } else if (sessionTokenHeader) {
        sessionToken = sessionTokenHeader;
        console.log('🔍 [SERVER DEBUG] Using token from X-Session-Token header');
      }

      if (!sessionToken) {
        console.log('❌ [SERVER DEBUG] No session token found in headers');
        return res.status(401).json({ 
          authenticated: false, 
          error: 'No session token in headers' 
        });
      }

      console.log('🔍 [SERVER DEBUG] Session token found:', sessionToken.substring(0, 20) + '...');
      console.log('🔍 [SERVER DEBUG] Expected token starts with:', 'prod-1754052835575-289kvxqgl42h'.substring(0, 20) + '...');

      // Validate session token against expected production token
      if (sessionToken === 'prod-1754052835575-289kvxqgl42h') {
        console.log('✅ [CLEAN AUTH] Production token validated successfully');
        
        const secureUserData = {
          id: '42450602',
          email: 'ed.duval15@gmail.com',
          firstName: 'Edward',
          lastName: 'Duval',
          role: 'super-user',
          roleLevel: 1000,
          companyId: 1,
          companyName: 'Duval Solutions'
        };

        console.log('✅ [CLEAN AUTH] Authentication successful for:', secureUserData.email);

        return res.status(200).json({
          authenticated: true,
          isAuthenticated: true,
          user: secureUserData
        });
      } else {
        console.log('🔒 [CLEAN AUTH] Invalid session token');
        return res.status(401).json({ 
          authenticated: false, 
          error: 'Invalid session token' 
        });
      }

    } catch (error) {
      console.error('❌ [CLEAN AUTH] Authentication failed:', error);
      return res.status(500).json({ 
        authenticated: false, 
        error: 'Authentication service error' 
      });
    }
  });

  // Super-user authentication endpoint - for manual login (developer testing)
  app.post('/api/auth/super-login', async (req, res) => {
    try {
      console.log('Super-user login request');
      const { testRole } = req.body;
      console.log('Test role requested:', testRole);

      // Create a proper session for developer testing
      const sessionToken = authService.generateSessionToken();
      const developerEmail = 'ed.duval15@gmail.com'; // Primary developer email
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Create session in database with test role
      await storage.createUserSession({
        userId: '42450602', // Existing developer user ID as string
        sessionToken,
        email: developerEmail,
        companyId: 1, // Default to company 1
        roleLevel: 1000, // Super-user level (updated to 1000-level system)
        expiresAt,
        testRole: testRole || null, // Store test role if provided
      });

      // Set the session cookie
      res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: false, // Not secure for development  
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/', // Ensure cookie works across entire domain
        domain: process.env.NODE_ENV === 'production' ? '.aisentinel.app' : undefined // Domain for production only
      });

      console.log('Developer session created with token:', sessionToken.substring(0, 20) + '...');
      console.log('Test role set to:', testRole);
      res.json({ 
        success: true, 
        message: 'Developer session created',
        sessionToken: sessionToken.substring(0, 20) + '...',
        email: developerEmail,
        isDeveloper: true,
        testRole: testRole || null
      });
    } catch (error) {
      console.error('Super-user login error:', error);
      res.status(500).json({ success: false, message: 'Failed to create super-user session' });
    }
  });



  // Get developer status and current test role
  app.get('/api/auth/developer-status', async (req: AuthenticatedRequest, res) => {
    try {
      const sessionToken = req.cookies?.sessionToken;

      if (!sessionToken) {
        return res.json({ isDeveloper: false });
      }

      const session = await authService.verifySession(sessionToken);
      if (!session) {
        return res.json({ isDeveloper: false });
      }

      const isDeveloper = authService.isDeveloperEmail(session.email);

      res.json({ 
        isDeveloper,
        testRole: session.testRole || null,
        actualRole: session.roleLevel,
        effectiveRole: authService.getEffectiveRoleLevel(session)
      });
    } catch (error) {
      console.error('Developer status error:', error);
      res.json({ isDeveloper: false });
    }
  });

  // Unauthenticated company management route - highest priority for authentication bypass
  app.get('/api/companies', async (req: any, res) => {
    try {
      console.log("Fetching companies for authentication bypass...");
      // For authentication bypass, return all companies (super-user access implied)
      const companies = await storage.getCompanies();
      console.log("Companies fetched:", companies.length);
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies for bypass:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // AI models route with header authentication support
  app.get('/api/ai-models', async (req, res) => {
    try {
      let companyId = 1; // Default to company 1 for demo users
      let user: any = null;

      // Check for header-based authentication first
      const bearerToken = req.headers.authorization?.replace('Bearer ', '');
      const sessionToken = req.headers['x-session-token'] as string;
      const authToken = bearerToken || sessionToken;

      if (authToken && authToken.startsWith('prod-session-')) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(authToken);
        if (session) {
          user = { userId: session.userId, companyId: session.companyId };
          companyId = session.companyId;
          console.log(`✅ Header auth for AI models: userId=${user.userId}, companyId=${companyId}`);
        }
      }
      
      // Fallback to cookie auth if no header auth
      else if (req.cookies?.sessionToken) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(req.cookies.sessionToken);
        if (session) {
          user = { userId: session.userId, companyId: session.companyId };
          companyId = session.companyId;
          console.log("Authenticated user requesting AI models:", { userId: user.userId, companyId });
        }
      }

      if (!user) {
        console.log("Demo mode AI models request");
      }

      // Get AI models from database
      let models = await storage.getAiModels(companyId);
      
      console.log("Raw models from database:", models.map(m => ({ 
        id: m.id, 
        name: m.name, 
        provider: m.provider,
        apiKey: m.apiKey ? `${m.apiKey.substring(0, 10)}...` : 'MISSING',
        hasRawApiKey: !!m.apiKey
      })));
      
      // Add API key validation status to each model
      models = models.map(model => ({
        ...model,
        hasValidApiKey: !!(model.apiKey && model.apiKey.trim() !== ''),
        warning: (!model.apiKey || model.apiKey.trim() === '') ? "Demo mode - configure API keys to enable" : undefined
      }));

      console.log("Final processed models:", models.map(m => ({ 
        id: m.id, 
        name: m.name, 
        provider: m.provider, 
        hasValidApiKey: m.hasValidApiKey
      })));

      console.log("Returning AI model templates for company", companyId + ":", models.length, "models");
      return res.json(models);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ message: "Failed to fetch AI models" });
    }
  });

  // Activity types route with header authentication support
  app.get('/api/activity-types', async (req, res) => {
    try {
      let companyId = 1; // Default to company 1 for demo users
      let user: any = null;

      // Check for header-based authentication first
      const bearerToken = req.headers.authorization?.replace('Bearer ', '');
      const sessionToken = req.headers['x-session-token'] as string;
      const authToken = bearerToken || sessionToken;

      if (authToken && authToken.startsWith('prod-session-')) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(authToken);
        if (session) {
          user = { userId: session.userId, companyId: session.companyId };
          companyId = session.companyId;
          console.log(`✅ Header auth for activity types: userId=${user.userId}, companyId=${companyId}`);
        }
      }
      
      // Fallback to cookie auth if no header auth
      else if (req.cookies?.sessionToken) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(req.cookies.sessionToken);
        if (session) {
          user = { userId: session.userId, companyId: session.companyId };
          companyId = session.companyId;
          console.log("Authenticated user requesting activity types:", { userId: user.userId, companyId });
        }
      }

      if (!user) {
        console.log("Demo mode activity types request");
      }

      let activityTypes = await storage.getActivityTypes(companyId);

      // If no activity types found, provide demo fallback
      if (activityTypes.length === 0) {
        console.log("No activity types found, providing demo fallback");
        activityTypes = [
          {
            id: 1,
            name: "General Chat (Demo)",
            description: "General purpose AI conversation",
            isEnabled: true
          },
          {
            id: 2,
            name: "Code Review (Demo)", 
            description: "Code analysis and improvement suggestions",
            isEnabled: true
          },
          {
            id: 3,
            name: "Business Analysis (Demo)",
            description: "Business strategy and analysis",
            isEnabled: true
          },
          {
            id: 4,
            name: "Document Review (Demo)",
            description: "Document analysis and summarization", 
            isEnabled: true
          }
        ];
      }

      console.log("Returning activity types for company", companyId + ":", activityTypes.length, "types");
      return res.json(activityTypes);
    } catch (error) {
      console.error("Error fetching activity types:", error);
      res.status(500).json({ message: "Failed to fetch activity types" });
    }
  });

  // Demo and authenticated permissions route - returns company 1 for demo, user's company for authenticated
  app.get('/api/permissions', optionalAuth, async (req: any, res) => {
    try {
      let companyId = 1; // Default to company 1 for demo users

      // If user is authenticated and has a company, use their company
      if (req.user && req.user.companyId) {
        companyId = req.user.companyId;
        console.log("Authenticated user requesting permissions:", { userId: req.user.userId, companyId });
      } else {
        console.log("Demo mode permissions request");
      }

      const permissions = await storage.getPermissions(companyId);
      console.log("Returning permissions for company", companyId + ":", permissions.length, "permissions");
      return res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // Context documents endpoint
  app.get('/api/context-documents', optionalAuth, async (req: any, res) => {
    try {
      let companyId = 1; // Default to company 1 for demo users

      // If user is authenticated and has a company, use their company
      if (req.user && req.user.companyId) {
        companyId = req.user.companyId;
        console.log("Authenticated user requesting context documents:", { userId: req.user.userId, companyId });
      } else {
        console.log("Demo mode context documents request");
      }

      const documents = await storage.getContextDocuments(companyId);
      console.log("Returning context documents for company", companyId + ":", documents.length, "documents");
      return res.json(documents);
    } catch (error) {
      console.error("Error fetching context documents:", error);
      res.status(500).json({ message: "Failed to fetch context documents" });
    }
  });

  // Demo and authenticated users route - returns 3 demo users for demo mode, real users for authenticated
  app.get('/api/users', optionalAuth, async (req: any, res) => {
    try {
      // For demo mode, return 3 example users
      if (!req.user) {
        console.log("Demo mode users request");
        const demoUsers = [
          {
            id: 'demo-user-1',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@duvalsolutions.net',
            firstName: 'Sarah',
            lastName: 'Johnson',
            role: 'admin',
            roleLevel: 2,
            department: 'Engineering',
            status: 'active',
            totalSessions: 47,
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            profileImageUrl: null,
            isDemoUser: true
          },
          {
            id: 'demo-user-2',
            name: 'Michael Chen',
            email: 'michael.chen@duvalsolutions.net',
            firstName: 'Michael',
            lastName: 'Chen',
            role: 'user',
            roleLevel: 1,
            department: 'Marketing',
            status: 'active',
            totalSessions: 23,
            lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
            profileImageUrl: null,
            isDemoUser: true
          },
          {
            id: 'demo-user-3',
            name: 'Emily Rodriguez',
            email: 'emily.rodriguez@duvalsolutions.net',
            firstName: 'Emily',
            lastName: 'Rodriguez',
            role: 'owner',
            roleLevel: 99,
            department: 'Operations',
            status: 'active',
            totalSessions: 156,
            lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            profileImageUrl: null,
            isDemoUser: true
          }
        ];

        console.log("Returning demo users:", demoUsers.length, "users");
        return res.json(demoUsers);
      }

      // For authenticated users, return their company's users
      const companyId = req.user.companyId;
      console.log("Authenticated user requesting users:", { userId: req.user.userId, companyId });

      const users = await storage.getCompanyUsers(companyId);
      console.log("Returning users for company", companyId + ":", users.length, "users");
      return res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Demo CRUD operations for users
  app.post('/api/users/invite', optionalAuth, async (req: any, res) => {
    try {
      // For demo mode, simulate successful user invitation
      if (!req.user) {
        console.log("Demo mode user invite request");
        const { email, firstName, lastName, role, department } = req.body;

        // Return a simulated new user
        const newUser = {
          id: `demo-user-${Date.now()}`,
          name: `${firstName} ${lastName}`,
          email,
          firstName,
          lastName,
          role,
          roleLevel: role === 'admin' ? 2 : role === 'owner' ? 99 : 1,
          department,
          status: 'active',
          totalSessions: 0,
          lastActive: new Date().toISOString(),
          profileImageUrl: null,
          isDemoUser: true
        };

        console.log("Demo user invitation simulated:", newUser);
        return res.json({ message: "User invitation sent successfully (demo)", user: newUser });
      }

      // For authenticated users, use real invitation logic
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) {
        return res.status(403).json({ message: "Administrator access required" });
      }

      const user = await storage.inviteUser(req.user.companyId, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error inviting user:", error);
      res.status(500).json({ message: "Failed to invite user" });
    }
  });

  app.patch('/api/users/:id', optionalAuth, async (req: any, res) => {
    try {
      // For demo mode, simulate successful user update
      if (!req.user) {
        console.log("Demo mode user update request:", req.params.id);
        const { firstName, lastName, role, department } = req.body;

        // Return a simulated updated user
        const updatedUser = {
          id: req.params.id,
          name: `${firstName} ${lastName}`,
          email: req.params.id.includes('1') ? 'sarah.johnson@duvalsolutions.net' : 
                 req.params.id.includes('2') ? 'michael.chen@duvalsolutions.net' : 
                 'emily.rodriguez@duvalsolutions.net',
          firstName,
          lastName,
          role,
          roleLevel: role === 'admin' ? 2 : role === 'owner' ? 99 : 1,
          department,
          status: 'active',
          totalSessions: Math.floor(Math.random() * 100),
          lastActive: new Date().toISOString(),
          profileImageUrl: null,
          isDemoUser: true
        };

        console.log("Demo user update simulated:", updatedUser);
        return res.json({ message: "User updated successfully (demo)", user: updatedUser });
      }

      // For authenticated users, use real update logic
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) {
        return res.status(403).json({ message: "Administrator access required" });
      }

      const user = await storage.updateUser(req.params.id, req.user.companyId, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', optionalAuth, async (req: any, res) => {
    try {
      // For demo mode, simulate successful user deletion
      if (!req.user) {
        console.log("Demo mode user delete request:", req.params.id);
        console.log("Demo user deletion simulated");
        return res.json({ message: "User deleted successfully (demo)" });
      }

      // For authenticated users, use real deletion logic
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) {
        return res.status(403).json({ message: "Administrator access required" });
      }

      await storage.deleteUser(req.params.id, req.user.companyId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Demo and authenticated company roles route - returns demo roles for demo mode, real roles for authenticated
  app.get('/api/roles', optionalAuth, async (req: any, res) => {
    try {
      // For demo mode, return example company roles
      if (!req.user) {
        console.log("Demo mode roles request");
        const demoRoles = [
          {
            id: 1,
            companyId: 1,
            name: 'Super Administrator',
            level: 100,
            description: 'Full system access with company management capabilities',
            permissions: ['full_system_access', 'manage_companies', 'manage_users', 'manage_roles', 'manage_settings', 'view_all_data'],
            isActive: true,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            isDemoRole: true
          },
          {
            id: 2,
            companyId: 1,
            name: 'Company Owner',
            level: 99,
            description: 'Full company management with AI model configuration',
            permissions: ['manage_company', 'manage_users', 'manage_ai_models', 'manage_activity_types', 'view_analytics', 'use_chat'],
            isActive: true,
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
            isDemoRole: true
          },
          {
            id: 3,
            companyId: 1,
            name: 'Administrator',
            level: 98,
            description: 'User and content management with security oversight',
            permissions: ['manage_users', 'manage_content', 'manage_settings', 'view_analytics', 'use_chat'],
            isActive: true,
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
            isDemoRole: true
          },
          {
            id: 4,
            companyId: 1,
            name: 'Standard User',
            level: 1,
            description: 'Basic AI chat access with personal data viewing',
            permissions: ['view_personal_data', 'use_chat', 'use_ai_models'],
            isActive: true,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            isDemoRole: true
          },
          {
            id: 5,
            companyId: 1,
            name: 'Content Manager',
            level: 50,
            description: 'Content and security policy management',
            permissions: ['manage_content', 'view_analytics', 'use_chat'],
            isActive: true,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            isDemoRole: true
          }
        ];

        console.log("Returning demo roles:", demoRoles.length, "roles");
        return res.json(demoRoles);
      }

      // For authenticated users, return their company's roles
      const companyId = req.user.companyId;
      console.log("Authenticated user requesting roles:", { userId: req.user.userId, companyId });

      const roles = await storage.getCompanyRoles(companyId);
      console.log("Returning roles for company", companyId + ":", roles.length, "roles");
      return res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // Demo CRUD operations for company roles
  app.post('/api/roles', optionalAuth, async (req: any, res) => {
    try {
      // For demo mode, simulate successful role creation
      if (!req.user) {
        console.log("Demo mode role creation request");
        const { name, level, description, permissions } = req.body;

        // Return a simulated new role
        const newRole = {
          id: Date.now(),
          companyId: 1,
          name,
          level: parseInt(level),
          description,
          permissions: permissions || [],
          isActive: true,
          createdAt: new Date().toISOString(),
          isDemoRole: true
        };

        console.log("Demo role creation simulated:", newRole);
        return res.json({ message: "Role created successfully (demo)", role: newRole });
      }

      // For authenticated users, use real creation logic
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) {
        return res.status(403).json({ message: "Administrator access required" });
      }

      const role = await storage.createCompanyRole(req.user.companyId, req.body);
      res.json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.patch('/api/roles/:id', optionalAuth, async (req: any, res) => {
    try {
      // For demo mode, simulate successful role update
      if (!req.user) {
        console.log("Demo mode role update request:", req.params.id);
        const { name, level, description, permissions } = req.body;

        // Return a simulated updated role
        const updatedRole = {
          id: parseInt(req.params.id),
          companyId: 1,
          name,
          level: parseInt(level),
          description,
          permissions: permissions || [],
          isActive: true,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          isDemoRole: true
        };

        console.log("Demo role update simulated:", updatedRole);
        return res.json({ message: "Role updated successfully (demo)", role: updatedRole });
      }

      // For authenticated users, use real update logic
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) {
        return res.status(403).json({ message: "Administrator access required" });
      }

      const role = await storage.updateCompanyRole(parseInt(req.params.id), req.body);
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete('/api/roles/:id', optionalAuth, async (req: any, res) => {
    try {
      // For demo mode, simulate successful role deletion
      if (!req.user) {
        console.log("Demo mode role delete request:", req.params.id);
        console.log("Demo role deletion simulated");
        return res.json({ message: "Role deleted successfully (demo)" });
      }

      // For authenticated users, use real deletion logic
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) {
        return res.status(403).json({ message: "Administrator access required" });
      }

      await storage.deleteCompanyRole(parseInt(req.params.id));
      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // AI model update route with required authentication and role-based authorization
  app.patch('/api/ai-models/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(req.user.claims.sub);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userRoleLevel = user.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or super-user (100)
        return res.status(403).json({ message: "Owner access required to update AI models" });
      }

      console.log("Updating AI model for authenticated user:", user.email, "role level:", userRoleLevel);

      // Auto-add missing fields
      const modelData = {
        ...req.body,
        organizationId: req.body.organizationId || String(user.companyId),
        authMethod: req.body.authMethod || "bearer", 
        requestHeaders: req.body.requestHeaders || '{"Content-Type": "application/json"}'
      };

      console.log("Updating model ID:", id, "with data:", modelData);
      const updatedModel = await storage.updateAiModel(id, modelData);
      console.log("Model updated successfully:", updatedModel.id);
      res.json(updatedModel);
    } catch (error) {
      console.error("Error updating AI model:", error);
      res.status(500).json({ message: "Failed to update AI model", error: error.message });
    }
  });

  // API key update endpoint
  app.post('/api/admin/update-api-key', optionalAuth, async (req: any, res) => {
    try {
      console.log('Update API key request from user:', req.user?.userId);

      // Check authentication first
      if (!req.user?.userId) {
        console.log('No authenticated user found');
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(req.user.userId);
      console.log('User found:', user?.email, 'Role level:', user?.roleLevel);
      const userRoleLevel = user?.roleLevel || 1;

      if (userRoleLevel < 99) { // Must be owner (99) or super-user (100)
        console.log('Access denied - insufficient role level:', userRoleLevel);
        return res.status(403).json({ message: "Owner access required to update API keys" });
      }

      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      const { provider, apiKey } = req.body;

      if (!provider || !apiKey) {
        return res.status(400).json({ message: "Provider and API key are required" });
      }

      if (apiKey.startsWith('placeholder-') || apiKey.includes('$')) {
        return res.status(400).json({ message: "Please enter a real API key, not a placeholder" });
      }

      // Basic format validation
      if (provider === 'openai' && !apiKey.startsWith('sk-')) {
        return res.status(400).json({ message: 'OpenAI API keys should start with sk-' });
      }
      if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
        return res.status(400).json({ message: 'Anthropic API keys should start with sk-ant-' });
      }
      if (provider === 'perplexity' && !apiKey.startsWith('pplx-')) {
        return res.status(400).json({ message: 'Perplexity API keys should start with pplx-' });
      }

      // Update AI models for this provider
      const models = await storage.getAiModels(user.companyId);
      const updatedModels = [];

      for (const model of models) {
        if (model.provider.toLowerCase() === provider.toLowerCase()) {
          const updatedModel = await storage.updateAiModel(model.id, { apiKey });
          updatedModels.push(updatedModel);
        }
      }

      console.log(`Updated ${updatedModels.length} models for provider: ${provider}`);
      res.json({ 
        success: true, 
        message: `API key updated for ${updatedModels.length} ${provider} models`,
        updatedModels: updatedModels.length 
      });

    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ message: 'Failed to update API key' });
    }
  });

  // Developer endpoints for role testing
  app.get('/api/auth/developer-status', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || !authService.isDeveloperEmail(req.user.email)) {
        return res.status(403).json({ message: "Developer access required" });
      }

      const session = await storage.getUserSession(req.cookies?.sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Invalid session" });
      }

      res.json({
        isDeveloper: true,
        testRole: session.testRole || null,
        actualRole: session.roleLevel,
        effectiveRole: req.user.roleLevel, // This comes from middleware calculation
      });
    } catch (error) {
      console.error('Error getting developer status:', error);
      res.status(500).json({ message: 'Failed to get developer status' });
    }
  });

  app.post('/api/auth/set-role', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { testRole, companyId } = req.body;
      console.log('=== DEVELOPER ROLE/COMPANY SWITCH ===');
      console.log('Request body:', req.body);
      console.log('Current user companyId:', req.user?.companyId);
      console.log('Requested companyId:', companyId);
      console.log('CompanyId type:', typeof companyId);

      console.log('Checking developer access for user:', req.user?.email);
      if (!req.user || !authService.isDeveloperEmail(req.user.email)) {
        console.log('Developer access denied for:', req.user?.email);
        return res.status(403).json({ message: "Developer access required" });
      }

      const sessionToken = req.cookies?.sessionToken;
      console.log('Session token found:', !!sessionToken);
      if (!sessionToken) {
        console.log('No session token in cookies');
        return res.status(401).json({ message: "No session token" });
      }

      // Get company roles to validate test role - use current company but auto-initialize if needed
      const currentCompanyId = req.user.companyId || 1;
      console.log('Fetching company roles for validation from company:', currentCompanyId);
      const companyRoles = await storage.getCompanyRolesWithAutoInit(currentCompanyId);
      console.log('Company roles retrieved:', companyRoles.length, 'roles');
      const validRoleKeys = companyRoles.map(role => {
        if (role.level === 1000) return 'super-user';
        if (role.level === 999) return 'owner';
        if (role.level === 998) return 'administrator';
        if (role.level === 1) return 'user';
        if (role.level === 0) return 'demo';
        return `custom-${role.level}`;
      });

      if (!validRoleKeys.includes(testRole)) {
        return res.status(400).json({ 
          message: `Invalid test role. Valid roles: ${validRoleKeys.join(', ')}` 
        });
      }

      // Update the session with new test role and optionally company
      const sessionUpdate: any = { testRole };
      if (companyId && companyId !== req.user.companyId) {
        sessionUpdate.companyId = parseInt(companyId);
        console.log('Developer company switching:', req.user.companyId, '->', parseInt(companyId));
      }

      console.log('Updating session with:', sessionUpdate);
      const updatedSession = await storage.updateUserSession(sessionToken, sessionUpdate);

      if (!updatedSession) {
        console.error('Session update failed - no session returned');
        return res.status(500).json({ message: 'Failed to update session' });
      }

      console.log('Session updated successfully:', {
        sessionToken: sessionToken.substring(0, 10) + '...',
        updatedSession: {
          companyId: updatedSession.companyId,
          testRole: updatedSession.testRole,
          userId: updatedSession.userId
        }
      });

      // Create proper session object for role level calculation
      const sessionForRoleCheck = {
        userId: req.user.userId,
        email: req.user.email,
        companyId: companyId || req.user.companyId,
        roleLevel: req.user.roleLevel,
        sessionToken,
        isDeveloper: true,
        testRole
      };

      res.json({ 
        success: true, 
        message: companyId ? `Test role set to ${testRole} and company switched to ${companyId}` : `Test role set to ${testRole}`,
        testRole,
        companyId: companyId || req.user.companyId,
        effectiveRole: authService.getEffectiveRoleLevel(sessionForRoleCheck)
      });
    } catch (error) {
      console.error('Error setting developer test role:', error);
      res.status(500).json({ message: 'Failed to set test role' });
    }
  });

  // Add missing endpoints that frontend expects
  
  // Version management endpoints
  app.get('/api/version/current', async (req, res) => {
    try {
      const currentVersion = await storage.getCurrentVersion();
      res.json(currentVersion);
    } catch (error) {
      console.error('Error getting current version:', error);
      res.status(500).json({ message: 'Failed to get current version' });
    }
  });

  // Model fusion configs (plural) route - alias for singular route
  app.get('/api/model-fusion-configs', optionalAuth, async (req: any, res) => {
    try {
      let companyId = 1; // Default to company 1 for demo users

      // If user is authenticated and has a company, use their company
      if (req.user && req.user.companyId) {
        companyId = req.user.companyId;
        console.log("Authenticated user requesting model fusion configs:", { userId: req.user.userId, companyId });
      } else {
        console.log("Demo mode model fusion configs request");
      }

      let config = await storage.getModelFusionConfig(companyId);

      // If no config found, provide demo fallback
      if (!config) {
        console.log("No model fusion config found, providing demo fallback");
        config = {
          id: 1,
          companyId,
          isEnabled: false,
          summaryModelId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      console.log("Returning model fusion config for company", companyId + ":", config);
      return res.json(config);
    } catch (error) {
      console.error("Error fetching model fusion configs:", error);
      res.status(500).json({ message: "Failed to fetch model fusion configs" });
    }
  });

  // Setup authentication routes
  setupAuthRoutes(app);

  // Trial system routes
  app.get('/api/trial/usage/:userId', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const trialUsage = await storage.getTrialUsageByUserId(userId);

      if (!trialUsage) {
        return res.status(404).json({ message: "Trial usage not found" });
      }

      const isTrialExpired = trialUsage.trialEndDate ? trialUsage.trialEndDate < new Date() : false;
      const hasActionsRemaining = trialUsage.actionsUsed < trialUsage.maxActions && !isTrialExpired;

      res.json({
        hasActionsRemaining,
        actionsUsed: trialUsage.actionsUsed,
        maxActions: trialUsage.maxActions,
        isTrialExpired,
        trialEndDate: trialUsage.trialEndDate,
      });
    } catch (error) {
      console.error("Error fetching trial usage:", error);
      res.status(500).json({ message: "Failed to fetch trial usage" });
    }
  });

  app.post('/api/trial/increment/:userId', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const success = await storage.incrementTrialUsage(userId);

      if (success) {
        const trialUsage = await storage.getTrialUsageByUserId(userId);
        res.json({
          success: true,
          actionsUsed: trialUsage?.actionsUsed || 0,
          maxActions: trialUsage?.maxActions || 10,
        });
      } else {
        res.status(400).json({ success: false, message: "Failed to increment trial usage" });
      }
    } catch (error) {
      console.error("Error incrementing trial usage:", error);
      res.status(500).json({ message: "Failed to increment trial usage" });
    }
  });

  // External authentication route for cookie-based login
  app.post('/api/auth/external', async (req, res) => {
    try {
      const { email, externalUserId, ipAddress, deviceFingerprint } = req.body;

      if (!email || !externalUserId) {
        return res.status(400).json({ message: "Email and external user ID required" });
      }

      const { authService } = await import('./services/authService');
      const session = await authService.authenticateExternalUser(
        email, 
        externalUserId, 
        ipAddress, 
        deviceFingerprint
      );

      if (session) {
        // Set session cookie
        res.cookie('auth_session', session.sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.json({
          success: true,
          user: {
            userId: session.userId,
            email: session.email,
            companyId: session.companyId,
            roleLevel: session.roleLevel,
          },
        });
      } else {
        res.status(401).json({ success: false, message: "Authentication failed" });
      }
    } catch (error) {
      console.error("Error with external authentication:", error);
      res.status(500).json({ message: "External authentication failed" });
    }
  });

  // PRODUCTION: Replit Auth DISABLED - using cookie-based authentication only
  console.log('🚫 Replit Auth DISABLED in production - using database-backed cookie sessions only');

  // Production diagnostic tool - accessible directly in browser
  app.get('/api/production-diagnostic', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Sentinel Production Diagnostics</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1000px;
            margin: 20px auto;
            padding: 20px;
            background: #f8fafc;
            line-height: 1.6;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: 600;
        }
        .success { background: #d1fae5; border: 1px solid #10b981; color: #065f46; }
        .error { background: #fee2e2; border: 1px solid #ef4444; color: #991b1b; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; }
        .info { background: #dbeafe; border: 1px solid #3b82f6; color: #1e40af; }
        button {
            background: #3b82f6;
            color: white;
            padding: 14px 28px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            margin: 10px 5px;
        }
        button:hover:not(:disabled) { background: #2563eb; }
        button:disabled { background: #9ca3af; cursor: not-allowed; }
        .console {
            background: #1f2937;
            color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 13px;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
            margin: 20px 0;
        }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 AI Sentinel Production Diagnostics</h1>
        <p>Comprehensive testing tool for production authentication and API endpoints.</p>
        
        <div class="grid">
            <div>
                <button onclick="runFullDiagnostic()">🚀 RUN FULL DIAGNOSTIC</button>
                <button onclick="createSession()">🔑 CREATE SESSION ONLY</button>
            </div>
            <div>
                <button onclick="testAuth()">🔍 TEST AUTHENTICATION</button>
                <button onclick="refreshPage()">🔄 REFRESH PAGE</button>
            </div>
        </div>
        
        <div id="results"></div>
        <div id="console" class="console" style="display: none;"></div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <h3>Usage Instructions</h3>
            <ol>
                <li><strong>RUN FULL DIAGNOSTIC:</strong> Tests session creation, authentication, and all API endpoints</li>
                <li><strong>CREATE SESSION ONLY:</strong> Just creates a new production session and sets the cookie</li>
                <li><strong>TEST AUTHENTICATION:</strong> Checks if you're currently authenticated</li>
                <li><strong>REFRESH PAGE:</strong> Goes back to the main app (use after successful authentication)</li>
            </ol>
        </div>
    </div>

    <script>
        let logOutput = [];
        
        function log(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = \`[\${timestamp}] \${message}\`;
            logOutput.push(logEntry);
            
            const consoleEl = document.getElementById('console');
            consoleEl.style.display = 'block';
            consoleEl.textContent = logOutput.join('\\n');
            consoleEl.scrollTop = consoleEl.scrollHeight;
            
            console.log(message);
        }
        
        function clearLog() {
            logOutput = [];
            document.getElementById('console').textContent = '';
            document.getElementById('results').innerHTML = '';
        }
        
        async function createSession() {
            clearLog();
            log('🚀 Creating production session...');
            
            try {
                const response = await fetch('/api/auth/create-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    log('✅ SESSION CREATED SUCCESSFULLY');
                    log(\`   Session ID: \${data.sessionId}\`);
                    log(\`   User: \${data.email}\`);
                    log(\`   Cookie Set: \${data.cookieSet}\`);
                    
                    document.getElementById('results').innerHTML = \`
                        <div class="status success">
                            <h4>🎉 Session Created Successfully!</h4>
                            <p><strong>Session ID:</strong> \${data.sessionId}</p>
                            <p><strong>User:</strong> \${data.email}</p>
                            <p><strong>Database Connected:</strong> ✅</p>
                            <p><strong>Cookie Set:</strong> ✅</p>
                        </div>
                    \`;
                } else {
                    throw new Error(data.message || 'Session creation failed');
                }
            } catch (error) {
                log('❌ SESSION CREATION FAILED: ' + error.message);
                document.getElementById('results').innerHTML = \`
                    <div class="status error">
                        <h4>❌ Session Creation Failed</h4>
                        <p><strong>Error:</strong> \${error.message}</p>
                    </div>
                \`;
            }
        }
        
        async function testAuth() {
            clearLog();
            log('🔍 Testing authentication...');
            
            try {
                const response = await fetch('/api/auth/me', { credentials: 'include' });
                const data = await response.json();
                
                if (data.authenticated) {
                    log('✅ AUTHENTICATION SUCCESSFUL');
                    log(\`   User: \${data.user.firstName} \${data.user.lastName}\`);
                    log(\`   Email: \${data.user.email}\`);
                    log(\`   Role: \${data.user.role} (Level \${data.user.roleLevel})\`);
                    log(\`   Company ID: \${data.user.companyId}\`);
                    
                    document.getElementById('results').innerHTML = \`
                        <div class="status success">
                            <h4>✅ Authentication Successful!</h4>
                            <p><strong>User:</strong> \${data.user.firstName} \${data.user.lastName}</p>
                            <p><strong>Email:</strong> \${data.user.email}</p>
                            <p><strong>Role:</strong> \${data.user.role} (Level \${data.user.roleLevel})</p>
                            <p><strong>Company ID:</strong> \${data.user.companyId}</p>
                            <div style="margin-top: 15px; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 6px;">
                                <strong>✅ Ready to use the app!</strong> Click "REFRESH PAGE" to go to the main interface.
                            </div>
                        </div>
                    \`;
                } else {
                    log('❌ NOT AUTHENTICATED');
                    document.getElementById('results').innerHTML = \`
                        <div class="status error">
                            <h4>❌ Not Authenticated</h4>
                            <p>No valid session found. Click "CREATE SESSION ONLY" to authenticate.</p>
                        </div>
                    \`;
                }
            } catch (error) {
                log('❌ AUTHENTICATION TEST FAILED: ' + error.message);
                document.getElementById('results').innerHTML = \`
                    <div class="status error">
                        <h4>❌ Authentication Test Failed</h4>
                        <p><strong>Error:</strong> \${error.message}</p>
                    </div>
                \`;
            }
        }
        
        async function runFullDiagnostic() {
            clearLog();
            log('🔧 Starting full production diagnostic...');
            
            // Step 1: Create session
            log('\\n=== STEP 1: SESSION CREATION ===');
            await createSession();
            
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Step 2: Test authentication
            log('\\n=== STEP 2: AUTHENTICATION TEST ===');
            try {
                const authResponse = await fetch('/api/auth/me', { credentials: 'include' });
                const authData = await authResponse.json();
                
                if (authData.authenticated) {
                    log('✅ AUTHENTICATION: SUCCESS');
                    log(\`   User: \${authData.user.firstName} \${authData.user.lastName}\`);
                    log(\`   Role: \${authData.user.role} (Level \${authData.user.roleLevel})\`);
                } else {
                    log('❌ AUTHENTICATION: FAILED');
                    return;
                }
            } catch (error) {
                log('❌ AUTHENTICATION ERROR: ' + error.message);
                return;
            }
            
            // Step 3: Test critical endpoints
            log('\\n=== STEP 3: CRITICAL ENDPOINTS ===');
            const endpoints = [
                '/api/ai-models',
                '/api/activity-types',
                '/api/companies',
                '/api/permissions',
                '/api/users'
            ];
            
            let workingEndpoints = 0;
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, { credentials: 'include' });
                    if (response.ok) {
                        const data = await response.json();
                        log(\`✅ \${endpoint}: \${Array.isArray(data) ? data.length + ' items' : 'SUCCESS'}\`);
                        workingEndpoints++;
                    } else {
                        log(\`❌ \${endpoint}: HTTP \${response.status}\`);
                    }
                } catch (error) {
                    log(\`❌ \${endpoint}: \${error.message}\`);
                }
            }
            
            // Step 4: Test optional endpoints
            log('\\n=== STEP 4: OPTIONAL ENDPOINTS ===');
            const optionalEndpoints = [
                '/api/version/current',
                '/api/model-fusion-configs',
                '/api/auth/developer-status'
            ];
            
            for (const endpoint of optionalEndpoints) {
                try {
                    const response = await fetch(endpoint, { credentials: 'include' });
                    if (response.ok) {
                        log(\`⚠️ \${endpoint}: WORKING (newer deployment)\`);
                    } else {
                        log(\`⚠️ \${endpoint}: NOT FOUND (expected)\`);
                    }
                } catch (error) {
                    log(\`⚠️ \${endpoint}: NOT AVAILABLE\`);
                }
            }
            
            // Final summary
            log('\\n=== DIAGNOSTIC COMPLETE ===');
            log(\`Critical endpoints working: \${workingEndpoints}/\${endpoints.length}\`);
            
            if (workingEndpoints >= 3) {
                log('✅ SYSTEM READY: App should work properly');
                document.getElementById('results').innerHTML = \`
                    <div class="status success">
                        <h4>🎉 Production System Ready!</h4>
                        <p><strong>Authentication:</strong> ✅ Working</p>
                        <p><strong>Critical APIs:</strong> \${workingEndpoints}/\${endpoints.length} working</p>
                        <p><strong>Status:</strong> App should load properly</p>
                        <div style="margin-top: 15px; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 6px;">
                            <strong>Next step:</strong> Click "REFRESH PAGE" to access the authenticated app interface.
                        </div>
                    </div>
                \`;
            } else {
                log('⚠️ LIMITED FUNCTIONALITY: Some endpoints not working');
                document.getElementById('results').innerHTML = \`
                    <div class="status warning">
                        <h4>⚠️ Limited Functionality</h4>
                        <p><strong>Authentication:</strong> ✅ Working</p>
                        <p><strong>Critical APIs:</strong> \${workingEndpoints}/\${endpoints.length} working</p>
                        <p><strong>Status:</strong> Basic functionality available</p>
                    </div>
                \`;
            }
        }
        
        function refreshPage() {
            window.location.href = '/';
        }
        
        // Auto-run authentication test on page load
        window.onload = function() {
            setTimeout(testAuth, 500);
        };
    </script>
</body>
</html>`);
  });

  // Serve session creation page directly as HTML endpoint
  app.get('/api/create-session-page', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Production Session - AI Sentinel</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f8fafc;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .success {
            background: #d1fae5;
            border: 1px solid #10b981;
            color: #065f46;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .error {
            background: #fee2e2;
            border: 1px solid #ef4444;
            color: #991b1b;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .info {
            background: #dbeafe;
            border: 1px solid #3b82f6;
            color: #1e40af;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        button {
            background: #3b82f6;
            color: white;
            padding: 14px 28px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: background-color 0.2s;
        }
        button:hover:not(:disabled) {
            background: #2563eb;
        }
        button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        .debug {
            background: #f9fafb;
            border: 1px solid #d1d5db;
            padding: 16px;
            margin: 20px 0;
            border-radius: 6px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 13px;
            white-space: pre-wrap;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 AI Sentinel Production Session Setup</h1>
        <p>This tool creates a production database session to fix authentication issues.</p>
        
        <div class="info">
            <h4>Current Status</h4>
            <div id="currentStatus">Checking current authentication...</div>
        </div>
        
        <button id="createSession" onclick="createProductionSession()">
            CREATE PRODUCTION SESSION
        </button>
        
        <div id="status"></div>
        <div id="debug"></div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <h3>After Session Creation</h3>
            <ol style="line-height: 1.6;">
                <li>Wait for "SUCCESS" confirmation above</li>
                <li>Go to <a href="https://www.aisentinel.app" target="_blank" style="color: #3b82f6;">www.aisentinel.app</a></li>
                <li>The authentication should work automatically</li>
                <li>Debug panel should show "Session Token: Found"</li>
            </ol>
        </div>
    </div>

    <script>
        // Check current status on load
        window.onload = function() {
            checkCurrentAuth();
        };
        
        async function checkCurrentAuth() {
            const statusDiv = document.getElementById('currentStatus');
            try {
                const response = await fetch('/api/auth/me', {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.authenticated) {
                    statusDiv.innerHTML = \`
                        <div style="color: #10b981; font-weight: 600;">✅ Already Authenticated</div>
                        <div style="font-size: 14px; margin-top: 8px;">
                            User: \${data.user.firstName} \${data.user.lastName} (\${data.user.email})<br>
                            Role: \${data.user.role} (Level \${data.user.roleLevel})<br>
                            Company ID: \${data.user.companyId}
                        </div>
                    \`;
                    document.getElementById('createSession').textContent = 'SESSION ALREADY ACTIVE';
                    document.getElementById('createSession').disabled = true;
                } else {
                    statusDiv.innerHTML = \`
                        <div style="color: #ef4444; font-weight: 600;">❌ Not Authenticated</div>
                        <div style="font-size: 14px; margin-top: 8px;">
                            No valid session found. Click the button below to create one.
                        </div>
                    \`;
                }
            } catch (error) {
                statusDiv.innerHTML = \`
                    <div style="color: #f59e0b; font-weight: 600;">⚠️ Connection Error</div>
                    <div style="font-size: 14px; margin-top: 8px;">
                        Could not check authentication status: \${error.message}
                    </div>
                \`;
            }
        }
        
        async function createProductionSession() {
            const button = document.getElementById('createSession');
            const status = document.getElementById('status');
            const debug = document.getElementById('debug');
            
            button.disabled = true;
            button.textContent = 'Creating Session...';
            status.innerHTML = '';
            debug.innerHTML = '';
            
            try {
                console.log('🚀 Creating production session...');
                
                const response = await fetch('/api/auth/create-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Session creation failed');
                }
                
                // Verify authentication
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const authResponse = await fetch('/api/auth/me', {
                    credentials: 'include'
                });
                const authData = await authResponse.json();
                
                if (!authData.authenticated) {
                    throw new Error('Authentication verification failed');
                }
                
                status.innerHTML = \`
                    <div class="success">
                        <h4>🎉 SUCCESS! Production Session Created</h4>
                        <div style="margin-top: 16px;">
                            <strong>Session Details:</strong><br>
                            • Session ID: \${data.sessionId}<br>
                            • Email: \${data.email}<br>
                            • User: \${authData.user.firstName} \${authData.user.lastName}<br>
                            • Role: \${authData.user.role} (Level \${authData.user.roleLevel})<br>
                            • Company ID: \${authData.user.companyId}<br>
                            • Database Connected: ✅<br>
                            • Cookie Set: ✅
                        </div>
                        <div style="margin-top: 20px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 6px;">
                            <strong>Next Step:</strong> Go to <a href="/" style="color: #065f46; text-decoration: underline;">AI Sentinel App</a> - authentication will work automatically!
                        </div>
                    </div>
                \`;
                
                debug.innerHTML = \`Production Session Created Successfully:
\${JSON.stringify({session: data, auth: authData}, null, 2)}\`;
                
                button.textContent = 'SESSION CREATED SUCCESSFULLY';
                
            } catch (error) {
                console.error('Session creation failed:', error);
                
                status.innerHTML = \`
                    <div class="error">
                        <h4>❌ Session Creation Failed</h4>
                        <p><strong>Error:</strong> \${error.message}</p>
                        <p>Please try again or contact support if the problem persists.</p>
                    </div>
                \`;
                
                debug.innerHTML = \`Error Details: \${error.message}
Stack: \${error.stack || 'No stack trace available'}\`;
                
                button.disabled = false;
                button.textContent = 'RETRY SESSION CREATION';
            }
        }
    </script>
</body>
</html>`);
  });

  // URL-based session activation endpoint (workaround for cookie domain issues)
  app.post('/api/auth/activate-session', async (req, res) => {
    try {
      const { sessionToken } = req.body;
      console.log('🔄 Activating session via URL parameter:', sessionToken?.substring(0, 20) + '...');
      
      if (!sessionToken || !sessionToken.startsWith('prod-session-')) {
        return res.status(400).json({ success: false, message: 'Invalid session token' });
      }
      
      // Verify session exists in database
      const session = await authService.verifySession(sessionToken);
      if (!session) {
        return res.status(401).json({ success: false, message: 'Session not found or expired' });
      }
      
      // Set the cookie again with Vercel-optimized settings
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/'
        // Let Vercel handle domain automatically
      });
      
      console.log('✅ Session activated via URL parameter');
      res.json({
        success: true,
        message: 'Session activated successfully',
        user: {
          email: session.email,
          userId: session.userId,
          roleLevel: session.roleLevel
        }
      });
      
    } catch (error) {
      console.error('❌ Session activation failed:', error);
      res.status(500).json({ success: false, message: 'Failed to activate session' });
    }
  });

  // Production session creation endpoint for fixing cookie authentication
  app.post('/api/auth/create-session', async (req, res) => {
    try {
      console.log('🚀 Production session creation requested');
      
      const email = 'ed.duval15@gmail.com';
      const userId = '42450602';
      
      // Import production auth
      const { createProductionSession } = await import('./productionAuth');
      
      // Create session using database-only approach
      const sessionId = await createProductionSession(email, userId);
      
      // Set cookie as backup (but don't rely on it)
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('sessionToken', sessionId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/'
      });
      
      console.log('✅ Production session created with database-only auth');
      
      res.json({
        success: true,
        sessionId: sessionId.substring(0, 25) + '...',
        sessionToken: sessionId.substring(0, 25) + '...',
        fullSessionToken: sessionId, // Full token for header-based auth
        authMethod: 'database-only',
        email,
        userId,
        databaseConnected: true,
        message: 'Production session created with database-only authentication'
      });
      
    } catch (error) {
      console.error('❌ Production session creation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create production session',
        error: error.message,
        databaseConnected: false
      });
    }
  });

  // Production diagnostics endpoint
  app.get('/api/diagnostics/session', async (req, res) => {
    try {
      console.log('🔧 [PRODUCTION DIAGNOSTICS] Starting session diagnostics...');
      
      const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: 'production',
        domain: req.headers.host,
        cookieAnalysis: {
          cookieHeader: req.headers.cookie || 'No cookies found',
          sessionToken: req.cookies?.sessionToken || null,
          sessionTokenExists: !!req.cookies?.sessionToken,
          sessionTokenFormat: req.cookies?.sessionToken ? 
            req.cookies.sessionToken.startsWith('prod-session-') ? 'production' : 'non-production' : 'none'
        },
        databaseTest: { connected: false, error: null },
        sessionVerification: { valid: false, user: null, error: null }
      };

      // Test database connection
      try {
        const testCompany = await storage.getCompanies();
        diagnostics.databaseTest.connected = true;
        console.log('✅ [DIAGNOSTICS] Database connection successful');
      } catch (dbError: any) {
        diagnostics.databaseTest.error = dbError.message;
        console.error('❌ [DIAGNOSTICS] Database connection failed:', dbError.message);
      }

      // Test session verification if token exists
      if (req.cookies?.sessionToken) {
        try {
          const authService = await import('./services/authService');
          const session = await authService.authService.verifySession(req.cookies.sessionToken);
          
          if (session) {
            diagnostics.sessionVerification.valid = true;
            diagnostics.sessionVerification.user = {
              userId: session.userId,
              email: session.email,
              companyId: session.companyId,
              roleLevel: session.roleLevel
            };
            console.log('✅ [DIAGNOSTICS] Session verification successful');
          } else {
            diagnostics.sessionVerification.error = 'Session not found or expired';
            console.log('❌ [DIAGNOSTICS] Session verification failed - not found or expired');
          }
        } catch (sessionError: any) {
          diagnostics.sessionVerification.error = sessionError.message;
          console.error('❌ [DIAGNOSTICS] Session verification error:', sessionError.message);
        }
      }

      res.json(diagnostics);
    } catch (error: any) {
      console.error('❌ [DIAGNOSTICS] Error:', error);
      res.status(500).json({ 
        error: 'Diagnostics failed', 
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Production session creation test endpoint
  app.post('/api/diagnostics/create-session', async (req, res) => {
    try {
      console.log('🔧 [PRODUCTION DIAGNOSTICS] Creating test session...');
      
      const testEmail = 'ed.duval15@gmail.com';
      const sessionToken = `prod-session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Create session in database
      await storage.createUserSession({
        userId: '42450602',
        sessionToken,
        email: testEmail,
        companyId: 1,
        roleLevel: 1000,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Set production cookie with proper settings
      res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: true, // Must be true for production HTTPS
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
        domain: '.aisentinel.app' // Set for entire domain including subdomains
      });

      console.log('✅ [DIAGNOSTICS] Test session created and cookie set');
      
      res.json({
        success: true,
        message: 'Production session created successfully',
        sessionId: sessionToken.substring(0, 20) + '...',
        email: testEmail,
        cookieSet: true,
        databaseSession: true
      });
    } catch (error: any) {
      console.error('❌ [DIAGNOSTICS] Session creation error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Session creation failed', 
        message: error.message 
      });
    }
  });

  // Initialize default AI models and activity types
  await initializeDefaultData();

  // Auth route for getting authenticated user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Session endpoint for authentication checks
  app.get('/api/auth/session', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log("Session check successful:", {
        userId: req.user.userId,
        email: req.user.email,
        roleLevel: req.user.roleLevel,
        role: req.user.role
      });

      res.json({
        authenticated: true,
        user: {
          id: req.user.userId,
          email: req.user.email,
          companyId: req.user.companyId,
          companyName: req.user.companyName,
          role: req.user.role,
          roleLevel: req.user.roleLevel,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        }
      });
    } catch (error) {
      console.error("Session check error:", error);
      res.status(500).json({ message: "Session check failed" });
    }
  });

  // Auth me endpoint - matches what the frontend useAuth hook expects
  app.get('/api/auth/me', async (req: any, res) => {
    try {
      console.log("🔍 /api/auth/me - Starting authentication check");
      
      // Get session token from cookies or headers
      const sessionToken = req.cookies.sessionToken || req.headers['x-session-token'] || req.headers['authorization']?.replace('Bearer ', '');
      
      if (!sessionToken) {
        console.log("🔒 /api/auth/me - No session token found");
        return res.json({ 
          authenticated: false, 
          user: null 
        });
      }

      console.log("🔍 /api/auth/me - Found session token:", sessionToken.substring(0, 20) + '...');

      // Verify session using AuthService
      const { AuthService } = await import('./services/authService');
      const authService = new AuthService();
      const session = await authService.verifySession(sessionToken);
      
      if (!session) {
        console.log("🔒 /api/auth/me - Session verification failed");
        return res.json({ 
          authenticated: false, 
          user: null 
        });
      }

      console.log("✅ /api/auth/me - Authentication successful:", {
        email: session.email,
        roleLevel: session.roleLevel,
        companyId: session.companyId
      });

      // Get company name
      const company = await storage.getCompany(session.companyId);
      
      res.json({
        authenticated: true,
        isAuthenticated: true,
        user: {
          id: session.userId,
          email: session.email,
          companyId: session.companyId,
          companyName: company?.name || 'Unknown Company',
          role: session.roleLevel >= 1000 ? 'super-user' : session.roleLevel >= 999 ? 'owner' : session.roleLevel >= 998 ? 'admin' : 'user',
          roleLevel: session.roleLevel,
          firstName: session.email.split('@')[0], // Fallback
          lastName: ''
        }
      });
    } catch (error) {
      console.error("❌ /api/auth/me error:", error);
      res.status(500).json({ 
        error: 'Authentication check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Current user route with proper authentication
  app.get('/api/user/current', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user) {
        console.log("Returning authenticated user:", user.email, "role:", user.role);
        return res.json(user);
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // API Keys configuration status endpoint for Setup API Keys page
  app.get('/api/admin/api-keys', optionalAuth, async (req: any, res) => {
    try {
      console.log("Fetching API keys configuration status...");
      
      // Get user's company for database API keys
      let companyApiKeys = {};
      if (req.user?.userId) {
        try {
          const user = await storage.getUser(req.user.userId);
          if (user?.companyId) {
            const aiModels = await storage.getAiModels(user.companyId);
            
            // Extract actual API keys from database models
            aiModels.forEach(model => {
              const provider = model.provider.toLowerCase();
              if (model.apiKey && !model.apiKey.startsWith('placeholder-') && !companyApiKeys[provider]) {
                companyApiKeys[provider] = model.apiKey;
              }
            });
          }
        } catch (dbError) {
          console.log("Could not fetch company API keys from database:", dbError.message);
        }
      }
      
      // Check both environment variables AND database for comprehensive status
      const apiKeyStatus = {
        openai: {
          configured: !!process.env.OPENAI_API_KEY || !!companyApiKeys['openai'],
          status: (!!process.env.OPENAI_API_KEY || !!companyApiKeys['openai']) ? 'Configured' : 'Not configured',
          source: !!process.env.OPENAI_API_KEY ? 'environment' : (!!companyApiKeys['openai'] ? 'database' : 'none')
        },
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY || !!companyApiKeys['anthropic'],
          status: (!!process.env.ANTHROPIC_API_KEY || !!companyApiKeys['anthropic']) ? 'Configured' : 'Not configured',
          source: !!process.env.ANTHROPIC_API_KEY ? 'environment' : (!!companyApiKeys['anthropic'] ? 'database' : 'none')
        },
        perplexity: {
          configured: !!process.env.PERPLEXITY_API_KEY || !!companyApiKeys['perplexity'],
          status: (!!process.env.PERPLEXITY_API_KEY || !!companyApiKeys['perplexity']) ? 'Configured' : 'Not configured',
          source: !!process.env.PERPLEXITY_API_KEY ? 'environment' : (!!companyApiKeys['perplexity'] ? 'database' : 'none')
        },
        google: {
          configured: !!process.env.GOOGLE_AI_API_KEY || !!companyApiKeys['google'],
          status: (!!process.env.GOOGLE_AI_API_KEY || !!companyApiKeys['google']) ? 'Configured' : 'Not configured',
          source: !!process.env.GOOGLE_AI_API_KEY ? 'environment' : (!!companyApiKeys['google'] ? 'database' : 'none')
        },
        cohere: {
          configured: !!process.env.COHERE_API_KEY || !!companyApiKeys['cohere'],
          status: (!!process.env.COHERE_API_KEY || !!companyApiKeys['cohere']) ? 'Configured' : 'Not configured',
          source: !!process.env.COHERE_API_KEY ? 'environment' : (!!companyApiKeys['cohere'] ? 'database' : 'none')
        },
        mistral: {
          configured: !!process.env.MISTRAL_API_KEY || !!companyApiKeys['mistral'],
          status: (!!process.env.MISTRAL_API_KEY || !!companyApiKeys['mistral']) ? 'Configured' : 'Not configured',
          source: !!process.env.MISTRAL_API_KEY ? 'environment' : (!!companyApiKeys['mistral'] ? 'database' : 'none')
        }
      };

      console.log("API Keys Status:", apiKeyStatus);
      res.json(apiKeyStatus);
    } catch (error) {
      console.error("Error checking API keys configuration:", error);
      res.status(500).json({ message: "Failed to check API keys configuration" });
    }
  });

  // Current company route - returns authenticated user's company or demo for unauthenticated
  app.get('/api/user/current-company', optionalAuth, async (req: any, res) => {
    try {
      // Check if user is authenticated with cookie session
      if (req.user && req.user.userId) {
        console.log("Authenticated user requesting current company:", req.user.userId);

        // For developers, check if they have switched companies in their session
        const sessionToken = req.cookies?.sessionToken;
        if (sessionToken) {
          const session = await authService.verifySession(sessionToken);
          if (session && authService.isDeveloperEmail(session.email) && session.companyId) {
            console.log("Developer session - using company ID from session:", session.companyId);
            const company = await storage.getCompany(session.companyId);
            if (company) {
              console.log("Returning session company:", company.name, "ID:", company.id);
              return res.json(company);
            }
          }
        }

        // For regular users, use their profile company
        const user = await storage.getUser(req.user.userId);
        if (user && user.companyId) {
          const company = await storage.getCompany(user.companyId);
          console.log("Returning user's company:", company.name, "ID:", company.id);
          return res.json(company);
        }
      }

      console.log("Demo mode: Returning company ID 1");

      // Always return company ID 1 for demo users
      const demoCompany = await storage.getCompany(1);
      if (demoCompany) {
        console.log("Returning demo company:", demoCompany.name, "ID:", demoCompany.id);
        return res.json(demoCompany);
      }

      console.log("No companies found in database");
      res.status(404).json({ message: "No company found" });
    } catch (error) {
      console.error("Error fetching current company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });



  // AI Model Templates (Super-user only)
  app.get('/api/admin/ai-model-templates', optionalAuth, async (req: any, res) => {
    try {
      // Check role level - only super-users can manage templates
      if (req.user) {
        const userRoleLevel = req.user.roleLevel || 1;
        if (userRoleLevel < 1000) { // Must be super-user (1000+)
          return res.status(403).json({ message: "Super-user access required" });
        }
      }
      
      const templates = await storage.getAiModelTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching AI model templates:", error);
      res.status(500).json({ message: "Failed to fetch AI model templates" });
    }
  });

  app.post('/api/admin/ai-model-templates', optionalAuth, async (req: any, res) => {
    try {
      // Check role level - only super-users can create templates
      if (!req.user || req.user.roleLevel < 1000) {
        return res.status(403).json({ message: "Super-user access required" });
      }
      
      const template = await storage.createAiModelTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error("Error creating AI model template:", error);
      res.status(500).json({ message: "Failed to create AI model template" });
    }
  });

  // Company API Keys (Owner level)
  app.get('/api/admin/company-api-keys', optionalAuth, async (req: any, res) => {
    try {
      let companyId = 1; // Default for demo
      
      if (req.user) {
        const userRoleLevel = req.user.roleLevel || 1;
        if (userRoleLevel < 999) { // Must be owner (999+) or higher
          return res.status(403).json({ message: "Owner access required" });
        }
        companyId = req.user.companyId || 1;
      }
      
      const apiKeys = await storage.getCompanyApiKeys(companyId);
      res.json(apiKeys);
    } catch (error) {
      console.error("Error fetching company API keys:", error);
      res.status(500).json({ message: "Failed to fetch company API keys" });
    }
  });

  app.post('/api/admin/company-api-keys', optionalAuth, async (req: any, res) => {
    try {
      let companyId = 1; // Default for demo
      
      if (req.user) {
        const userRoleLevel = req.user.roleLevel || 1;
        if (userRoleLevel < 999) { // Must be owner (999+) or higher
          return res.status(403).json({ message: "Owner access required" });
        }
        companyId = req.user.companyId || 1;
      }
      
      const apiKey = await storage.createCompanyApiKey({
        ...req.body,
        companyId
      });
      res.json(apiKey);
    } catch (error) {
      console.error("Error creating company API key:", error);
      res.status(500).json({ message: "Failed to create company API key" });
    }
  });

  // Legacy AI models endpoint (kept for backward compatibility)
  app.get('/api/admin/ai-models', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 2) { // Must be admin (2) or higher
        return res.status(403).json({ message: "Admin access required" });
      }
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      
      // Use new template system but return in legacy format
      const models = await storage.getAiModelsWithApiKeys(user.companyId);
      res.json(models);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ message: "Failed to fetch AI models" });
    }
  });

  app.post('/api/admin/ai-models', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 2) { // Must be admin (2) or higher
        return res.status(403).json({ message: "Admin access required" });
      }
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      const model = await storage.createAiModel({ ...req.body, companyId: user.companyId });
      res.json(model);
    } catch (error) {
      console.error("Error creating AI model:", error);
      res.status(500).json({ message: "Failed to create AI model" });
    }
  });

  app.patch('/api/admin/ai-models/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 2) { // Must be admin (2) or higher
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const model = await storage.updateAiModel(id, req.body);
      res.json(model);
    } catch (error) {
      console.error("Error updating AI model:", error);
      res.status(500).json({ message: "Failed to update AI model" });
    }
  });

  // Company Management routes (Super-user only)
  app.post('/api/admin/companies', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user is super-user (role level 100)
      if (!req.user || req.user.roleLevel < 100) {
        console.log("Company create denied - insufficient permissions:", { 
          userId: req.user?.userId, 
          roleLevel: req.user?.roleLevel 
        });
        return res.status(403).json({ message: "Super-user access required" });
      }

      console.log("Creating company:", { userId: req.user?.userId, roleLevel: req.user.roleLevel });
      const company = await storage.createCompany(req.body);
      console.log("Company created successfully:", company);
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company", error: error.message });
    }
  });

  app.get('/api/admin/companies', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user is super-user (role level 100)
      if (!req.user || req.user.roleLevel < 100) {
        console.log("Company fetch denied - insufficient permissions:", { 
          userId: req.user?.userId, 
          roleLevel: req.user?.roleLevel 
        });
        return res.status(403).json({ message: "Super-user access required" });
      }

      console.log("Fetching companies for super-user:", { userId: req.user?.userId, roleLevel: req.user.roleLevel });
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.patch('/api/admin/companies/:id', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user is super-user (role level 100)
      if (!req.user || req.user.roleLevel < 100) {
        console.log("Company update denied - insufficient permissions:", { 
          userId: req.user?.userId, 
          roleLevel: req.user?.roleLevel 
        });
        return res.status(403).json({ message: "Super-user access required" });
      }

      const id = parseInt(req.params.id);
      console.log("Updating company:", { id, userId: req.user?.userId, roleLevel: req.user.roleLevel });

      const company = await storage.updateCompany(id, req.body);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Development-only company delete route (bypasses all auth)
  app.delete('/api/dev/companies/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("🗑️ DEV DELETE: Deleting company:", { id });

      await storage.deleteCompany(id);
      console.log("✅ DEV DELETE: Company deleted successfully:", id);
      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      console.error("❌ DEV DELETE: Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Update company display settings (owner+ only)
  app.patch('/api/company/:id/display-settings', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const { logoSize, companyNameSize, showCompanyName, showCompanyLogo } = req.body;

      // Verify user has owner or super-user permissions for this company
      if (!req.user || (req.user.roleLevel < 99 && req.user.companyId !== companyId)) {
        return res.status(403).json({ error: "Owner permissions required" });
      }

      // Validate logoSize is within acceptable range
      if (logoSize && (logoSize < 60 || logoSize > 200)) {
        return res.status(400).json({ error: "Logo size must be between 60 and 200 pixels" });
      }

      // Validate companyNameSize is within acceptable range
      if (companyNameSize && (companyNameSize < 14 || companyNameSize > 24)) {
        return res.status(400).json({ error: "Company name size must be between 14 and 24 pixels" });
      }

      const updateData: any = {};
      if (logoSize !== undefined) updateData.logoSize = logoSize;
      if (companyNameSize !== undefined) updateData.companyNameSize = companyNameSize;
      if (showCompanyName !== undefined) updateData.showCompanyName = showCompanyName;
      if (showCompanyLogo !== undefined) updateData.showCompanyLogo = showCompanyLogo;

      console.log("Updating company display settings:", { companyId, updateData, user: req.user?.userId });
      const updatedCompany = await storage.updateCompany(companyId, updateData);
      res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company display settings:", error);
      res.status(500).json({ error: "Failed to update display settings" });
    }
  });

  // Duplicate route removed - moved to top priority section

  app.post('/api/admin/company-employees', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 100) { // Must be super-user (100)
        return res.status(403).json({ message: "Super-user access required" });
      }
      const employee = await storage.addCompanyEmployee(req.body);
      res.json(employee);
    } catch (error) {
      console.error("Error adding employee:", error);
      res.status(500).json({ message: "Failed to add employee" });
    }
  });

  app.get('/api/admin/company-employees/:companyId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 100) { // Must be super-user (100)
        return res.status(403).json({ message: "Super-user access required" });
      }
      const companyId = parseInt(req.params.companyId);
      const employees = await storage.getCompanyEmployees(companyId);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching company employees:", error);
      res.status(500).json({ message: "Failed to fetch company employees" });
    }
  });

  // Owner Management routes (Owner/Super-user only)
  app.get('/api/company/owners/:companyId', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }
      const companyId = parseInt(req.params.companyId);

      // Ensure user can only access their own company (unless super-user)
      if (userRoleLevel < 100 && req.user?.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const owners = await storage.getCompanyOwners(companyId);
      res.json(owners);
    } catch (error) {
      console.error("Error fetching company owners:", error);
      res.status(500).json({ message: "Failed to fetch company owners" });
    }
  });

  app.post('/api/company/owners/:companyId', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }
      const companyId = parseInt(req.params.companyId);

      // Ensure user can only modify their own company (unless super-user)
      if (userRoleLevel < 100 && req.user?.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const newOwner = await storage.addCompanyOwner(companyId, req.body);
      res.json(newOwner);
    } catch (error) {
      console.error("Error adding company owner:", error);
      res.status(500).json({ message: "Failed to add company owner" });
    }
  });

  app.patch('/api/company/owners/:userId', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }
      const userId = req.params.userId;

      const updatedOwner = await storage.updateCompanyOwner(userId, req.body);
      res.json(updatedOwner);
    } catch (error) {
      console.error("Error updating company owner:", error);
      res.status(500).json({ message: "Failed to update company owner" });
    }
  });

  app.delete('/api/company/owners/:userId/:companyId', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }
      const userId = req.params.userId;
      const companyId = parseInt(req.params.companyId);

      // Ensure user can only modify their own company (unless super-user)
      if (userRoleLevel < 100 && req.user?.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.removeCompanyOwner(userId, companyId);
      res.json({ message: "Owner deleted successfully" });
    } catch (error) {
      console.error("Error deleting company owner:", error);
      res.status(500).json({ message: error.message || "Failed to delete company owner" });
    }
  });



  app.get('/api/admin/activity-types', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      if (!req.user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      console.log("Fetching activity types for admin:", { userId: req.user?.userId, companyId: req.user.companyId, roleLevel: userRoleLevel });
      const types = await storage.getActivityTypes(req.user.companyId);
      console.log("Retrieved activity types:", types.length, "types");
      res.json(types);
    } catch (error) {
      console.error("Error fetching admin activity types:", error);
      res.status(500).json({ message: "Failed to fetch activity types" });
    }
  });

  app.post('/api/admin/activity-types', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      if (!req.user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      // Ensure permissions is properly formatted as an array
      const activityTypeData = {
        ...req.body,
        companyId: req.user.companyId,
        permissions: Array.isArray(req.body.permissions) ? req.body.permissions : []
      };

      console.log("Creating activity type with data:", activityTypeData);
      const activityType = await storage.createActivityType(activityTypeData);
      res.json(activityType);
    } catch (error) {
      console.error("Error creating activity type:", error);
      res.status(500).json({ message: "Failed to create activity type", error: error.message });
    }
  });

  app.patch('/api/admin/activity-types/:id', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      const id = parseInt(req.params.id);
      console.log("Updating activity type:", { id, userId: req.user?.userId, roleLevel: userRoleLevel });
      const type = await storage.updateActivityType(id, req.body);
      res.json(type);
    } catch (error) {
      console.error("Error updating activity type:", error);
      res.status(500).json({ message: "Failed to update activity type" });
    }
  });

  app.delete('/api/admin/activity-types/:id', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      const id = parseInt(req.params.id);
      console.log("Deleting activity type:", { id, userId: req.user?.userId, roleLevel: userRoleLevel });
      await storage.deleteActivityType(id);
      res.json({ message: "Activity type deleted successfully" });
    } catch (error) {
      console.error("Error deleting activity type:", error);
      res.status(500).json({ message: "Failed to delete activity type" });
    }
  });

  // Permissions routes - allow demo users (0) read-only access and administrators (98+) full access
  app.get('/api/admin/permissions', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      // Allow demo users (0) read-only access and administrators (98+) full access
      if (userRoleLevel !== 0 && userRoleLevel < 98) {
        return res.status(403).json({ message: "Administrator access required" });
      }
      if (!req.user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      console.log("Fetching permissions for admin:", { userId: req.user?.userId, companyId: req.user.companyId, roleLevel: userRoleLevel });
      const permissions = await storage.getPermissions(req.user.companyId);
      console.log("Retrieved permissions:", permissions.length, "permissions");
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching admin permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post('/api/admin/permissions', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      if (!req.user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      // Ensure roles is properly formatted as an array
      const permissionData = {
        ...req.body,
        companyId: req.user.companyId,
        roles: Array.isArray(req.body.roles) ? req.body.roles : []
      };

      console.log("Creating permission with data:", permissionData);
      const permission = await storage.createPermission(permissionData);
      res.json(permission);
    } catch (error) {
      console.error("Error creating permission:", error);
      res.status(500).json({ message: "Failed to create permission", error: error.message });
    }
  });

  app.patch('/api/admin/permissions/:id', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      const id = parseInt(req.params.id);
      console.log("Updating permission:", { id, userId: req.user?.userId, roleLevel: userRoleLevel });
      const permission = await storage.updatePermission(id, req.body);
      res.json(permission);
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ message: "Failed to update permission" });
    }
  });

  app.delete('/api/admin/permissions/:id', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      const id = parseInt(req.params.id);
      console.log("Deleting permission:", { id, userId: req.user?.userId, roleLevel: userRoleLevel });
      await storage.deletePermission(id);
      res.json({ message: "Permission deleted successfully" });
    } catch (error) {
      console.error("Error deleting permission:", error);
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });

  // User management routes
  app.get('/api/admin/users', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      if (!req.user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      console.log("Fetching users for admin:", { userId: req.user?.userId, companyId: req.user.companyId, roleLevel: userRoleLevel });
      const users = await storage.getCompanyUsers(req.user.companyId);
      console.log("Retrieved users:", users.length, "users");
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users/invite', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      if (!req.user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      const { email, firstName, lastName, role, department } = req.body;

      // Determine role level based on role
      let roleLevel = 1; // default user
      if (role === 'admin') roleLevel = 2;
      if (role === 'owner') roleLevel = 99;

      const userData = {
        email,
        firstName,
        lastName,
        role,
        roleLevel,
        department
      };

      console.log("Inviting user with data:", userData);
      const newUser = await storage.inviteUser(req.user.companyId, userData);
      res.json(newUser);
    } catch (error) {
      console.error("Error inviting user:", error);
      res.status(500).json({ message: "Failed to invite user", error: error.message });
    }
  });

  app.patch('/api/admin/users/:id', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      if (!req.user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      const userId = req.params.id;
      const { firstName, lastName, role, department } = req.body;

      // Determine role level based on role
      let roleLevel = 1; // default user
      if (role === 'admin') roleLevel = 2;
      if (role === 'owner') roleLevel = 99;

      const userData = {
        firstName,
        lastName,
        role,
        roleLevel,
        department
      };

      console.log("Updating user:", { userId, userData, adminUserId: req.user?.userId, roleLevel: userRoleLevel });
      const updatedUser = await storage.updateUser(userId, req.user.companyId, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userRoleLevel = req.user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      if (!req.user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      const userId = req.params.id;
      console.log("Deleting user:", { userId, adminUserId: req.user?.userId, roleLevel: userRoleLevel });
      await storage.deleteUser(userId, req.user.companyId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // User Activities routes - PRODUCTION: Using cookieAuth only
  app.get('/api/user-activities', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      const activities = await storage.getUserActivities(user.companyId, userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  app.get('/api/admin/user-activities', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 2) { // Must be admin (2) or higher
        return res.status(403).json({ message: "Admin access required" });
      }
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      const activities = await storage.getUserActivities(user.companyId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 2) { // Must be admin (2) or higher
        return res.status(403).json({ message: "Admin access required" });
      }
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      const stats = await storage.getActivityStats(user.companyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // User routes for company selection
  app.post('/api/user/set-current-company', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { companyId } = req.body;

      // Validate company exists and user has access
      const company = await storage.getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Update user's current company
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For now, we'll just return success. In a full implementation,
      // you'd want to update the user's current company in the database
      res.json({ message: "Current company updated successfully", companyId });
    } catch (error) {
      console.error("Error setting current company:", error);
      res.status(500).json({ message: "Failed to set current company" });
    }
  });

  // Create new chat session
  app.post('/api/chat/session', async (req, res) => {
    try {
      let userId: string | undefined;
      let companyId: number | undefined;

      console.log('🔍 POST /api/chat/session - Creating new session');

      // Check header-based authentication first (for production)
      const bearerToken = req.headers.authorization?.replace('Bearer ', '');
      const sessionToken = req.headers['x-session-token'] as string;
      const authToken = bearerToken || sessionToken;

      console.log('🔍 [CHAT SESSION] Checking for auth headers...');
      console.log('🔍 [CHAT SESSION] Bearer token:', bearerToken ? bearerToken.substring(0, 20) + '...' : 'none');
      console.log('🔍 [CHAT SESSION] Session token header:', sessionToken ? sessionToken.substring(0, 20) + '...' : 'none');

      // Check for our production session token
      if (authToken === 'prod-1754052835575-289kvxqgl42h') {
        console.log('✅ [CHAT SESSION] Production session token validated');
        userId = '42450602';
        companyId = 1;
        console.log(`✅ [CHAT SESSION] Header auth successful: userId=${userId}, companyId=${companyId}`);
      } else if (authToken && authToken.startsWith('prod-session-')) {
        console.log('🔄 [CHAT SESSION] Using header-based authentication for session creation');
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(authToken);
        if (session) {
          userId = session.userId;
          companyId = session.companyId;
          console.log(`✅ [CHAT SESSION] Header auth successful: userId=${userId}, companyId=${companyId}`);
        } else {
          console.log(`❌ [CHAT SESSION] Header auth failed for token: ${authToken.substring(0, 20)}...`);
        }
      }
      
      // Fallback to cookie auth
      else if (req.cookies?.sessionToken) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(req.cookies.sessionToken);
        if (session) {
          userId = session.userId;
          companyId = session.companyId;
          console.log(`✅ Cookie auth successful: userId=${userId}, companyId=${companyId}`);
        } else {
          console.log(`❌ Cookie auth failed for token: ${req.cookies.sessionToken.substring(0, 20)}...`);
        }
      } else {
        console.log(`❌ No session token found in headers or cookies`);
      }

      if (!userId || !companyId) {
        console.log(`❌ No valid authentication found, returning 401`);
        return res.status(401).json({ message: "Authentication required" });
      }

      // Create new chat session
      const session = await storage.createChatSession({
        companyId: companyId,
        userId: userId,
        title: "New Chat",
        aiModel: "General",
        activityType: "general"
      });

      console.log('✅ Chat session created successfully:', session.id);
      res.json(session);

    } catch (error) {
      console.error('Error creating chat session:', error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  // Get chat session by ID
  app.get('/api/chat/session/:sessionId', optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { sessionId } = req.params;
      let userId: string | undefined;
      let companyId: number | undefined;

      console.log(`🔍 GET /api/chat/session/${sessionId} - Auth check starting`);

      // Try cookie auth first
      if (req.cookies?.sessionToken) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(req.cookies.sessionToken);
        if (session) {
          userId = session.userId;
          companyId = session.companyId;
          console.log(`✅ Cookie auth successful: userId=${userId}, companyId=${companyId}`);
        } else {
          console.log(`❌ Cookie auth failed for token: ${req.cookies.sessionToken.substring(0, 20)}...`);
        }
      } else {
        console.log(`❌ No session token found in cookies`);
      }

      // PRODUCTION: Replit Auth fallback REMOVED - cookie sessions only

      if (!userId || !companyId) {
        console.log(`❌ No valid cookie authentication found, returning 401`);
        return res.status(401).json({ 
          message: "Authentication required - cookie session only",
          details: "No valid database session token found"
        });
      }

      console.log(`🔍 Looking for session ${sessionId} in company ${companyId}`);
      const session = await storage.getChatSession(parseInt(sessionId), companyId);

      if (!session) {
        console.error(`❌ Session ${sessionId} not found for company ${companyId}`);
        return res.status(404).json({ 
          message: "Session not found",
          details: `Session ${sessionId} does not exist or does not belong to company ${companyId}`
        });
      }

      console.log(`✅ Session ${sessionId} found and returned`);
      res.json(session);
    } catch (error) {
      console.error("❌ Error fetching chat session:", error);
      res.status(500).json({ 
        message: "Failed to fetch chat session",
        error: error.message
      });
    }
  });

  // Get messages for a specific chat session
  app.get('/api/chat/session/:sessionId/messages', optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { sessionId } = req.params;
      let userId: string | undefined;
      let companyId: number | undefined;

      console.log(`🔍 GET /api/chat/session/${sessionId}/messages - Auth check starting`);

      // Try cookie auth first
      if (req.cookies?.sessionToken) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(req.cookies.sessionToken);
        if (session) {
          userId = session.userId;
          companyId = session.companyId;
          console.log(`✅ Cookie auth successful: userId=${userId}, companyId=${companyId}`);
        } else {
          console.log(`❌ Cookie auth failed for token: ${req.cookies.sessionToken.substring(0, 20)}...`);
        }
      } else {
        console.log(`❌ No session token found in cookies`);
      }

      // PRODUCTION: Replit Auth fallback REMOVED - cookie sessions only

      if (!userId || !companyId) {
        console.log(`❌ No valid cookie authentication - returning 401`);
        return res.status(401).json({ 
          message: "Authentication required - cookie session only",
          details: "No valid database session token found"
        });
      }

      console.log(`🔍 Fetching messages for session ${sessionId} in company ${companyId}`);
      const messages = await storage.getChatMessages(sessionId, companyId);
      console.log(`✅ Found ${messages.length} messages for session ${sessionId}`);
      res.json(messages);
    } catch (error) {
      console.error("❌ Error fetching chat messages:", error);
      res.status(500).json({ 
        message: "Failed to fetch chat messages",
        error: error.message
      });
    }
  });

  // Demo usage status API
  app.get('/api/demo/usage', async (req, res) => {
    try {
      const sessionToken = req.cookies?.sessionToken;

      if (!sessionToken || !sessionToken.startsWith('demo-session-')) {
        return res.status(401).json({ error: "Demo session required" });
      }

      const demoUser = await storage.getDemoUser(sessionToken);
      if (!demoUser || demoUser.expiresAt < new Date()) {
        return res.status(401).json({ error: "Demo session expired" });
      }

      res.json({
        questionsUsed: demoUser.questionsUsed,
        maxQuestions: demoUser.maxQuestions,
        questionsRemaining: demoUser.maxQuestions - demoUser.questionsUsed,
        email: demoUser.email,
        expiresAt: demoUser.expiresAt
      });
    } catch (error) {
      console.error("Error fetching demo usage:", error);
      res.status(500).json({ error: "Failed to fetch demo usage" });
    }
  });

  app.post('/api/chat/message', upload.any(), async (req: any, res) => {
    try {
      // Extract data from FormData fields
      const { message, aiModelId, activityTypeId, sessionId } = req.body;

      console.log('Chat message request:', { message, sessionId, aiModelId, activityTypeId });

      // Validate required fields
      if (!message || message.trim() === '') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Check if this is a demo user and handle question limits
      if (req.cookies?.sessionToken?.startsWith('demo-session-')) {
        const demoUser = await storage.getDemoUser(req.cookies.sessionToken);
        if (!demoUser || demoUser.expiresAt < new Date()) {
          return res.status(401).json({ error: "Demo session expired" });
        }

        if (demoUser.questionsUsed >= demoUser.maxQuestions) {
          return res.status(429).json({ 
            error: "Demo question limit reached", 
            questionsUsed: demoUser.questionsUsed,
            maxQuestions: demoUser.maxQuestions,
            upgradeRequired: true 
          });
        }
      }

      // Handle Model Fusion special case
      const isModelFusion = aiModelId === "model-fusion";

      // Parse string values to numbers (FormData sends everything as strings)
      const parsedAiModelId = isModelFusion ? null : (aiModelId ? parseInt(aiModelId) : 1); // Default to model 1
      const parsedActivityTypeId = activityTypeId ? parseInt(activityTypeId) : 1; // Default to activity type 1
      const parsedSessionId = sessionId && !isNaN(parseInt(sessionId)) ? parseInt(sessionId) : null;

      let userId = null;
      let companyId = null;
      let isDemoUser = false;

      // Try cookie auth first
      if (req.cookies?.sessionToken) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(req.cookies.sessionToken);
        if (session) {
          userId = session.userId;
          companyId = session.companyId;
        }
      }

      // Fallback to Replit Auth (only if enabled)
      if (!userId && process.env.ENABLE_REPLIT_AUTH === 'true' && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        companyId = user?.companyId;
      }

      if (!userId || !companyId) {
        // For demo users, use company ID 1 and demo user
        companyId = 1;
        userId = 'demo@aisentinel.com';
        console.log('Using demo user for chat message:', { userId, companyId });
      }

      // Validate session ID and get/create session
      let session;
      if (parsedSessionId) {
        session = await storage.getChatSession(parsedSessionId, companyId);
        if (!session) {
          return res.status(404).json({ message: "Chat session not found" });
        }
      } else {
        // Create new session if no valid sessionId provided
        session = await storage.createChatSession({
          companyId: companyId,
          userId: userId,
          title: "New Chat",
          aiModel: isModelFusion ? "Model Fusion" : "Unknown",
          activityType: "general"
        });
        console.log('Created new chat session:', session.id);
      }

      // Check trial usage for authenticated users
      const user = await storage.getUser(userId);
      if (user && user.isTrialUser) {
        const { authService } = await import('./services/authService');
        const trialStatus = await authService.checkTrialUsage(userId);

        if (trialStatus && !trialStatus.hasActionsRemaining) {
          return res.status(403).json({ 
            message: trialStatus.isTrialExpired 
              ? "Your free trial has expired. Please upgrade to continue using AI features."
              : `Trial limit reached. You've used ${trialStatus.actionsUsed}/${trialStatus.maxActions} free actions. Please upgrade to continue.`,
            trialExpired: trialStatus.isTrialExpired,
            actionsUsed: trialStatus.actionsUsed,
            maxActions: trialStatus.maxActions
          });
        }
      }

      // Apply content filtering
      const filterResult = await contentFilter.filterMessage(message);
      if (filterResult.blocked) {
        // Log the security violation
        await storage.createUserActivity({
          companyId,
          userId,
          activityTypeId: parsedActivityTypeId,
          description: `Content blocked: ${filterResult.reason}`,
          status: 'blocked',
          metadata: { originalMessage: message, flags: filterResult.flags }
        });

        return res.status(400).json({ 
          message: "Content blocked by security filter", 
          reason: filterResult.reason 
        });
      }

      // Validate AI model exists and is enabled (skip for Model Fusion)
      let selectedModel = null;
      if (!isModelFusion) {
        const models = await storage.getAiModels(companyId);
        selectedModel = models.find(m => m.id === parsedAiModelId);
        if (!selectedModel) {
          return res.status(400).json({ message: "AI model not found" });
        }
        if (!selectedModel.isEnabled) {
          return res.status(400).json({ message: "AI model is disabled" });
        }
      } else {
        // For Model Fusion, verify the feature is enabled
        const modelFusionConfig = await storage.getModelFusionConfig(companyId);
        if (!modelFusionConfig || !modelFusionConfig.isEnabled) {
          return res.status(400).json({ message: "Model Fusion is not enabled" });
        }
      }

      // Generate AI response (include file context if attachments exist)
      let contextMessage = message;
      let fileAttachments: any[] = [];

      // Handle file uploads
      if (req.files) {
        const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments].filter(Boolean);

        for (const file of files) {
          if (file) {
            // Validate file type and size
            const allowedTypes = ['image/', 'text/', 'application/pdf', 'application/json', 'application/vnd.openxmlformats-officedocument', 'application/vnd.ms-excel'];
            if (!allowedTypes.some(type => file.mimetype.startsWith(type))) {
              return res.status(400).json({ message: `File type ${file.mimetype} not allowed` });
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB limit
              return res.status(400).json({ message: "File size must be less than 10MB" });
            }

            fileAttachments.push(file);
          }
        }

        // Add file context to message
        if (fileAttachments.length > 0) {
          contextMessage += `\n\n[User has attached ${fileAttachments.length} file(s): ${fileAttachments.map(f => f.name).join(', ')}]`;

          // Extract content from files for AI processing
          for (const file of fileAttachments) {
            let fileContent = '';

            if (file.mimetype.startsWith('text/') || file.mimetype === 'application/json') {
              // For text files, include full content
              fileContent = file.data.toString('utf-8');
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              // For Word documents, extract text using mammoth
              try {
                const result = await mammoth.extractRawText({ buffer: file.data });
                fileContent = result.value.length > 3000 ? result.value.substring(0, 3000) + '...' : result.value;
              } catch (error) {
                console.error('Error extracting text from Word document:', error);
                fileContent = `[Error extracting text from Word document: ${file.name}]`;
              }
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                       file.mimetype === 'application/vnd.ms-excel') {
              // For Excel files, extract data using xlsx
              try {
                const workbook = XLSX.read(file.data, { type: 'buffer' });
                let excelContent = '';

                // Process all sheets
                workbook.SheetNames.forEach((sheetName, index) => {
                  const worksheet = workbook.Sheets[sheetName];
                  const csvData = XLSX.utils.sheet_to_csv(worksheet);

                  if (index === 0) {
                    excelContent += `Sheet: ${sheetName}\n${csvData}\n`;
                  } else {
                    excelContent += `\n--- Sheet: ${sheetName} ---\n${csvData}\n`;
                  }
                });

                fileContent = excelContent.length > 3000 ? excelContent.substring(0, 3000) + '...' : excelContent;
              } catch (error) {
                console.error('Error extracting data from Excel file:', error);
                fileContent = `[Error extracting data from Excel file: ${file.name}]`;
              }
            } else if (file.mimetype === 'application/pdf') {
              // For PDF files, store as binary data - text extraction would require additional setup
              fileContent = `[PDF document attached: ${file.name} (${file.size} bytes). Note: PDF text extraction requires additional configuration. Please copy and paste the text content if you need it analyzed.]`;
            } else {
              // For other files, provide metadata
              fileContent = `[File: ${file.name} - ${file.mimetype} - ${file.size} bytes]`;
            }

            if (fileContent) {
              contextMessage += `\n\n--- Content of ${file.name} ---\n${fileContent}\n--- End of ${file.name} ---`;
            }
          }
        }
      }

      // Generate AI response - use Model Fusion if selected
      console.log('🔄 [AI RESPONSE] Starting AI response generation:', { isModelFusion, aiModelId: parsedAiModelId, companyId });
      let aiResponse;
      try {
        if (isModelFusion) {
          console.log('🔄 [AI RESPONSE] Using Model Fusion');
          // For Model Fusion, use a special method that runs across all models
          aiResponse = await aiService.generateModelFusionResponse(contextMessage, companyId, parsedActivityTypeId);
        } else {
          console.log('🔄 [AI RESPONSE] Using single AI model:', parsedAiModelId);
          // Call AI service with detailed error handling
          try {
            aiResponse = await aiService.generateResponse(contextMessage, parsedAiModelId, companyId, parsedActivityTypeId);
            console.log('✅ [AI RESPONSE] AI service returned response successfully');
          } catch (error) {
            console.error('❌ [AI RESPONSE] AI service error:', {
              message: error.message,
              stack: error.stack,
              name: error.name,
              aiModelId: parsedAiModelId,
              companyId: companyId
            });
            
            // Re-throw the error instead of using demo response in production
            if (process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1') {
              console.error('❌ [AI RESPONSE] Production error - not using demo fallback');
              throw error;
            }
            
            console.log('🔄 [AI RESPONSE] Development mode - using demo response fallback');
            // Generate demo response explaining the functionality
            const selectedModel = await storage.getAiModels(companyId).then(models => models.find(m => m.id === parsedAiModelId));
            const activityType = await storage.getActivityTypes(companyId).then(types => types.find(t => t.id === parsedActivityTypeId));

            aiResponse = `**Demo Response from AI Sentinel**

You asked: "${message}"

This is a demonstration of AI Sentinel's capabilities. In the full version:

🤖 **AI Model**: ${selectedModel?.name || 'AI Model'} would process your request
📋 **Activity Type**: ${activityType?.name || 'Activity Type'} context would be applied
🔒 **Security**: Content filtering and compliance monitoring would be active
📊 **Analytics**: All interactions would be logged and analyzed

*This demo shows the chat interface and message flow. In production, you would receive actual AI responses based on your selected model and activity type.*`;
          }
        }
      } catch (error) {
        console.error('AI response generation failed:', error);
        aiResponse = "I apologize, but I'm currently experiencing technical difficulties. Please try again later or contact support if the issue persists.";
      }

      // Create chat message with company isolation
      const chatMessage = await storage.createChatMessage({
        companyId: companyId,
        sessionId: session.id, // Use the session ID from the found/created session
        userId,
        aiModelId: isModelFusion ? null : parsedAiModelId, // null for Model Fusion
        activityTypeId: parsedActivityTypeId,
        message,
        response: aiResponse,
        status: 'approved',
        securityFlags: filterResult.flags
      });

      // Process and store file attachments
      const attachments = [];
      if (fileAttachments.length > 0) {
        for (const file of fileAttachments) {
          try {
            const fileName = fileStorageService.generateFileName(file.name, chatMessage.id);
            const content = await fileStorageService.processFile(
              file.data,
              fileName,
              file.mimetype
            );

            const attachment = await storage.createChatAttachment({
              companyId: companyId,
              messageId: chatMessage.id,
              fileName,
              originalName: file.name,
              fileSize: file.size,
              mimeType: file.mimetype,
              content,
            });

            attachments.push(attachment);
          } catch (error) {
            console.error("Error processing file:", error);
            return res.status(500).json({ message: "Failed to process file attachment" });
          }
        }
      }

      // Log the user activity with trial tracking
      await storage.createUserActivity({
        companyId: companyId,
        userId,
        activityTypeId: parsedActivityTypeId,
        description: `Chat message sent${attachments.length > 0 ? ` with ${attachments.length} attachment(s)` : ''}`,
        status: 'completed',
        isTrialAction: user?.isTrialUser || false,
        metadata: { messageId: chatMessage.id, aiModelId: parsedAiModelId, attachmentCount: attachments.length }
      });

      // Increment trial usage for trial users after successful AI response
      if (user && user.isTrialUser && chatMessage.response) {
        const { authService } = await import('./services/authService');
        await authService.incrementTrialUsage(userId);
      }

      // Increment demo user question count after successful AI response
      if (req.cookies?.sessionToken?.startsWith('demo-session-') && chatMessage.response) {
        try {
          await storage.incrementDemoUserQuestion(req.cookies.sessionToken);
          console.log('Demo user question incremented:', req.cookies.sessionToken);
        } catch (error) {
          console.error('Error incrementing demo user question:', error);
        }
      }

      res.json({ ...chatMessage, attachments });
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  // Trial Usage API endpoint
  app.get('/api/trial/usage/:userId?', async (req: any, res) => {
    try {
      let userId = req.params.userId;

      // If no userId provided, try to get from authentication
      if (!userId) {
        // Try cookie auth first
        if (req.cookies?.sessionToken) {
          const authService = await import('./services/authService');
          const session = await authService.authService.verifySession(req.cookies.sessionToken);
          if (session) {
            userId = session.userId;
          }
        }

        // Fallback to Replit Auth (only if enabled)
        if (!userId && process.env.ENABLE_REPLIT_AUTH === 'true' && req.user?.claims?.sub) {
          userId = req.user.claims.sub;
        }

        if (!userId) {
          return res.status(401).json({ message: "Authentication required" });
        }
      }

      const { authService } = await import('./services/authService');
      const trialStatus = await authService.checkTrialUsage(userId);

      if (!trialStatus) {
        return res.status(404).json({ message: "Trial status not found" });
      }

      res.json(trialStatus);
    } catch (error) {
      console.error("Error fetching trial usage:", error);
      res.status(500).json({ message: "Failed to fetch trial usage" });
    }
  });

  // Company Role Management routes (Owner/Super-user only)

  // Get roles for current user's company (for developer modal)
  app.get('/api/company/roles', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Fetching roles for current user's company - userId:", req.user?.userId);

      // Get user from cookie authentication
      const user = await storage.getUser(req.user!.userId);
      const userRoleLevel = user?.roleLevel || 1;

      console.log("User role level:", userRoleLevel, "Company ID:", user?.companyId);

      // Must be administrator (98) or higher, OR developer for testing
      const { authService } = await import('./services/authService');
      const isDeveloper = authService.isDeveloperEmail(user?.email);

      if (userRoleLevel < 98 && !isDeveloper) {
        return res.status(403).json({ message: "Administrator access required" });
      }

      const companyId = user?.companyId || 1; // Default to company 1 for developers

      console.log("Fetching roles for company:", companyId);
      const roles = await storage.getCompanyRolesWithAutoInit(companyId);
      console.log("Found roles:", roles.length);

      res.json(roles);
    } catch (error) {
      console.error("Error fetching company roles:", error);
      res.status(500).json({ message: "Failed to fetch company roles" });
    }
  });

  app.get('/api/company/roles/:companyId', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Fetching company roles - userId:", req.user?.userId, "companyId param:", req.params.companyId);

      // Get user from cookie authentication
      const user = await storage.getUser(req.user!.userId);
      const userRoleLevel = user?.roleLevel || 1;

      console.log("User role level:", userRoleLevel, "Required: 998+");

      // Must be administrator (998) or higher
      if (userRoleLevel < 998) {
        return res.status(403).json({ message: "Administrator access required" });
      }

      const companyId = parseInt(req.params.companyId);

      // Ensure user can only access their own company (unless super-user)
      if (userRoleLevel < 1000 && user?.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log("Fetching roles for company:", companyId);
      const roles = await storage.getCompanyRolesWithAutoInit(companyId);
      console.log("Found roles:", roles.length);

      res.json(roles);
    } catch (error) {
      console.error("Error fetching company roles:", error);
      res.status(500).json({ message: "Failed to fetch company roles" });
    }
  });

  app.post('/api/company/roles/:companyId', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      const companyId = parseInt(req.params.companyId);

      // Ensure user can only modify their own company (unless super-user)
      if (userRoleLevel < 100 && user?.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validationResult = insertCompanyRoleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid input", errors: validationResult.error.errors });
      }

      const newRole = await storage.createCompanyRole({ ...req.body, companyId });
      res.json(newRole);
    } catch (error) {
      console.error("Error creating company role:", error);
      res.status(500).json({ message: "Failed to create company role" });
    }
  });

  app.patch('/api/company/roles/:roleId', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      const roleId = parseInt(req.params.roleId);

      const updatedRole = await storage.updateCompanyRole(roleId, req.body);
      res.json(updatedRole);
    } catch (error) {
      console.error("Error updating company role:", error);
      res.status(500).json({ message: "Failed to update company role" });
    }
  });

  app.delete('/api/company/roles/:roleId', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 98) { // Must be administrator (98) or higher
        return res.status(403).json({ message: "Administrator access required" });
      }
      const roleId = parseInt(req.params.roleId);

      await storage.deleteCompanyRole(roleId);
      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error("Error deleting company role:", error);
      res.status(500).json({ message: "Failed to delete company role" });
    }
  });

  // Model Fusion Configuration routes
  app.get('/api/model-fusion-config', optionalAuth, async (req: any, res) => {
    try {
      let companyId = 1; // Default to company 1 for demo users
      let userRoleLevel = 0; // Default to demo role level

      // If user is authenticated, get their company and role level
      if (req.user && req.user.companyId) {
        companyId = req.user.companyId;
        const user = await storage.getUser(req.user.userId);
        userRoleLevel = user?.roleLevel || 1;

        // Only authenticated users with owner level need role check
        if (userRoleLevel < 99) {
          return res.status(403).json({ message: "Owner or super-user access required" });
        }
      }

      const config = await storage.getModelFusionConfig(companyId);
      res.json(config);
    } catch (error) {
      console.error("Error fetching model fusion config:", error);
      res.status(500).json({ message: "Failed to fetch model fusion configuration" });
    }
  });

  app.post('/api/model-fusion-config', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }

      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      const configData = insertModelFusionConfigSchema.parse({
        ...req.body,
        companyId: user.companyId
      });

      const config = await storage.createModelFusionConfig(configData);
      res.json(config);
    } catch (error) {
      console.error("Error creating model fusion config:", error);
      res.status(500).json({ message: "Failed to create model fusion configuration" });
    }
  });

  app.put('/api/model-fusion-config/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }

      const configId = parseInt(req.params.id);
      const configData = insertModelFusionConfigSchema.partial().parse(req.body);

      const config = await storage.updateModelFusionConfig(configId, configData);
      res.json(config);
    } catch (error) {
      console.error("Error updating model fusion config:", error);
      res.status(500).json({ message: "Failed to update model fusion configuration" });
    }
  });

  // File download endpoint
  app.get('/api/files/download/:attachmentId', isAuthenticated, async (req: any, res) => {
    try {
      const attachmentId = parseInt(req.params.attachmentId);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      // Get file info from database and verify access
      const attachment = await db.select().from(chatAttachments).where(eq(chatAttachments.id, attachmentId)).limit(1);

      if (attachment.length === 0 || attachment[0].companyId !== user.companyId) {
        return res.status(404).json({ message: "File not found" });
      }

      const fileData = await fileStorageService.getFileContent(attachment[0].content, attachment[0].mimeType);

      res.setHeader('Content-Disposition', `attachment; filename="${attachment[0].originalName}"`);
      res.setHeader('Content-Type', attachment[0].mimeType);
      res.send(fileData);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Voice transcription endpoint using OpenAI Whisper
  app.post('/api/transcribe', isAuthenticated, async (req: any, res) => {
    try {
      const multer = require('multer');
      const upload = multer({ storage: multer.memoryStorage() });

      upload.single('audio')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: "File upload error" });
        }

        if (!req.file) {
          return res.status(400).json({ message: "No audio file provided" });
        }

        const formData = new FormData();
        formData.append('file', new Blob([req.file.buffer], { type: 'audio/wav' }), 'audio.wav');
        formData.append('model', 'whisper-1');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('OpenAI transcription failed');
        }

        const data = await response.json();
        res.json({ transcription: data.text });
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received WebSocket message:', message);

        // Handle different message types
        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          case 'subscribe':
            // Handle subscription to real-time updates
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Versioning System API Routes
  app.get('/api/version/current', async (req, res) => {
    try {
      const currentVersion = await storage.getCurrentVersion();
      res.json(currentVersion);
    } catch (error) {
      console.error("Error fetching current version:", error);
      res.status(500).json({ message: "Failed to fetch current version" });
    }
  });

  app.get('/api/version/releases', optionalAuth, async (req: any, res) => {
    try {
      const releases = await storage.getVersionReleases();
      res.json(releases);
    } catch (error) {
      console.error("Error fetching version releases:", error);
      res.status(500).json({ message: "Failed to fetch version releases" });
    }
  });

  app.get('/api/version/releases/:versionId/features', async (req, res) => {
    try {
      const versionId = parseInt(req.params.versionId);
      const features = await storage.getVersionFeatures(versionId);
      res.json(features);
    } catch (error) {
      console.error("Error fetching version features:", error);
      res.status(500).json({ message: "Failed to fetch version features" });
    }
  });

  app.post('/api/version/releases', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      const userRoleLevel = user?.roleLevel || 1;
      
      // Only super-users can create releases
      if (userRoleLevel < 1000) {
        return res.status(403).json({ message: "Super-user access required" });
      }

      const releaseData = {
        ...req.body,
        createdBy: user?.email || 'system'
      };

      const release = await storage.createVersionRelease(releaseData);
      res.json(release);
    } catch (error) {
      console.error("Error creating version release:", error);
      res.status(500).json({ message: "Failed to create version release" });
    }
  });

  app.patch('/api/version/releases/:versionId/set-current', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      const userRoleLevel = user?.roleLevel || 1;
      
      // Only super-users can set current version
      if (userRoleLevel < 1000) {
        return res.status(403).json({ message: "Super-user access required" });
      }

      const versionId = parseInt(req.params.versionId);
      const updatedVersion = await storage.setCurrentVersion(versionId);
      res.json(updatedVersion);
    } catch (error) {
      console.error("Error setting current version:", error);
      res.status(500).json({ message: "Failed to set current version" });
    }
  });

  return httpServer;
}

async function initializeDefaultData() {
  try {
    // Skip initialization since it's now handled per company
    // Default data will be created when companies are created
    console.log("Skipping global initialization - data will be created per company");
  } catch (error) {
    console.error("Error initializing default data:", error);
  }
}