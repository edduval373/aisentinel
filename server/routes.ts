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

export async function registerRoutes(app: Express): Promise<Server> {
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
  
  // Authentication disabled for complete bypass
  // setupAuthRoutes(app);

  // Replit Auth disabled
  // if (process.env.ENABLE_REPLIT_AUTH === 'true') {
  //   await setupAuth(app);
  // }

  // Initialize default AI models and activity types (disabled for demo mode)
  // await initializeDefaultData();

  // Legacy auth route (for backward compatibility) - only if Replit Auth is enabled
  if (process.env.ENABLE_REPLIT_AUTH === 'true') {
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
  } else {
    // Return unauthorized if Replit Auth is disabled
    app.get('/api/auth/user', async (req: any, res) => {
      res.status(401).json({ message: "Unauthorized" });
    });
  }

  // Unauthenticated route to get current user (pulls super-user from Railway database)
  app.get('/api/user/current', async (req: any, res) => {
    try {
      // For complete authentication bypass, always return the super-user from Railway database
      const superUsers = await storage.getUsersByRole('super-user');
      if (superUsers.length > 0) {
        return res.json(superUsers[0]);
      }

      res.status(404).json({ message: "No super-user found in Railway database" });
    } catch (error) {
      console.error("Error fetching super-user from Railway database:", error);
      res.status(500).json({ message: "Failed to fetch user from Railway database" });
    }
  });

  // Unauthenticated route to get first available company (for demo access)
  app.get('/api/user/current-company', async (req: any, res) => {
    try {
      // For complete authentication bypass, always return company ID 1 from Railway database
      const company = await storage.getCompany(1);
      if (company) {
        return res.json(company);
      }

      // Try authenticated access first
      if (req.cookies?.sessionToken) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(req.cookies.sessionToken);
        if (session && session.companyId) {
          const company = await storage.getCompany(session.companyId);
          if (company) {
            return res.json(company);
          }
        }
      }

      // For unauthenticated access, return the first available company
      const companies = await storage.getCompanies();
      if (companies.length > 0) {
        return res.json(companies[0]);
      }

      res.status(404).json({ message: "No company found" });
    } catch (error) {
      console.error("Error fetching current company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // AI Models routes - Support both auth methods
  app.get('/api/ai-models', async (req: any, res) => {
    try {
      let user = null;
      let companyId = null;

      // Try cookie auth first
      if (req.cookies?.sessionToken) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(req.cookies.sessionToken);
        if (session) {
          user = await storage.getUser(session.userId);
          companyId = session.companyId;
        }
      }

      // Fallback to Replit Auth (only if enabled)
      if (!user && process.env.ENABLE_REPLIT_AUTH === 'true' && req.user?.claims?.sub) {
        user = await storage.getUser(req.user.claims.sub);
        companyId = user?.companyId;
      }

      if (!user || !companyId) {
        // For unauthenticated users, try to get models from first available company
        try {
          const companies = await storage.getCompanies();
          if (companies.length > 0) {
            const firstCompanyId = companies[0].id;
            const models = await storage.getEnabledAiModels(firstCompanyId);
            return res.json(models);
          }
        } catch (error) {
          console.error("Error fetching default company models:", error);
        }
        // Fallback to empty array
        return res.json([]);
      }

      const models = await storage.getEnabledAiModels(companyId);
      res.json(models);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ message: "Failed to fetch AI models" });
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
  app.post('/api/admin/companies', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      console.log("User attempting to create company:", { 
        userId: req.user?.claims?.sub, 
        userRole: user?.role,
        requestBody: req.body 
      });

      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 100) { // Must be super-user (100)
        return res.status(403).json({ message: "Super-user access required" });
      }

      const company = await storage.createCompany(req.body);
      console.log("Company created successfully:", company);
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company", error: error.message });
    }
  });

  app.get('/api/admin/companies', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 100) { // Must be super-user (100)
        return res.status(403).json({ message: "Super-user access required" });
      }
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.patch('/api/admin/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 100) { // Must be super-user (100)
        return res.status(403).json({ message: "Super-user access required" });
      }
      const id = parseInt(req.params.id);
      const company = await storage.updateCompany(id, req.body);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/admin/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 100) { // Must be super-user (100)
        return res.status(403).json({ message: "Super-user access required" });
      }
      const id = parseInt(req.params.id);
      await storage.deleteCompany(id);
      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
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
  app.get('/api/company/owners/:companyId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }
      const companyId = parseInt(req.params.companyId);

      // Ensure user can only access their own company (unless super-user)
      if (userRoleLevel < 100 && user?.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const owners = await storage.getCompanyOwners(companyId);
      res.json(owners);
    } catch (error) {
      console.error("Error fetching company owners:", error);
      res.status(500).json({ message: "Failed to fetch company owners" });
    }
  });

  app.post('/api/company/owners/:companyId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }
      const companyId = parseInt(req.params.companyId);

      // Ensure user can only modify their own company (unless super-user)
      if (userRoleLevel < 100 && user?.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const newOwner = await storage.addCompanyOwner(companyId, req.body);
      res.json(newOwner);
    } catch (error) {
      console.error("Error adding company owner:", error);
      res.status(500).json({ message: "Failed to add company owner" });
    }
  });

  app.patch('/api/company/owners/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
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

  app.delete('/api/company/owners/:userId/:companyId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }
      const userId = req.params.userId;
      const companyId = parseInt(req.params.companyId);

      // Ensure user can only modify their own company (unless super-user)
      if (userRoleLevel < 100 && user?.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.removeCompanyOwner(userId, companyId);
      res.json({ message: "Owner deleted successfully" });
    } catch (error) {
      console.error("Error deleting company owner:", error);
      res.status(500).json({ message: error.message || "Failed to delete company owner" });
    }
  });

  // Activity Types routes
  app.get('/api/activity-types', async (req: any, res) => {
    try {
      let user = null;
      let companyId = null;

      // Try cookie auth first
      if (req.cookies?.sessionToken) {
        const authService = await import('./services/authService');
        const session = await authService.authService.verifySession(req.cookies.sessionToken);
        if (session) {
          user = await storage.getUser(session.userId);
          companyId = session.companyId;
        }
      }

      // Fallback to Replit Auth (only if enabled)
      if (!user && process.env.ENABLE_REPLIT_AUTH === 'true' && req.user?.claims?.sub) {
        user = await storage.getUser(req.user.claims.sub);
        companyId = user?.companyId;
      }

      if (!user || !companyId) {
        // For unauthenticated users, try to get activity types from first available company
        try {
          const companies = await storage.getCompanies();
          if (companies.length > 0) {
            const firstCompanyId = companies[0].id;
            const types = await storage.getEnabledActivityTypes(firstCompanyId);
            return res.json(types);
          }
        } catch (error) {
          console.error("Error fetching default company activity types:", error);
        }
        // Fallback to empty array
        return res.json([]);
      }

      const types = await storage.getEnabledActivityTypes(companyId);
      res.json(types);
    } catch (error) {
      console.error("Error fetching activity types:", error);
      res.status(500).json({ message: "Failed to fetch activity types" });
    }
  });

  app.get('/api/admin/activity-types', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 2) { // Must be admin (2) or higher
        return res.status(403).json({ message: "Admin access required" });
      }
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      const types = await storage.getActivityTypes(user.companyId);
      res.json(types);
    } catch (error) {
      console.error("Error fetching activity types:", error);
      res.status(500).json({ message: "Failed to fetch activity types" });
    }
  });

  app.post('/api/admin/activity-types', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 2) { // Must be admin (2) or higher
        return res.status(403).json({ message: "Admin access required" });
      }
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      // Ensure permissions is properly formatted as an array
      const activityTypeData = {
        ...req.body,
        companyId: user.companyId,
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

  app.patch('/api/admin/activity-types/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 2) { // Must be admin (2) or higher
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const type = await storage.updateActivityType(id, req.body);
      res.json(type);
    } catch (error) {
      console.error("Error updating activity type:", error);
      res.status(500).json({ message: "Failed to update activity type" });
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

  // Context Document API routes
  app.get("/api/context-documents", isAuthenticated, async (req: any, res) => {
    try {
      const userRoleLevel = await storage.getUserRoleLevel(req.user.claims.sub);
      if (userRoleLevel < 2) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const user = await storage.getUser(req.user.claims.sub);
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

  // Chat routes
  app.post('/api/chat/session', async (req: any, res) => {
    try {
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
        // For unauthenticated users, use first available company and super-user account
        try {
          const companies = await storage.getCompanies();
          if (companies.length > 0) {
            companyId = companies[0].id;
            // Use the existing super-user ID to maintain role structure
            userId = '42450602';
          } else {
            return res.status(400).json({ message: "No companies available" });
          }
        } catch (error) {
          console.error("Error finding default company:", error);
          return res.status(500).json({ message: "Failed to find company" });
        }
      }

      const session = await storage.createChatSession({ companyId, userId });
      res.json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.get('/api/chat/sessions', async (req: any, res) => {
    try {
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
        // For unauthenticated users, use first available company and anonymous user
        try {
          const companies = await storage.getCompanies();
          if (companies.length > 0) {
            companyId = companies[0].id;
            userId = '42450602';
          } else {
            return res.json([]); // Return empty array if no companies
          }
        } catch (error) {
          console.error("Error finding default company:", error);
          return res.json([]);
        }
      }

      const sessions = await storage.getUserChatSessions(userId, companyId);
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
        // For unauthenticated users, use first available company and anonymous user
        try {
          const companies = await storage.getCompanies();
          if (companies.length > 0) {
            companyId = companies[0].id;
            userId = '42450602';
          } else {
            return res.json([]); // Return empty array if no companies
          }
        } catch (error) {
          console.error("Error finding default company:", error);
          return res.json([]);
        }
      }

      // Remove company check since we're allowing anonymous access
      const messages = await storage.getChatMessages(sessionId, companyId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/chat/message', async (req: any, res) => {
    try {
      const { message, aiModelId, activityTypeId, sessionId } = req.body;
      
      console.log('Chat message request:', { message, sessionId, aiModelId, activityTypeId });
      
      // Validate required fields
      if (!message || message.trim() === '') {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Handle Model Fusion special case
      const isModelFusion = aiModelId === "model-fusion";
      
      // Parse string values to numbers (FormData sends everything as strings)
      const parsedAiModelId = isModelFusion ? null : (aiModelId ? parseInt(aiModelId) : 1); // Default to model 1
      const parsedActivityTypeId = activityTypeId ? parseInt(activityTypeId) : 1; // Default to activity type 1
      const parsedSessionId = sessionId && !isNaN(parseInt(sessionId)) ? parseInt(sessionId) : null;
      
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
        // For unauthenticated users, use first available company and super-user account
        try {
          const companies = await storage.getCompanies();
          if (companies.length > 0) {
            companyId = companies[0].id;
            // Use the existing super-user ID to maintain role structure
            userId = '42450602';
          } else {
            return res.status(400).json({ message: "No companies available" });
          }
        } catch (error) {
          console.error("Error finding default company:", error);
          return res.status(500).json({ message: "Failed to find company" });
        }
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
      if (isModelFusion) {
        // For Model Fusion, use a special method that runs across all models
        aiResponse = await aiService.generateModelFusionResponse(contextMessage, companyId, parsedActivityTypeId);
      } else {
        aiResponse = await aiService.generateResponse(contextMessage, parsedAiModelId, companyId, parsedActivityTypeId);
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

      // Log the user activity
      await storage.createUserActivity({
        companyId: companyId,
        userId,
        activityTypeId: parsedActivityTypeId,
        description: `Chat message sent${attachments.length > 0 ? ` with ${attachments.length} attachment(s)` : ''}`,
        status: 'completed',
        metadata: { messageId: chatMessage.id, aiModelId: parsedAiModelId, attachmentCount: attachments.length }
      });

      res.json({ ...chatMessage, attachments });
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  // Company Role Management routes (Owner/Super-user only)
  app.get('/api/company/roles/:companyId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }
      const companyId = parseInt(req.params.companyId);

      // Ensure user can only access their own company (unless super-user)
      if (userRoleLevel < 100 && user?.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const roles = await storage.getCompanyRoles(companyId);
      res.json(roles);
    } catch (error) {
      console.error("Error fetching company roles:", error);
      res.status(500).json({ message: "Failed to fetch company roles" });
    }
  });

  app.post('/api/company/roles/:companyId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
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

  app.patch('/api/company/roles/:roleId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }
      const roleId = parseInt(req.params.roleId);

      const updatedRole = await storage.updateCompanyRole(roleId, req.body);
      res.json(updatedRole);
    } catch (error) {
      console.error("Error updating company role:", error);
      res.status(500).json({ message: "Failed to update company role" });
    }
  });

  app.delete('/api/company/roles/:roleId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
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
  app.get('/api/model-fusion-config', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const userRoleLevel = user?.roleLevel || 1;
      if (userRoleLevel < 99) { // Must be owner (99) or higher
        return res.status(403).json({ message: "Owner or super-user access required" });
      }
      
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      
      const config = await storage.getModelFusionConfig(user.companyId);
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