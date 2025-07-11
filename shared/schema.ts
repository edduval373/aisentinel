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

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
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
  role: varchar("role").default("employee"), // employee, admin, owner
  department: varchar("department"),
  isActive: boolean("is_active").default(true),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  index("idx_company_employee_email").on(table.email),
  index("idx_company_employee_company").on(table.companyId),
]);

// Company roles table - allows companies to define their own role hierarchy
export const companyRoles = pgTable("company_roles", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name").notNull(), // e.g., "Manager", "Lead", "Senior", etc.
  level: integer("level").notNull(), // 1=user, 2=admin, 99=owner, 100=super-user
  description: text("description"),
  permissions: jsonb("permissions"), // customizable permissions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_company_role_level").on(table.companyId, table.level),
]);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(), // user, admin, owner, super-user (legacy field)
  roleLevel: integer("role_level").default(1).notNull(), // 1=user, 2=admin, 99=owner, 100=super-user
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
  provider: varchar("provider").notNull(), // openai, anthropic
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
  prePrompt: text("pre_prompt"), // System prompt to guide AI behavior for this activity type
  riskLevel: varchar("risk_level").default("low").notNull(), // low, medium, high
  permissions: jsonb("permissions"), // ["read", "write", "analyze", etc.]
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
  status: varchar("status").notNull(), // approved, blocked, pending
  securityFlags: jsonb("security_flags"), // PII detected, financial data, etc.
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  description: text("description").notNull(), // What activity was performed
  metadata: jsonb("metadata"), // Additional context data
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

// Context documents
export const contextDocuments = pgTable("context_documents", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // 'policy', 'procedure', 'guideline', 'knowledge'
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  content: text("content").notNull(), // processed text content
  priority: integer("priority").default(1).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Link documents to activity types
export const activityContextLinks = pgTable("activity_context_links", {
  id: serial("id").primaryKey(),
  activityTypeId: integer("activity_type_id").references(() => activityTypes.id).notNull(),
  documentId: integer("document_id").references(() => contextDocuments.id).notNull(),
  usageType: varchar("usage_type").default("optional").notNull(), // 'required', 'optional'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_activity_context_activity").on(table.activityTypeId),
  index("idx_activity_context_document").on(table.documentId),
]);

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompanyEmployeeSchema = createInsertSchema(companyEmployees).omit({ id: true, addedAt: true });
export const insertCompanyRoleSchema = createInsertSchema(companyRoles).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiModelSchema = createInsertSchema(aiModels).omit({ id: true, createdAt: true });
export const insertActivityTypeSchema = createInsertSchema(activityTypes).omit({ id: true, createdAt: true });
export const insertUserActivitySchema = createInsertSchema(userActivities).omit({ id: true, timestamp: true });
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, timestamp: true });
export const insertContextDocumentSchema = createInsertSchema(contextDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivityContextLinkSchema = createInsertSchema(activityContextLinks).omit({ id: true, createdAt: true });

// Types
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
export type ContextDocument = typeof contextDocuments.$inferSelect;
export type InsertContextDocument = z.infer<typeof insertContextDocumentSchema>;
export type ActivityContextLink = typeof activityContextLinks.$inferSelect;
export type InsertActivityContextLink = z.infer<typeof insertActivityContextLinkSchema>;
