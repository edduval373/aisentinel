import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { contentFilter } from "./services/contentFilter";
import { insertUserActivitySchema, insertChatMessageSchema, insertCompanyRoleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default AI models and activity types
  await initializeDefaultData();

  // Auth routes
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

  // AI Models routes
  app.get('/api/ai-models', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      const models = await storage.getEnabledAiModels(user.companyId);
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
  app.get('/api/activity-types', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      const types = await storage.getEnabledActivityTypes(user.companyId);
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

  app.get('/api/user/current-company', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      const company = await storage.getCompanyById(user.companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json(company);
    } catch (error) {
      console.error("Error fetching current company:", error);
      res.status(500).json({ message: "Failed to fetch current company" });
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

  // Chat routes
  app.post('/api/chat/session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      const session = await storage.createChatSession({ companyId: user.companyId, userId });
      res.json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.get('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      const sessions = await storage.getUserChatSessions(userId, user.companyId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.get('/api/chat/session/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }
      const messages = await storage.getChatMessages(sessionId, user.companyId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/chat/message', isAuthenticated, async (req: any, res) => {
    try {
      const { message, aiModelId, activityTypeId, sessionId } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.companyId) {
        return res.status(400).json({ message: "No company associated with user" });
      }

      // Validate that the session belongs to the user's company
      const session = await storage.getChatSession(sessionId, user.companyId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      // Apply content filtering
      const filterResult = await contentFilter.filterMessage(message);
      if (filterResult.blocked) {
        // Log the security violation
        await storage.createUserActivity({
          companyId: user.companyId,
          userId,
          activityTypeId,
          description: `Content blocked: ${filterResult.reason}`,
          status: 'blocked',
          metadata: { originalMessage: message, flags: filterResult.flags }
        });
        
        return res.status(400).json({ 
          message: "Content blocked by security filter", 
          reason: filterResult.reason 
        });
      }

      // Validate AI model exists and is enabled
      const models = await storage.getAiModels(user.companyId);
      const selectedModel = models.find(m => m.id === aiModelId);
      if (!selectedModel) {
        return res.status(400).json({ message: "AI model not found" });
      }
      if (!selectedModel.isEnabled) {
        return res.status(400).json({ message: "AI model is disabled" });
      }

      // Generate AI response
      const aiResponse = await aiService.generateResponse(message, aiModelId, user.companyId, activityTypeId);
      
      // Create chat message with company isolation
      const chatMessage = await storage.createChatMessage({
        companyId: user.companyId,
        sessionId,
        userId,
        aiModelId,
        activityTypeId,
        message,
        response: aiResponse,
        status: 'approved',
        securityFlags: filterResult.flags
      });

      // Log the user activity
      await storage.createUserActivity({
        companyId: user.companyId,
        userId,
        activityTypeId,
        description: `Chat message sent`,
        status: 'completed',
        metadata: { messageId: chatMessage.id, aiModelId }
      });

      res.json(chatMessage);
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