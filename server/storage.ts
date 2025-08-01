import {
  users,
  companies,
  companyEmployees,
  companyRoles,
  aiModels,
  aiModelTemplates,
  companyApiKeys,
  activityTypes,
  permissions,
  userActivities,
  chatSessions,
  chatMessages,
  chatAttachments,
  contextDocuments,
  activityContextLinks,
  modelFusionConfigs,
  emailVerificationTokens,
  userSessions,
  subscriptions,
  trialUsage,
  demoUsers,
  versionReleases,
  versionFeatures,
  versionDeployments,
  appVersions,
  subscriptionPlans,
  userSubscriptions,
  apiUsageTracking,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type CompanyEmployee,
  type InsertCompanyEmployee,
  type CompanyRole,
  type InsertCompanyRole,
  type AiModel,
  type InsertAiModel,
  type AiModelTemplate,
  type InsertAiModelTemplate,
  type CompanyApiKey,
  type InsertCompanyApiKey,
  type AiModelWithApiKey,
  type ActivityType,
  type InsertActivityType,
  type Permission,
  type InsertPermission,
  type UserActivity,
  type InsertUserActivity,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type ChatAttachment,
  type InsertChatAttachment,
  type ContextDocument,
  type InsertContextDocument,
  type ActivityContextLink,
  type InsertActivityContextLink,
  type ModelFusionConfig,
  type InsertModelFusionConfig,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
  type UserSession,
  type InsertUserSession,
  type Subscription,
  type InsertSubscription,
  type TrialUsage,
  type InsertTrialUsage,
  type DemoUser,
  type InsertDemoUser,
  type VersionRelease,
  type InsertVersionRelease,
  type VersionFeature,
  type InsertVersionFeature,
  type VersionDeployment,
  type InsertVersionDeployment,
  type AppVersion,
  type InsertAppVersion,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type UserSubscription,
  type InsertUserSubscription,
  type ApiUsageTracking,
  type InsertApiUsageTracking,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql, sum, like, inArray, gte, asc, not, ilike } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Authentication operations
  createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  markEmailVerificationTokenAsUsed(id: number): Promise<void>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSession(sessionToken: string): Promise<UserSession | undefined>;
  updateUserSession(sessionToken: string, updates: Partial<UserSession>): Promise<void>;
  updateUserSessionLastAccessed(sessionId: number): Promise<void>;
  deleteUserSession(sessionToken: string): Promise<void>;
  
  // Demo user operations
  createDemoUser(demoUser: InsertDemoUser): Promise<DemoUser>;
  getDemoUser(sessionToken: string): Promise<DemoUser | undefined>;
  incrementDemoUserQuestions(sessionToken: string): Promise<DemoUser>;
  getDemoUserByEmail(email: string): Promise<DemoUser | undefined>;
  
  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByDomain(domain: string): Promise<Company | undefined>;
  getCompanyByEmailDomain(email: string): Promise<Company | undefined>;
  getCompanyEmployeeByEmail(email: string): Promise<CompanyEmployee | undefined>;
  getCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;
  getCompanyById(id: number): Promise<Company | undefined>;
  getCompanyEmployees(companyId: number): Promise<CompanyEmployee[]>;
  addCompanyEmployee(employee: InsertCompanyEmployee): Promise<CompanyEmployee>;
  isEmployeeAuthorized(email: string, companyId: number): Promise<boolean>;
  
  // Company initialization
  initializeCompanyDefaults(companyId: number): Promise<void>;
  
  // Owner operations
  getCompanyOwners(companyId: number): Promise<User[]>;
  addCompanyOwner(companyId: number, userData: { firstName: string; lastName: string; email: string; department?: string }): Promise<User>;
  updateCompanyOwner(userId: string, userData: { firstName?: string; lastName?: string; email?: string; department?: string }): Promise<User>;
  removeCompanyOwner(userId: string, companyId: number): Promise<void>;
  
  // Company Role operations
  getCompanyRoles(companyId: number): Promise<CompanyRole[]>;
  createCompanyRole(role: InsertCompanyRole): Promise<CompanyRole>;
  updateCompanyRole(id: number, role: Partial<InsertCompanyRole>): Promise<CompanyRole>;
  deleteCompanyRole(id: number): Promise<void>;
  getUserRoleLevel(userId: string): Promise<number>;
  
  // AI Models operations (legacy)
  getAiModels(companyId: number): Promise<AiModel[]>;
  getWorkingAiModels(companyId: number): Promise<AiModel[]>;
  getEnabledAiModels(companyId: number): Promise<AiModel[]>;
  createAiModel(model: InsertAiModel): Promise<AiModel>;
  updateAiModel(id: number, model: Partial<InsertAiModel>): Promise<AiModel>;
  
  // AI Model Template operations (universal templates)
  getAiModelTemplates(): Promise<AiModelTemplate[]>;
  getAiModelTemplate(id: number): Promise<AiModelTemplate | undefined>;
  createAiModelTemplate(template: InsertAiModelTemplate): Promise<AiModelTemplate>;
  updateAiModelTemplate(id: number, template: Partial<InsertAiModelTemplate>): Promise<AiModelTemplate>;
  deleteAiModelTemplate(id: number): Promise<void>;
  
  // Company API Key operations
  getCompanyApiKeys(companyId: number): Promise<CompanyApiKey[]>;
  getCompanyApiKey(companyId: number, templateId: number): Promise<CompanyApiKey | undefined>;
  createCompanyApiKey(apiKey: InsertCompanyApiKey): Promise<CompanyApiKey>;
  updateCompanyApiKey(id: number, apiKey: Partial<InsertCompanyApiKey>): Promise<CompanyApiKey>;
  deleteCompanyApiKey(id: number): Promise<void>;
  
  // Combined AI Models with API Keys (what the frontend uses)
  getAiModelsWithApiKeys(companyId: number): Promise<AiModelWithApiKey[]>;
  
  // Activity Types operations
  getActivityTypes(companyId: number): Promise<ActivityType[]>;
  getEnabledActivityTypes(companyId: number): Promise<ActivityType[]>;
  createActivityType(activityType: InsertActivityType): Promise<ActivityType>;
  updateActivityType(id: number, activityType: Partial<InsertActivityType>): Promise<ActivityType>;
  deleteActivityType(id: number): Promise<void>;
  
  // Permissions operations
  getPermissions(companyId: number): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission>;
  deletePermission(id: number): Promise<void>;
  
  // User Activities operations
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getUserActivities(companyId: number, userId?: string, limit?: number): Promise<UserActivity[]>;
  getActivityStats(companyId: number): Promise<{
    totalConversations: number;
    securityBlocks: number;
    activeUsers: number;
    policyViolations: number;
  }>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: number, companyId: number): Promise<ChatSession | undefined>;
  getUserChatSessions(userId: string, companyId: number): Promise<(ChatSession & { messageCount?: number; lastMessage?: string })[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: number, companyId: number): Promise<ChatMessage[]>;
  
  // Chat attachment operations
  createChatAttachment(attachment: InsertChatAttachment): Promise<ChatAttachment>;
  getChatAttachments(messageId: number): Promise<ChatAttachment[]>;
  getAttachmentsBySession(sessionId: number, companyId: number): Promise<ChatAttachment[]>;
  
  // Context Document operations
  getContextDocuments(companyId: number): Promise<ContextDocument[]>;
  getEnabledContextDocuments(companyId: number): Promise<ContextDocument[]>;
  createContextDocument(document: InsertContextDocument): Promise<ContextDocument>;
  updateContextDocument(id: number, document: Partial<InsertContextDocument>): Promise<ContextDocument>;
  deleteContextDocument(id: number): Promise<void>;
  
  // Activity Context Link operations
  getActivityContextLinks(activityTypeId: number): Promise<(ActivityContextLink & { document?: ContextDocument })[]>;
  createActivityContextLink(link: InsertActivityContextLink): Promise<ActivityContextLink>;
  deleteActivityContextLink(activityTypeId: number, documentId: number): Promise<void>;
  getContextForActivity(activityTypeId: number, companyId: number): Promise<ContextDocument[]>;
  
  // Model Fusion operations
  getModelFusionConfig(companyId: number): Promise<ModelFusionConfig | undefined>;
  createModelFusionConfig(config: InsertModelFusionConfig): Promise<ModelFusionConfig>;
  updateModelFusionConfig(id: number, config: Partial<InsertModelFusionConfig>): Promise<ModelFusionConfig>;
  
  // Subscription operations
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByUserId(userId: string): Promise<Subscription | undefined>;
  getSubscriptionByCompanyId(companyId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription>;
  
  // Trial operations
  getTrialUsageByUserId(userId: string): Promise<TrialUsage | undefined>;
  getTrialUsageByEmail(email: string): Promise<TrialUsage | undefined>;
  createTrialUsage(trial: InsertTrialUsage): Promise<TrialUsage>;
  updateTrialUsage(id: number, trial: Partial<InsertTrialUsage>): Promise<TrialUsage>;
  incrementTrialUsage(userId: string): Promise<boolean>;
  
  // User update method
  updateUser(id: string, userData: {
    firstName?: string;
    lastName?: string;
    role?: string;
    roleLevel?: number;
    department?: string;
    companyId?: number;
    lastLoginAt?: Date;
    isTrialUser?: boolean;
  }): Promise<User>;
  
  // Versioning operations
  getCurrentVersion(): Promise<VersionRelease | undefined>;
  getVersionReleases(): Promise<VersionRelease[]>;
  getVersionFeatures(versionId: number): Promise<VersionFeature[]>;
  createVersionRelease(release: InsertVersionRelease): Promise<VersionRelease>;
  setCurrentVersion(versionId: number): Promise<VersionRelease>;
  createVersionFeature(feature: InsertVersionFeature): Promise<VersionFeature>;
  createVersionDeployment(deployment: InsertVersionDeployment): Promise<VersionDeployment>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const roleUsers = await db.select().from(users).where(eq(users.role, role));
    return roleUsers;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if this is the first user - make them super-user
    const userCount = await db.select({ count: count() }).from(users);
    const isFirstUser = userCount[0].count === 0;
    
    if (isFirstUser) {
      userData.role = 'super-user';
      userData.roleLevel = 100; // Super-user level
    } else {
      // Check if user's email domain matches a company and auto-assign
      if (userData.email) {
        const emailDomain = userData.email.split('@')[1];
        const company = await this.getCompanyByDomain(emailDomain);
        
        if (company && company.isActive) {
          // Check if user is authorized employee
          const isAuthorized = await this.isEmployeeAuthorized(userData.email, company.id);
          if (isAuthorized) {
            userData.companyId = company.id;
            userData.role = 'user';
            userData.roleLevel = 1; // Default user level
          }
        }
      }
    }

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Authentication operations
  async createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    const [newToken] = await db.insert(emailVerificationTokens).values(token).returning();
    return newToken;
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token));
    return verificationToken;
  }

  async markEmailVerificationTokenAsUsed(id: number): Promise<void> {
    await db
      .update(emailVerificationTokens)
      .set({ isUsed: true })
      .where(eq(emailVerificationTokens.id, id));
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async getUserSession(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
    return session;
  }

  async updateUserSession(sessionToken: string, updates: Partial<UserSession>): Promise<void> {
    await db
      .update(userSessions)
      .set(updates)
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  async updateUserSessionLastAccessed(sessionId: number): Promise<void> {
    await db
      .update(userSessions)
      .set({ lastAccessedAt: new Date() })
      .where(eq(userSessions.id, sessionId));
  }

  async deleteUserSession(sessionToken: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.sessionToken, sessionToken));
  }

  // Demo user operations
  async createDemoUser(demoUser: InsertDemoUser): Promise<DemoUser> {
    const [created] = await db.insert(demoUsers).values(demoUser).returning();
    return created;
  }

  async getDemoUser(sessionToken: string): Promise<DemoUser | undefined> {
    const [demoUser] = await db
      .select()
      .from(demoUsers)
      .where(eq(demoUsers.sessionToken, sessionToken));
    return demoUser;
  }

  async incrementDemoUserQuestions(sessionToken: string): Promise<DemoUser> {
    const [updated] = await db
      .update(demoUsers)
      .set({ 
        questionsUsed: sql`${demoUsers.questionsUsed} + 1`,
        lastQuestionAt: new Date()
      })
      .where(eq(demoUsers.sessionToken, sessionToken))
      .returning();
    return updated;
  }

  async getDemoUserByEmail(email: string): Promise<DemoUser | undefined> {
    const [demoUser] = await db
      .select()
      .from(demoUsers)
      .where(eq(demoUsers.email, email));
    return demoUser;
  }

  async updateDemoUserSession(email: string, sessionToken: string, expiresAt: Date): Promise<DemoUser> {
    const [updated] = await db
      .update(demoUsers)
      .set({ 
        sessionToken,
        expiresAt,
        questionsUsed: 0, // Reset questions for new session
        lastQuestionAt: null
      })
      .where(eq(demoUsers.email, email))
      .returning();
    return updated;
  }

  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByDomain(domain: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.domain, domain));
    return company;
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(companies.name);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    
    // Initialize default models and activity types for the new company
    // Temporarily disabled to fix array parsing issues
    // await this.initializeCompanyDefaults(newCompany.id);
    
    return newCompany;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({
        ...company,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<void> {
    // Delete all dependent records first to avoid foreign key constraint violations
    console.log("🗑️ Deleting company dependencies for company ID:", id);
    
    // Delete AI models
    await db.delete(aiModels).where(eq(aiModels.companyId, id));
    console.log("✅ Deleted AI models for company:", id);
    
    // Delete activity types
    await db.delete(activityTypes).where(eq(activityTypes.companyId, id));
    console.log("✅ Deleted activity types for company:", id);
    
    // Delete chat sessions and messages
    await db.delete(chatMessages).where(
      inArray(chatMessages.sessionId, 
        db.select({ id: chatSessions.id }).from(chatSessions).where(eq(chatSessions.companyId, id))
      )
    );
    await db.delete(chatSessions).where(eq(chatSessions.companyId, id));
    console.log("✅ Deleted chat sessions and messages for company:", id);
    
    // Delete user activities
    await db.delete(userActivities).where(eq(userActivities.companyId, id));
    console.log("✅ Deleted user activities for company:", id);
    
    // Delete model fusion configs
    await db.delete(modelFusionConfigs).where(eq(modelFusionConfigs.companyId, id));
    console.log("✅ Deleted model fusion configs for company:", id);
    
    // Finally delete the company
    await db.delete(companies).where(eq(companies.id, id));
    console.log("✅ Company deleted successfully:", id);
  }

  async getCompanyById(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByEmailDomain(email: string): Promise<Company | undefined> {
    const emailDomain = email.split('@')[1];
    return await this.getCompanyByDomain(emailDomain);
  }

  async getCompanyEmployeeByEmail(email: string): Promise<CompanyEmployee | undefined> {
    const [employee] = await db
      .select()
      .from(companyEmployees)
      .where(eq(companyEmployees.email, email));
    return employee;
  }

  async getCompanyEmployees(companyId: number): Promise<CompanyEmployee[]> {
    return await db.select().from(companyEmployees).where(eq(companyEmployees.companyId, companyId));
  }

  async addCompanyEmployee(employee: InsertCompanyEmployee): Promise<CompanyEmployee> {
    const [created] = await db.insert(companyEmployees).values(employee).returning();
    return created;
  }

  async isEmployeeAuthorized(email: string, companyId: number): Promise<boolean> {
    const [employee] = await db
      .select()
      .from(companyEmployees)
      .where(and(
        eq(companyEmployees.email, email),
        eq(companyEmployees.companyId, companyId),
        eq(companyEmployees.isActive, true)
      ));
    return !!employee;
  }

  // Owner operations
  async getCompanyOwners(companyId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.companyId, companyId),
        eq(users.role, 'owner')
      ))
      .orderBy(users.firstName, users.lastName);
  }

  async addCompanyOwner(companyId: number, userData: { firstName: string; lastName: string; email: string; department?: string }): Promise<User> {
    // Generate a temporary user ID (in real scenario, this would come from auth system)
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [newOwner] = await db
      .insert(users)
      .values({
        id: tempUserId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        department: userData.department,
        role: 'owner',
        roleLevel: 99, // Owner level
        companyId: companyId,
      })
      .returning();
    return newOwner;
  }

  async updateCompanyOwner(userId: string, userData: { firstName?: string; lastName?: string; email?: string; department?: string }): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async removeCompanyOwner(userId: string, companyId: number): Promise<void> {
    // Only allow deletion if there's more than one owner
    const owners = await this.getCompanyOwners(companyId);
    if (owners.length <= 1) {
      throw new Error("Cannot delete the last owner. At least one owner must remain.");
    }
    
    await db.delete(users).where(and(
      eq(users.id, userId),
      eq(users.companyId, companyId),
      eq(users.role, 'owner')
    ));
  }

  // Company Role operations
  async getCompanyRoles(companyId: number): Promise<CompanyRole[]> {
    return await db.select().from(companyRoles)
      .where(and(eq(companyRoles.companyId, companyId), eq(companyRoles.isActive, true)))
      .orderBy(companyRoles.level);
  }

  async createCompanyRole(role: InsertCompanyRole): Promise<CompanyRole> {
    const [created] = await db.insert(companyRoles).values(role).returning();
    return created;
  }

  async updateCompanyRole(id: number, role: Partial<InsertCompanyRole>): Promise<CompanyRole> {
    const [updated] = await db
      .update(companyRoles)
      .set(role)
      .where(eq(companyRoles.id, id))
      .returning();
    return updated;
  }

  async deleteCompanyRole(id: number): Promise<void> {
    await db.delete(companyRoles).where(eq(companyRoles.id, id));
  }

  async getUserRoleLevel(userId: string): Promise<number> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.roleLevel || 1;
  }

  // AI Models operations
  async getAiModels(companyId: number): Promise<AiModel[]> {
    // Return all models - let the frontend handle filtering by API key status
    return await db.select().from(aiModels).where(eq(aiModels.companyId, companyId)).orderBy(aiModels.name);
  }

  async getWorkingAiModels(companyId: number): Promise<AiModel[]> {
    // Only return models with valid API keys (not placeholder values)
    const allModels = await db.select().from(aiModels).where(eq(aiModels.companyId, companyId)).orderBy(aiModels.name);
    
    // Filter out models with placeholder API keys
    return allModels.filter(model => {
      const apiKey = model.apiKey;
      // Skip models with placeholder or missing API keys
      if (!apiKey || 
          apiKey.startsWith('$') || 
          apiKey.includes('placeholder') || 
          apiKey.includes('your-api-key') ||
          apiKey.length < 10) {
        return false;
      }
      return true;
    });
  }

  async getEnabledAiModels(companyId: number): Promise<AiModel[]> {
    return await db.select().from(aiModels).where(and(eq(aiModels.companyId, companyId), eq(aiModels.isEnabled, true))).orderBy(aiModels.name);
  }

  async createAiModel(model: InsertAiModel): Promise<AiModel> {
    const [created] = await db.insert(aiModels).values(model).returning();
    return created;
  }

  async updateAiModel(id: number, model: Partial<InsertAiModel>): Promise<AiModel> {
    const [updated] = await db
      .update(aiModels)
      .set(model)
      .where(eq(aiModels.id, id))
      .returning();
    return updated;
  }

  // AI Model Template operations (universal templates)
  async getAiModelTemplates(): Promise<AiModelTemplate[]> {
    return await db.select().from(aiModelTemplates).where(eq(aiModelTemplates.isEnabled, true)).orderBy(aiModelTemplates.name);
  }

  async getAiModelTemplate(id: number): Promise<AiModelTemplate | undefined> {
    const [template] = await db.select().from(aiModelTemplates).where(eq(aiModelTemplates.id, id));
    return template;
  }

  async createAiModelTemplate(template: InsertAiModelTemplate): Promise<AiModelTemplate> {
    const [created] = await db.insert(aiModelTemplates).values(template).returning();
    return created;
  }

  async updateAiModelTemplate(id: number, template: Partial<InsertAiModelTemplate>): Promise<AiModelTemplate> {
    const [updated] = await db
      .update(aiModelTemplates)
      .set(template)
      .where(eq(aiModelTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteAiModelTemplate(id: number): Promise<void> {
    await db.delete(aiModelTemplates).where(eq(aiModelTemplates.id, id));
  }

  // Company API Key operations
  async getCompanyApiKeys(companyId: number): Promise<CompanyApiKey[]> {
    return await db.select().from(companyApiKeys)
      .where(eq(companyApiKeys.companyId, companyId))
      .orderBy(companyApiKeys.createdAt);
  }

  async getCompanyApiKey(companyId: number, templateId: number): Promise<CompanyApiKey | undefined> {
    const [apiKey] = await db.select().from(companyApiKeys)
      .where(and(
        eq(companyApiKeys.companyId, companyId),
        eq(companyApiKeys.templateId, templateId)
      ));
    return apiKey;
  }

  async createCompanyApiKey(apiKey: InsertCompanyApiKey): Promise<CompanyApiKey> {
    const [created] = await db.insert(companyApiKeys).values(apiKey).returning();
    return created;
  }

  async updateCompanyApiKey(id: number, apiKey: Partial<InsertCompanyApiKey>): Promise<CompanyApiKey> {
    const [updated] = await db
      .update(companyApiKeys)
      .set(apiKey)
      .where(eq(companyApiKeys.id, id))
      .returning();
    return updated;
  }

  async deleteCompanyApiKey(id: number): Promise<void> {
    await db.delete(companyApiKeys).where(eq(companyApiKeys.id, id));
  }

  // Combined AI Models with API Keys (what the frontend uses)
  async getAiModelsWithApiKeys(companyId: number): Promise<AiModelWithApiKey[]> {
    // Get all templates
    const templates = await this.getAiModelTemplates();
    
    // Get company's API keys
    const apiKeys = await this.getCompanyApiKeys(companyId);
    
    // Combine templates with API keys
    const modelsWithApiKeys: AiModelWithApiKey[] = templates.map(template => {
      const companyApiKey = apiKeys.find(key => key.templateId === template.id);
      
      return {
        ...template,
        apiKey: companyApiKey?.apiKey,
        organizationId: companyApiKey?.organizationId,
        hasValidApiKey: !!(companyApiKey?.apiKey && companyApiKey.apiKey.length > 10 && !companyApiKey.apiKey.startsWith('placeholder')),
        lastTested: companyApiKey?.lastTested,
        isWorking: companyApiKey?.isWorking,
      };
    });
    
    // Only return models that have valid API keys OR are enabled templates (for display purposes)
    return modelsWithApiKeys.filter(model => model.isEnabled);
  }

  // Activity Types operations
  async getActivityTypes(companyId: number): Promise<ActivityType[]> {
    return await db.select().from(activityTypes).where(eq(activityTypes.companyId, companyId)).orderBy(activityTypes.name);
  }

  async getEnabledActivityTypes(companyId: number): Promise<ActivityType[]> {
    return await db.select().from(activityTypes).where(and(eq(activityTypes.companyId, companyId), eq(activityTypes.isEnabled, true))).orderBy(activityTypes.name);
  }

  async createActivityType(activityType: InsertActivityType): Promise<ActivityType> {
    const [created] = await db.insert(activityTypes).values(activityType).returning();
    return created;
  }

  async updateActivityType(id: number, activityType: Partial<InsertActivityType>): Promise<ActivityType> {
    const [updated] = await db
      .update(activityTypes)
      .set(activityType)
      .where(eq(activityTypes.id, id))
      .returning();
    return updated;
  }

  async deleteActivityType(id: number): Promise<void> {
    await db
      .delete(activityTypes)
      .where(eq(activityTypes.id, id));
  }

  // Permissions operations
  async getPermissions(companyId: number): Promise<Permission[]> {
    return await db.select().from(permissions).where(eq(permissions.companyId, companyId)).orderBy(permissions.name);
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [created] = await db.insert(permissions).values(permission).returning();
    return created;
  }

  async updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission> {
    const [updated] = await db
      .update(permissions)
      .set(permission)
      .where(eq(permissions.id, id))
      .returning();
    return updated;
  }

  async deletePermission(id: number): Promise<void> {
    await db
      .delete(permissions)
      .where(eq(permissions.id, id));
  }

  // User management operations
  async getCompanyUsers(companyId: number): Promise<any[]> {
    const companyUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        roleLevel: users.roleLevel,
        department: users.department,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        isTrialUser: users.isTrialUser
      })
      .from(users)
      .where(eq(users.companyId, companyId))
      .orderBy(users.firstName, users.lastName);

    // Get session count for each user
    const usersWithStats = await Promise.all(
      companyUsers.map(async (user) => {
        const [sessionCount] = await db
          .select({ count: count() })
          .from(chatSessions)
          .where(eq(chatSessions.userId, user.id));

        const [lastActivity] = await db
          .select({ timestamp: userActivities.timestamp })
          .from(userActivities)
          .where(eq(userActivities.userId, user.id))
          .orderBy(desc(userActivities.timestamp))
          .limit(1);

        return {
          ...user,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          totalSessions: sessionCount.count,
          lastActive: lastActivity?.timestamp || user.lastLoginAt || user.createdAt,
          status: user.lastLoginAt && user.lastLoginAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'active' : 'inactive'
        };
      })
    );

    return usersWithStats;
  }

  async inviteUser(companyId: number, userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    roleLevel: number;
    department?: string;
  }): Promise<any> {
    // First add to company employees
    const [employee] = await db.insert(companyEmployees).values({
      companyId,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      isActive: true
    }).returning();

    // Create a pending user record (they'll be activated when they sign in)
    const [user] = await db.insert(users).values({
      id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      roleLevel: userData.roleLevel,
      companyId,
      department: userData.department,
      isTrialUser: false
    }).returning();

    return {
      ...user,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      totalSessions: 0,
      lastActive: null,
      status: 'pending'
    };
  }

  // Super-user method to get all users across all companies
  async getAllUsers(): Promise<any[]> {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        roleLevel: users.roleLevel,
        companyId: users.companyId,
        isTrialUser: users.isTrialUser,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt
      })
      .from(users)
      .orderBy(users.email);

    return allUsers;
  }

  // Super-user updateUser method (no company restriction)
  async updateUser(userId: string, userData: {
    firstName?: string;
    lastName?: string;
    role?: string;
    roleLevel?: number;
    department?: string;
    companyId?: number;
    lastLoginAt?: Date;
    isTrialUser?: boolean;
  }): Promise<any> {
    const [updated] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return updated;
  }

  // Company-restricted updateUser method
  async updateUserInCompany(userId: string, companyId: number, userData: {
    firstName?: string;
    lastName?: string;
    role?: string;
    roleLevel?: number;
    department?: string;
  }): Promise<any> {
    const [updated] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(and(eq(users.id, userId), eq(users.companyId, companyId)))
      .returning();

    // Also update in company employees if role changed
    if (userData.role) {
      await db
        .update(companyEmployees)
        .set({ role: userData.role, department: userData.department })
        .where(and(eq(companyEmployees.email, updated.email), eq(companyEmployees.companyId, companyId)));
    }

    return {
      ...updated,
      name: `${updated.firstName || ''} ${updated.lastName || ''}`.trim() || updated.email
    };
  }

  async deleteUser(userId: string, companyId: number): Promise<void> {
    // Get user email first
    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
    
    if (user) {
      // Remove from company employees
      await db
        .delete(companyEmployees)
        .where(and(eq(companyEmployees.email, user.email), eq(companyEmployees.companyId, companyId)));
      
      // Delete user record
      await db
        .delete(users)
        .where(and(eq(users.id, userId), eq(users.companyId, companyId)));
    }
  }

  // User Activities operations
  async createUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [created] = await db.insert(userActivities).values(activity).returning();
    return created;
  }

  async getUserActivities(companyId: number, userId?: string, limit: number = 50): Promise<UserActivity[]> {
    let whereCondition = eq(userActivities.companyId, companyId);
    
    if (userId) {
      whereCondition = and(whereCondition, eq(userActivities.userId, userId));
    }
    
    return await db.select().from(userActivities)
      .where(whereCondition)
      .orderBy(desc(userActivities.timestamp))
      .limit(limit);
  }

  async getActivityStats(companyId: number): Promise<{
    totalConversations: number;
    securityBlocks: number;
    activeUsers: number;
    policyViolations: number;
  }> {
    const [totalConversations] = await db
      .select({ count: count() })
      .from(userActivities)
      .where(eq(userActivities.companyId, companyId));

    const [securityBlocks] = await db
      .select({ count: count() })
      .from(userActivities)
      .where(and(eq(userActivities.companyId, companyId), eq(userActivities.status, 'blocked')));

    const [activeUsers] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${userActivities.userId})` })
      .from(userActivities)
      .where(and(
        eq(userActivities.companyId, companyId),
        sql`${userActivities.timestamp} >= NOW() - INTERVAL '24 hours'`
      ));

    const [policyViolations] = await db
      .select({ count: count() })
      .from(userActivities)
      .where(and(
        eq(userActivities.companyId, companyId),
        eq(userActivities.status, 'blocked'),
        sql`${userActivities.timestamp} >= NOW() - INTERVAL '7 days'`
      ));

    return {
      totalConversations: totalConversations.count,
      securityBlocks: securityBlocks.count,
      activeUsers: activeUsers.count,
      policyViolations: policyViolations.count,
    };
  }

  // Chat operations
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [created] = await db.insert(chatSessions).values(session).returning();
    return created;
  }

  async getChatSession(id: number, companyId: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(and(eq(chatSessions.id, id), eq(chatSessions.companyId, companyId)));
    return session;
  }

  async getUserChatSessions(userId: string, companyId: number): Promise<(ChatSession & { messageCount?: number; lastMessage?: string })[]> {
    const sessions = await db.select().from(chatSessions).where(
      and(eq(chatSessions.userId, userId), eq(chatSessions.companyId, companyId))
    ).orderBy(desc(chatSessions.createdAt)).limit(20);
    
    // Get message count and last message for each session
    const sessionsWithDetails = await Promise.all(sessions.map(async (session) => {
      const messages = await db.select().from(chatMessages).where(
        and(eq(chatMessages.sessionId, session.id), eq(chatMessages.companyId, companyId))
      ).orderBy(desc(chatMessages.timestamp));
      
      const messageCount = messages.length;
      const lastMessage = messages.length > 0 ? messages[0].message.substring(0, 50) + (messages[0].message.length > 50 ? '...' : '') : undefined;
      
      return {
        ...session,
        messageCount,
        lastMessage
      };
    }));
    
    return sessionsWithDetails;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async getChatMessages(sessionId: number, companyId: number): Promise<(ChatMessage & { aiModel?: AiModel; attachments?: ChatAttachment[] })[]> {
    const messages = await db
      .select({
        id: chatMessages.id,
        companyId: chatMessages.companyId,
        sessionId: chatMessages.sessionId,
        userId: chatMessages.userId,
        aiModelId: chatMessages.aiModelId,
        activityTypeId: chatMessages.activityTypeId,
        message: chatMessages.message,
        response: chatMessages.response,
        status: chatMessages.status,
        securityFlags: chatMessages.securityFlags,
        timestamp: chatMessages.timestamp,
        aiModel: {
          id: aiModels.id,
          companyId: aiModels.companyId,
          name: aiModels.name,
          provider: aiModels.provider,
          modelId: aiModels.modelId,
          isEnabled: aiModels.isEnabled,
          createdAt: aiModels.createdAt,
        }
      })
      .from(chatMessages)
      .leftJoin(aiModels, eq(chatMessages.aiModelId, aiModels.id))
      .where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.companyId, companyId)))
      .orderBy(chatMessages.timestamp);

    // Get attachments for all messages
    const messageIds = messages.map(msg => msg.id);
    const attachments = messageIds.length > 0 
      ? await db.select().from(chatAttachments).where(inArray(chatAttachments.messageId, messageIds))
      : [];

    return messages.map(msg => ({
      ...msg,
      aiModel: msg.aiModel.id ? msg.aiModel : undefined,
      attachments: attachments.filter(att => att.messageId === msg.id)
    }));
  }

  // Context Document operations
  async getContextDocuments(companyId: number): Promise<ContextDocument[]> {
    return await db.select().from(contextDocuments)
      .where(eq(contextDocuments.companyId, companyId))
      .orderBy(contextDocuments.name);
  }

  async getEnabledContextDocuments(companyId: number): Promise<ContextDocument[]> {
    return await db.select().from(contextDocuments)
      .where(and(eq(contextDocuments.companyId, companyId), eq(contextDocuments.isEnabled, true)))
      .orderBy(contextDocuments.name);
  }

  async createContextDocument(document: InsertContextDocument): Promise<ContextDocument> {
    const [created] = await db.insert(contextDocuments).values(document).returning();
    return created;
  }

  async updateContextDocument(id: number, document: Partial<InsertContextDocument>): Promise<ContextDocument> {
    const [updated] = await db
      .update(contextDocuments)
      .set({
        ...document,
        updatedAt: new Date(),
      })
      .where(eq(contextDocuments.id, id))
      .returning();
    return updated;
  }

  async deleteContextDocument(id: number): Promise<void> {
    // First delete all activity context links
    await db.delete(activityContextLinks).where(eq(activityContextLinks.documentId, id));
    // Then delete the document
    await db.delete(contextDocuments).where(eq(contextDocuments.id, id));
  }

  // Activity Context Link operations
  async getActivityContextLinks(activityTypeId: number): Promise<(ActivityContextLink & { document?: ContextDocument })[]> {
    const links = await db
      .select({
        id: activityContextLinks.id,
        activityTypeId: activityContextLinks.activityTypeId,
        documentId: activityContextLinks.documentId,
        usageType: activityContextLinks.usageType,
        createdAt: activityContextLinks.createdAt,
        document: contextDocuments,
      })
      .from(activityContextLinks)
      .leftJoin(contextDocuments, eq(activityContextLinks.documentId, contextDocuments.id))
      .where(eq(activityContextLinks.activityTypeId, activityTypeId));
    
    return links;
  }

  async createActivityContextLink(link: InsertActivityContextLink): Promise<ActivityContextLink> {
    const [created] = await db.insert(activityContextLinks).values(link).returning();
    return created;
  }

  async deleteActivityContextLink(activityTypeId: number, documentId: number): Promise<void> {
    await db.delete(activityContextLinks).where(
      and(
        eq(activityContextLinks.activityTypeId, activityTypeId),
        eq(activityContextLinks.documentId, documentId)
      )
    );
  }

  async getContextForActivity(activityTypeId: number, companyId: number): Promise<ContextDocument[]> {
    const documents = await db
      .select({
        id: contextDocuments.id,
        companyId: contextDocuments.companyId,
        name: contextDocuments.name,
        description: contextDocuments.description,
        category: contextDocuments.category,
        fileName: contextDocuments.fileName,
        fileSize: contextDocuments.fileSize,
        content: contextDocuments.content,
        priority: contextDocuments.priority,
        isEnabled: contextDocuments.isEnabled,
        createdAt: contextDocuments.createdAt,
        updatedAt: contextDocuments.updatedAt,
      })
      .from(contextDocuments)
      .innerJoin(activityContextLinks, eq(contextDocuments.id, activityContextLinks.documentId))
      .where(and(
        eq(activityContextLinks.activityTypeId, activityTypeId),
        eq(contextDocuments.companyId, companyId),
        eq(contextDocuments.isEnabled, true)
      ))
      .orderBy(contextDocuments.priority, contextDocuments.name);
    
    return documents;
  }

  // Chat attachment operations
  async createChatAttachment(attachment: InsertChatAttachment): Promise<ChatAttachment> {
    const [created] = await db.insert(chatAttachments).values(attachment).returning();
    return created;
  }

  async getChatAttachments(messageId: number): Promise<ChatAttachment[]> {
    return await db.select().from(chatAttachments).where(eq(chatAttachments.messageId, messageId));
  }

  async getAttachmentsBySession(sessionId: number, companyId: number): Promise<ChatAttachment[]> {
    return await db
      .select()
      .from(chatAttachments)
      .innerJoin(chatMessages, eq(chatAttachments.messageId, chatMessages.id))
      .where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.companyId, companyId)));
  }

  // Company initialization with default models and activity types
  async initializeCompanyDefaults(companyId: number): Promise<void> {
    // Create default AI models for the company
    const defaultAiModels = [
      {
        name: "GPT-4o",
        provider: "openai",
        modelId: "gpt-4o",
        description: "OpenAI's most capable model with multimodal capabilities",
        contextWindow: 128000,
        isEnabled: true,
        capabilities: ["text-generation", "code-generation", "multimodal"],
        apiKey: `placeholder-${companyId}-openai-gpt4o`,
        apiEndpoint: "https://api.openai.com/v1/chat/completions",
        authMethod: "bearer",
        requestHeaders: { "Content-Type": "application/json" },
        maxTokens: 4000,
        temperature: 0.7,
        maxRetries: 3,
        timeout: 30000,
        rateLimit: 100,
        companyId: companyId,
      },
      {
        name: "Claude Sonnet 4",
        provider: "anthropic",
        modelId: "claude-sonnet-4-20250514",
        description: "Anthropic's latest and most capable model",
        contextWindow: 200000,
        isEnabled: true,
        capabilities: ["text-generation", "code-generation", "multimodal"],
        apiKey: `placeholder-${companyId}-anthropic-claude`,
        apiEndpoint: "https://api.anthropic.com/v1/messages",
        authMethod: "x-api-key",
        requestHeaders: { "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
        maxTokens: 4000,
        temperature: 0.7,
        maxRetries: 3,
        timeout: 30000,
        rateLimit: 100,
        companyId: companyId,
      },
      {
        name: "Perplexity Sonar",
        provider: "perplexity",
        modelId: "llama-3.1-sonar-small-128k-online",
        description: "Perplexity's search-enabled model with real-time information",
        contextWindow: 128000,
        isEnabled: true,
        capabilities: ["text-generation", "real-time-search"],
        apiKey: `placeholder-${companyId}-perplexity-sonar`,
        apiEndpoint: "https://api.perplexity.ai/chat/completions",
        authMethod: "bearer",
        requestHeaders: { "Content-Type": "application/json" },
        maxTokens: 4000,
        temperature: 0.2,
        maxRetries: 3,
        timeout: 30000,
        rateLimit: 100,
        companyId: companyId,
      },
    ];

    // Insert default AI models
    await db.insert(aiModels).values(defaultAiModels);

    // Create default activity types for the company
    const defaultActivityTypes = [
      {
        name: "Brainstorming",
        description: "Creative ideation and concept development",
        prePrompt: "You are an expert brainstorming facilitator. Help generate creative ideas and solutions. Encourage innovative thinking and build upon ideas constructively.",
        riskLevel: "low",
        permissions: ["all"],
        isEnabled: true,
        companyId: companyId,
      },
      {
        name: "Research Assistant",
        description: "Information gathering and analysis",
        prePrompt: "You are a skilled research assistant. Provide accurate, well-sourced information. Always cite sources when possible and distinguish between factual information and analysis.",
        riskLevel: "medium",
        permissions: ["research", "analysis"],
        isEnabled: true,
        companyId: companyId,
      },
      {
        name: "Code Review",
        description: "Software development and code analysis",
        prePrompt: "You are an expert code reviewer. Analyze code for best practices, security vulnerabilities, and optimization opportunities. Provide constructive feedback and suggest improvements.",
        riskLevel: "high",
        permissions: ["development", "security"],
        isEnabled: true,
        companyId: companyId,
      },
      {
        name: "Document Writing",
        description: "Professional document creation and editing",
        prePrompt: "You are a professional writing assistant. Help create clear, well-structured documents. Maintain appropriate tone and style for the intended audience.",
        riskLevel: "medium",
        permissions: ["writing", "editing"],
        isEnabled: true,
        companyId: companyId,
      },
      {
        name: "Customer Support",
        description: "Customer service and support interactions",
        prePrompt: "You are a helpful customer support representative. Provide friendly, professional assistance. Always prioritize customer satisfaction while following company policies.",
        riskLevel: "high",
        permissions: ["customer-facing", "support"],
        isEnabled: true,
        companyId: companyId,
      },
    ];

    // Insert default activity types
    await db.insert(activityTypes).values(defaultActivityTypes);
  }

  // Model Fusion operations
  async getModelFusionConfig(companyId: number): Promise<ModelFusionConfig | undefined> {
    const [config] = await db
      .select()
      .from(modelFusionConfigs)
      .where(eq(modelFusionConfigs.companyId, companyId));
    return config;
  }

  async createModelFusionConfig(config: InsertModelFusionConfig): Promise<ModelFusionConfig> {
    const [created] = await db.insert(modelFusionConfigs).values(config).returning();
    return created;
  }

  async updateModelFusionConfig(id: number, config: Partial<InsertModelFusionConfig>): Promise<ModelFusionConfig> {
    const [updated] = await db
      .update(modelFusionConfigs)
      .set({
        ...config,
        updatedAt: new Date(),
      })
      .where(eq(modelFusionConfigs.id, id))
      .returning();
    return updated;
  }

  // Subscription operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async getSubscriptionByCompanyId(companyId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.companyId, companyId));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(subscriptions).values(subscription).returning();
    return created;
  }

  async updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const [updated] = await db
      .update(subscriptions)
      .set({
        ...subscription,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  // Trial operations
  async getTrialUsageByUserId(userId: string): Promise<TrialUsage | undefined> {
    const [trial] = await db.select().from(trialUsage).where(eq(trialUsage.userId, userId));
    return trial;
  }

  async getTrialUsageByEmail(email: string): Promise<TrialUsage | undefined> {
    const [trial] = await db.select().from(trialUsage).where(eq(trialUsage.email, email));
    return trial;
  }

  async createTrialUsage(trial: InsertTrialUsage): Promise<TrialUsage> {
    const [created] = await db.insert(trialUsage).values(trial).returning();
    return created;
  }

  async updateTrialUsage(id: number, trial: Partial<InsertTrialUsage>): Promise<TrialUsage> {
    const [updated] = await db
      .update(trialUsage)
      .set({
        ...trial,
        updatedAt: new Date(),
      })
      .where(eq(trialUsage.id, id))
      .returning();
    return updated;
  }

  async incrementTrialUsage(userId: string): Promise<boolean> {
    try {
      const [updated] = await db
        .update(trialUsage)
        .set({
          actionsUsed: sql`${trialUsage.actionsUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(trialUsage.userId, userId))
        .returning();
      return !!updated;
    } catch (error) {
      console.error('Error incrementing trial usage:', error);
      return false;
    }
  }

  // Subscription management methods (temporarily disabled - schema not available)
  async getSubscriptionPlans(): Promise<any[]> {
    // return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
    return [];
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | null> {
    const [result] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return result || null;
  }

  async getSubscriptionPlanByName(name: string): Promise<SubscriptionPlan | null> {
    const [result] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, name));
    return result || null;
  }

  async createSubscriptionPlan(data: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [result] = await db.insert(subscriptionPlans).values(data).returning();
    return result;
  }

  async createUserSubscription(data: InsertUserSubscription): Promise<UserSubscription> {
    const [result] = await db.insert(userSubscriptions).values(data).returning();
    return result;
  }

  async getUserActiveSubscription(userId: string): Promise<UserSubscription | null> {
    const [result] = await db.select().from(userSubscriptions)
      .where(and(eq(userSubscriptions.userId, userId), eq(userSubscriptions.status, 'active')))
      .orderBy(desc(userSubscriptions.createdAt));
    return result || null;
  }

  async getApiUsageForDate(userId: string, date: string): Promise<number> {
    const [result] = await db.select({ total: sum(apiUsageTracking.apiCalls) })
      .from(apiUsageTracking)
      .where(and(eq(apiUsageTracking.userId, userId), eq(apiUsageTracking.date, date)));
    return Number(result?.total || 0);
  }

  async getApiUsageForMonth(userId: string, month: string): Promise<number> {
    const [result] = await db.select({ total: sum(apiUsageTracking.apiCalls) })
      .from(apiUsageTracking)
      .where(and(eq(apiUsageTracking.userId, userId), like(apiUsageTracking.date, `${month}%`)));
    return Number(result?.total || 0);
  }

  async incrementApiUsage(userId: string, companyId: number | null, date: string, count: number = 1): Promise<void> {
    const existing = await db.select().from(apiUsageTracking)
      .where(and(eq(apiUsageTracking.userId, userId), eq(apiUsageTracking.date, date)));

    if (existing.length > 0) {
      await db.update(apiUsageTracking)
        .set({ 
          apiCalls: existing[0].apiCalls + count,
          updatedAt: new Date()
        })
        .where(and(eq(apiUsageTracking.userId, userId), eq(apiUsageTracking.date, date)));
    } else {
      await db.insert(apiUsageTracking).values({
        userId,
        companyId,
        subscriptionId: null, // Will be filled when subscription is created
        date,
        apiCalls: count,
        aiTokensUsed: 0,
      });
    }
  }



  // Initialize default company roles if none exist
  async initializeCompanyRoles(companyId: number): Promise<CompanyRole[]> {
    console.log(`Initializing default roles for company ${companyId}`);
    
    const defaultRoles = [
      {
        companyId,
        name: "Super-User",
        level: 1000,
        description: "System administrator with full platform access",
        permissions: ["full_system_access", "manage_companies", "manage_super_users"],
        isActive: true
      },
      {
        companyId,
        name: "Owner", 
        level: 999,
        description: "Company owner with full administrative control over their company",
        permissions: ["manage_company", "manage_users", "manage_roles", "manage_settings", "view_analytics"],
        isActive: true
      },
      {
        companyId,
        name: "Administrator",
        level: 998,
        description: "Administrative access with user and content management capabilities", 
        permissions: ["manage_users", "manage_content", "view_analytics", "manage_ai_models", "manage_activity_types"],
        isActive: true
      },
      {
        companyId,
        name: "User",
        level: 1,
        description: "Standard user with basic access to chat and personal features",
        permissions: ["use_chat", "view_personal_data", "use_ai_models"],
        isActive: true
      },
      {
        companyId,
        name: "Demo User",
        level: 0,
        description: "Limited demo access with read-only features",
        permissions: ["demo_access"],
        isActive: true
      }
    ];

    const createdRoles: CompanyRole[] = [];
    for (const roleData of defaultRoles) {
      const created = await this.createCompanyRole(roleData);
      createdRoles.push(created);
    }

    console.log(`Created ${createdRoles.length} default roles for company ${companyId}`);
    return createdRoles;
  }

  // Enhanced getCompanyRoles that auto-initializes if no roles exist
  async getCompanyRolesWithAutoInit(companyId: number): Promise<CompanyRole[]> {
    let roles = await this.getCompanyRoles(companyId);
    
    if (roles.length === 0) {
      console.log(`No roles found for company ${companyId}, initializing defaults`);
      roles = await this.initializeCompanyRoles(companyId);
    }
    
    return roles;
  }

  // Simple Version operations
  async getCurrentVersion(): Promise<AppVersion | undefined> {
    try {
      const [currentVersion] = await db.select()
        .from(appVersions)
        .where(eq(appVersions.isCurrentVersion, true))
        .limit(1);
      
      if (currentVersion) {
        console.log("Found current version:", currentVersion);
        return currentVersion;
      }
      
      // If no current version, get the most recent one
      const allVersions = await db.select().from(appVersions);
      if (allVersions.length > 0) {
        const latestVersion = allVersions.sort((a, b) => b.id - a.id)[0];
        console.log("Using latest version as current:", latestVersion);
        return latestVersion;
      }
      
      // Return default version if none exists
      return {
        id: 1,
        majorVersion: 1,
        minorVersion: 0,
        patchVersion: 0,
        version: "1.0.0",
        title: "AI Sentinel Launch",
        isCurrentVersion: true,
        releaseDate: new Date(),
        createdAt: new Date()
      };
    } catch (error) {
      console.log("Error fetching version from database, returning default:", error);
      // Return default version if database query fails
      return {
        id: 1,
        majorVersion: 1,
        minorVersion: 0,
        patchVersion: 0,
        version: "1.0.0",
        title: "AI Sentinel Launch",
        isCurrentVersion: true,
        releaseDate: new Date(),
        createdAt: new Date()
      };
    }
  }

  async getAllVersions(): Promise<AppVersion[]> {
    return await db.select()
      .from(appVersions)
      .orderBy(desc(appVersions.releaseDate));
  }

  async createVersion(versionData: InsertAppVersion): Promise<AppVersion> {
    // If this is set as current version, unset all others first
    if (versionData.isCurrentVersion) {
      try {
        await db.update(appVersions).set({ isCurrentVersion: false });
      } catch (error) {
        console.log("Note: appVersions table doesn't exist yet, will be created");
      }
    }
    
    const [version] = await db.insert(appVersions).values(versionData).returning();
    return version;
  }
}

export const storage = new DatabaseStorage();
