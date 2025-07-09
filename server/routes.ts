import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { contentFilter } from "./services/contentFilter";
import { insertUserActivitySchema, insertChatMessageSchema } from "@shared/schema";
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
  app.get('/api/ai-models', isAuthenticated, async (req, res) => {
    try {
      const models = await storage.getEnabledAiModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ message: "Failed to fetch AI models" });
    }
  });

  app.get('/api/admin/ai-models', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const models = await storage.getAiModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ message: "Failed to fetch AI models" });
    }
  });

  app.post('/api/admin/ai-models', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const model = await storage.createAiModel(req.body);
      res.json(model);
    } catch (error) {
      console.error("Error creating AI model:", error);
      res.status(500).json({ message: "Failed to create AI model" });
    }
  });

  app.patch('/api/admin/ai-models/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
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

  // Activity Types routes
  app.get('/api/activity-types', isAuthenticated, async (req, res) => {
    try {
      const types = await storage.getEnabledActivityTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching activity types:", error);
      res.status(500).json({ message: "Failed to fetch activity types" });
    }
  });

  app.get('/api/admin/activity-types', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const types = await storage.getActivityTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching activity types:", error);
      res.status(500).json({ message: "Failed to fetch activity types" });
    }
  });

  app.patch('/api/admin/activity-types/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
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
      const activities = await storage.getUserActivities(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  app.get('/api/admin/user-activities', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const activities = await storage.getUserActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const stats = await storage.getActivityStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Chat routes
  app.post('/api/chat/message', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, aiModelId, activityTypeId, sessionId } = req.body;

      // Validate input
      const validationResult = insertChatMessageSchema.safeParse({
        sessionId,
        userId,
        aiModelId,
        activityTypeId,
        message,
        response: '',
        status: 'pending',
        securityFlags: null,
      });

      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid input", errors: validationResult.error.errors });
      }

      // Filter content for security
      const filterResult = await contentFilter.filterMessage(message);
      
      if (filterResult.blocked) {
        // Log blocked activity
        await storage.createUserActivity({
          userId,
          aiModelId,
          activityTypeId,
          message,
          response: null,
          status: 'blocked',
          securityFlags: filterResult.flags,
        });

        return res.status(403).json({ 
          message: "Message blocked by security policy",
          reason: filterResult.reason,
          flags: filterResult.flags 
        });
      }

      // Get AI response
      const aiResponse = await aiService.generateResponse(message, aiModelId);

      // Create chat message
      const chatMessage = await storage.createChatMessage({
        sessionId,
        userId,
        aiModelId,
        activityTypeId,
        message,
        response: aiResponse,
        status: 'approved',
        securityFlags: filterResult.flags,
      });

      // Log activity
      await storage.createUserActivity({
        userId,
        aiModelId,
        activityTypeId,
        message,
        response: aiResponse,
        status: 'approved',
        securityFlags: filterResult.flags,
      });

      res.json(chatMessage);
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  app.post('/api/chat/session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.createChatSession({ userId });
      res.json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.get('/api/chat/session/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
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
    // Initialize default AI models
    const existingModels = await storage.getAiModels();
    if (existingModels.length === 0) {
      await storage.createAiModel({
        name: "GPT-4",
        provider: "openai",
        modelId: "gpt-4o",
        isEnabled: true,
      });
      await storage.createAiModel({
        name: "GPT-3.5 Turbo",
        provider: "openai",
        modelId: "gpt-3.5-turbo",
        isEnabled: true,
      });
      await storage.createAiModel({
        name: "Claude 3",
        provider: "anthropic",
        modelId: "claude-sonnet-4-20250514",
        isEnabled: true,
      });
    }

    // Initialize default activity types
    const existingTypes = await storage.getActivityTypes();
    if (existingTypes.length === 0) {
      await storage.createActivityType({
        name: "General Inquiry",
        description: "General questions and inquiries",
        isEnabled: true,
      });
      await storage.createActivityType({
        name: "Code Review",
        description: "Code analysis and review",
        isEnabled: true,
      });
      await storage.createActivityType({
        name: "Documentation",
        description: "Documentation writing and review",
        isEnabled: true,
      });
      await storage.createActivityType({
        name: "Brainstorming",
        description: "Creative brainstorming sessions",
        isEnabled: true,
      });
      await storage.createActivityType({
        name: "Data Analysis",
        description: "Data analysis and insights",
        isEnabled: false, // Disabled by default for security
      });
    }
  } catch (error) {
    console.error("Error initializing default data:", error);
  }
}
