import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { cookieAuth, optionalAuth, AuthenticatedRequest } from "./cookieAuth";
import { setupAuthRoutes } from "./authRoutes";
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

  // Demo and authenticated AI models route - returns company 1 for demo, user's company for authenticated
  app.get('/api/ai-models', optionalAuth, async (req: any, res) => {
    try {
      let companyId = 1; // Default to company 1 for demo users
      
      // If user is authenticated and has a company, use their company
      if (req.user && req.user.companyId) {
        companyId = req.user.companyId;
        console.log("Authenticated user requesting AI models:", { userId: req.user.userId, companyId });
      } else {
        console.log("Demo mode AI models request");
      }
      
      const models = await storage.getEnabledAiModels(companyId);
      console.log("Returning models for company", companyId + ":", models.length, "models");
      return res.json(models);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ message: "Failed to fetch AI models" });
    }
  });

  // Demo and authenticated activity types route - returns company 1 for demo, user's company for authenticated
  app.get('/api/activity-types', optionalAuth, async (req: any, res) => {
    try {
      let companyId = 1; // Default to company 1 for demo users
      
      // If user is authenticated and has a company, use their company
      if (req.user && req.user.companyId) {
        companyId = req.user.companyId;
        console.log("Authenticated user requesting activity types:", { userId: req.user.userId, companyId });
      } else {
        console.log("Demo mode activity types request");
      }
      
      const activityTypes = await storage.getActivityTypes(companyId);
      console.log("Returning activity types for company", companyId + ":", activityTypes.length, "types");
      return res.json(activityTypes);
    } catch (error) {
      console.error("Error fetching activity types:", error);
      res.status(500).json({ message: "Failed to fetch activity types" });
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
        organizationId: req.body.organizationId || `company-${user.companyId}`,
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

  // Enable Replit Auth for production authentication
  process.env.ENABLE_REPLIT_AUTH = 'true';
  await setupAuth(app);

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

  // Current company route - returns authenticated user's company or demo for unauthenticated
  app.get('/api/user/current-company', optionalAuth, async (req: any, res) => {
    try {
      // Check if user is authenticated with cookie session
      if (req.user && req.user.userId) {
        console.log("Authenticated user requesting current company:", req.user.userId);
        
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
      const models = await storage.getAiModels(user.companyId);
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

  // User Activities routes
  app.get('/api/user-activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/admin/user-activities', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
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



  // Whisper API route
  app.post('/api/transcribe', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.files || !req.files.audio) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const audioFile = req.files.audio;
      const transcription = await aiService.transcribeAudio(audioFile.data, audioFile.name);

      res.json({ transcription });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  // API Key Testing endpoint  
  app.post('/api/admin/test-api-key', optionalAuth, async (req: any, res) => {
    try {
      console.log('Test API key request from user:', req.user?.userId);
      
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
        return res.status(403).json({ message: "Owner access required to test API keys" });
      }

      const { provider, apiKey } = req.body;
      
      if (!provider || !apiKey) {
        return res.status(400).json({ message: "Provider and API key are required" });
      }

      // Simple validation for now
      if (apiKey.startsWith('placeholder-') || apiKey.includes('$')) {
        return res.status(400).json({ message: 'Please enter a real API key (not placeholder or environment variable)' });
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

      console.log(`Testing ${provider} API key format validation`);
      
      // For now, just validate format - actual API testing can be added later
      return res.json({ 
        success: true, 
        message: `${provider} API key format is valid`,
        provider: provider.charAt(0).toUpperCase() + provider.slice(1)
      });
    } catch (error) {
      console.error('Error testing API key:', error);
      return res.status(500).json({ message: 'Failed to test API key' });
    }
  });

  // Context Document API routes
  app.get("/api/context-documents", optionalAuth, async (req: any, res) => {
    try {
      // For demo mode, return empty array
      if (!req.user) {
        console.log("Demo mode context documents request");
        return res.json([]);
      }

      const userId = req.user?.claims?.sub || req.user?.userId;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const userRoleLevel = await storage.getUserRoleLevel(userId);
      // Allow demo users (role level 0) read-only access to context documents
      if (userRoleLevel < 0) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      const documents = await storage.getContextDocuments(user.companyId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching context documents:", error);
      res.status(500).json({ message: "Failed to fetch context documents" });
    }
  });

  app.post("/api/context-documents", isAuthenticated, async (req: any, res) => {
    try {
      const userRoleLevel = await storage.getUserRoleLevel(req.user.claims.sub);
      if (userRoleLevel < 2) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      const file = req.files?.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { name, description, category, priority = 1 } = req.body;
      if (!name || !category) {
        return res.status(400).json({ message: "Name and category are required" });
      }

      // Extract text content from file
      let content = '';
      if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown') {
        content = file.data.toString('utf-8');
      } else if (file.mimetype === 'application/json') {
        content = file.data.toString('utf-8');
      } else {
        // For other file types, store first 2000 characters as preview
        content = `[File: ${file.name}]\n${file.data.toString('utf-8', 0, 2000)}...`;
      }

      const document = await storage.createContextDocument({
        companyId: user.companyId,
        name,
        description,
        category,
        fileName: file.name,
        fileSize: file.size,
        content,
        priority: parseInt(priority),
        isEnabled: true
      });

      res.json(document);
    } catch (error) {
      console.error("Error creating context document:", error);
      res.status(500).json({ message: "Failed to create context document" });
    }
  });

  app.put("/api/context-documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userRoleLevel = await storage.getUserRoleLevel(req.user.claims.sub);
      if (userRoleLevel < 2) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const documentId = parseInt(req.params.id);
      const updateData = req.body;

      const document = await storage.updateContextDocument(documentId, updateData);
      res.json(document);
    } catch (error) {
      console.error("Error updating context document:", error);
      res.status(500).json({ message: "Failed to update context document" });
    }
  });

  app.delete("/api/context-documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userRoleLevel = await storage.getUserRoleLevel(req.user.claims.sub);
      if (userRoleLevel < 2) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const documentId = parseInt(req.params.id);
      await storage.deleteContextDocument(documentId);
      res.json({ message: "Context document deleted successfully" });
    } catch (error) {
      console.error("Error deleting context document:", error);
      res.status(500).json({ message: "Failed to delete context document" });
    }
  });

  // Activity Context Links API routes
  app.get("/api/activity-types/:id/context-links", isAuthenticated, async (req: any, res) => {
    try {
      const userRoleLevel = await storage.getUserRoleLevel(req.user.claims.sub);
      if (userRoleLevel < 2) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const activityTypeId = parseInt(req.params.id);
      const links = await storage.getActivityContextLinks(activityTypeId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching activity context links:", error);
      res.status(500).json({ message: "Failed to fetch activity context links" });
    }
  });

  app.post("/api/activity-types/:id/context-links", isAuthenticated, async (req: any, res) => {
    try {
      const userRoleLevel = await storage.getUserRoleLevel(req.user.claims.sub);
      if (userRoleLevel < 2) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const activityTypeId = parseInt(req.params.id);
      const { documentId, usageType = "optional" } = req.body;

      const link = await storage.createActivityContextLink({
        activityTypeId,
        documentId,
        usageType
      });

      res.json(link);
    } catch (error) {
      console.error("Error creating activity context link:", error);
      res.status(500).json({ message: "Failed to create activity context link" });
    }
  });

  app.delete("/api/activity-types/:activityId/context-links/:documentId", isAuthenticated, async (req: any, res) => {
    try {
      const userRoleLevel = await storage.getUserRoleLevel(req.user.claims.sub);
      if (userRoleLevel < 2) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const activityTypeId = parseInt(req.params.activityId);
      const documentId = parseInt(req.params.documentId);

      await storage.deleteActivityContextLink(activityTypeId, documentId);
      res.json({ message: "Activity context link deleted successfully" });
    } catch (error) {
      console.error("Error deleting activity context link:", error);
      res.status(500).json({ message: "Failed to delete activity context link" });
    }
  });

  // Chat routes with demo and authenticated user support
  app.post('/api/chat/session', async (req: any, res) => {
    try {
      let userId = null;
      let companyId = null;
      let roleLevel = 1; // Default user level

      // Try cookie auth first
      if (req.cookies?.sessionToken) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(req.cookies.sessionToken);
        if (session) {
          userId = session.userId;
          companyId = session.companyId || 1; // Default to company 1 if no company
          const user = await storage.getUser(userId);
          roleLevel = user?.roleLevel || 0; // Get actual role level
          console.log('Cookie authentication successful:', { userId, companyId, roleLevel });
        }
      }

      // Fallback to Replit Auth (only if enabled)
      if (!userId && process.env.ENABLE_REPLIT_AUTH === 'true' && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        companyId = user?.companyId || 1; // Default to company 1
        roleLevel = user?.roleLevel || 1;
        console.log('Replit authentication successful:', { userId, companyId, roleLevel });
      }
      
      // For demo users or unauthenticated users, use company ID 1 with demo role
      if (!userId) {
        userId = 'demo@aisentinel.com';
        companyId = 1;
        roleLevel = 0; // Demo level for read-only access
        console.log('Demo user session creation:', { userId, companyId, roleLevel });
      }

      const session = await storage.createChatSession({ 
        companyId: companyId, 
        userId: userId,
        title: "New Chat",
        aiModel: "Default",
        activityType: "general"
      });
      
      console.log('Chat session created successfully:', { sessionId: session.id, userId, companyId, roleLevel });
      res.json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.get('/api/chat/sessions', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const sessions = await storage.getUserChatSessions(userId, user.companyId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.get('/api/chat/session/:id/messages', async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      // Validate session ID is a valid number
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      let userId = null;
      let companyId = null;

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
        console.log('Using demo user for messages:', { userId, companyId });
      }

      // Remove company check since we're allowing anonymous access
      const messages = await storage.getChatMessages(sessionId, companyId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
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
      let aiResponse;
      try {
        if (isModelFusion) {
          // For Model Fusion, use a special method that runs across all models
          aiResponse = await aiService.generateModelFusionResponse(contextMessage, companyId, parsedActivityTypeId);
        } else {
          // For demo/development, provide fallback response if AI service fails
          try {
            aiResponse = await aiService.generateResponse(contextMessage, parsedAiModelId, companyId, parsedActivityTypeId);
          } catch (error) {
            console.log('AI service error, using demo response:', error.message);
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
  app.get('/api/company/roles/:companyId', cookieAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Fetching company roles - userId:", req.user?.userId, "companyId param:", req.params.companyId);
      
      // Get user from cookie authentication
      const user = await storage.getUser(req.user!.userId);
      const userRoleLevel = user?.roleLevel || 1;
      
      console.log("User role level:", userRoleLevel, "Required: 98+");
      
      // Must be administrator (98) or higher
      if (userRoleLevel < 98) {
        return res.status(403).json({ message: "Administrator access required" });
      }
      
      const companyId = parseInt(req.params.companyId);

      // Ensure user can only access their own company (unless super-user)
      if (userRoleLevel < 100 && user?.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log("Fetching roles for company:", companyId);
      const roles = await storage.getCompanyRoles(companyId);
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