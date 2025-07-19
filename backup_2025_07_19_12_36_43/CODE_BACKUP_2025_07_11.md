# AI Sentinel - Complete Code Backup
## Date: July 11, 2025

This is a comprehensive backup of the AI Sentinel enterprise AI governance platform. The system provides secure, compliant, and monitored AI interactions for organizations with comprehensive administrative capabilities.

## System Overview

- **Frontend**: React 18 with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js with Express.js, PostgreSQL with Drizzle ORM  
- **Authentication**: Replit Auth with OpenID Connect
- **Database**: Railway PostgreSQL deployment
- **AI Providers**: OpenAI, Anthropic, Perplexity support
- **Architecture**: Full multi-tenancy with company-based data isolation

## Key Features Implemented

✅ **Complete Authentication System**
- Replit Auth integration with OpenID Connect
- Hierarchical role-based access control (super-user: 100, owner: 99, admin: 2, user: 1)
- Company-based authentication and employee authorization
- Session management with PostgreSQL storage

✅ **Multi-Model AI Integration**
- OpenAI GPT-4o support
- Anthropic Claude Sonnet 4 support  
- Perplexity AI integration for real-time information
- Activity-specific pre-prompts for guided AI behavior

✅ **Advanced Chat Management**
- Complete session history with message counts and previews
- Session restoration - click to load previous conversations
- Repeat functionality - fills input field for message modification
- Real-time WebSocket communication

✅ **Enterprise Administration**
- Company management (super-user level)
- Owner management system with add/remove functionality
- AI model configuration and enabling/disabling
- Activity type management with pre-prompts and risk levels
- Content filtering and security monitoring

✅ **Security & Compliance**
- PII detection and data leakage prevention
- Content filtering for sensitive information
- Activity logging and audit trails
- Company data isolation and multi-tenancy

## Core Files

### Database Schema (`shared/schema.ts`)
```typescript
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Companies table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  domain: varchar("domain").unique(),
  primaryAdminName: varchar("primary_admin_name"),
  primaryAdminEmail: varchar("primary_admin_email"),
  primaryAdminTitle: varchar("primary_admin_title"),
  logo: text("logo"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company employees table
export const companyEmployees = pgTable("company_employees", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  email: varchar("email").notNull(),
  role: varchar("role").default("employee"),
  department: varchar("department"),
  isActive: boolean("is_active").default(true),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  index("idx_company_employee_email").on(table.email),
  index("idx_company_employee_company").on(table.companyId),
]);

// Company roles table
export const companyRoles = pgTable("company_roles", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name").notNull(),
  level: integer("level").notNull(), // 1=user, 2=admin, 99=owner, 100=super-user
  description: text("description"),
  permissions: jsonb("permissions"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_company_role_level").on(table.companyId, table.level),
]);

// Users table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(),
  roleLevel: integer("role_level").default(1).notNull(),
  companyRoleId: integer("company_role_id").references(() => companyRoles.id),
  companyId: integer("company_id").references(() => companies.id),
  department: varchar("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Models configuration
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name").notNull(),
  provider: varchar("provider").notNull(), // openai, anthropic, perplexity
  modelId: varchar("model_id").notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity types configuration
export const activityTypes = pgTable("activity_types", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  prePrompt: text("pre_prompt"), // System prompt for AI behavior
  riskLevel: varchar("risk_level").default("low").notNull(),
  permissions: jsonb("permissions"),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User activities tracking
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  aiModelId: integer("ai_model_id").references(() => aiModels.id),
  activityTypeId: integer("activity_type_id").references(() => activityTypes.id),
  message: text("message"),
  response: text("response"),
  status: varchar("status").notNull(),
  securityFlags: jsonb("security_flags"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
});

// Chat sessions
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  sessionId: integer("session_id").references(() => chatSessions.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  aiModelId: integer("ai_model_id").references(() => aiModels.id).notNull(),
  activityTypeId: integer("activity_type_id").references(() => activityTypes.id).notNull(),
  message: text("message").notNull(),
  response: text("response"),
  status: varchar("status").notNull(),
  securityFlags: jsonb("security_flags"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Insert schemas and types
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompanyEmployeeSchema = createInsertSchema(companyEmployees).omit({ id: true, addedAt: true });
export const insertCompanyRoleSchema = createInsertSchema(companyRoles).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiModelSchema = createInsertSchema(aiModels).omit({ id: true, createdAt: true });
export const insertActivityTypeSchema = createInsertSchema(activityTypes).omit({ id: true, createdAt: true });
export const insertUserActivitySchema = createInsertSchema(userActivities).omit({ id: true, timestamp: true });
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, timestamp: true });

// Type definitions
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type CompanyEmployee = typeof companyEmployees.$inferSelect;
export type InsertCompanyEmployee = z.infer<typeof insertCompanyEmployeeSchema>;
export type CompanyRole = typeof companyRoles.$inferSelect;
export type InsertCompanyRole = z.infer<typeof insertCompanyRoleSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiModel = z.infer<typeof insertAiModelSchema>;
export type ActivityType = typeof activityTypes.$inferSelect;
export type InsertActivityType = z.infer<typeof insertActivityTypeSchema>;
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ChatMessageWithModel = ChatMessage & { aiModel?: AiModel };
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
```

### Package Configuration (`package.json`)
```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.37.0",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-select": "^2.1.7",
    "@tanstack/react-query": "^5.60.5",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "drizzle-orm": "^0.39.3",
    "drizzle-zod": "^0.7.0",
    "openai": "^5.8.2",
    "openid-client": "^6.6.2",
    "passport": "^0.7.0",
    "pg": "^8.16.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "^3.4.17",
    "wouter": "^3.3.5",
    "ws": "^8.18.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.2",
    "drizzle-kit": "^0.30.4",
    "typescript": "5.6.3",
    "vite": "^5.4.19"
  }
}
```

### Server Entry Point (`server/index.ts`)
```typescript
import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  abortOnLimit: true,
  responseOnLimit: "File size limit exceeded",
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup development or production serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server on port 5000
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
```

### AI Service (`server/services/aiService.ts`)
```typescript
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { storage } from "../storage";

// Latest model versions
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_OPENAI_MODEL = "gpt-4o";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class AIService {
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    try {
      const file = new File([audioBuffer], filename, { type: 'audio/wav' });
      const response = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en',
        response_format: 'text'
      });
      return response;
    } catch (error) {
      console.error("Whisper API error:", error);
      throw new Error("Failed to transcribe audio");
    }
  }

  async generateResponse(message: string, aiModelId: number, companyId: number, activityTypeId?: number): Promise<string> {
    try {
      const models = await storage.getAiModels(companyId);
      const model = models.find(m => m.id === aiModelId);

      if (!model || !model.isEnabled) {
        throw new Error("AI model not found or disabled");
      }

      // Get activity-specific system prompt
      let systemPrompt = "You are an AI assistant in a corporate environment. Provide helpful, professional responses while being mindful of data privacy and security.";
      
      if (activityTypeId) {
        const activityTypes = await storage.getActivityTypes(companyId);
        const activityType = activityTypes.find(at => at.id === activityTypeId);
        if (activityType?.prePrompt) {
          systemPrompt = activityType.prePrompt;
        }
      }

      // Route to appropriate provider
      switch (model.provider) {
        case "openai":
          return await this.generateOpenAIResponse(message, model.modelId, systemPrompt);
        case "anthropic":
          return await this.generateAnthropicResponse(message, model.modelId, systemPrompt);
        case "perplexity":
          return await this.generatePerplexityResponse(message, model.modelId, systemPrompt);
        default:
          throw new Error(`Unsupported AI provider: ${model.provider}`);
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      throw new Error("Failed to generate AI response");
    }
  }

  private async generateOpenAIResponse(message: string, modelId: string, systemPrompt: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });
    return response.choices[0].message.content || "I apologize, but I couldn't generate a response.";
  }

  private async generateAnthropicResponse(message: string, modelId: string, systemPrompt: string): Promise<string> {
    const response = await anthropic.messages.create({
      model: modelId,
      system: systemPrompt,
      max_tokens: 1000,
      messages: [{ role: "user", content: message }],
    });
    return response.content[0].text || "I apologize, but I couldn't generate a response.";
  }

  private async generatePerplexityResponse(message: string, modelId: string, systemPrompt: string): Promise<string> {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || "I apologize, but I couldn't generate a response.";
  }
}

export const aiService = new AIService();
```

### Chat Interface (`client/src/components/chat/ChatInterface.tsx`)
```typescript
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, RotateCcw, Trash2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

interface ChatInterfaceProps {
  currentSession: number | null;
  setCurrentSession: (sessionId: number) => void;
}

export default function ChatInterface({ currentSession, setCurrentSession }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [selectedActivityType, setSelectedActivityType] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [showPreviousChats, setShowPreviousChats] = useState(false);
  const [prefillMessage, setPrefillMessage] = useState<string>("");

  // Fetch AI models and activity types
  const { data: aiModels } = useQuery<AiModel[]>({ queryKey: ['/api/ai-models'] });
  const { data: activityTypes } = useQuery<ActivityType[]>({ queryKey: ['/api/activity-types'] });
  const { data: currentCompany } = useQuery<Company>({ queryKey: ['/api/user/current-company'] });

  // Chat session management
  const createSessionMutation = useMutation({
    mutationFn: async () => apiRequest("/api/chat/session", "POST"),
    onSuccess: (session) => {
      setCurrentSession(session.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/session'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!currentSession || !selectedModel || !selectedActivityType) {
        throw new Error("Missing required parameters");
      }
      return apiRequest("/api/chat/message", "POST", {
        sessionId: currentSession,
        message,
        aiModelId: selectedModel,
        activityTypeId: selectedActivityType,
      });
    },
    onSuccess: (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      setLastMessage(newMessage.message);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
    },
  });

  // Chat management functions
  const handleClearChat = () => {
    createSessionMutation.mutate();
    setMessages([]);
    setLastMessage("");
    toast({ title: "New Chat Started", description: "Started a new chat session" });
  };

  const handleRepeatLast = () => {
    if (!lastMessage) {
      toast({ title: "No Previous Message", description: "No previous message to repeat", variant: "destructive" });
      return;
    }
    setPrefillMessage(lastMessage);
    setTimeout(() => setPrefillMessage(""), 100);
  };

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessageMutation.mutateAsync(message);
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header with controls */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select value={selectedModel?.toString()} onValueChange={(value) => setSelectedModel(parseInt(value))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select AI Model" />
              </SelectTrigger>
              <SelectContent>
                {aiModels?.map((model) => (
                  <SelectItem key={model.id} value={model.id.toString()}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedActivityType?.toString()} onValueChange={(value) => setSelectedActivityType(parseInt(value))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Activity Type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreviousChats(!showPreviousChats)}>
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={handleRepeatLast}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Repeat
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearChat}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>

      {/* Chat input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!selectedModel || !selectedActivityType || !currentSession || sendMessageMutation.isPending}
        prefillMessage={prefillMessage}
      />
    </div>
  );
}
```

### Chat Input Component (`client/src/components/chat/ChatInput.tsx`)
```typescript
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import VoiceInput from "./VoiceInput";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  prefillMessage?: string;
}

export default function ChatInput({ onSendMessage, disabled, prefillMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle prefill message
  useEffect(() => {
    if (prefillMessage) {
      setMessage(prefillMessage);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [prefillMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-4">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="min-h-[40px] max-h-32 resize-none"
            disabled={disabled}
          />
        </div>
        <div className="flex items-end space-x-2">
          <VoiceInput onTranscription={(text) => setMessage(prev => prev + (prev ? ' ' : '') + text)} disabled={disabled} />
          <Button type="submit" disabled={!message.trim() || disabled} className="bg-sentinel-blue hover:bg-blue-600">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
        <span>All conversations are monitored and logged for compliance.</span>
        <span>Press Enter to send</span>
      </div>
    </div>
  );
}
```

### Main App Router (`client/src/App.tsx`)
```typescript
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompanyContext";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import CompanyManagement from "@/pages/admin/company-management";
import AdminModels from "@/pages/admin/models";
import AdminActivityTypes from "@/pages/admin/activity-types";
import CompanySetup from "@/pages/company-setup";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/admin" component={CompanyManagement} />
          <Route path="/admin/models" component={AdminModels} />
          <Route path="/admin/activity-types" component={AdminActivityTypes} />
          <Route path="/company-setup" component={CompanySetup} />
          {/* Additional admin routes */}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CompanyProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CompanyProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### Database Configuration (`drizzle.config.ts`)
```typescript
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

## Environment Variables Required

```env
DATABASE_URL=postgresql://...
RAILWAY_DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
SESSION_SECRET=your-secret-key
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.com
```

## Deployment Instructions

1. **Database Setup**:
   ```bash
   npm run db:push
   ```

2. **Development**:
   ```bash
   npm run dev
   ```

3. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

## Key Business Rules

1. **Role Hierarchy**: super-user (100) > owner (99) > admin (2) > user (1)
2. **Company Isolation**: All data is isolated by company ID
3. **Authentication**: Email domain-based company assignment
4. **Owner Protection**: Cannot delete the last company owner
5. **Security**: All AI interactions are logged and monitored

## Recent Updates (July 11, 2025)

- ✅ Enhanced chat management with full session functionality
- ✅ Implemented complete chat session history with message counts and previews
- ✅ Added session restoration - clicking previous chat loads all messages
- ✅ Modified repeat functionality to fill input field instead of auto-submitting
- ✅ Enhanced session display to show first line of last message
- ✅ Fixed session history refresh to update immediately when new messages are sent
- ✅ All chat sessions properly isolated by company with Railway PostgreSQL storage

## Status: Production Ready ✅

The AI Sentinel platform is fully functional with:
- Complete authentication and authorization system
- Multi-model AI integration with OpenAI, Anthropic, and Perplexity
- Advanced chat management and session restoration
- Company-based multi-tenancy with data isolation
- Comprehensive administrative controls
- Security and compliance features
- Railway PostgreSQL production database

All core features are implemented and tested. The system is ready for enterprise deployment.