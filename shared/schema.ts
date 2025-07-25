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
  real,
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

// Email verification tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_token").on(table.email),
  index("idx_token_expires").on(table.token, table.expiresAt),
]);

// User sessions table for cookie-based auth
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionToken: varchar("session_token").notNull().unique(),
  email: varchar("email").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  roleLevel: integer("role_level").default(1),
  expiresAt: timestamp("expires_at").notNull(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_session_token").on(table.sessionToken),
  index("idx_user_session").on(table.userId),
]);

// Companies table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  domain: varchar("domain").unique(),
  primaryAdminName: varchar("primary_admin_name"),
  primaryAdminEmail: varchar("primary_admin_email"),
  primaryAdminTitle: varchar("primary_admin_title"),
  logo: text("logo"),
  logoSize: integer("logo_size").default(100), // Logo size in pixels (60-300)
  companyNameSize: integer("company_name_size").default(28), // Company name font size in pixels (16-48)
  showCompanyName: boolean("show_company_name").default(true),
  showCompanyLogo: boolean("show_company_logo").default(true),
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
  role: varchar("role").default("guest").notNull(), // guest, user, admin, owner, super-user
  roleLevel: integer("role_level").default(0).notNull(), // 0=guest, 1=user, 2=admin, 99=owner, 100=super-user
  companyRoleId: integer("company_role_id").references(() => companyRoles.id),
  companyId: integer("company_id").references(() => companies.id),
  department: varchar("department"),
  isTrialUser: boolean("is_trial_user").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions table - manages both company and individual subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  type: varchar("type").notNull(), // "company", "individual"
  companyId: integer("company_id").references(() => companies.id),
  userId: varchar("user_id").references(() => users.id),
  planId: varchar("plan_id").notNull(), // "trial", "basic", "pro", "enterprise"
  status: varchar("status").notNull(), // "active", "cancelled", "expired", "suspended"
  billingCycle: varchar("billing_cycle").default("monthly"), // "monthly", "yearly"
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(true),
  maxUsers: integer("max_users"), // For company subscriptions
  pricePerMonth: real("price_per_month"),
  currency: varchar("currency").default("USD"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_subscription_company").on(table.companyId),
  index("idx_subscription_user").on(table.userId),
  index("idx_subscription_status").on(table.status),
]);

// Trial tracking table - manages free trial usage and limits
export const trialUsage = pgTable("trial_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  companyId: integer("company_id").references(() => companies.id),
  email: varchar("email").notNull(),
  ipAddress: varchar("ip_address"),
  deviceFingerprint: varchar("device_fingerprint"),
  actionsUsed: integer("actions_used").default(0).notNull(),
  maxActions: integer("max_actions").default(10).notNull(), // Free trial limit
  trialStartDate: timestamp("trial_start_date").defaultNow(),
  trialEndDate: timestamp("trial_end_date"),
  isTrialExpired: boolean("is_trial_expired").default(false),
  hasUpgraded: boolean("has_upgraded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_trial_user").on(table.userId),
  index("idx_trial_email").on(table.email),
  index("idx_trial_ip").on(table.ipAddress),
  index("idx_trial_device").on(table.deviceFingerprint),
]);

// AI Models configuration
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name").notNull(),
  provider: varchar("provider").notNull(), // openai, anthropic, perplexity, google, cohere, custom
  modelId: varchar("model_id").notNull(),
  description: text("description"),
  contextWindow: integer("context_window").default(4096).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  capabilities: jsonb("capabilities"), // ["text-generation", "code-generation", "multimodal", etc.]
  // API Configuration
  apiKey: text("api_key").notNull(),
  apiEndpoint: text("api_endpoint").notNull(),
  authMethod: varchar("auth_method").default("bearer").notNull(), // bearer, api-key, x-api-key, basic, custom
  requestHeaders: jsonb("request_headers"), // JSON object with headers
  maxTokens: integer("max_tokens").default(1000).notNull(),
  temperature: real("temperature").default(0.7).notNull(),
  // Advanced settings
  maxRetries: integer("max_retries").default(3).notNull(),
  timeout: integer("timeout").default(30000).notNull(), // milliseconds
  rateLimit: integer("rate_limit").default(100).notNull(), // requests per minute
  organizationId: varchar("organization_id"),
  // Status
  lastTested: timestamp("last_tested"),
  isWorking: boolean("is_working"),
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

// Permissions configuration
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // ai_model_access, activity_types, content_access, administrative
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_permissions_company").on(table.companyId),
  index("idx_permissions_category").on(table.category),
]);

// User activities tracking
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
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
  isTrialAction: boolean("is_trial_action").default(false), // Track if this was a trial action
  tokenUsage: jsonb("token_usage"), // Track API token usage for billing
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

// Chat attachments
export const chatAttachments = pgTable("chat_attachments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  messageId: integer("message_id").references(() => chatMessages.id).notNull(),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  content: text("content").notNull(), // file content stored directly in database
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => [
  index("idx_chat_attachment_message").on(table.messageId),
  index("idx_chat_attachment_company").on(table.companyId),
]);

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

// Model Fusion configuration
export const modelFusionConfigs = pgTable("model_fusion_configs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  summaryModelId: integer("summary_model_id").references(() => aiModels.id), // Model used for final summary
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_model_fusion_company").on(table.companyId),
]);

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompanyEmployeeSchema = createInsertSchema(companyEmployees).omit({ id: true, addedAt: true });
export const insertCompanyRoleSchema = createInsertSchema(companyRoles).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiModelSchema = createInsertSchema(aiModels).omit({ id: true, createdAt: true });
export const insertActivityTypeSchema = createInsertSchema(activityTypes).omit({ id: true, createdAt: true });
export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true, createdAt: true });
export const insertUserActivitySchema = createInsertSchema(userActivities).omit({ id: true, timestamp: true });
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, timestamp: true });
export const insertChatAttachmentSchema = createInsertSchema(chatAttachments).omit({ id: true, uploadedAt: true });
export const insertContextDocumentSchema = createInsertSchema(contextDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivityContextLinkSchema = createInsertSchema(activityContextLinks).omit({ id: true, createdAt: true });
export const insertModelFusionConfigSchema = createInsertSchema(modelFusionConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({ id: true, createdAt: true });
export const insertUserSessionSchema = createInsertSchema(userSessions).omit({ id: true, createdAt: true, lastAccessedAt: true });

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
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatAttachment = typeof chatAttachments.$inferSelect;
export type InsertChatAttachment = z.infer<typeof insertChatAttachmentSchema>;
export type ChatMessageWithModel = ChatMessage & { aiModel?: AiModel; attachments?: ChatAttachment[] };
export type ContextDocument = typeof contextDocuments.$inferSelect;
export type InsertContextDocument = z.infer<typeof insertContextDocumentSchema>;
export type ActivityContextLink = typeof activityContextLinks.$inferSelect;
export type InsertActivityContextLink = z.infer<typeof insertActivityContextLinkSchema>;
export type ModelFusionConfig = typeof modelFusionConfigs.$inferSelect;
export type InsertModelFusionConfig = z.infer<typeof insertModelFusionConfigSchema>;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

// Subscription Plans
export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // 'trial', 'personal', 'company'
  displayName: varchar('display_name', { length: 100 }).notNull(),
  price: varchar('price', { length: 20 }).notNull(), // Store as string to avoid decimal issues
  billingPeriod: varchar('billing_period', { length: 20 }).notNull(), // 'monthly', 'yearly'
  maxUsers: integer('max_users'), // null for unlimited
  dailyApiLimit: integer('daily_api_limit').notNull(),
  monthlyApiLimit: integer('monthly_api_limit').notNull(),
  requiresCreditCard: boolean('requires_credit_card').notNull().default(false),
  requiresApiKey: boolean('requires_api_key').notNull().default(false),
  features: text('features').array(), // JSON array of features
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// User Subscriptions
export const userSubscriptions = pgTable('user_subscriptions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  companyId: integer('company_id').references(() => companies.id),
  planId: integer('plan_id').references(() => subscriptionPlans.id).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'active', 'cancelled', 'expired', 'pending'
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  trialEnd: timestamp('trial_end'),
  cancelAt: timestamp('cancel_at'),
  canceledAt: timestamp('canceled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// API Usage Tracking
export const apiUsageTracking = pgTable('api_usage_tracking', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  companyId: integer('company_id').references(() => companies.id),
  subscriptionId: integer('subscription_id').references(() => userSubscriptions.id),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD for daily tracking
  apiCalls: integer('api_calls').notNull().default(0),
  aiTokensUsed: integer('ai_tokens_used').notNull().default(0),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Payment Information (for credit card validation)
export const paymentMethods = pgTable('payment_methods', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  stripePaymentMethodId: varchar('stripe_payment_method_id', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'card'
  cardBrand: varchar('card_brand', { length: 20 }), // 'visa', 'mastercard', etc.
  cardLast4: varchar('card_last4', { length: 4 }),
  cardExpMonth: integer('card_exp_month'),
  cardExpYear: integer('card_exp_year'),
  isDefault: boolean('is_default').notNull().default(false),
  isValid: boolean('is_valid').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Updated trial usage for 30-day trial with credit card requirement
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true });
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApiUsageTrackingSchema = createInsertSchema(apiUsageTracking).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertTrialUsageSchema = createInsertSchema(trialUsage);

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type ApiUsageTracking = typeof apiUsageTracking.$inferSelect;
export type InsertApiUsageTracking = z.infer<typeof insertApiUsageTrackingSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type TrialUsage = typeof trialUsage.$inferSelect;
export type InsertTrialUsage = z.infer<typeof insertTrialUsageSchema>;
